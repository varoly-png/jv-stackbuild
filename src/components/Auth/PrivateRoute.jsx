import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { PageSpinner } from '@/components/UI/Spinner'

export function PrivateRoute() {
  const { session, loading } = useAuth()
  if (loading) return <PageSpinner />
  if (!session) return <Navigate to="/login" replace />
  return <Outlet />
}
