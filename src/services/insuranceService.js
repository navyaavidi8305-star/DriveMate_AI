import { supabase } from '../lib/supabase'
import { computeExpiryStatus } from '../utils/statusHelpers'
import { EXPIRY_WARNING_DAYS } from '../utils/constants'

const TABLE = 'insurance_policies'

export const insuranceService = {
  async getAll() {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*, vehicles(id, name, reg_number)')
      .order('expiry_date', { ascending: true })
    if (error) throw error
    return data
  },

  async create(record) {
    const { data: { user } } = await supabase.auth.getUser()
    const payload = {
      ...record,
      user_id: user.id,
      ...(record.expiry_date && { status: computeExpiryStatus(record.expiry_date) }),
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
    if (updates.expiry_date) {
      payload.status = computeExpiryStatus(updates.expiry_date)
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
      .select('expiry_date, status')
    if (error) throw error

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let active = 0
    let expiringSoon = 0
    let expired = 0

    data.forEach(r => {
      const status = computeExpiryStatus(r.expiry_date, EXPIRY_WARNING_DAYS)
      if (status === 'Valid') active++
      else if (status === 'Expiring Soon') expiringSoon++
      else expired++
    })

    return { total: data.length, active, expiringSoon, expired }
  },
}

export { computeExpiryStatus }