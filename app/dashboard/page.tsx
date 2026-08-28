'use client'
import { Bird, Video, FileText, Folder, Plus, Download, LogOut } from 'lucide-react'

export default function Dashboard() {
  return (
    <div className="flex h-screen bg-neutral-950 text-white font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-neutral-800 p-4 flex flex-col justify-between">
        <div className="space-y-6">
          <div className="flex items-center gap-2 px-2">
            <Bird className="w-6 h-6 text-emerald-500" />
            <span className="font-bold text-lg">Parakeet AI</span>
          </div>

          <nav className="space-y-1">
            <div className="text-xs font-semibold text-neutral-500 px-2 mb-2">Workspace</div>
            <button className="w-full flex items-center gap-3 px-3 py-2 bg-neutral-800 rounded-lg text-sm text-white font-medium">
              <Video className="w-4 h-4 text-emerald-400" /> Call Sessions
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 text-neutral-400 hover:bg-neutral-900 rounded-lg text-sm transition">
              <FileText className="w-4 h-4" /> CVs & Resumes
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 text-neutral-400 hover:bg-neutral-900 rounded-lg text-sm transition">
              <Folder className="w-4 h-4" /> Documents
            </button>
          </nav>
        </div>

        <div className="space-y-4">
          <button className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-neutral-700 hover:bg-neutral-800 rounded-xl text-sm transition font-medium">
            <Download className="w-4 h-4" /> Download Desktop App
          </button>
          <button className="w-full flex items-center gap-2 px-2 text-xs text-neutral-500 hover:text-neutral-300">
            <LogOut className="w-4 h-4" /> Log Out
          </button>
        </div>
      </aside>

      {/* Main Panel */}
      <main className="flex-1 p-8 flex flex-col justify-between">
        <div>
          <header className="flex items-center justify-between pb-6 border-b border-neutral-800">
            <div>
              <h1 className="text-xl font-bold">Call Sessions</h1>
              <p className="text-xs text-neutral-400">Prepare for calls and review past sessions.</p>
            </div>
            <button className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
              <Plus className="w-4 h-4" /> Create Session
            </button>
          </header>

          <div className="flex flex-col items-center justify-center py-32 text-center">
            <h3 className="font-semibold text-lg mb-1">You have no sessions yet</h3>
            <p className="text-sm text-neutral-500 mb-6">Your sessions will appear here once created.</p>
            <button className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
              <Plus className="w-4 h-4" /> Create Session
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}