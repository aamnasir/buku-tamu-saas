'use client'

import { createClient } from '../lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      
      if (error) { 
        alert(error.message) 
      } else {
        // Cek role user setelah login
        const { data: { user } } = await supabase.auth.getUser()
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user?.id)
          .single()

        // Arahkan berdasarkan role
        if (profile?.role === 'staff' || profile?.role === 'security') {
          router.push('/kiosk')
        } else {
          router.push('/dashboard')
        }
        router.refresh()
      }
    } catch (err) {
      alert("Gagal menghubungi server.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary">
      <div className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl border border-white/20 w-full max-w-sm">
        <h1 className="text-3xl font-heading font-bold text-white text-center mb-6">BukuTamu</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-white/70 text-sm mb-1 block">Email</label>
            <input 
              type="email" 
              placeholder="admin@sekolah.id" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-accent" 
              required 
            />
          </div>
          <div>
            <label className="text-white/70 text-sm mb-1 block">Password</label>
            <input 
              type="password" 
              placeholder="Min. 6 karakter" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-accent" 
              required 
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-2.5 bg-accent hover:bg-accent-light text-white font-bold rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>
        
        <p className="text-center text-white/40 text-sm mt-6">
          Belum punya akun sekolah?{' '}
          <a href="/register" className="text-accent hover:text-accent-light font-semibold">
            Daftar SaaS BukuTamu
          </a>
        </p>
      </div>
    </div>
  )
}