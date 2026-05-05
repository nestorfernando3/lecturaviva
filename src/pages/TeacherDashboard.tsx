import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Users, Activity, BookOpen, Download, BarChart3, Zap, TrendingUp, Plus, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface Student {
  id: string
  nickname: string
  xp: number
  streak: number
  created_at: string
}

interface SessionData {
  id: string
  code: string
  mission_title: string
  is_active: boolean
}

interface ProgressData {
  student_id: string
  gnosis_pre: number | null
  gnosis_post: number | null
  evidences_collected: any[]
  ai_feedback: any[]
  final_text: string | null
}

export default function TeacherDashboard() {
  const [sessions, setSessions] = useState<SessionData[]>([])
  const [selectedSession, setSelectedSession] = useState<string>('')
  const [students, setStudents] = useState<Student[]>([])
  const [progressData, setProgressData] = useState<ProgressData[]>([])
  const [loading, setLoading] = useState(true)
  
  // New session form state
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newCode, setNewCode] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchSessions().then(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (selectedSession) {
      fetchStudents()
      fetchProgress()
      subscribeToRealtime()
    }
  }, [selectedSession])

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setSessions(data || [])
      if (data && data.length > 0) {
        setSelectedSession(prev => prev || data[0].id)
      }
    } catch (err) {
      console.error('Error fetching sessions:', err)
      setSessions([])
    }
  }

  const fetchStudents = useCallback(async () => {
    if (!selectedSession) return

    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('session_id', selectedSession)
        .order('xp', { ascending: false })
      
      if (error) throw error
      setStudents(data || [])
    } catch (err) {
      console.error('Error fetching students:', err)
    }
  }, [selectedSession])

  const fetchProgress = useCallback(async () => {
    if (!selectedSession || students.length === 0) return

    try {
      const { data, error } = await supabase
        .from('student_progress')
        .select('*')
        .in('student_id', students.map(s => s.id))
      
      if (error) throw error
      setProgressData(data || [])
    } catch (err) {
      console.error('Error fetching progress:', err)
    }
  }, [selectedSession, students])

  const subscribeToRealtime = () => {
    const channel = supabase
      .channel('students')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, () => {
        fetchStudents()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }

  const createSession = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCode.trim() || !newTitle.trim()) return
    if (newCode.length !== 4) {
      alert('El código debe tener exactamente 4 caracteres')
      return
    }

    setCreating(true)
    try {
      const { data, error } = await supabase
        .from('sessions')
        .insert({
          code: newCode.toUpperCase(),
          mission_title: newTitle.trim(),
          is_active: true,
        })
        .select()
        .single()

      if (error) throw error

      setSessions([data, ...sessions])
      setSelectedSession(data.id)
      setShowCreateForm(false)
      setNewCode('')
      setNewTitle('')
      alert(`¡Sesión creada! Código: ${data.code}`)
    } catch (err: any) {
      console.error('Error creating session:', err)
      if (err.message?.includes('duplicate') || err.message?.includes('unique')) {
        alert('Ese código ya existe. Intenta con otro código.')
      } else {
        alert('Error al crear sesión. Intenta de nuevo.')
      }
    } finally {
      setCreating(false)
    }
  }

  const exportToPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(20)
    doc.text('Reporte LecturaViva', 14, 22)
    
    const session = sessions.find(s => s.id === selectedSession)
    doc.setFontSize(12)
    doc.text(`Sesión: ${session?.mission_title || 'Sin sesión'}`, 14, 32)
    doc.text(`Código: ${session?.code || 'N/A'}`, 14, 40)
    doc.text(`Estudiantes: ${students.length}`, 14, 48)

    const tableData = students.map(s => {
      const prog = progressData.find(p => p.student_id === s.id)
      return [
        s.nickname,
        s.xp.toString(),
        prog?.evidences_collected?.length?.toString() || '0',
        prog?.ai_feedback?.length?.toString() || '0',
        prog?.final_text ? 'Sí' : 'No',
      ]
    })

    autoTable(doc, {
      head: [['Estudiante', 'XP', 'Evidencias', 'Feedback', 'Finalizado']],
      body: tableData,
      startY: 55,
    })

    doc.save(`reporte-lecturaviva-${session?.code || 'reporte'}.pdf`)
  }

  const getCompetencyScore = (studentId: string) => {
    const prog = progressData.find(p => p.student_id === studentId)
    if (!prog) return { evidence: 0, feedback: 0, completion: 0 }
    
    const evidence = Math.min(100, (prog.evidences_collected?.length || 0) * 25)
    const feedback = Math.min(100, (prog.ai_feedback?.length || 0) * 33)
    const completion = prog.final_text ? 100 : prog.evidences_collected?.length > 0 ? 60 : 20
    
    return { evidence, feedback, completion }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1 }}
          className="w-8 h-8 border-2 border-ink border-t-transparent rounded-full"
        />
      </div>
    )
  }

  // Dashboard
  const totalXp = students.reduce((sum, s) => sum + s.xp, 0)
  const avgXp = students.length > 0 ? Math.round(totalXp / students.length) : 0
  const activeStudents = students.length

  return (
    <div className="min-h-screen bg-paper">
      {/* Header */}
      <header className="bg-white border-b border-paper-dark px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-ink rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-paper" />
            </div>
            <div>
              <h1 className="font-serif text-xl font-semibold text-ink">LecturaViva</h1>
              <p className="text-xs text-ink/50">Dashboard Docente</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={exportToPDF}
              disabled={students.length === 0}
              className="flex items-center gap-2 bg-ink text-paper px-4 py-2 rounded-xl text-sm font-medium hover:bg-ink/90 disabled:opacity-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              Exportar PDF
            </button>
          </div>
        </div>
      </header>

      <div className="p-6 max-w-7xl mx-auto">
        {/* Session Selector & Create */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <label className="text-sm font-medium text-ink mb-2 block">Sesión Activa</label>
            <select
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
              className="bg-white border border-paper-dark rounded-xl px-4 py-2 text-ink focus:border-verification outline-none"
            >
              {sessions.length === 0 && (
                <option value="">No hay sesiones aún</option>
              )}
              {sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.code} - {session.mission_title}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-2 bg-verification text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-verification/90 transition-colors"
          >
            {showCreateForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showCreateForm ? 'Cancelar' : 'Nueva Sesión'}
          </button>
        </div>

        {/* Create Session Form */}
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 border border-verification/30 shadow-lg mb-6"
          >
            <h3 className="font-serif text-lg font-semibold text-ink mb-4">
              Crear Nueva Misión
            </h3>
            <form onSubmit={createSession} className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium text-ink mb-1 block">
                  Código (4 letras)
                </label>
                <input
                  type="text"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  placeholder="Ej: X7K9"
                  maxLength={4}
                  className="w-full px-4 py-2 rounded-xl border-2 border-paper-dark bg-paper/50 text-ink placeholder:text-ink/30 focus:border-verification outline-none uppercase tracking-widest font-bold"
                />
              </div>
              <div className="flex-[2]">
                <label className="text-sm font-medium text-ink mb-1 block">
                  Título de la Misión
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ej: Análisis de Argumentos"
                  className="w-full px-4 py-2 rounded-xl border-2 border-paper-dark bg-paper/50 text-ink placeholder:text-ink/30 focus:border-verification outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={creating || !newCode.trim() || !newTitle.trim()}
                className="bg-ink text-paper px-6 py-2 rounded-xl font-medium hover:bg-ink/90 disabled:opacity-50 transition-colors"
              >
                {creating ? 'Creando...' : 'Crear'}
              </button>
            </form>
          </motion.div>
        )}

        {/* Empty state when no sessions */}
        {sessions.length === 0 && !showCreateForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl p-12 border border-paper-dark text-center"
          >
            <BookOpen className="w-12 h-12 text-ink/20 mx-auto mb-4" />
            <h3 className="font-serif text-xl font-semibold text-ink mb-2">
              ¡Bienvenido, docente!
            </h3>
            <p className="text-ink/60 mb-6 max-w-md mx-auto">
              Aún no tienes sesiones creadas. Crea tu primera misión de lectura para que tus estudiantes puedan unirse con un código.
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center gap-2 bg-verification text-white px-6 py-3 rounded-xl font-medium hover:bg-verification/90 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Crear Primera Sesión
            </button>
          </motion.div>
        )}

        {/* Stats - only show when there's a selected session */}
        {selectedSession && sessions.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-2xl p-6 border border-paper-dark">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="w-5 h-5 text-ink/40" />
                  <span className="text-sm text-ink/60">Estudiantes</span>
                </div>
                <p className="text-3xl font-bold text-ink">{activeStudents}</p>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-paper-dark">
                <div className="flex items-center gap-3 mb-2">
                  <Zap className="w-5 h-5 text-evidence" />
                  <span className="text-sm text-ink/60">XP Promedio</span>
                </div>
                <p className="text-3xl font-bold text-ink">{avgXp}</p>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-paper-dark">
                <div className="flex items-center gap-3 mb-2">
                  <Activity className="w-5 h-5 text-verification" />
                  <span className="text-sm text-ink/60">Activos Ahora</span>
                </div>
                <p className="text-3xl font-bold text-ink">{activeStudents}</p>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-paper-dark">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-5 h-5 text-ink/40" />
                  <span className="text-sm text-ink/60">Completados</span>
                </div>
                <p className="text-3xl font-bold text-ink">
                  {progressData.filter(p => p.final_text).length}
                </p>
              </div>
            </div>

            {/* Students Table with Heatmap */}
            {students.length > 0 && (
              <div className="bg-white rounded-2xl border border-paper-dark overflow-hidden">
                <div className="px-6 py-4 border-b border-paper-dark">
                  <h2 className="font-semibold text-ink flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Progreso por Estudiante
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-paper/50">
                        <th className="text-left px-6 py-3 text-sm font-medium text-ink/60">Estudiante</th>
                        <th className="text-center px-6 py-3 text-sm font-medium text-ink/60">XP</th>
                        <th className="text-center px-6 py-3 text-sm font-medium text-ink/60">Evidencias</th>
                        <th className="text-center px-6 py-3 text-sm font-medium text-ink/60">Feedback</th>
                        <th className="text-center px-6 py-3 text-sm font-medium text-ink/60">Finalizado</th>
                        <th className="text-center px-6 py-3 text-sm font-medium text-ink/60">Competencias</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student) => {
                        const scores = getCompetencyScore(student.id)
                        return (
                          <tr key={student.id} className="border-t border-paper-dark hover:bg-paper/30 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-ink/10 rounded-full flex items-center justify-center">
                                  <span className="text-sm font-medium text-ink">
                                    {student.nickname[0].toUpperCase()}
                                  </span>
                                </div>
                                <span className="font-medium text-ink">{student.nickname}</span>
                              </div>
                            </td>
                            <td className="text-center px-6 py-4">
                              <span className="font-semibold text-verification">{student.xp}</span>
                            </td>
                            <td className="text-center px-6 py-4 text-ink/70">
                              {progressData.find(p => p.student_id === student.id)?.evidences_collected?.length || 0}
                            </td>
                            <td className="text-center px-6 py-4 text-ink/70">
                              {progressData.find(p => p.student_id === student.id)?.ai_feedback?.length || 0}
                            </td>
                            <td className="text-center px-6 py-4">
                              {progressData.find(p => p.student_id === student.id)?.final_text ? (
                                <span className="px-2 py-1 bg-verification/20 text-verification rounded-lg text-xs font-medium">
                                  Sí
                                </span>
                              ) : (
                                <span className="px-2 py-1 bg-paper-dark text-ink/40 rounded-lg text-xs">
                                  No
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex gap-2 justify-center">
                                <div 
                                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                                  style={{ backgroundColor: scores.evidence > 70 ? '#4f8f6f' : scores.evidence > 40 ? '#f3c84b' : '#e5e4e7', color: scores.evidence > 40 ? 'white' : '#25231f' }}
                                  title="Evidencia"
                                >
                                  E
                                </div>
                                <div 
                                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                                  style={{ backgroundColor: scores.feedback > 70 ? '#4f8f6f' : scores.feedback > 40 ? '#f3c84b' : '#e5e4e7', color: scores.feedback > 40 ? 'white' : '#25231f' }}
                                  title="Feedback"
                                >
                                  F
                                </div>
                                <div 
                                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                                  style={{ backgroundColor: scores.completion > 70 ? '#4f8f6f' : scores.completion > 40 ? '#f3c84b' : '#e5e4e7', color: scores.completion > 40 ? 'white' : '#25231f' }}
                                  title="Completitud"
                                >
                                  C
                                </div>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {students.length === 0 && (
              <div className="bg-white rounded-2xl p-12 border border-paper-dark text-center">
                <Users className="w-12 h-12 text-ink/20 mx-auto mb-4" />
                <h3 className="font-serif text-lg font-semibold text-ink mb-2">
                  Sin estudiantes aún
                </h3>
                <p className="text-ink/60">
                  Comparte el código <span className="font-bold text-verification">{sessions.find(s => s.id === selectedSession)?.code}</span> con tus estudiantes para que se unan.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}