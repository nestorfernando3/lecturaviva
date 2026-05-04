import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import LabLayout from './layouts/LabLayout'
import TeacherDashboard from './pages/TeacherDashboard'
import { useSessionStore } from './store/useSessionStore'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useSessionStore((state) => state.isAuthenticated)
  return isAuthenticated ? <>{children}</> : <Navigate to="/" replace />
}

function App() {
  return (
    <BrowserRouter basename="/lecturaviva">
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/lab"
          element={
            <ProtectedRoute>
              <LabLayout />
            </ProtectedRoute>
          }
        />
        <Route path="/dashboard" element={<TeacherDashboard />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
