import { useState, useEffect } from 'react'
import { Card, Button, Empty, toast } from '@/components/ui'
import { Plus, BookOpen } from 'lucide-react'
import { getClasses, addClass, updateClass, deleteClass } from '@/services/classService'
import { getEnrollmentsByClass } from '@/services/enrollmentService'
import { ClassModal } from '@/components/classes/ClassModal'
import { ClassCard } from '@/components/classes/ClassCard'

export const ClassesOverviewPage = ({ onSelectClass }) => {
  const [classes, setClasses] = useState([])
  const [enrollmentCounts, setEnrollmentCounts] = useState({})
  const [classModalOpen, setClassModalOpen] = useState(false)
  const [editingClass, setEditingClass] = useState(null)

  const loadData = async () => {
    const cls = await getClasses()
    setClasses(cls)
    const counts = {}
    await Promise.all(cls.map(async c => {
      const enrollments = await getEnrollmentsByClass(c.id)
      counts[c.id] = enrollments.filter(e => e.status === 'active').length
    }))
    setEnrollmentCounts(counts)
  }

  useEffect(() => { loadData() }, [])

  const handleSaveClass = async (data) => {
    try {
      if (editingClass) {
        await updateClass(editingClass.id, data)
      } else {
        await addClass(data)
      }
      setClassModalOpen(false)
      setEditingClass(null)
      await loadData()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleDeleteClass = async (id) => {
    const enrollments = await getEnrollmentsByClass(id)
    const hasActiveStudents = enrollments.some(e => e.status !== 'dropped')
    if (hasActiveStudents) {
      toast.error('Không thể xóa lớp đang có học viên theo học. Vui lòng chuyển học viên sang lớp khác hoặc đổi trạng thái thành "Đã nghỉ" trước.')
      return
    }
    if (window.confirm('Bạn có chắc chắn muốn xóa lớp học này không?')) {
      await deleteClass(id)
      toast.success('Đã xóa lớp học')
      await loadData()
    }
  }

  const openClassModal = (classItem = null) => {
    setEditingClass(classItem)
    setClassModalOpen(true)
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-navy-900">Lớp Học</h1>
          <p className="text-sm text-navy-400 mt-0.5">Quản lý danh sách lớp học</p>
        </div>
        <Button onClick={() => openClassModal()} className="shrink-0 flex items-center gap-2">
          <Plus size={18} /> Thêm lớp học
        </Button>
      </div>

      {classes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {classes.map(cls => (
            <div key={cls.id} onClick={() => onSelectClass(cls.id)} className="cursor-pointer">
              <ClassCard
                cls={cls}
                studentCount={enrollmentCounts[cls.id] ?? 0}
                onEdit={() => openClassModal(cls)}
                onDelete={() => handleDeleteClass(cls.id)}
              />
            </div>
          ))}
        </div>
      ) : (
        <Card className="p-12">
          <Empty
            icon={<BookOpen />}
            title="Không có lớp học nào"
            desc="Bấm nút Thêm lớp học để tạo lớp mới"
            action={
              <Button onClick={() => openClassModal()} className="mt-4 flex items-center gap-2">
                <Plus size={18} /> Thêm lớp học
              </Button>
            }
          />
        </Card>
      )}

      <ClassModal
        open={classModalOpen}
        onClose={() => setClassModalOpen(false)}
        classItem={editingClass}
        onSave={handleSaveClass}
      />
    </div>
  )
}
