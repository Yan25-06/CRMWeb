import { supabase } from '@/lib/supabase'
import { row, currentUserId } from './_utils'

const DEFAULT_SETTINGS = {
  teacherName: '',
  centerName: 'Anh Ngữ Ms.Phương',
  defaultFeePerSession: 0,
  currency: 'đ',
}

export const getSettings = async () => {
  const teacherId = await currentUserId()
  const { data } = await supabase
    .from('settings').select('*').eq('teacher_id', teacherId).maybeSingle()
  if (!data) return DEFAULT_SETTINGS
  return {
    teacherName: data.teacher_name,
    centerName: data.center_name,
    defaultFeePerSession: data.default_fee_per_session,
    currency: data.currency,
  }
}

export const saveSettings = async (settingsData) => {
  const teacherId = await currentUserId()
  const payload = {
    teacher_id: teacherId,
    teacher_name: settingsData.teacherName ?? DEFAULT_SETTINGS.teacherName,
    center_name: settingsData.centerName ?? DEFAULT_SETTINGS.centerName,
    default_fee_per_session: settingsData.defaultFeePerSession ?? DEFAULT_SETTINGS.defaultFeePerSession,
    currency: settingsData.currency ?? DEFAULT_SETTINGS.currency,
  }
  const { data, error } = await supabase
    .from('settings').upsert(payload, { onConflict: 'teacher_id' }).select().single()
  return row(data, error)
}
