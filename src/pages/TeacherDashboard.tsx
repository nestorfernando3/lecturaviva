import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Activity, BookOpen, Download, BarChart3, Zap, TrendingUp } from 'lucide-react'
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
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (selectedSession) {
      fetchStudents()
      fetchProgress()
      subscribeToRealtime()
    }
  }, [selectedSession])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      setIsAuthenticated(true)
      fetchSessions()
    } else {
      setLoading(false)
    }
  }

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setSessions(data || [])
      if (data && data.length > 0) {
        setSelectedSession(data[0].id)
      }
    } catch (err) {
      console.error('Error fetching sessions:', err)
      // Datos de demo
      setSessions([{ id: 'demo', code: 'A4B2', mission_title: 'Misión: Análisis de IA', is_active: true }])
      setSelectedSession('demo')
    } finally {
      setLoading(false)
    }
  }

  const fetchStudents = async () => {
    if (!selectedSession || selectedSession === 'demo') {
      setStudents([
        { id: '1', nickname: 'Ana', xp: 150, streak: 3, created_at: new Date().toISOString() },
        { id: '2', nickname: 'Carlos', xp: 210, streak: 5, created_at: new Date().toISOString() },
        { id: '3', nickname: 'María', xp: 85, streak: 1, created_at: new Date().toISOString() },
      ])
      return
    }

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
  }

  const fetchProgress = async () => {
    if (!selectedSession || selectedSession === 'demo') {
      setProgressData([
        { student_id: '1', gnosis_pre: 3, gnosis_post: 4, evidences_collected: [{}, {}], ai_feedback: [{}], final_text: 'Texto final' },
        { student_id: '2', gnosis_pre: 4, gnosis_post: 5, evidences_collected: [{}, {}, {}], ai_feedback: [{}, {}], final_text: 'Texto final' },
        { student_id: '3', gnosis_pre: 2, gnosis_post: 3, evidences_collected: [{}], ai_feedback: [], final_text: null },
      ])
      return
    }

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
  }

  const subscribeToRealtime = () => {
    const channel = supabase
      .channel('students')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, () => {
        fetchStudents()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }

  const handleLogin = async () => {
    // Para demo, simplemente mostramos datos
    setIsAuthenticated(true)
    setLoading(false)
    fetchSessions()
  }

  const exportToPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(20)
    doc.text('Reporte LecturaViva', 14, 22)
    
    const session = sessions.find(s => s.id === selectedSession)
    doc.setFontSize(12)
    doc.text(`Sesión: ${session?.mission_title || 'Demo'}`, 14, 32)
    doc.text(`Código: ${session?.code || 'A4B2'}`, 14, 40)
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

    doc.save(`reporte-lecturaviva-${session?.code || 'demo'}.pdf`)
  }

  const getCompetencyScore = (studentId: string) => {
    const prog = progressData.find(p => p.student_id === studentId)
    if (!prog) return { evidence: 0, feedback: 0, completion: 0 }
    
    const evidence = Math.min(100, (prog.evidences_collected?.length || 0) * 25)
    const feedback = Math.min(100, (prog.ai_feedback?.length || 0) * 33)
    const completion = prog.final_text ? 100 : prog.evidences_collected?.length > 0 ? 60 : 20
    
    return { evidence, feedback, completion }
  }

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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="bg-white rounded-3xl p-8 shadow-lg border border-paper-dark max-w-md w-full text-center">
          <div className="w-16 h-16 bg-ink rounded-2xl flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-8 h-8 text-paper" />
          </div>
          <h1 className="font-serif text-2xl font-semibold text-ink mb-2">
            Dashboard Docente
          </h1>
          <p className="text-ink/60 mb-6">
            Accede al panel de control de tus sesiones de lectura
          </p>
          <button
            onClick={handleLogin}
            className="w-full bg-ink text-paper py-3 rounded-xl font-medium hover:bg-ink/90 transition-colors"
          >
            Acceder (Demo)
          </button>
        </div>
      </div>
    )
  }

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
          <button
            onClick={exportToPDF}
            className="flex items-center gap-2 bg-ink text-paper px-4 py-2 rounded-xl text-sm font-medium hover:bg-ink/90 transition-colors"
          >
            <Download className="w-4 h-4" />
            Exportar PDF
          </button>
        </div>
      </header>

      <div className="p-6 max-w-7xl mx-auto">
        {/* Session Selector */}
        <div className="mb-6">
          <label className="text-sm font-medium text-ink mb-2 block">Sesión Activa</label>
          <select
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
            className="bg-white border border-paper-dark rounded-xl px-4 py-2 text-ink focus:border-verification outline-none"
          >
            {sessions.map((session) => (
              <option key={session.id} value={session.id}>
                {session.code} - {session.mission_title}
              </option>
            ))}
          </select>
        </div>

        {/* Stats */}
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
      </div>
    </div>
  )
}
