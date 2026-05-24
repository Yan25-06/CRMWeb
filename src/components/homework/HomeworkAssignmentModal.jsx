import { useState, useEffect } from 'react'
import { Modal, Button, Input } from '@/components/ui'
import { todayISO } from '@/utils/helpers'

const addDays = (iso, days) => {
  const d = new Date(iso)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

export const HomeworkAssignmentModal = ({ open, onClose, onSave, initial }) => {
  const today = todayISO()
  const [form, setForm] = useState({ title: '', description: '', assignedAt: today, dueDate: addDays(today, 7) })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (open) {
      if (initial) {
        setForm({ title: initial.title ?? '', description: initial.description ?? '', assignedAt: initial.assignedAt ?? today, dueDate: initial.dueDate ?? addDays(initial.assignedAt ?? today, 7) })
      } else {
        setForm({ title: '', description: '', assignedAt: today, dueDate: addDays(today, 7) })
      }
      setErrors({})
    }
  }, [open, initial])

  const set = (f, v) => {
    setForm(prev => {
      const next = { ...prev, [f]: v }
      if (f === 'assignedAt' && v && !initial) next.dueDate = addDays(v, 7)
      return next
    })
  }

  const handleSubmit = () => {
    if (!form.title.trim()) { setErrors({ title: 'Nhập tên bài tập' }); return }
    onSave({ ...form, title: form.title.trim(), dueDate: form.dueDate || undefined })
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Sửa bài tập' : 'Thêm bài tập'}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Huỷ</Button>
          <Button onClick={handleSubmit}>Lưu</Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Tên bài tập *"
          placeholder="Unit 5 Vocabulary..."
          value={form.title}
          onChange={e => set('title', e.target.value)}
          error={errors.title}
        />
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-navy-600 uppercase tracking-wide">Mô tả</label>
          <textarea
            className="input resize-none h-16 text-sm"
            placeholder="Nội dung bài tập..."
            value={form.description}
            onChange={e => set('description', e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Ngày giao"
            type="date"
            value={form.assignedAt}
            onChange={e => set('assignedAt', e.target.value)}
          />
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-navy-600 uppercase tracking-wide">Hạn nộp</label>
            <div className="flex gap-1">
              <input
                type="date"
                className="input flex-1 text-sm"
                value={form.dueDate ?? ''}
                onChange={e => set('dueDate', e.target.value || undefined)}
              />
              {form.dueDate && (
                <button
                  type="button"
                  title="Xóa hạn nộp"
                  onClick={() => set('dueDate', undefined)}
                  className="px-2 rounded-lg text-navy-400 hover:text-red-500 hover:bg-red-50 transition-colors text-xs"
                >
                  Xóa
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}
