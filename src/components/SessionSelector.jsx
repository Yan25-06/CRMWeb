import { useMemo } from 'react'
import { Plus } from 'lucide-react'
import { Select, Button } from '@/components/ui'

export const SessionSelector = ({ sessions, activeSessionId, onSelect, onAddNew }) => {
  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [sessions])

  const formatDate = (isoStr) => {
    if (!isoStr) return ''
    const d = new Date(isoStr)
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 max-w-xs">
        <Select
          value={activeSessionId || ''}
          onChange={(e) => onSelect(e.target.value)}
        >
          {sortedSessions.length === 0 && (
            <option value="" disabled>Chưa có buổi học nào</option>
          )}
          {sortedSessions.map(s => (
            <option key={s.id} value={s.id}>
              {formatDate(s.date)} — {s.topic || 'Buổi học'}
            </option>
          ))}
        </Select>
      </div>
      <Button variant="secondary" onClick={onAddNew} className="shrink-0 flex items-center gap-1">
        <Plus size={16} /> Buổi mới
      </Button>
    </div>
  )
}
