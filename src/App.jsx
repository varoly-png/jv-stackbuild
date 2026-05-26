import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { Layout } from '@/components/Layout/Layout'
import { PrivateRoute } from '@/components/Auth/PrivateRoute'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Projects from '@/pages/Projects'
import ProjectDetail from '@/pages/ProjectDetail'
import Takeoff from '@/pages/Takeoff'
import Estimates from '@/pages/Estimates'
import EstimateDetail from '@/pages/EstimateDetail'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />

        {/* Protected – all wrapped in Layout */}
        <Route element={<PrivateRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/takeoff" element={<Takeoff />} />
            <Route path="/estimates" element={<Estimates />} />
            <Route path="/estimates/:id" element={<EstimateDetail />} />
          </Route>
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
