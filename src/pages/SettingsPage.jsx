import { useState, useEffect } from 'react'
import { Save } from 'lucide-react'
import { Card, Input, Button, toast } from '@/components/ui'
import { getSettings, saveSettings } from '@/services/settingsService'

const DEFAULT_SETTINGS = { teacherName: '', centerName: 'Anh Ngữ Ms.Phương', defaultFeePerSession: 0, currency: 'đ' }

export const SettingsPage = () => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    getSettings().then(s => setSettings(s ?? DEFAULT_SETTINGS))
  }, [])

  const handleSave = async () => {
    try {
      await saveSettings(settings)
      setSaved(true)
      toast.success('Đã lưu cài đặt!')
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in max-w-xl">
      <div>
        <h1 className="text-2xl font-display font-bold text-navy-900">Cài Đặt</h1>
        <p className="text-sm text-navy-400 mt-0.5">Thông tin trung tâm và tuỳ chỉnh</p>
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
    </div>
  )
}
