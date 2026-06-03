import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { teacherService, classService } from '@/services/classService'
import { ClassModal } from '@/components/classes/ClassModal'
import { Button, Card, Modal, toast } from '@/components/ui'
import { Plus } from 'lucide-react'

export function AdminPanelPage() {
  const { teacher } = useAuth()
  const [teachers, setTeachers] = useState([])
  const [classes, setClasses] = useState([])
  const [loadingTeachers, setLoadingTeachers] = useState(true)
  const [loadingClasses, setLoadingClasses] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditTeacherModal, setShowEditTeacherModal] = useState(false)
  const [selectedClass, setSelectedClass] = useState(null)
  const [editingTeacherId, setEditingTeacherId] = useState(null)

  useEffect(() => {
    loadTeachers()
    loadClasses()
  }, [])

  const loadTeachers = async () => {
    try {
      setLoadingTeachers(true)
      const data = await teacherService.getAll()
      setTeachers(data)
    } catch (err) {
      toast.error('Lỗi tải danh sách giáo viên: ' + err.message)
    } finally {
      setLoadingTeachers(false)
    }
  }

  const loadClasses = async () => {
    try {
      setLoadingClasses(true)
      const data = await classService.getAll()
      setClasses(data)
    } catch (err) {
      toast.error('Lỗi tải danh sách lớp: ' + err.message)
    } finally {
      setLoadingClasses(false)
    }
  }

  const handleCreateClass = async (formData) => {
    try {
      await classService.create(formData)
      setShowCreateModal(false)
      loadClasses()
    } catch (err) {
      toast.error('Lỗi tạo lớp: ' + err.message)
    }
  }

  const handleUpdateTeacher = async () => {
    if (!editingTeacherId) {
      toast.error('Vui lòng chọn giáo viên')
      return
    }
    try {
      await classService.update(selectedClass.id, { teacherId: editingTeacherId })
      toast.success('Cập nhật giáo viên thành công!')
      setShowEditTeacherModal(false)
      loadClasses()
    } catch (err) {
      toast.error('Lỗi cập nhật: ' + err.message)
    }
  }

  if (!teacher?.is_admin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-navy-800 font-semibold">Chỉ admin mới có thể truy cập</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-navy-900 mb-2">Bảng Điều Khiển Admin</h1>
        <p className="text-navy-600">Quản lý giáo viên và lớp học</p>
      </div>

      {/* Teachers Section */}
      <div>
        <h2 className="text-lg font-semibold text-navy-900 mb-4">Danh Sách Giáo Viên</h2>
        {loadingTeachers ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 rounded-full border-4 border-navy-200 border-t-navy-800 animate-spin mx-auto" />
          </div>
        ) : teachers.length === 0 ? (
          <Card className="text-center py-8 text-navy-600">
            Chưa có giáo viên nào
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teachers.map(t => (
              <Card key={t.id} className="p-4">
                <p className="font-semibold text-navy-900">{t.name}</p>
                <p className="text-sm text-navy-600">{t.email}</p>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Classes Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-navy-900">Danh Sách Lớp Học</h2>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="gap-2"
            size="sm"
          >
            <Plus size={16} />
            Tạo Lớp
          </Button>
        </div>

        {loadingClasses ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 rounded-full border-4 border-navy-200 border-t-navy-800 animate-spin mx-auto" />
          </div>
        ) : classes.length === 0 ? (
          <Card className="text-center py-8 text-navy-600">
            Chưa có lớp nào
          </Card>
        ) : (
          <div className="space-y-3">
            {classes.map(cls => (
              <Card key={cls.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-navy-900">{cls.name}</p>
                  <p className="text-sm text-navy-600">Giáo viên: {cls.teacherName || 'Chưa gán'}</p>
                </div>
                <Button
                  onClick={() => {
                    setSelectedClass(cls)
                    setEditingTeacherId(cls.teacherId)
                    setShowEditTeacherModal(true)
                  }}
                  variant="secondary"
                  size="sm"
                >
                  Đổi GV
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Class Modal - reuse ClassModal */}
      <ClassModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        classItem={null}
        onSave={handleCreateClass}
        isAdmin={true}
        teachers={teachers}
      />

      {/* Edit Teacher Modal */}
      <Modal
        open={showEditTeacherModal}
        onClose={() => setShowEditTeacherModal(false)}
        title={`Đổi Giáo Viên cho Lớp ${selectedClass?.name}`}
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setShowEditTeacherModal(false)} size="sm">
              Hủy
            </Button>
            <Button onClick={handleUpdateTeacher} size="sm">
              Cập nhật
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-navy-600 uppercase tracking-wide">
            Giáo viên phụ trách
          </label>
          <select
            value={editingTeacherId}
            onChange={e => setEditingTeacherId(e.target.value)}
            className="select"
          >
            <option value="">Chọn giáo viên</option>
            {teachers.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </Modal>
    </div>
  )
}
