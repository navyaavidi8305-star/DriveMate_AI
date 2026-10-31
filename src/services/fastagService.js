import { supabase } from '../lib/supabase'
import { LOW_BALANCE_THRESHOLD } from '../utils/constants'

const TABLE = 'fastags'

export function calculateFastagStatus(balance, threshold = LOW_BALANCE_THRESHOLD) {
  const bal = Number(balance || 0)
  if (bal < threshold) return 'Low Balance'
  return 'Active'
}

export const fastagService = {
  async getAll() {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*, vehicles(id, name, reg_number)')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async create(record) {
    const { data: { user } } = await supabase.auth.getUser()
    const payload = {
      ...record,
      user_id: user.id,
      balance: Number(record.balance || 0),
      status: calculateFastagStatus(record.balance),
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
    if (payload.balance !== undefined) {
      payload.balance = Number(payload.balance)
      payload.status = calculateFastagStatus(payload.balance)
    }
    payload.updated_at = new Date().toISOString()
    const { data, error } = await supabase
      .from(TABLE)
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async updateBalance(id, balance) {
    return this.update(id, { balance })
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
      .select('status, balance')
    if (error) throw error

    return {
      total: data.length,
      active: data.filter(f => f.status === 'Active').length,
      lowBalance: data.filter(f => f.status === 'Low Balance').length,
    }
  },
}