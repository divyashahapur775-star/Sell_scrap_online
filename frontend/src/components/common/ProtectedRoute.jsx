import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import LoadingScreen from './LoadingScreen'

// Statuses that require the user to go through verification before accessing the marketplace
const UNVERIFIED_STATUSES = ['not_submitted', 'pending', 'rejected']

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <LoadingScreen />

  // Not logged in → go to login
  if (!user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />
  }

  // Wrong role → redirect to correct dashboard
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    if (user.role === 'buyer')  return <Navigate to="/buyer/overview"  replace />
    if (user.role === 'seller') return <Navigate to="/seller/overview" replace />
    if (user.role === 'admin')  return <Navigate to="/admin/overview"  replace />
    return <Navigate to="/" replace />
  }

  // Admins skip verification entirely
  if (user.role === 'admin') return children

  // Buyers and sellers must be verified
  if (UNVERIFIED_STATUSES.includes(user.verificationStatus)) {
    if (!location.pathname.includes('/auth/verify')) {
      return <Navigate to="/auth/verify" replace />
    }
  }

  return children
}
