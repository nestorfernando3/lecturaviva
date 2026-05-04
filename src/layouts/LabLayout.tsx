import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, LogOut } from 'lucide-react'
import { useSessionStore } from '../store/useSessionStore'
import TextReader from '../components/TextReader'
import GnosisPreTest from '../components/GnosisPreTest'
import EvidenceCollector from '../components/EvidenceCollector'
import GuidedWriting from '../components/GuidedWriting'
import FinalReview from '../components/FinalReview'

type Tab = 'gnosis' | 'reading' | 'evidence' | 'writing' | 'review'

const tabs: { id: Tab; label: string }[] = [
  { id: 'gnosis', label: 'Gnosis' },
  { id: 'reading', label: 'Lectura' },
  { id: 'evidence', label: 'Evidencias' },
  { id: 'writing', label: 'Escritura' },
  { id: 'review', label: 'Revisión' },
]

export default function LabLayout() {
  const [activeTab, setActiveTab] = useState<Tab>('gnosis')
  const [mobilePanel, setMobilePanel] = useState<'text' | 'work'>('work')
  const [selectedText, setSelectedText] = useState('')
  const { nickname, xp, logout } = useSessionStore()
  const isAuthenticated = useSessionStore((state) => state.isAuthenticated)
  
  useEffect(() => {
    if (!isAuthenticated) {
      window.location.href = '/'
    }
  }, [isAuthenticated])

  const handleTextSelect = (text: string) => {
    setSelectedText(text)
    setActiveTab('evidence')
    setMobilePanel('work')
  }

  const handleClearSelection = () => {
    setSelectedText('')
  }

  const handleLogout = () => {
    logout()
    window.location.href = '/'
  }

  if (!isAuthenticated) return null

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-paper-dark px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-ink rounded-xl flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-paper" />
          </div>
          <div>
            <h1 className="font-serif text-lg font-semibold text-ink leading-tight">
              LecturaViva
            </h1>
            <p className="text-xs text-ink/50">Laboratorio de Lectura</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* XP Bar */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-32 h-2 bg-paper-dark rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-verification rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((xp % 100) / 100 * 100, 100)}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <span className="text-sm font-semibold text-verification">{xp} XP</span>
          </div>

          {/* User */}
          <div className="flex items-center gap-2">
            <div className="bg-paper px-3 py-1.5 rounded-full">
              <span className="text-sm font-medium text-ink">{nickname}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-paper transition-colors"
              title="Salir"
            >
              <LogOut className="w-4 h-4 text-ink/50" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Tab Switcher */}
      <div className="lg:hidden bg-white border-b border-paper-dark flex">
        <button
          onClick={() => setMobilePanel('text')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            mobilePanel === 'text'
              ? 'text-ink border-b-2 border-ink'
              : 'text-ink/50'
          }`}
        >
          Texto
        </button>
        <button
          onClick={() => setMobilePanel('work')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            mobilePanel === 'work'
              ? 'text-ink border-b-2 border-ink'
              : 'text-ink/50'
          }`}
        >
          Área de Trabajo
        </button>
      </div>

      {/* Main Content - Split Screen */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Panel - Text (40%) */}
        <div
          className={`${
            mobilePanel === 'text' ? 'flex' : 'hidden lg:flex'
          } lg:w-[40%] flex-col border-r border-paper-dark bg-white`}
        >
          <TextReader onTextSelect={handleTextSelect} />
        </div>

        {/* Right Panel - Work Area (60%) */}
        <div
          className={`${
            mobilePanel === 'work' ? 'flex' : 'hidden lg:flex'
          } lg:w-[60%] flex-col`}
        >
          {/* Tab Navigation */}
          <nav className="bg-white border-b border-paper-dark px-4 overflow-x-auto">
            <div className="flex gap-1 py-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? 'bg-ink text-paper'
                      : 'text-ink/60 hover:bg-paper'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </nav>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-4 lg:p-6">
            {activeTab === 'gnosis' && <GnosisPreTest onComplete={() => setActiveTab('reading')} />}
            {activeTab === 'reading' && (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-ink/20 mx-auto mb-4" />
                <h2 className="font-serif text-2xl font-semibold text-ink mb-2">
                  Lee el texto atentamente
                </h2>
                <p className="text-ink/60 max-w-md mx-auto">
                  El texto está en el panel izquierdo. Lee con atención para identificar la tesis principal y las evidencias.
                </p>
                <button
                  onClick={() => setActiveTab('evidence')}
                  className="mt-6 bg-ink text-paper px-6 py-3 rounded-xl font-medium hover:bg-ink/90 transition-colors"
                >
                  Ir a Recolección de Evidencias →
                </button>
              </div>
            )}
            {activeTab === 'evidence' && (
              <EvidenceCollector 
                selectedText={selectedText} 
                onClearSelection={handleClearSelection} 
              />
            )}
            {activeTab === 'writing' && <GuidedWriting />}
            {activeTab === 'review' && <FinalReview />}
          </div>
        </div>
      </div>
    </div>
  )
}
