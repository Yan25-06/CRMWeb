import { useState } from 'react'
import { Save, Database, Trash2, Upload } from 'lucide-react'
import { Card, Input, Button, toast } from '@/components/ui'
import { getSettings, saveSettings, exportData, importData, seedDemoData } from '@/store/db'

export const SettingsPage = () => {
  const [settings, setSettings] = useState(getSettings())
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    saveSettings(settings)
    setSaved(true)
    toast.success('Đã lưu cài đặt!')
    setTimeout(() => setSaved(false), 2000)
  }

  const handleImport = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        importData(ev.target.result)
        toast.success('Import thành công! Đang tải lại...')
        setTimeout(() => window.location.reload(), 1000)
      } catch {
        toast.error('File không hợp lệ')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleSeed = () => {
    if (!window.confirm('Thêm dữ liệu demo vào app? (Không xóa dữ liệu cũ)')) return
    seedDemoData()
    toast.success('Đã thêm dữ liệu demo!')
    setTimeout(() => window.location.reload(), 800)
  }

  const handleClear = () => {
    if (!window.confirm('XÓA TOÀN BỘ dữ liệu? Hành động này không thể hoàn tác!')) return
    localStorage.clear()
    toast.info('Đã xóa tất cả dữ liệu')
    setTimeout(() => window.location.reload(), 800)
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in max-w-xl">
      <div>
        <h1 className="text-2xl font-display text-navy-900">Cài Đặt</h1>
        <p className="text-sm text-navy-400 mt-0.5">Thông tin trung tâm và quản lý dữ liệu</p>
      </div>

      {/* General */}
      <Card className="p-6 flex flex-col gap-5">
        <h2 className="font-semibold text-navy-800 text-sm uppercase tracking-wide">Thông Tin Chung</h2>
        <Input
          label="Tên Trung Tâm"
          value={settings.centerName || ''}
          onChange={e => setSettings(s => ({ ...s, centerName: e.target.value }))}
          placeholder="VD: Trung Tâm Anh Văn ABC"
        />
        <Input
          label="Tên Giáo Viên"
          value={settings.teacherName || ''}
          onChange={e => setSettings(s => ({ ...s, teacherName: e.target.value }))}
          placeholder="VD: Nguyễn Văn A"
        />
        <Input
          label="Học Phí Mặc Định / Buổi"
          type="number"
          value={settings.defaultFeePerSession || ''}
          onChange={e => setSettings(s => ({ ...s, defaultFeePerSession: Number(e.target.value) }))}
          placeholder="VD: 150000"
        />
        <Button onClick={handleSave} variant="primary" className="w-fit gap-2">
          <Save size={15} />
          {saved ? 'Đã lưu!' : 'Lưu Cài Đặt'}
        </Button>
      </Card>

      {/* Data management */}
      <Card className="p-6 flex flex-col gap-4">
        <h2 className="font-semibold text-navy-800 text-sm uppercase tracking-wide">Quản Lý Dữ Liệu</h2>
        <p className="text-sm text-navy-500">
          Dữ liệu được lưu trên thiết bị này (localStorage). Xuất backup thường xuyên để tránh mất dữ liệu.
        </p>
        <div className="flex flex-col gap-2">
          <Button onClick={exportData} variant="secondary" className="justify-start gap-2 w-full">
            <Database size={15} />
            Xuất Backup (JSON)
          </Button>
          <label className="btn btn-md btn-secondary justify-start gap-2 w-full cursor-pointer">
            <Upload size={15} />
            Import Backup
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
          <Button onClick={handleSeed} variant="ghost" className="justify-start gap-2 w-full text-navy-600">
            <Database size={15} />
            Thêm Dữ Liệu Demo
          </Button>
        </div>
      </Card>

      {/* Danger zone */}
      <Card className="p-6 flex flex-col gap-4 border-red-100">
        <h2 className="font-semibold text-red-700 text-sm uppercase tracking-wide">Vùng Nguy Hiểm</h2>
        <Button onClick={handleClear} variant="danger" className="w-fit gap-2">
          <Trash2 size={15} />
          Xóa Toàn Bộ Dữ Liệu
        </Button>
      </Card>
    </div>
  )
}
