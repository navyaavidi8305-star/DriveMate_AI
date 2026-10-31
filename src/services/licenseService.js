import { supabase } from '../lib/supabase'
import { computeExpiryStatus } from '../utils/statusHelpers'
import { EXPIRY_WARNING_DAYS } from '../utils/constants'

const TABLE = 'driving_licenses'

export const licenseService = {
  async getAll() {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .order('valid_till', { ascending: true })
    if (error) throw error
    return data
  },

  async create(record) {
    const { data: { user } } = await supabase.auth.getUser()
    const payload = {
      ...record,
      user_id: user.id,
      ...(record.valid_till && { status: computeExpiryStatus(record.valid_till) }),
    }
    const { data, error } = await supabase
      .from(TABLE)
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id, updates) {
    const payload = { ...updates }
    if (updates.valid_till) {
      payload.status = computeExpiryStatus(updates.valid_till)
    }
    const { data, error } = await supabase
      .from(TABLE)
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async remove(id) {
    const { error } = await supabase
      .from(TABLE)
      .delete()
      .eq('id', id)
    if (error) throw error
  },

  async getStats() {
    const { data, error } = await supabase
      .from(TABLE)
      .select('valid_till')
    if (error) throw error

    let valid = 0
    let expiringSoon = 0
    let expired = 0

    data.forEach(r => {
      const status = computeExpiryStatus(r.valid_till, EXPIRY_WARNING_DAYS)
      if (status === 'Valid') valid++
      else if (status === 'Expiring Soon') expiringSoon++
      else expired++
    })

    return { total: data.length, valid, expiringSoon, expired }
  },
}

export { computeExpiryStatus }