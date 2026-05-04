import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Star, MessageSquare, Trophy } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useSessionStore } from '../store/useSessionStore'

export default function FinalReview() {
  const [progress, setProgress] = useState<any>(null)
  const [reflection, setReflection] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const studentId = useSessionStore((state) => state.studentId)
  const xp = useSessionStore((state) => state.xp)
  const addXp = useSessionStore((state) => state.addXp)

  useEffect(() => {
    fetchProgress()
  }, [studentId])

  const fetchProgress = async () => {
    if (!studentId) return
    const { data } = await supabase
      .from('student_progress')
      .select('*')
      .eq('student_id', studentId)
      .single()
    
    if (data) {
      setProgress(data)
      if (data.reflection) {
        setReflection(data.reflection)
        setSubmitted(true)
      }
    }
  }

  const handleSubmitReflection = async () => {
    if (!studentId || !reflection.trim()) return
    
    await supabase
      .from('student_progress')
      .upsert({
        student_id: studentId,
        reflection: reflection.trim(),
        gnosis_post: Math.min(5, Math.ceil(xp / 100)),
      })
    
    setSubmitted(true)
    addXp(50)
  }

  const evidenceCount = progress?.evidences_collected?.length || 0
  const feedbackCount = progress?.ai_feedback?.length || 0
  const hasFinalText = !!progress?.final_text

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-verification/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-8 h-8 text-verification" />
        </div>
        <h2 className="font-serif text-2xl font-semibold text-ink mb-2">
          Revisión Final
        </h2>
        <p className="text-ink/60">
          Revisa tu progreso y reflexiona sobre tu aprendizaje
        </p>
      </div>

      {/* Progress Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-4 text-center border border-paper-dark">
          <BookOpen className="w-6 h-6 text-ink/40 mx-auto mb-2" />
          <p className="text-2xl font-bold text-ink">{evidenceCount}</p>
          <p className="text-xs text-ink/50">Evidencias</p>
        </div>
        <div className="bg-white rounded-2xl p-4 text-center border border-paper-dark">
          <MessageSquare className="w-6 h-6 text-ink/40 mx-auto mb-2" />
          <p className="text-2xl font-bold text-ink">{feedbackCount}</p>
          <p className="text-xs text-ink/50">Revisiones</p>
        </div>
        <div className="bg-white rounded-2xl p-4 text-center border border-paper-dark">
          <Star className="w-6 h-6 text-evidence mx-auto mb-2" />
          <p className="text-2xl font-bold text-ink">{xp}</p>
          <p className="text-xs text-ink/50">XP Total</p>
        </div>
      </div>

      {/* Final Text Preview */}
      {hasFinalText && (
        <div className="bg-white rounded-2xl p-6 border border-paper-dark mb-6">
          <h3 className="font-semibold text-ink mb-3">Tu Texto Final</h3>
          <div className="bg-paper rounded-xl p-4 text-sm text-ink/80 whitespace-pre-wrap">
            {progress.final_text}
          </div>
        </div>
      )}

      {/* Reflection */}
      {!submitted ? (
        <div className="bg-white rounded-2xl p-6 border border-paper-dark">
          <h3 className="font-semibold text-ink mb-3">
            Reflexión Final (Anamnesis)
          </h3>
          <p className="text-sm text-ink/60 mb-4">
            ¿Qué aprendiste sobre análisis de textos? ¿Qué harías diferente?
          </p>
          <textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="Escribe tu reflexión aquí..."
            className="w-full p-4 rounded-xl border-2 border-paper-dark bg-paper/50 text-ink placeholder:text-ink/30 focus:border-verification transition-colors resize-none mb-4"
            rows={4}
          />
          <button
            onClick={handleSubmitReflection}
            disabled={!reflection.trim()}
            className="w-full bg-verification text-white py-3 rounded-xl font-medium hover:bg-verification/90 disabled:opacity-50 transition-all"
          >
            Guardar Reflexión (+50 XP)
          </button>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-verification/10 rounded-2xl p-6 border-2 border-verification/30 text-center"
        >
          <Trophy className="w-12 h-12 text-verification mx-auto mb-3" />
          <h3 className="font-serif text-xl font-semibold text-ink mb-2">
            ¡Misión Completada!
          </h3>
          <p className="text-ink/60 mb-4">
            Has completado todas las etapas del laboratorio de lectura crítica.
          </p>
          <div className="bg-white rounded-xl p-4 text-left">
            <p className="text-sm font-medium text-ink mb-2">Tu reflexión:</p>
            <p className="text-sm text-ink/70 italic">"{reflection}"</p>
          </div>
        </motion.div>
      )}
    </div>
  )
}
