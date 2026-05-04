import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Volume2, ChevronDown, Highlighter } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useSessionStore } from '../store/useSessionStore'

interface ReadingText {
  id: string
  title: string
  content: string
  level: 'basic' | 'intermediate' | 'advanced'
}

interface TextReaderProps {
  onTextSelect?: (text: string) => void
}

export default function TextReader({ onTextSelect }: TextReaderProps) {
  const [texts, setTexts] = useState<ReadingText[]>([])
  const [selectedLevel, setSelectedLevel] = useState<'basic' | 'intermediate' | 'advanced'>('intermediate')
  const [currentText, setCurrentText] = useState<ReadingText | null>(null)
  const [loading, setLoading] = useState(true)
  const addXp = useSessionStore((state) => state.addXp)
  const [showLevelSelector, setShowLevelSelector] = useState(false)

  useEffect(() => {
    fetchTexts()
  }, [])

  useEffect(() => {
    if (texts.length > 0) {
      const text = texts.find((t) => t.level === selectedLevel)
      setCurrentText(text || texts[0])
    }
  }, [texts, selectedLevel])

  const fetchTexts = async () => {
    try {
      const { data, error } = await supabase
        .from('reading_texts')
        .select('*')
        .order('level')

      if (error) throw error
      setTexts(data as ReadingText[])
    } catch (err) {
      console.error('Error fetching texts:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLevelChange = (level: 'basic' | 'intermediate' | 'advanced') => {
    if (level !== selectedLevel) {
      setSelectedLevel(level)
      addXp(10)
      setShowLevelSelector(false)
    }
  }

  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection()
    if (selection && selection.toString().trim().length > 10) {
      const text = selection.toString().trim()
      if (onTextSelect) {
        onTextSelect(text)
      }
    }
  }, [onTextSelect])

  const speakText = () => {
    if (currentText && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(currentText.content)
      utterance.lang = 'es-ES'
      window.speechSynthesis.speak(utterance)
    }
  }

  const levelLabels = {
    basic: 'Básico',
    intermediate: 'Intermedio',
    advanced: 'Avanzado',
  }

  const levelColors = {
    basic: 'bg-green-100 text-green-800',
    intermediate: 'bg-yellow-100 text-yellow-800',
    advanced: 'bg-red-100 text-red-800',
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-8 h-8 border-2 border-ink border-t-transparent rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-paper-dark bg-paper/50">
        <div className="relative">
          <button
            onClick={() => setShowLevelSelector(!showLevelSelector)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-paper-dark text-sm font-medium hover:bg-paper transition-colors"
          >
            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${levelColors[selectedLevel]}`}>
              {levelLabels[selectedLevel]}
            </span>
            <ChevronDown className="w-4 h-4 text-ink/50" />
          </button>

          {showLevelSelector && (
            <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-lg border border-paper-dark py-2 z-10 min-w-[150px]">
              {(Object.keys(levelLabels) as Array<keyof typeof levelLabels>).map((level) => (
                <button
                  key={level}
                  onClick={() => handleLevelChange(level)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-paper transition-colors flex items-center justify-between ${
                    selectedLevel === level ? 'font-semibold' : ''
                  }`}
                >
                  <span className={`px-2 py-0.5 rounded text-xs ${levelColors[level]}`}>
                    {levelLabels[level]}
                  </span>
                  {selectedLevel === level && <div className="w-2 h-2 bg-verification rounded-full" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={speakText}
            className="p-2 rounded-lg hover:bg-paper transition-colors"
            title="Escuchar texto"
          >
            <Volume2 className="w-5 h-5 text-ink/60" />
          </button>
        </div>
      </div>

      {/* Text Content */}
      <div 
        className="flex-1 overflow-y-auto px-4 py-6 lg:px-8 lg:py-8"
        onMouseUp={handleTextSelection}
      >
        {currentText ? (
          <article>
            <div className="flex items-center gap-2 mb-4">
              <Highlighter className="w-4 h-4 text-ink/40" />
              <span className="text-xs text-ink/40">Selecciona texto para guardar evidencia</span>
            </div>
            <h2 className="font-serif text-2xl lg:text-3xl font-bold text-ink mb-6 leading-tight">
              {currentText.title}
            </h2>
            <div className="prose prose-lg max-w-none">
              {currentText.content.split('\n\n').map((paragraph, index) => (
                <p
                  key={index}
                  className="font-serif text-lg leading-relaxed text-ink/90 mb-4 select-text"
                  style={{ fontFamily: "'Libre Baskerville', 'Merriweather', Georgia, serif" }}
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </article>
        ) : (
          <div className="text-center py-12 text-ink/50">
            No hay textos disponibles para este nivel.
          </div>
        )}
      </div>
    </div>
  )
}
