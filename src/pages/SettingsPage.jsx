import { useState, useEffect } from 'react'
import { Save } from 'lucide-react'
import { Card, Input, Button, toast, Skeleton } from '@/components/ui'
import { settingsService, DEFAULT_SETTINGS } from '@/services/settingsService'

export const SettingsPage = () => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [loading, setLoading]   = useState(true)
  const [saved, setSaved]       = useState(false)

  useEffect(() => {
    settingsService.get()
      .then(s => { setSettings(s); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    try {
      await settingsService.upsert(settings)
      setSaved(true)
      toast.success('Đã lưu cài đặt!')
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      toast.error('Lỗi khi lưu: ' + err.message)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6 max-w-xl">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in max-w-xl">
      <div>
        <h1 className="text-2xl font-display font-bold text-navy-900">Cài Đặt</h1>
        <p className="text-sm text-navy-400 mt-0.5">Thông tin trung tâm</p>
      </div>

      <Card className="p-6 flex flex-col gap-5">
        <h2 className="font-semibold text-navy-800 text-sm uppercase tracking-wide">Thông Tin Chung</h2>
        <Input
          label="Tên Trung Tâm"
          value={settings.centerName || ''}
          onChange={e => setSettings(s => ({ ...s, centerName: e.target.value }))}
          placeholder="VD: Anh Ngữ Ms.Phương"
        />
        <Input
          label="Tên Giáo Viên"
          value={settings.teacherName || ''}
          onChange={e => setSettings(s => ({ ...s, teacherName: e.target.value }))}
          placeholder="VD: Nguyễn Văn A"
        />
        <Button onClick={handleSave} variant="primary" className="w-fit gap-2">
          <Save size={15} />
          {saved ? 'Đã lưu!' : 'Lưu Cài Đặt'}
        </Button>
      </Card>
    </div>
  )
}
