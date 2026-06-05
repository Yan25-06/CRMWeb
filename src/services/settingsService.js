import { supabase } from '@/lib/supabase'
import { getUid } from './studentService'

export const DEFAULT_SETTINGS = {
  centerName: 'Anh Ngữ Ms.Phương',
  defaultFeePerSession: 0,
  currency: 'đ',
}

const fromDB = (row) => row ? {
  centerName: row.center_name,
  defaultFeePerSession: row.default_fee_per_session,
  currency: row.currency,
} : { ...DEFAULT_SETTINGS }

const toDB = (data) => ({
  center_name: data.centerName ?? '',
  default_fee_per_session: data.defaultFeePerSession ?? 0,
  currency: data.currency ?? 'đ',
})

export const settingsService = {
  async get() {
    const uid = await getUid()
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('teacher_id', uid)
      .maybeSingle()
    if (error) throw new Error(error.message)
    return fromDB(data)
  },

  async upsert(data) {
    const teacher_id = await getUid()
    const { data: row, error } = await supabase
      .from('settings')
      .upsert({ ...toDB(data), teacher_id }, { onConflict: 'teacher_id' })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return fromDB(row)
  },
}
