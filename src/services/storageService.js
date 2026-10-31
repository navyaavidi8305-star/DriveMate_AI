import { supabase } from '../lib/supabase'

const BUCKET = 'documents'

export const storageService = {
  async uploadDocument(file, userId, vehicleId, module) {
    const fileExt = file.name.split('.').pop() || 'file'
    const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`
    const path = `${userId}/${vehicleId || 'misc'}/${module}/${fileName}`

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { cacheControl: '3600', upsert: false })

    if (error) throw error
    return path
  },

  async deleteDocument(path) {
    if (!path) return
    const { error } = await supabase.storage.from(BUCKET).remove([path])
    if (error) throw error
  },

  async getSignedUrl(path) {
    if (!path) return null
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(path, 3600)
    if (error) {
      console.error('Error creating signed URL:', error)
      return null
    }
    return data.signedUrl
  },
}

export async function signUpload(file, userId, vehicleId, module) {
  return storageService.uploadDocument(file, userId, vehicleId, module)
}