import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Highlighter, Tag, Check, X, Star } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useSessionStore } from '../store/useSessionStore'

interface Evidence {
  id: string
  text: string
  category: 'fact' | 'opinion' | 'context'
  correct: boolean
}

interface EvidenceCollectorProps {
  selectedText: string
  onClearSelection: () => void
}

export default function EvidenceCollector({ selectedText, onClearSelection }: EvidenceCollectorProps) {
  const [evidences, setEvidences] = useState<Evidence[]>([])
  const [showCategoryPicker, setShowCategoryPicker] = useState(false)
  const [loading, setLoading] = useState(false)
  const studentId = useSessionStore((state) => state.studentId)
  const addXp = useSessionStore((state) => state.addXp)

  useEffect(() => {
    if (selectedText) {
      setShowCategoryPicker(true)
    }
  }, [selectedText])

  useEffect(() => {
    fetchEvidences()
  }, [studentId])

  const fetchEvidences = async () => {
    if (!studentId) return
    const { data } = await supabase
      .from('student_progress')
      .select('evidences_collected')
      .eq('student_id', studentId)
      .single()
    
    if (data?.evidences_collected) {
      setEvidences(data.evidences_collected)
    }
  }

  const handleSaveEvidence = async (category: 'fact' | 'opinion' | 'context') => {
    if (!studentId || !selectedText) return

    setLoading(true)
    
    // Simular verificación de categoría (en producción vendría de metadata)
    const isCorrect = simulateCategoryCheck(selectedText, category)
    
    const newEvidence: Evidence = {
      id: crypto.randomUUID(),
      text: selectedText,
      category,
      correct: isCorrect,
    }

    const updatedEvidences = [...evidences, newEvidence]
    setEvidences(updatedEvidences)

    try {
      await supabase
        .from('student_progress')
        .upsert({
          student_id: studentId,
          evidences_collected: updatedEvidences,
        })

      if (isCorrect) {
        addXp(50)
      } else {
        addXp(10)
      }
    } catch (err) {
      console.error('Error saving evidence:', err)
    } finally {
      setLoading(false)
      setShowCategoryPicker(false)
      onClearSelection()
    }
  }

  const simulateCategoryCheck = (text: string, category: string): boolean => {
    // Heurística simple para demo
    const lower = text.toLowerCase()
    if (category === 'fact' && (lower.includes('%') || lower.includes('según') || lower.includes('estudio'))) return true
    if (category === 'opinion' && (lower.includes('creo') || lower.includes('pienso') || lower.includes('debería'))) return true
    if (category === 'context' && (lower.includes('ejemplo') || lower.includes('como'))) return true
    return Math.random() > 0.3 // 70% de acierto para demo
  }

  const categoryLabels = {
    fact: { label: 'Hecho', color: 'bg-verification/20 text-verification', icon: Check },
    opinion: { label: 'Opinión', color: 'bg-evidence/20 text-ink', icon: Star },
    context: { label: 'Contexto', color: 'bg-blue-100 text-blue-800', icon: Tag },
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-evidence/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Highlighter className="w-8 h-8 text-ink" />
        </div>
        <h2 className="font-serif text-2xl font-semibold text-ink mb-2">
          Recolección de Evidencias
        </h2>
        <p className="text-ink/60">
          Selecciona texto en el panel izquierdo y clasifícalo
        </p>
      </div>

      {/* Category Picker Popup */}
      <AnimatePresence>
        {showCategoryPicker && selectedText && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="bg-white rounded-2xl p-6 shadow-lg border-2 border-evidence mb-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-ink">¿Qué tipo de evidencia es esto?</h3>
              <button onClick={() => { setShowCategoryPicker(false); onClearSelection() }} className="p-1 hover:bg-paper rounded">
                <X className="w-5 h-5 text-ink/50" />
              </button>
            </div>
            
            <div className="bg-paper p-3 rounded-xl mb-4 text-sm text-ink/80 italic border-l-4 border-evidence">
              "{selectedText.substring(0, 150)}{selectedText.length > 150 ? '...' : ''}"
            </div>

            <div className="grid grid-cols-3 gap-3">
              {(Object.keys(categoryLabels) as Array<keyof typeof categoryLabels>).map((cat) => {
                const { label, color, icon: Icon } = categoryLabels[cat]
                return (
                  <button
                    key={cat}
                    onClick={() => handleSaveEvidence(cat)}
                    disabled={loading}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-transparent hover:border-ink transition-all ${color} bg-opacity-10`}
                  >
                    <Icon className="w-6 h-6" />
                    <span className="font-medium text-sm">{label}</span>
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Evidence List */}
      <div className="space-y-3">
        {evidences.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-paper-dark">
            <Highlighter className="w-12 h-12 text-ink/20 mx-auto mb-3" />
            <p className="text-ink/50">No has recolectado evidencias aún</p>
            <p className="text-sm text-ink/40 mt-1">Selecciona texto en el panel izquierdo</p>
          </div>
        ) : (
          evidences.map((evidence, index) => {
            const { label, color } = categoryLabels[evidence.category]
            return (
              <motion.div
                key={evidence.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-white rounded-xl p-4 border-2 ${evidence.correct ? 'border-verification/30' : 'border-red-200'} shadow-sm`}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm text-ink/80 flex-1">"{evidence.text.substring(0, 120)}..."</p>
                  <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${color}`}>
                    {label}
                  </span>
                </div>
                {evidence.correct && (
                  <div className="flex items-center gap-1 mt-2 text-verification text-xs">
                    <Check className="w-3 h-3" />
                    <span>+50 XP</span>
                  </div>
                )}
              </motion.div>
            )
          })
        )}
      </div>

      {evidences.length > 0 && (
        <div className="mt-6 text-center">
          <p className="text-sm text-ink/50">
            Has recolectado {evidences.length} evidencia{evidences.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  )
}
