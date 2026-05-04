import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import TeacherDashboard from './pages/TeacherDashboard'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TeacherDashboard />
  </StrictMode>,
)
