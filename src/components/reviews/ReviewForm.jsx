import { useState, useEffect } from 'react'
import { Modal, Button, Input } from '@/components/ui'
import { QuickTagEditor } from './QuickTagEditor'

const EMPTY_FORM = {
  date: new Date().toISOString().split('T')[0],
  listenScore: '', speakScore: '', readScore: '', writeScore: '',
  tags: [], advice: '', remark: '',
}

const clampScore = (val) => {
  const n = parseFloat(val)
  if (isNaN(n)) return ''
  return Math.min(9, Math.max(0, n))
}

/**
 * ReviewForm — modal form to create/edit a skill assessment review
 * @param {boolean}  open
 * @param {Function} onClose
 * @param {Object}   editingReview - null = add, object = edit
 * @param {string}   studentId
 * @param {string}   classId
 * @param {string}   teacherName
 * @param {Function} onSave - callback(reviewData)
 */
export const ReviewForm = ({ open, onClose, editingReview, studentId, classId, teacherName, onSave }) => {
  const isEdit = !!editingReview
  const [form, setForm]     = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (open) {
      if (editingReview) {
        setForm({
          date:        editingReview.date ?? EMPTY_FORM.date,
          listenScore: editingReview.listenScore ?? '',
          speakScore:  editingReview.speakScore  ?? '',
          readScore:   editingReview.readScore   ?? '',
          writeScore:  editingReview.writeScore  ?? '',
          tags:        editingReview.tags        ?? [],
          advice:      editingReview.advice      ?? '',
          remark:      editingReview.remark      ?? '',
        })
      } else {
        setForm(EMPTY_FORM)
      }
      setErrors({})
    }
  }, [open, editingReview])

  const setField = (field, val) => setForm(f => ({ ...f, [field]: val }))

  const validate = () => {
    const e = {}
    if (!form.date) e.date = 'Vui lòng chọn ngày'
    for (const key of ['listenScore', 'speakScore', 'readScore', 'writeScore']) {
      if (form[key] !== '' && (parseFloat(form[key]) < 0 || parseFloat(form[key]) > 9))
        e[key] = 'Điểm 0–9'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return
    const data = {
      studentId, classId,
      date:        form.date,
      listenScore: form.listenScore !== '' ? parseFloat(form.listenScore) : undefined,
      speakScore:  form.speakScore  !== '' ? parseFloat(form.speakScore)  : undefined,
      readScore:   form.readScore   !== '' ? parseFloat(form.readScore)   : undefined,
      writeScore:  form.writeScore  !== '' ? parseFloat(form.writeScore)  : undefined,
      tags:        form.tags,
      advice:      form.advice.trim() || undefined,
      remark:      form.remark.trim() || undefined,
      teacherName: teacherName || undefined,
    }
    onSave?.(data)
    onClose?.()
  }

  const ScoreInput = ({ label, field }) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-navy-600 uppercase tracking-wide">{label}</label>
      <input
        type="number"
        min="0" max="9" step="0.5"
        placeholder="—"
        value={form[field]}
        onChange={e => setField(field, e.target.value)}
        onBlur={e => setField(field, clampScore(e.target.value) === '' ? '' : clampScore(e.target.value))}
        className={`input text-center ${errors[field] ? 'border-red-400' : ''}`}
      />
      {errors[field] && <span className="text-xs text-red-500">{errors[field]}</span>}
    </div>
  )

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Sửa Đánh Giá' : 'Thêm Đánh Giá'}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>Hủy</Button>
          <Button variant="primary" size="sm" onClick={handleSubmit}>
            {isEdit ? 'Cập nhật' : 'Lưu Đánh Giá'}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-3.5">
        {/* Date */}
        <Input
          label="Ngày đánh giá"
          type="date"
          value={form.date}
          onChange={e => setField('date', e.target.value)}
          error={errors.date}
        />

        {/* 4 skill scores */}
        <div>
          <p className="text-xs font-medium text-navy-600 uppercase tracking-wide mb-1.5">Điểm Kỹ Năng (0–9)</p>
          <div className="grid grid-cols-4 gap-2">
            <ScoreInput label="Nghe"  field="listenScore" />
            <ScoreInput label="Nói"   field="speakScore"  />
            <ScoreInput label="Đọc"   field="readScore"   />
            <ScoreInput label="Viết"  field="writeScore"  />
          </div>
        </div>

        {/* Quick tags */}
        <div>
          <p className="text-xs font-medium text-navy-600 uppercase tracking-wide mb-1.5">Nhận Xét Nhanh</p>
          <QuickTagEditor value={form.tags} onChange={tags => setField('tags', tags)} />
        </div>

        {/* Remark */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-navy-600 uppercase tracking-wide">Nhận Xét Thêm</label>
          <textarea
            className="input resize-none"
            rows={1}
            placeholder="Ghi chú thêm về buổi học..."
            value={form.remark}
            onChange={e => setField('remark', e.target.value)}
          />
        </div>

        {/* Advice */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-navy-600 uppercase tracking-wide">Lời Khuyên Cá Nhân</label>
          <textarea
            className="input resize-none"
            rows={1}
            placeholder="Lời khuyên cho học viên và phụ huynh..."
            value={form.advice}
            onChange={e => setField('advice', e.target.value)}
          />
        </div>
      </div>
    </Modal>
  )
}
