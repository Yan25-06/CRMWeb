import { supabase } from '@/lib/supabase'

export const getDashboardStats = async (year, month) => {
  const prefix = `${year}-${String(month).padStart(2, '0')}`
  const today  = new Date().toISOString().split('T')[0]

  const [
    { count: totalStudents },
    { count: totalClasses },
    { count: presentToday },
    { data: monthPayments },
    { data: yearPayments },
  ] = await Promise.all([
    supabase.from('students').select('id', { count: 'exact', head: true }),
    supabase.from('classes').select('id', { count: 'exact', head: true }),
    supabase.from('attendance').select('id', { count: 'exact', head: true })
      .eq('date', today).eq('present', true),
    supabase.from('payments').select('amount').eq('period', prefix),
    supabase.from('payments').select('amount, period').like('period', `${year}-%`),
  ])

  const monthlyRevenue = (monthPayments ?? []).reduce((s, p) => s + (p.amount ?? 0), 0)
  const yearlyRevenue  = (yearPayments ?? []).reduce((s, p) => s + (p.amount ?? 0), 0)

  return {
    totalStudents: totalStudents ?? 0,
    totalClasses:  totalClasses ?? 0,
    presentToday:  presentToday ?? 0,
    monthlyRevenue,
    yearlyRevenue,
  }
}
