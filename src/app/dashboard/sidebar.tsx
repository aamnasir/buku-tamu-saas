'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function Sidebar({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="min-h-screen bg-cream flex relative">
      
      {/* Overlay Hitam saat sidebar terbuka di HP */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setIsOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-primary text-white flex flex-col p-6 transition-transform transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <h1 className="text-2xl font-heading font-bold mb-8 text-accent">BukuTamu</h1>
        
        <nav className="flex-1 space-y-2">
          <Link href="/dashboard" onClick={() => setIsOpen(false)} className="block py-2 px-4 rounded-lg hover:bg-white/10 transition-colors">📊 Dashboard</Link>
          <Link href="/dashboard/blacklist" onClick={() => setIsOpen(false)} className="block py-2 px-4 rounded-lg hover:bg-white/10 transition-colors">🚫 Daftar Pembatasan</Link>
          <Link href="/dashboard/appointments" onClick={() => setIsOpen(false)} className="block py-2 px-4 rounded-lg hover:bg-white/10 transition-colors">📅 Appointment</Link>
          <Link href="/dashboard/reports" onClick={() => setIsOpen(false)} className="block py-2 px-4 rounded-lg hover:bg-white/10 transition-colors">📄 Laporan</Link>
          <Link href="/dashboard/staff" onClick={() => setIsOpen(false)} className="block py-2 px-4 rounded-lg hover:bg-white/10 transition-colors">👥 Kelola Staff</Link>
          <Link href="/kiosk" onClick={() => setIsOpen(false)} className="block py-2 px-4 rounded-lg hover:bg-white/10 transition-colors">📱 Mode Kiosk</Link>
        </nav>

        <form action="/auth/signout" method="post" className="mt-auto">
          <button type="submit" className="w-full text-left py-2 px-4 rounded-lg hover:bg-red-500/20 text-red-300 transition-colors">🚪 Logout</button>
        </form>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto w-full">
        
        {/* Header Mobile dengan Tombol Hamburger */}
        <div className="md:hidden flex justify-between items-center mb-6 bg-primary text-white p-3 rounded-xl -mt-2 -ml-2 mr-2">
          <button onClick={() => setIsOpen(true)} className="text-white p-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <h1 className="text-lg font-heading font-bold">BukuTamu</h1>
          <div className="w-6"></div> {/* Penyeimbang */}
        </div>

        {children}
      </main>
    </div>
  )
}