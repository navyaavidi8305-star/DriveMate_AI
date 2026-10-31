import { supabase } from '../lib/supabase'

const TABLE = 'maintenance_records'

export const maintenanceService = {
  async getAll() {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*, vehicles(id, name, reg_number)')
      .order('service_date', { ascending: false })
    if (error) throw error
    return data
  },

  async getByVehicle(vehicleId) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*, vehicles(id, name, reg_number)')
      .eq('vehicle_id', vehicleId)
      .order('service_date', { ascending: false })
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
      .select('status, next_service_date, cost')
    if (error) throw error

    const today = new Date().toISOString().split('T')[0]

    let upcoming = 0
    let overdue = 0

    data.forEach(r => {
      const isOverdue =
        r.status !== 'Completed' &&
        r.next_service_date &&
        r.next_service_date < today

      if (isOverdue || r.status === 'Overdue') overdue++
      else if (r.status === 'Upcoming') upcoming++
    })

    return {
      upcoming,
      overdue,
      total: data.length,
    }
  },
}

export function getDisplayStatus(record) {
  const today = new Date().toISOString().split('T')[0]
  if (
    record.status !== 'Completed' &&
    record.next_service_date &&
    record.next_service_date < today
  ) {
    return 'Overdue'
  }
  return record.status
}