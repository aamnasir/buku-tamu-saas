'use client'

import { createClient } from '../../lib/supabase/client'
import { useSearchParams } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'

function CheckinForm() {
  const searchParams = useSearchParams()
  const schoolId = searchParams.get('school_id')
  const supabase = createClient()

  const [schoolName, setSchoolName] = useState('Sekolah')
  const [loading, setLoading] = useState(false)
  const [screen, setScreen] = useState<'form' | 'success' | 'blacklist'>('form')

  const [name, setName] = useState('')
  const [identity, setIdentity] = useState('')
  const [category, setCategory] = useState('parent')
  const [purpose, setPurpose] = useState('meeting')
  const [targetStaff, setTargetStaff] = useState('')

  useEffect(() => {
    if (schoolId) {
      const fetchSchool = async () => {
        const { data } = await supabase.from('schools').select('name').eq('id', schoolId).single()
        if (data) setSchoolName(data.name)
      }
      fetchSchool()
    }
  }, [schoolId, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!schoolId) return alert("ID Sekolah tidak valid")
    setLoading(true)

    const res = await fetch('/api/public-checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        school_id: schoolId, 
        full_name: name, 
        identity_number: identity, 
        category, 
        purpose, 
        target_staff: targetStaff 
      })
    })

    const result = await res.json()
    if (result.error === "PENGUNJUNG_BLACKLIST") {
      setScreen('blacklist')
    } else if (result.error) {
      alert("Gagal check-in: " + result.error)
    } else {
      setScreen('success')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      {screen === 'form' && (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 w-full max-w-md">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-heading font-bold text-gray-800">Check-in Pengunjung</h1>
            <p className="text-sm text-gray-500 mt-1">{schoolName}</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Nama Lengkap *</label><input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm" placeholder="Nama sesuai KTP" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">No. Identitas (KTP/SIM) *</label><input type="text" required value={identity} onChange={(e) => setIdentity(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm" placeholder="Nomor identitas" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Kategori *</label><select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm"><option value="parent">Orang Tua</option><option value="vendor">Vendor</option><option value="government">Pemerintah</option><option value="student_candidate">Calon Siswa</option><option value="other">Lainnya</option></select></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Tujuan *</label><select value={purpose} onChange={(e) => setPurpose(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm"><option value="meeting">Meeting</option><option value="pickup">Pickup</option><option value="delivery">Delivery</option><option value="other">Lainnya</option></select></div>
            </div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Staff yang Dituju</label><input type="text" value={targetStaff} onChange={(e) => setTargetStaff(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm" placeholder="Nama staff/ruangan" /></div>
            <button type="submit" disabled={loading} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 mt-2">{loading ? 'Memproses...' : 'Check-in Sekarang'}</button>
          </form>
        </div>
      )}

      {screen === 'success' && (
        <div className="text-center max-w-sm mx-auto">
          <div className="bg-white p-8 rounded-2xl shadow-lg">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4 text-green-600 text-4xl">✓</div>
            <h2 className="text-2xl font-heading font-bold text-gray-800 mb-2">Check-in Berhasil!</h2>
            <p className="text-gray-500 mb-1">Selamat datang, {name}</p>
          </div>
        </div>
      )}

      {screen === 'blacklist' && (
        <div className="text-center max-w-sm mx-auto">
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-red-200">
            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4 text-red-600 text-4xl">✕</div>
            <h2 className="text-2xl font-heading font-bold text-red-600 mb-2">Akses Ditolak</h2>
            <p className="text-gray-500 text-sm">Anda terdaftar dalam daftar pembatasan.</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CheckinPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Memuat...</div>}>
      <CheckinForm />
    </Suspense>
  )
}