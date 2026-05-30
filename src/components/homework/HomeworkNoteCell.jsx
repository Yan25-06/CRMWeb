import { useState, useEffect, useRef } from 'react'
import { FileEdit } from 'lucide-react'
import { clsx } from 'clsx'

export const HomeworkNoteCell = ({ note = '', onSave, disabled }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [value, setValue] = useState(note)
  const textareaRef = useRef(null)
  
  // Sync prop to state if not editing
  useEffect(() => {
    if (!isEditing) setValue(note)
  }, [note, isEditing])

  // Debounce save
  useEffect(() => {
    if (!isEditing) return
    const timer = setTimeout(() => {
      if (value !== note) onSave?.(value)
    }, 800)
    return () => clearTimeout(timer)
  }, [value, isEditing, note, onSave])

  const handleBlur = () => {
    setIsEditing(false)
    if (value !== note) onSave?.(value)
  }

  const handleEditClick = () => {
    if (disabled) return
    setIsEditing(true)
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
        textareaRef.current.setSelectionRange(textareaRef.current.value.length, textareaRef.current.value.length)
      }
    }, 50)
  }

  if (isEditing) {
    return (
      <div className="relative animate-fade-in w-full">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder="Nhập ghi chú..."
          className="w-full bg-white border border-navy-200 focus:border-navy-500 focus:ring-1 focus:ring-navy-500 rounded-lg p-2 text-sm text-navy-800 outline-none resize-none transition-all shadow-navy-sm"
          rows={2}
        />
        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-navy-500 animate-[expand_0.3s_ease-out]" />
      </div>
    )
  }

  return (
    <div 
      className={clsx(
        "flex items-center gap-2 group w-full", 
        !disabled && "cursor-pointer"
      )}
      onClick={handleEditClick}
    >
      <button 
        disabled={disabled}
        className={clsx(
          "p-1.5 rounded-lg text-navy-400 shrink-0 transition-colors",
          !disabled && "group-hover:bg-navy-50 group-hover:text-navy-700"
        )}
      >
        <FileEdit size={16} />
      </button>
      <div className={clsx(
        "flex-1 min-w-0 text-sm truncate",
        !value ? "text-navy-300 italic" : "text-navy-700",
        disabled && "opacity-50"
      )}>
        {value || '—'}
      </div>
    </div>
  )
}
