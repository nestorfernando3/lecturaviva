import { useState } from 'react'
import { motion } from 'framer-motion'
import { Brain, ArrowRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useSessionStore } from '../store/useSessionStore'

interface GnosisPreTestProps {
  onComplete: () => void
}

export default function GnosisPreTest({ onComplete }: GnosisPreTestProps) {
  const [confidence, setConfidence] = useState(3)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const studentId = useSessionStore((state) => state.studentId)

  const handleSubmit = async () => {
    if (!studentId) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('student_progress')
        .upsert({
          student_id: studentId,
          gnosis_pre: confidence,
        })

      if (error) throw error

      setSubmitted(true)
      setTimeout(() => {
        onComplete()
      }, 2000)
    } catch (err) {
      console.error('Error saving gnosis:', err)
      // Aún así permitimos continuar
      setSubmitted(true)
      setTimeout(() => {
        onComplete()
      }, 2000)
    } finally {
      setLoading(false)
    }
  }

  const labels = [
    'Muy inseguro',
    'Inseguro',
    'Neutral',
    'Seguro',
    'Muy seguro',
  ]

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-lg mx-auto text-center py-12"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="w-20 h-20 bg-verification rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <Brain className="w-10 h-10 text-white" />
        </motion.div>
        <h2 className="font-serif text-2xl font-semibold text-ink mb-3">
          ¡Gracias por tu reflexión!
        </h2>
        <p className="text-ink/60">
          Ahora comienza la lectura activa. Prepara tu mente para analizar el texto.
        </p>
      </motion.div>
    )
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-evidence/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Brain className="w-8 h-8 text-ink" />
        </div>
        <h2 className="font-serif text-2xl font-semibold text-ink mb-2">
          Gnosis Inicial
        </h2>
        <p className="text-ink/60">
          Antes de comenzar, evalúa tu nivel de confianza
        </p>
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-lg border border-paper-dark">
        <div className="text-center mb-8">
          <p className="text-lg font-medium text-ink mb-6">
            ¿Qué tan seguro te sientes analizando argumentos en un texto?
          </p>

          {/* Slider */}
          <div className="mb-4">
            <input
              type="range"
              min={1}
              max={5}
              value={confidence}
              onChange={(e) => setConfidence(Number(e.target.value))}
              className="w-full h-3 bg-paper-dark rounded-full appearance-none cursor-pointer accent-ink"
            />
          </div>

          {/* Label */}
          <motion.p
            key={confidence}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xl font-semibold text-verification"
          >
            {labels[confidence - 1]}
          </motion.p>
        </div>

        {/* Visual indicators */}
        <div className="flex justify-between mb-8 px-2">
          {[1, 2, 3, 4, 5].map((level) => (
            <motion.button
              key={level}
              onClick={() => setConfidence(level)}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                level <= confidence
                  ? 'bg-ink text-paper'
                  : 'bg-paper-dark text-ink/40'
              }`}
            >
              {level}
            </motion.button>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-ink text-paper py-4 rounded-2xl font-semibold text-lg flex items-center justify-center gap-2 hover:bg-ink/90 disabled:opacity-50 transition-all"
        >
          {loading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="w-6 h-6 border-2 border-paper border-t-transparent rounded-full"
            />
          ) : (
            <>
              Comenzar Lectura
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>

      <p className="text-center text-ink/40 text-sm mt-4">
        Esta información es solo para tu autoreflexión
      </p>
    </div>
  )
}
