import { supabase } from '@/lib/supabase'

const fromDB = (row) => row ? {
  id: row.id,
  mockTestId: row.mock_test_id,
  studentId: row.student_id,
  scores: row.scores,
  totalScore: row.total_score,
  teacherNote: row.teacher_note,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
} : null

export const mockTestResultService = {
  async getByTest(mockTestId) {
    const { data, error } = await supabase
      .from('mock_test_results')
      .select('*')
      .eq('mock_test_id', mockTestId)
    if (error) throw new Error(error.message)
    return (data ?? []).map(fromDB)
  },

  async getByClass(classId) {
    const { data: tests, error: testErr } = await supabase
      .from('mock_tests')
      .select('id')
      .eq('class_id', classId)
    if (testErr) throw new Error(testErr.message)
    if (!tests || tests.length === 0) return []
    const testIds = tests.map(t => t.id)
    const { data, error } = await supabase
      .from('mock_test_results')
      .select('*')
      .in('mock_test_id', testIds)
    if (error) throw new Error(error.message)
    return (data ?? []).map(fromDB)
  },

  async getByStudent(studentId, classId) {
    const { data: tests, error: testErr } = await supabase
      .from('mock_tests')
      .select('id, date')
      .eq('class_id', classId)
    if (testErr) throw new Error(testErr.message)
    if (!tests || tests.length === 0) return []
    const testIds = tests.map(t => t.id)
    const testDateMap = new Map(tests.map(t => [t.id, t.date]))
    const { data, error } = await supabase
      .from('mock_test_results')
      .select('*')
      .eq('student_id', studentId)
      .in('mock_test_id', testIds)
    if (error) throw new Error(error.message)
    return (data ?? [])
      .map(fromDB)
      .sort((a, b) => (testDateMap.get(a.mockTestId) || '').localeCompare(testDateMap.get(b.mockTestId) || ''))
  },

  async getAll() {
    const { data, error } = await supabase
      .from('mock_test_results')
      .select('*')
    if (error) throw new Error(error.message)
    return (data ?? []).map(fromDB)
  },

  async upsert(data) {
    const scores = data.scores ?? {}
    const total_score = Object.values(scores).reduce((sum, v) => sum + (v !== '' ? (Number(v) || 0) : 0), 0)
    const payload = {
      mock_test_id: data.mockTestId,
      student_id: data.studentId,
      scores,
      total_score,
      teacher_note: data.teacherNote ?? null,
      updated_at: new Date().toISOString(),
    }
    const { data: row, error } = await supabase
      .from('mock_test_results')
      .upsert(payload, { onConflict: 'mock_test_id,student_id' })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return fromDB(row)
  },
}
