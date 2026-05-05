import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { PenTool, Send, RotateCcw, MessageSquare, Sparkles } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useSessionStore } from '../store/useSessionStore'

interface FeedbackItem {
  text: string
  timestamp: string
}

export default function GuidedWriting() {
  const [claim, setClaim] = useState('')
  const [evidence, setEvidence] = useState('')
  const [reasoning, setReasoning] = useState('')
  const [feedback, setFeedback] = useState<FeedbackItem[]>([])
  const [loading, setLoading] = useState(false)
  const [tokensLeft, setTokensLeft] = useState(3)
  const [finalText, setFinalText] = useState('')
  
  const studentId = useSessionStore((state) => state.studentId)
  const addXp = useSessionStore((state) => state.addXp)

  useEffect(() => {
    fetchProgress()
  }, [studentId])

  const fetchProgress = async () => {
    if (!studentId) return
    const { data } = await supabase
      .from('student_progress')
      .select('draft_text, ai_feedback, final_text')
      .eq('student_id', studentId)
      .single()
    
    if (data) {
      if (data.draft_text) {
        const parts = data.draft_text.split('\n')
        setClaim(parts[0]?.replace('El autor afirma que ', '') || '')
        setEvidence(parts[1]?.replace('Esto se evidencia cuando ', '') || '')
        setReasoning(parts[2]?.replace('Por lo tanto, ', '') || '')
      }
      if (data.ai_feedback) {
        setFeedback(data.ai_feedback)
        setTokensLeft(Math.max(0, 3 - data.ai_feedback.length))
      }
      if (data.final_text) setFinalText(data.final_text)
    }
  }

  const getFullText = () => {
    return `El autor afirma que ${claim}\nEsto se evidencia cuando ${evidence}\nPor lo tanto, ${reasoning}`
  }

  const handleGetFeedback = async () => {
    if (!studentId || tokensLeft <= 0) return
    if (!claim.trim() || !evidence.trim()) {
      alert('Completa al menos la afirmación y la evidencia')
      return
    }

    setLoading(true)
    const fullText = getFullText()

    try {
      // Guardar borrador
      await supabase
        .from('student_progress')
        .upsert({ student_id: studentId, draft_text: fullText })

      // Llamar a Gemini
      const geminiKey = import.meta.env.VITE_GEMINI_API_KEY
      let feedbackText = ''
      
      if (geminiKey) {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: `Eres un tutor de lectura crítica experto. Evalúa el siguiente análisis de un estudiante sobre un texto. No corrijas ortografía ni reescribas el texto. Solo dale 1 sugerencia clara y constructiva para mejorar su argumento (máximo 3 oraciones).\n\nAnálisis del estudiante:\n${fullText}\n\nSugerencia:`
                }]
              }],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 200,
              }
            }),
          }
        )

        if (response.ok) {
          const data = await response.json()
          feedbackText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ''
        }
      }
      
      if (!feedbackText) {
        feedbackText = generateFallbackFeedback(fullText)
      }

      const newFeedback: FeedbackItem = {
        text: feedbackText,
        timestamp: new Date().toISOString(),
      }

      const updatedFeedback = [...feedback, newFeedback]
      setFeedback(updatedFeedback)
      setTokensLeft(tokensLeft - 1)

      await supabase
        .from('student_progress')
        .upsert({
          student_id: studentId,
          ai_feedback: updatedFeedback,
        })

      addXp(25)
    } catch (err) {
      console.error('Error getting feedback:', err)
      const fallback = generateFallbackFeedback(getFullText())
      const newFeedback: FeedbackItem = {
        text: fallback,
        timestamp: new Date().toISOString(),
      }
      setFeedback([...feedback, newFeedback])
    } finally {
      setLoading(false)
    }
  }

  const generateFallbackFeedback = (text: string): string => {
    const hasClaim = text.toLowerCase().includes('afirma')
    const hasEvidence = text.length > 50
    
    if (!hasClaim) return 'Intenta comenzar con una afirmación clara sobre la tesis del autor. ¿Cuál es el argumento principal?'
    if (!hasEvidence) return 'Buen inicio. Ahora desarrolla más la evidencia: ¿qué datos o ejemplos específicos del texto respaldan tu afirmación?'
    return 'Excelente progreso. Considera analizar las implicaciones más amplias del argumento: ¿por qué es importante este tema para la sociedad actual?'
  }

  const handleSubmitFinal = async () => {
    if (!studentId) return
    const fullText = getFullText()
    setFinalText(fullText)
    
    await supabase
      .from('student_progress')
      .upsert({
        student_id: studentId,
        final_text: fullText,
      })
    
    addXp(100)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-ink/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <PenTool className="w-8 h-8 text-ink" />
        </div>
        <h2 className="font-serif text-2xl font-semibold text-ink mb-2">
          Escritura Guiada
        </h2>
        <p className="text-ink/60">
          Construye tu argumento paso a paso
        </p>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-lg border border-paper-dark space-y-6">
        {/* Sentence Stems */}
        <div>
          <label className="block text-sm font-medium text-ink mb-2">
            El autor afirma que...
          </label>
          <textarea
            value={claim}
            onChange={(e) => setClaim(e.target.value)}
            placeholder="Identifica la tesis principal del texto"
            className="w-full p-4 rounded-xl border-2 border-paper-dark bg-paper/50 text-ink placeholder:text-ink/30 focus:border-verification transition-colors resize-none"
            rows={2}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-2">
            Esto se evidencia cuando...
          </label>
          <textarea
            value={evidence}
            onChange={(e) => setEvidence(e.target.value)}
            placeholder="Cita evidencias específicas del texto"
            className="w-full p-4 rounded-xl border-2 border-paper-dark bg-paper/50 text-ink placeholder:text-ink/30 focus:border-verification transition-colors resize-none"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-2">
            Por lo tanto...
          </label>
          <textarea
            value={reasoning}
            onChange={(e) => setReasoning(e.target.value)}
            placeholder="Explica la implicación o conclusión"
            className="w-full p-4 rounded-xl border-2 border-paper-dark bg-paper/50 text-ink placeholder:text-ink/30 focus:border-verification transition-colors resize-none"
            rows={2}
          />
        </div>

        {/* Tokens */}
        <div className="flex items-center justify-between bg-paper rounded-xl p-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-evidence" />
            <span className="text-sm font-medium text-ink">
              Fichas de revisión: {tokensLeft}/3
            </span>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full ${i <= tokensLeft ? 'bg-evidence' : 'bg-paper-dark'}`}
              />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleGetFeedback}
            disabled={loading || tokensLeft <= 0 || !claim.trim()}
            className="flex-1 bg-ink text-paper py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-ink/90 disabled:opacity-50 transition-all"
          >
            {loading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="w-5 h-5 border-2 border-paper border-t-transparent rounded-full"
              />
            ) : (
              <>
                <MessageSquare className="w-5 h-5" />
                Revisar con IA
              </>
            )}
          </button>
          
          <button
            onClick={handleSubmitFinal}
            disabled={!claim.trim() || !evidence.trim()}
            className="flex-1 bg-verification text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-verification/90 disabled:opacity-50 transition-all"
          >
            <Send className="w-5 h-5" />
            Enviar Final
          </button>
        </div>
      </div>

      {/* Feedback Panel */}
      {feedback.length > 0 && (
        <div className="mt-6 space-y-3">
          <h3 className="font-semibold text-ink flex items-center gap-2">
            <RotateCcw className="w-4 h-4" />
            Feedback del Tutor
          </h3>
          {feedback.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-blue-50 border-l-4 border-blue-400 rounded-r-xl p-4"
            >
              <p className="text-sm text-ink/80">{item.text}</p>
              <p className="text-xs text-ink/40 mt-2">
                Revisión #{index + 1}
              </p>
            </motion.div>
          ))}
        </div>
      )}

      {finalText && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 bg-verification/10 rounded-2xl p-6 border-2 border-verification/30"
        >
          <h3 className="font-semibold text-verification mb-2">¡Texto final enviado!</h3>
          <p className="text-sm text-ink/70">+100 XP por completar la escritura</p>
        </motion.div>
      )}
    </div>
  )
}
