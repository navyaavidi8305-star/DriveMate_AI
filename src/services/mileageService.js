import { supabase } from '../lib/supabase'

const TABLE = 'mileage_records'

export const mileageService = {
  async getAll() {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*, vehicles(id, name, reg_number, fuel_type)')
      .order('date', { ascending: false })
    if (error) throw error
    return data
  },

  async getById(id) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*, vehicles(id, name, reg_number)')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },

  async create(record) {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from(TABLE)
      .insert({ ...record, user_id: user.id })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from(TABLE)
      .update(updates)
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
      .select('mileage, distance, date, fuel_qty, fuel_cost')
    if (error) throw error

    const totalRecords = data.length
    const avgMileage = totalRecords > 0
      ? (data.reduce((sum, r) => sum + (r.mileage || 0), 0) / totalRecords).toFixed(1)
      : 0

    const now = new Date()
    const thisMonth = data.filter(r => {
      const d = new Date(r.date)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
    const distanceThisMonth = thisMonth.reduce((sum, r) => sum + (r.distance || 0), 0)

    return { totalRecords, avgMileage, distanceThisMonth }
  },
}
