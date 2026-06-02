import { supabase } from '@/lib/supabase'
import { rows, row, toSnake } from './_utils'

// ── Mock Tests ──────────────────────────────────────────────

export const getMockTestsByClass = async (classId) => {
  const { data, error } = await supabase
    .from('mock_tests').select('*').eq('class_id', classId).order('date', { ascending: false })
  return rows(data, error)
}

export const createMockTest = async (testData) => {
  const { data: test, error } = await supabase
    .from('mock_tests').insert(toSnake(testData)).select().single()
  if (error) throw error

  // Side-effect: create empty result rows for active students
  const { data: enrollments } = await supabase
    .from('enrollments').select('student_id').eq('class_id', testData.classId).eq('status', 'active')

  if (enrollments?.length) {
    const now = new Date().toISOString()
    const resultStubs = enrollments.map(e => ({
      mock_test_id: test.id,
      student_id: e.student_id,
      scores: {},
      total_score: 0,
      teacher_note: '',
      created_at: now,
      updated_at: now,
    }))
    await supabase.from('mock_test_results').insert(resultStubs)
  }

  return row(test, null)
}

export const updateMockTest = async (id, testData) => {
  const { data, error } = await supabase
    .from('mock_tests').update(toSnake(testData)).eq('id', id).select().single()
  return row(data, error)
}

export const deleteMockTest = async (id) => {
  // Cascade via FK ON DELETE CASCADE
  const { error } = await supabase.from('mock_tests').delete().eq('id', id)
  if (error) throw error
}

// ── Mock Test Results ────────────────────────────────────────

export const getMockTestResultsByTest = async (mockTestId) => {
  const { data, error } = await supabase
    .from('mock_test_results').select('*').eq('mock_test_id', mockTestId)
  return rows(data, error)
}

export const getResultsByStudent = async (studentId, classId) => {
  const { data: tests } = await supabase
    .from('mock_tests').select('id, date').eq('class_id', classId)
  if (!tests?.length) return []

  const testMap = new Map(tests.map(t => [t.id, t]))
  const { data, error } = await supabase
    .from('mock_test_results').select('*')
    .eq('student_id', studentId)
    .in('mock_test_id', tests.map(t => t.id))
  if (error) throw error

  return (data ?? [])
    .sort((a, b) => new Date(testMap.get(a.mock_test_id)?.date) - new Date(testMap.get(b.mock_test_id)?.date))
    .map(r => ({
      id: r.id, mockTestId: r.mock_test_id, studentId: r.student_id,
      scores: r.scores, totalScore: r.total_score, teacherNote: r.teacher_note,
      createdAt: r.created_at, updatedAt: r.updated_at,
    }))
}

export const getMockTestResultsByClass = async (classId) => {
  const { data: tests } = await supabase.from('mock_tests').select('id').eq('class_id', classId)
  if (!tests?.length) return []
  const { data, error } = await supabase
    .from('mock_test_results').select('*').in('mock_test_id', tests.map(t => t.id))
  return rows(data, error)
}

export const upsertMockTestResult = async (resultData) => {
  const scores  = resultData.scores ?? {}
  const total   = Object.values(scores).reduce((s, v) => s + (Number(v) || 0), 0)
  const now     = new Date().toISOString()
  const payload = {
    mock_test_id: resultData.mockTestId,
    student_id:   resultData.studentId,
    scores,
    total_score:  total,
    teacher_note: resultData.teacherNote ?? '',
    updated_at:   now,
  }
  const { data, error } = await supabase
    .from('mock_test_results')
    .upsert(payload, { onConflict: 'mock_test_id,student_id' })
    .select().single()
  return row(data, error)
}
