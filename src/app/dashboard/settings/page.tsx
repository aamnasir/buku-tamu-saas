'use client'

import { createClient } from '../../../lib/supabase/client'
import { useEffect, useState } from 'react'

export default function SettingsPage() {
  const supabase = createClient()
  const [schoolId, setSchoolId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // School Info State
  const [schoolName, setSchoolName] = useState('')
  const [schoolLocation, setSchoolLocation] = useState('')
  const [schoolPhone, setSchoolPhone] = useState('')
  const [schoolEmail, setSchoolEmail] = useState('')
  
  // Notification State (WhatsApp)
  const [notifPhone, setNotifPhone] = useState('')
  const [notifyBlacklist, setNotifyBlacklist] = useState(true)
  const [notifyVip, setNotifyVip] = useState(true)

  useEffect(() => {
    const initData = async () => {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase.from('profiles').select('school_id').eq('id', user.id).single()
      if (profile) {
        setSchoolId(profile.school_id)
        await fetchSettings(profile.school_id)
      }
      setLoading(false)
    }
    initData()
  }, [])

  const fetchSettings = async (sId: string) => {
    const { data } = await supabase.from('schools').select('*').eq('id', sId).single()
    if (data) {
      setSchoolName(data.name || '')
      setSchoolLocation(data.location || '')
      setSchoolPhone(data.phone || '')
      setSchoolEmail(data.email || '')
      setNotifPhone(data.notification_phone || '')
      setNotifyBlacklist(data.notify_blacklist ?? true)
      setNotifyVip(data.notify_vip ?? true)
    }
  }

  const handleSave = async () => {
    if (!schoolId) return
    setSaving(true)

    const { error } = await supabase.from('schools').update({
      name: schoolName,
      location: schoolLocation,
      phone: schoolPhone,
      email: schoolEmail,
      notification_phone: notifPhone,
      notify_blacklist: notifyBlacklist,
      notify_vip: notifyVip
    }).eq('id', schoolId)

    if (error) {
      alert("Gagal menyimpan: " + error.message)
    } else {
      alert("Pengaturan berhasil disimpan!")
    }
    setSaving(false)
  }

  if (loading) return <p className="text-muted">Memuat pengaturan...</p>

  return (
    <div>
      <h1 className="text-3xl font-heading font-bold text-primary mb-6">Pengaturan Sekolah</h1>

      <div className="max-w-3xl space-y-6">
        
        {/* Info Sekolah */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-cream-dark">
          <h2 className="font-heading font-bold text-lg text-primary mb-4">Informasi Sekolah</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="block text-sm font-medium text-muted mb-1">Nama Sekolah</label>
              <input type="text" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} className="w-full p-2 border border-cream-dark rounded-lg focus:outline-none focus:border-accent" />
            </div>
            <div className="form-group">
              <label className="block text-sm font-medium text-muted mb-1">Lokasi</label>
              <input type="text" value={schoolLocation} onChange={(e) => setSchoolLocation(e.target.value)} className="w-full p-2 border border-cream-dark rounded-lg focus:outline-none focus:border-accent" />
            </div>
            <div className="form-group">
              <label className="block text-sm font-medium text-muted mb-1">Telepon Sekolah</label>
              <input type="tel" value={schoolPhone} onChange={(e) => setSchoolPhone(e.target.value)} className="w-full p-2 border border-cream-dark rounded-lg focus:outline-none focus:border-accent" />
            </div>
            <div className="form-group">
              <label className="block text-sm font-medium text-muted mb-1">Email Sekolah</label>
              <input type="email" value={schoolEmail} onChange={(e) => setSchoolEmail(e.target.value)} className="w-full p-2 border border-cream-dark rounded-lg focus:outline-none focus:border-accent" />
            </div>
          </div>
        </div>

        {/* Pengaturan WhatsApp */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-cream-dark">
          <h2 className="font-heading font-bold text-lg text-primary mb-2">Notifikasi WhatsApp</h2>
          <p className="text-sm text-muted mb-4">Atur notifikasi otomatis ke WhatsApp Kepala Sekolah saat ada kejadian penting.</p>
          
          <div className="form-group mb-4">
            <label className="block text-sm font-medium text-muted mb-1">Nomor WA Kepala Sekolah</label>
            <input 
              type="tel" 
              value={notifPhone} 
              onChange={(e) => setNotifPhone(e.target.value)} 
              className="w-full p-2 border border-cream-dark rounded-lg focus:outline-none focus:border-accent" 
              placeholder="Contoh: 081234567890" 
            />
            <p className="text-xs text-muted mt-1">Gunakan format 08xx atau 62xx. Pastikan nomor ini sudah terdaftar di Fonnte.</p>
          </div>

          <div className="space-y-3 mb-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={notifyBlacklist} 
                onChange={(e) => setNotifyBlacklist(e.target.checked)} 
                className="w-4 h-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              />
              <div>
                <span className="text-sm font-medium">Alert Daftar Pembatasan</span>
                <p className="text-xs text-muted">Kirim WA saat tamu yang di-blacklist mencoba check-in.</p>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={notifyVip} 
                onChange={(e) => setNotifyVip(e.target.checked)} 
                className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <div>
                <span className="text-sm font-medium">Notifikasi Tamu VIP</span>
                <p className="text-xs text-muted">Kirim WA saat tamu penting (Pemerintah, Media, Calon Siswa) check-in.</p>
              </div>
            </label>
          </div>
        </div>

        <button onClick={handleSave} disabled={saving} className="btn btn-primary w-full py-3 text-base disabled:opacity-50">
          {saving ? 'Menyimpan...' : 'Simpan Semua Pengaturan'}
        </button>

      </div>
    </div>
  )
}