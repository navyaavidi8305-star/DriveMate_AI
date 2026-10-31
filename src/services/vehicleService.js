import { supabase } from '../lib/supabase'

const TABLE = 'vehicles'

export const vehicleService = {
  async getAll() {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async getById(id) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },

  async create(vehicle) {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from(TABLE)
      .insert({ ...vehicle, user_id: user.id })
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

  async getCounts() {
    const { data, error } = await supabase
      .from(TABLE)
      .select('id, status')
    if (error) throw error
    return {
      total: data.length,
      active: data.filter(v => v.status === 'Active').length,
      inactive: data.filter(v => v.status === 'Inactive').length,
    }
  },
}
