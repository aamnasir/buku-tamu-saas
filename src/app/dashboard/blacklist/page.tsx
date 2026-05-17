'use client'

import { createClient } from '../../../lib/supabase/client'
import { useEffect, useState } from 'react'

export default function BlacklistPage() {
  const supabase = createClient()
  const [schoolId, setSchoolId] = useState<string | null>(null)
  const [blacklists, setBlacklists] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Form State
  const [name, setName] = useState('')
  const [identity, setIdentity] = useState('')
  const [reason, setReason] = useState('')

  useEffect(() => {
    const initData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase.from('profiles').select('school_id').eq('id', user.id).single()
      if (profile) {
        setSchoolId(profile.school_id)
        fetchBlacklists(profile.school_id)
      }
    }
    initData()
  }, [])

  const fetchBlacklists = async (sId: string) => {
    setLoading(true)
    const { data } = await supabase.from('blacklist').select('*').eq('school_id', sId).order('created_at', { ascending: false })
    setBlacklists(data || [])
    setLoading(false)
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!schoolId) return

    const { error } = await supabase.from('blacklist').insert({
      school_id: schoolId,
      full_name: name,
      identity_number: identity,
      reason: reason
    })

    if (!error) {
      setName(''); setIdentity(''); setReason('')
      fetchBlacklists(schoolId) // Refresh list
    } else {
      alert("Gagal menambahkan: " + error.message)
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-heading font-bold text-primary mb-6">Daftar Pembatasan (Blacklist)</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Tambah */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-cream-dark h-fit">
          <h2 className="font-heading font-bold text-lg text-primary mb-4">Tambah Orang Baru</h2>
          <form onSubmit={handleAdd} className="space-y-3">
            <input type="text" required placeholder="Nama Lengkap" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 border border-cream-dark rounded-lg focus:outline-none focus:border-accent" />
            <input type="text" required placeholder="No. KTP / Identitas" value={identity} onChange={(e) => setIdentity(e.target.value)} className="w-full p-2 border border-cream-dark rounded-lg focus:outline-none focus:border-accent" />
            <textarea required placeholder="Alasan pembatasan..." value={reason} onChange={(e) => setReason(e.target.value)} className="w-full p-2 border border-cream-dark rounded-lg focus:outline-none focus:border-accent" rows={3}></textarea>
            <button type="submit" className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 rounded-xl transition-colors cursor-pointer">
              Tambahkan ke Daftar
            </button>
          </form>
        </div>

        {/* Daftar Tabel */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-cream-dark">
          <h2 className="font-heading font-bold text-lg text-primary mb-4">Orang yang Dibatasi</h2>
          {loading ? <p className="text-muted">Memuat data...</p> : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b-2 border-cream-dark">
                  <th className="py-2 text-xs text-muted uppercase">Nama</th>
                  <th className="py-2 text-xs text-muted uppercase">Identitas</th>
                  <th className="py-2 text-xs text-muted uppercase">Alasan</th>
                </tr>
              </thead>
              <tbody>
                {blacklists.length === 0 && (
                  <tr><td colSpan={3} className="text-center py-6 text-muted">Belum ada data pembatasan</td></tr>
                )}
                {blacklists.map((bl: any) => (
                  <tr key={bl.id} className="border-b border-cream-dark">
                    <td className="py-2 text-sm font-medium">{bl.full_name}</td>
                    <td className="py-2 text-sm text-muted font-mono">{bl.identity_number}</td>
                    <td className="py-2 text-sm text-muted">{bl.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}