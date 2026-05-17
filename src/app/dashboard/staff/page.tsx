'use client'

import { createClient } from '../../../lib/supabase/client'
import { useEffect, useState } from 'react'

export default function StaffPage() {
  const supabase = createClient()
  const [schoolId, setSchoolId] = useState<string | null>(null)
  const [staffs, setStaffs] = useState<any[]>([])
  
  // Form State
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')

  useEffect(() => {
    const initData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase.from('profiles').select('school_id').eq('id', user.id).single()
      if (profile) {
        setSchoolId(profile.school_id)
        fetchStaffs(profile.school_id)
      }
    }
    initData()
  }, [])

  const fetchStaffs = async (sId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('school_id', sId).order('created_at', { ascending: false })
    setStaffs(data || [])
  }

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!schoolId) return

    const res = await fetch('/api/create-staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, full_name: fullName, school_id: schoolId })
    })

    const result = await res.json()
    if (result.error) {
      alert("Gagal: " + result.error)
    } else {
      alert("Staff berhasil ditambahkan!")
      setEmail(''); setPassword(''); setFullName('')
      fetchStaffs(schoolId)
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-heading font-bold text-primary mb-6">Kelola Staff & Security</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-cream-dark h-fit">
          <h2 className="font-heading font-bold text-lg text-primary mb-4">Tambah Staff Baru</h2>
          <form onSubmit={handleAddStaff} className="space-y-3">
            <input type="text" required placeholder="Nama Lengkap" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full p-2 border border-cream-dark rounded-lg focus:outline-none focus:border-accent" />
            <input type="email" required placeholder="Email Staff" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-2 border border-cream-dark rounded-lg focus:outline-none focus:border-accent" />
            <input type="password" required placeholder="Password (Min 6)" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} className="w-full p-2 border border-cream-dark rounded-lg focus:outline-none focus:border-accent" />
            <button type="submit" className="w-full bg-primary hover:bg-primary-light text-white font-bold py-2 rounded-xl transition-colors cursor-pointer">
              Buat Akun Staff
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-cream-dark">
          <h2 className="font-heading font-bold text-lg text-primary mb-4">Daftar Pengguna</h2>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b-2 border-cream-dark">
                <th className="py-2 text-xs text-muted uppercase">Nama</th>
                <th className="py-2 text-xs text-muted uppercase">Role</th>
              </tr>
            </thead>
            <tbody>
              {staffs.map((s: any) => (
                <tr key={s.id} className="border-b border-cream-dark">
                  <td className="py-2 text-sm font-medium">{s.full_name}</td>
                  <td className="py-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${s.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {s.role}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}