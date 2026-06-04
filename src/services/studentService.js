import { supabase } from '@/lib/supabase'

export const getUid = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user?.id) throw new Error('Not authenticated')
  return session.user.id
}

const fromDB = (row) => row ? {
  id: row.id,
  name: row.name,
  grade: row.grade,
  phone: row.phone,
  email: row.email ?? null,
  createdAt: row.created_at,
} : null

const toDB = (data) => ({
  name: data.name,
  grade: data.grade ?? null,
  phone: data.phone ?? null,
  email: data.email ?? null,
})

export const studentService = {
  async getAll() {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return data.map(fromDB)
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw new Error(error.message)
    return fromDB(data)
  },

  async create(data) {
    const teacher_id = await getUid()
    const { data: row, error } = await supabase
      .from('students')
      .insert({ ...toDB(data), teacher_id })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return fromDB(row)
  },

  async update(id, data) {
    const { error } = await supabase
      .from('students')
      .update(toDB(data))
      .eq('id', id)
    if (error) throw new Error(error.message)
  },

  async remove(id) {
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', id)
    if (error) throw new Error(error.message)
  },
}
