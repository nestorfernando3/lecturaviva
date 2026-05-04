import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, ArrowRight, Sparkles } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useSessionStore } from '../store/useSessionStore'

export default function Login() {
  const [code, setCode] = useState('')
  const [nickname, setNickname] = useState('')
  const [step, setStep] = useState<'code' | 'nickname'>('code')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const setStudent = useSessionStore((state) => state.setStudent)

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (code.length !== 4) {
      setError('El código debe tener exactamente 4 caracteres')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .select('id, code, mission_title, is_active')
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .single()

      if (sessionError || !session) {
        setError('Código no válido o sesión inactiva. Verifica con tu docente.')
        setLoading(false)
        return
      }

      // Código válido, pasar al paso de nickname
      setStep('nickname')
    } catch (err) {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const handleNicknameSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (nickname.trim().length < 2) {
      setError('Tu apodo debe tener al menos 2 caracteres')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Buscar la sesión nuevamente
      const { data: session } = await supabase
        .from('sessions')
        .select('id')
        .eq('code', code.toUpperCase())
        .single()

      if (!session) {
        setError('Sesión no encontrada')
        setLoading(false)
        return
      }

      // Crear estudiante
      const { data: student, error: studentError } = await supabase
        .from('students')
        .insert({
          session_id: session.id,
          nickname: nickname.trim(),
          xp: 0,
          streak: 1,
        })
        .select()
        .single()

      if (studentError || !student) {
        setError('Error al crear tu perfil. Intenta de nuevo.')
        setLoading(false)
        return
      }

      // Guardar en store
      setStudent(student.id, nickname.trim(), session.id, code.toUpperCase())
      
      // Crear progreso inicial
      await supabase
        .from('student_progress')
        .insert({
          student_id: student.id,
          evidences_collected: [],
          ai_feedback: [],
        })

      // Redirigir al laboratorio (usaremos navegación simple por ahora)
      window.location.href = '/lab'
    } catch (err) {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo y título */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-ink rounded-2xl mb-6"
          >
            <BookOpen className="w-10 h-10 text-paper" />
          </motion.div>
          <h1 className="font-serif text-4xl font-bold text-ink mb-2">
            LecturaViva
          </h1>
          <p className="text-ink/60 text-lg">
            Laboratorio de Lectura Crítica
          </p>
        </div>

        {/* Formulario */}
        <AnimatePresence mode="wait">
          {step === 'code' ? (
            <motion.form
              key="code"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleCodeSubmit}
              className="bg-white rounded-3xl p-8 shadow-lg border border-paper-dark"
            >
              <div className="text-center mb-6">
                <Sparkles className="w-8 h-8 text-evidence mx-auto mb-3" />
                <h2 className="font-serif text-2xl font-semibold text-ink mb-2">
                  Ingresa tu código
                </h2>
                <p className="text-ink/60">
                  Escribe las 4 letras de tu misión
                </p>
              </div>

              <div className="mb-6">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="Ej: A4B2"
                  maxLength={4}
                  className="w-full text-center text-3xl font-bold tracking-[0.5em] uppercase py-4 px-6 rounded-2xl border-2 border-paper-dark bg-paper text-ink placeholder:text-ink/30 focus:border-verification transition-colors"
                  autoFocus
                />
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-600 text-sm text-center mb-4"
                >
                  {error}
                </motion.p>
              )}

              <button
                type="submit"
                disabled={loading || code.length !== 4}
                className="w-full bg-ink text-paper py-4 rounded-2xl font-semibold text-lg flex items-center justify-center gap-2 hover:bg-ink/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="w-6 h-6 border-2 border-paper border-t-transparent rounded-full"
                  />
                ) : (
                  <>
                    Continuar
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </motion.form>
          ) : (
            <motion.form
              key="nickname"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleNicknameSubmit}
              className="bg-white rounded-3xl p-8 shadow-lg border border-paper-dark"
            >
              <div className="text-center mb-6">
                <h2 className="font-serif text-2xl font-semibold text-ink mb-2">
                  ¿Cómo te llamas?
                </h2>
                <p className="text-ink/60">
                  Usa un apodo o tu nombre
                </p>
              </div>

              <div className="mb-6">
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Tu apodo"
                  maxLength={20}
                  className="w-full text-center text-2xl font-semibold py-4 px-6 rounded-2xl border-2 border-paper-dark bg-paper text-ink placeholder:text-ink/30 focus:border-verification transition-colors"
                  autoFocus
                />
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-600 text-sm text-center mb-4"
                >
                  {error}
                </motion.p>
              )}

              <button
                type="submit"
                disabled={loading || nickname.trim().length < 2}
                className="w-full bg-verification text-white py-4 rounded-2xl font-semibold text-lg flex items-center justify-center gap-2 hover:bg-verification/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : (
                  <>
                    Entrar al Laboratorio
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep('code')
                  setError('')
                }}
                className="w-full mt-4 text-ink/50 hover:text-ink text-sm transition-colors"
              >
                ← Volver al código
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Footer */}
        <p className="text-center text-ink/40 text-sm mt-8">
          No necesitas crear una cuenta · Solo tu código de misión
        </p>
      </motion.div>
    </div>
  )
}
