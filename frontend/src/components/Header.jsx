import React from 'react'
import { Target, Zap } from 'lucide-react'

const Header = () => (
  <header className="sticky top-0 z-50 bg-bg/95 backdrop-blur-xl border-b border-slate-700/20">
    <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-light rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
          <Target className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-100 tracking-tight">QuizMaster Pro</h1>
          <p className="text-xs text-slate-500 font-medium">AI-Powered Learning</p>
        </div>
      </div>
      <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5">
        <Zap className="w-4 h-4 text-primary-light" />
        <span className="text-sm font-semibold text-primary-light">Groq AI</span>
      </div>
    </div>
  </header>
)

export default Header