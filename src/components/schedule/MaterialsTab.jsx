import { useState, useEffect, useCallback } from 'react'
import { Plus, ExternalLink, Pencil, Trash2, FileText } from 'lucide-react'
import { clsx } from 'clsx'
import { Button, Empty, Skeleton, toast } from '@/components/ui'
import { classMaterialService } from '@/services/classMaterialService'
import { getMaterialType } from './materialType'
import { MaterialModal } from './MaterialModal'

/**
 * MaterialsTab — tài liệu giảng dạy theo lớp
 * @param {Array}   classes - lớp đã load ở SchedulePage (giáo viên: lớp mình; admin: tất cả)
 * @param {boolean} isAdmin
 */
export const MaterialsTab = ({ classes = [], isAdmin = false }) => {
  const [selectedClassId, setSelectedClassId] = useState('')
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)

  // Mặc định chọn lớp đầu tiên khi danh sách lớp sẵn sàng
  useEffect(() => {
    if (!selectedClassId && classes.length > 0) {
      setSelectedClassId(classes[0].id)
    }
  }, [classes, selectedClassId])

  const loadMaterials = useCallback(async () => {
    if (!selectedClassId) { setMaterials([]); return }
    setLoading(true)
    try {
      const rows = await classMaterialService.getByClass(selectedClassId)
      setMaterials(rows)
    } catch {
      toast.error('Không thể tải tài liệu')
      setMaterials([])
    } finally {
      setLoading(false)
    }
  }, [selectedClassId])

  useEffect(() => { loadMaterials() }, [loadMaterials])

  const openAdd = () => { setEditingItem(null); setModalOpen(true) }
  const openEdit = (item) => { setEditingItem(item); setModalOpen(true) }

  const handleSave = useCallback(async ({ data, isEdit, id }) => {
    try {
      if (isEdit) {
        await classMaterialService.update(id, data)
        toast.success('Đã cập nhật tài liệu')
      } else {
        await classMaterialService.create({ ...data, classId: selectedClassId })
        toast.success('Đã thêm tài liệu')
      }
      await loadMaterials()
    } catch {
      toast.error('Không thể lưu tài liệu')
    }
  }, [selectedClassId, loadMaterials])

  const handleDelete = useCallback(async (id) => {
    try {
      await classMaterialService.remove(id)
      toast.success('Đã xóa tài liệu')
      await loadMaterials()
    } catch {
      toast.error('Không thể xóa tài liệu')
    }
  }, [loadMaterials])

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar: chọn lớp + nút thêm */}
      <div className="flex items-center gap-2 bg-white rounded-2xl border border-navy-100 shadow-navy-sm px-3 py-2 flex-wrap">
        <span className="text-xs text-navy-400 shrink-0">Lớp:</span>
        <select
          value={selectedClassId}
          onChange={e => setSelectedClassId(e.target.value)}
          className="text-xs border border-navy-200 rounded-lg px-2.5 py-1.5 text-navy-700 bg-navy-50 hover:bg-navy-100 focus:outline-none focus:ring-2 focus:ring-navy-300 transition-colors cursor-pointer"
        >
          {classes.length === 0 && <option value="">— Chưa có lớp —</option>}
          {classes.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <div className="flex-1" />
        {isAdmin && selectedClassId && (
          <Button variant="primary" size="sm" onClick={openAdd} className="flex items-center gap-1.5 shrink-0">
            <Plus size={14} />
            Thêm
          </Button>
        )}
      </div>

      {/* Danh sách tài liệu */}
      <div className="bg-white rounded-2xl border border-navy-100 shadow-navy-sm">
        {loading ? (
          <div className="p-4 flex flex-col gap-2">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 rounded-xl" />)}
          </div>
        ) : materials.length === 0 ? (
          <div className="p-12">
            <Empty
              icon={<FileText size={40} />}
              title="Chưa có tài liệu"
              desc={isAdmin ? 'Bấm "Thêm" để gửi tài liệu đầu tiên cho lớp này.' : 'Lớp này chưa có tài liệu giảng dạy.'}
            />
          </div>
        ) : (
          <ul className="divide-y divide-navy-50">
            {materials.map(m => {
              const t = getMaterialType(m.type)
              return (
                <li key={m.id} className="flex items-center gap-3 px-4 py-3">
                  <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-md shrink-0', t.badge)}>
                    {t.label}
                  </span>
                  <a
                    href={m.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-navy-800 hover:text-navy-600 hover:underline min-w-0 flex-1"
                  >
                    <span className="truncate">{m.title}</span>
                    <ExternalLink size={13} className="shrink-0 text-navy-400" />
                  </a>
                  {isAdmin && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openEdit(m)}
                        className="p-1.5 rounded-lg text-navy-400 hover:text-navy-700 hover:bg-navy-50 transition-colors"
                        title="Sửa"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(m.id)}
                        className="p-1.5 rounded-lg text-navy-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Xóa"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <MaterialModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editingItem={editingItem}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  )
}
