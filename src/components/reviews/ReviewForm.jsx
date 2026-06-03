import { useState, useEffect } from 'react'
import { Modal, Button, Input } from '@/components/ui'
import { QuickTagEditor } from './QuickTagEditor'
import { DEFAULT_SKILL_CONFIG } from '@/services/classService'

const EMPTY_FORM = {
  date: new Date().toISOString().split('T')[0],
  scores: {},
  tags: [], advice: '', remark: '',
}

const clampScore = (val, maxScore) => {
  const n = parseFloat(val)
  if (isNaN(n)) return ''
  return Math.min(maxScore, Math.max(0, n))
}

/**
 * ReviewForm — modal form to create/edit a skill assessment review
 * @param {boolean}  open
 * @param {Function} onClose
 * @param {Object}   editingReview - null = add, object = edit
 * @param {string}   studentId
 * @param {string}   classId
 * @param {string}   teacherName
 * @param {Array}    skillConfig   - [{ name, maxScore, order }]
 * @param {Function} onSave - callback(reviewData)
 */
export const ReviewForm = ({ open, onClose, editingReview, studentId, classId, teacherName, skillConfig, onSave }) => {
  const skills = skillConfig ?? DEFAULT_SKILL_CONFIG
  const isEdit = !!editingReview
  const [form, setForm]     = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (open) {
      if (editingReview) {
        setForm({
          date:   editingReview.date ?? EMPTY_FORM.date,
          scores: editingReview.scores ?? {},
          tags:   editingReview.tags   ?? [],
          advice: editingReview.advice ?? '',
          remark: editingReview.remark ?? '',
        })
      } else {
        setForm(EMPTY_FORM)
      }
      setErrors({})
    }
  }, [open, editingReview])

  const setScore = (name, val) =>
    setForm(f => ({ ...f, scores: { ...f.scores, [name]: val } }))

  const validate = () => {
    const e = {}
    if (!form.date) e.date = 'Vui lòng chọn ngày'
    for (const skill of skills) {
      const val = form.scores?.[skill.name]
      if (val !== '' && val != null) {
        const n = parseFloat(val)
        if (isNaN(n) || n < 0 || n > skill.maxScore)
          e[skill.name] = `Điểm 0–${skill.maxScore}`
      }
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return
    const cleanScores = {}
    for (const skill of skills) {
      const val = form.scores?.[skill.name]
      if (val !== '' && val != null) {
        const n = parseFloat(val)
        if (!isNaN(n)) cleanScores[skill.name] = n
      }
    }
    const data = {
      studentId, classId,
      date:        form.date,
      scores:      cleanScores,
      tags:        form.tags,
      advice:      form.advice.trim() || undefined,
      remark:      form.remark.trim() || undefined,
      teacherName: teacherName || undefined,
    }
    onSave?.(data)
    onClose?.()
  }

  const ScoreInput = ({ skill }) => {
    const val = form.scores?.[skill.name] ?? ''
    return (
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-navy-600 uppercase tracking-wide">{skill.name}</label>
        <input
          type="number"
          min="0"
          max={skill.maxScore}
          step={skill.maxScore <= 9 ? 0.5 : 1}
          placeholder="—"
          value={val}
          onChange={e => setScore(skill.name, e.target.value)}
          onBlur={e => {
            const clamped = clampScore(e.target.value, skill.maxScore)
            setScore(skill.name, clamped === '' ? '' : clamped)
          }}
          className={`input text-center ${errors[skill.name] ? 'border-red-400' : ''}`}
        />
        {errors[skill.name] && <span className="text-xs text-red-500">{errors[skill.name]}</span>}
      </div>
    )
  }

  const cols = skills.length <= 4 ? skills.length : 4

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
          onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
          error={errors.date}
        />

        {/* Dynamic skill scores */}
        <div>
          <p className="text-xs font-medium text-navy-600 uppercase tracking-wide mb-1.5">Điểm Kỹ Năng</p>
          <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
            {skills.map(skill => <ScoreInput key={skill.name} skill={skill} />)}
          </div>
        </div>

        {/* Quick tags */}
        <div>
          <p className="text-xs font-medium text-navy-600 uppercase tracking-wide mb-1.5">Nhận Xét Nhanh</p>
          <QuickTagEditor value={form.tags} onChange={tags => setForm(f => ({ ...f, tags }))} />
        </div>

        {/* Remark */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-navy-600 uppercase tracking-wide">Nhận Xét Thêm</label>
          <textarea
            className="input resize-none"
            rows={1}
            placeholder="Ghi chú thêm về buổi học..."
            value={form.remark}
            onChange={e => setForm(f => ({ ...f, remark: e.target.value }))}
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
            onChange={e => setForm(f => ({ ...f, advice: e.target.value }))}
          />
        </div>
      </div>
    </Modal>
  )
}
