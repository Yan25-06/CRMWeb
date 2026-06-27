import { supabase } from '@/lib/supabase'
import { getUid } from './studentService'
import { scheduleService } from './scheduleService'

export const DEFAULT_SKILL_CONFIG = [
  { name: 'Listening', order: 0 },
  { name: 'Reading',   order: 1 },
  { name: 'Writing',   order: 2 },
  { name: 'Speaking',  order: 3 },
]

const fromDB = (row) => row ? {
  id: row.id,
  name: row.name,
  level: row.level,
  maxStudents: row.max_students,
  courseType: row.course_type,
  scheduleDays: row.schedule_days,
  scheduleTime: row.schedule_time,
  startDate: row.start_date,
  scheduleDayList: Array.isArray(row.schedule_day_list) ? row.schedule_day_list : [],
  startTime: row.start_time,
  endTime: row.end_time,
  room: row.room,
  createdAt: row.created_at,
  teacherId: row.teacher_id,
  teacherName: row.teachers?.name || row.teachers?.email || null,
  skillConfig: Array.isArray(row.skill_config) && row.skill_config.length > 0
    ? row.skill_config.map(sk => ({ name: sk.name, order: sk.order ?? 0 }))
    : DEFAULT_SKILL_CONFIG,
} : null

const DAY_LABELS_SHORT = { 0: 'CN', 1: 'T2', 2: 'T3', 3: 'T4', 4: 'T5', 5: 'T6', 6: 'T7' }
// Sắp theo Thứ 2 trước, CN cuối
const deriveScheduleDays = (dayList) =>
  Array.isArray(dayList) && dayList.length > 0
    ? [...dayList]
        .sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b))
        .map(d => DAY_LABELS_SHORT[d])
        .join('-')
    : null
const deriveScheduleTime = (s, e) => (s && e) ? `${s}-${e}` : null

const toDB = (data) => {
  const obj = {
    name: data.name,
    level: data.level ?? null,
    max_students: data.maxStudents ?? null,
    course_type: data.courseType ?? null,
    start_date: data.startDate ?? null,
    skill_config: Array.isArray(data.skillConfig) && data.skillConfig.length > 0
      ? data.skillConfig.map((sk, i) => ({ name: sk.name, order: sk.order ?? i }))
      : DEFAULT_SKILL_CONFIG,
  }
  if (data.teacherId) obj.teacher_id = data.teacherId
  // Lịch học có cấu trúc — chỉ ghi khi ClassModal cung cấp (không đụng khi update riêng teacher)
  if (data.scheduleDayList !== undefined) {
    obj.schedule_day_list = Array.isArray(data.scheduleDayList) ? data.scheduleDayList.map(Number) : []
    obj.start_time = data.startTime ?? null
    obj.end_time = data.endTime ?? null
    obj.room = data.room ?? null
    obj.schedule_days = deriveScheduleDays(data.scheduleDayList)
    obj.schedule_time = deriveScheduleTime(data.startTime, data.endTime)
  }
  return obj
}

export const teacherService = {
  async getAll() {
    const { data, error } = await supabase
      .from('teachers')
      .select('id, name, email, is_admin, session_rate')
      .order('name')
    if (error) throw new Error(error.message)
    return (data ?? []).map(t => ({
      id: t.id,
      name: t.name,
      email: t.email,
      is_admin: t.is_admin,
      sessionRate: t.session_rate ?? null,
    }))
  },

  async update(id, { name, sessionRate }) {
    const payload = {}
    if (name !== undefined) payload.name = name
    if (sessionRate !== undefined) payload.session_rate = sessionRate
    const { error } = await supabase
      .from('teachers')
      .update(payload)
      .eq('id', id)
    if (error) throw new Error(error.message)
  },

  async setAdmin(id, isAdmin) {
    const { error } = await supabase
      .from('teachers')
      .update({ is_admin: isAdmin })
      .eq('id', id)
    if (error) throw new Error(error.message)
  },
}

export const classService = {
  async getAll() {
    const { data, error } = await supabase
      .from('classes')
      .select('*, teachers(name, email)')
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return data.map(fromDB)
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('classes')
      .select('*, teachers(name, email)')
      .eq('id', id)
      .single()
    if (error) throw new Error(error.message)
    return fromDB(data)
  },

  async create(data) {
    const teacher_id = data.teacherId ?? await getUid()
    const { data: row, error } = await supabase
      .from('classes')
      .insert({ ...toDB(data), teacher_id })
      .select()
      .single()
    if (error) throw new Error(error.message)
    if (data.scheduleDayList !== undefined) {
      await scheduleService.syncForClass(row.id, {
        dayList: data.scheduleDayList,
        startTime: data.startTime,
        endTime: data.endTime,
        room: data.room,
      })
    }
    return fromDB(row)
  },

  async update(id, data) {
    const { error } = await supabase
      .from('classes')
      .update(toDB(data))
      .eq('id', id)
    if (error) throw new Error(error.message)
    if (data.scheduleDayList !== undefined) {
      await scheduleService.syncForClass(id, {
        dayList: data.scheduleDayList,
        startTime: data.startTime,
        endTime: data.endTime,
        room: data.room,
      })
    }
  },

  async remove(id) {
    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('id', id)
    if (error) throw new Error(error.message)
  },
}
