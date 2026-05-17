'use client'

import { createClient } from '../../lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [schoolName, setSchoolName] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Panggil Supabase Auth dan sisipkan metadata
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          school_name: schoolName
        }
      }
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    // Jika sukses, langsung arahkan ke dashboard
    // Trigger database akan membuatkan school & profile di belakang layar
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary p-4">
      <div className="bg-white/10 backdrop-blur p-8 rounded-2xl border border-white/20 w-full max-w-md">
        <h1 className="text-3xl font-heading font-bold text-white text-center mb-2">Daftar Sekolah Baru</h1>
        <p className="text-white/50 text-center text-sm mb-6">Buat akun untuk mengelola buku tamu sekolah Anda</p>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-2 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="text-white/70 text-sm mb-1 block">Nama Sekolah / Yayasan</label>
            <input 
              type="text" 
              required 
              value={schoolName} 
              onChange={(e) => setSchoolName(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-accent" 
              placeholder="SMP Negeri 1 Contoh" 
            />
          </div>
          
          <div>
            <label className="text-white/70 text-sm mb-1 block">Nama Lengkap Admin</label>
            <input 
              type="text" 
              required 
              value={fullName} 
              onChange={(e) => setFullName(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-accent" 
              placeholder="Dr. Ahmad Fauzi" 
            />
          </div>

          <div>
            <label className="text-white/70 text-sm mb-1 block">Email Institusi</label>
            <input 
              type="email" 
              required 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-accent" 
              placeholder="admin@sekolah.sch.id" 
            />
          </div>

          <div>
            <label className="text-white/70 text-sm mb-1 block">Password</label>
            <input 
              type="password" 
              required 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-accent" 
              placeholder="Min. 6 karakter" 
              minLength={6}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-2.5 bg-accent hover:bg-accent-light text-white font-bold rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Membuat Akun...' : 'Daftar Sekarang'}
          </button>
        </form>

        <p className="text-center text-white/40 text-sm mt-6">
          Sudah punya akun?{' '}
          <Link href="/" className="text-accent hover:text-accent-light font-semibold">
            Masuk di sini
          </Link>
        </p>
      </div>
    </div>
  )
}