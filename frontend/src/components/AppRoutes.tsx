import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { setUser, clearUser, setLoading } from '../store/authSlice'
import { authAPI } from '../services/authAPI'
import Perfil from '../pages/Perfil'
import PerfilPublico from '../pages/PerfilPublico'
import Login from '../pages/Login'
import Game from '../pages/Game'
import Callback from '../pages/Callback'
import { ProgressSpinner } from 'primereact/progressspinner'

function AppRoutes() {
  const dispatch = useAppDispatch()
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth)

  useEffect(() => {
    let mounted = true

    const checkAuth = async () => {
      const user = await authAPI.getCurrentUser()
      if (!mounted) {
        return
      }

      if (user) {
        dispatch(setUser(user))
      } else {
        dispatch(clearUser())
      }
      dispatch(setLoading(false))
    }

    checkAuth()

    return () => {
      mounted = false
    }
  }, [dispatch])

  if (isLoading) {
    return (
      <div className="flex align-items-center justify-content-center min-h-screen">
        <ProgressSpinner />
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
      <Route path="/callback" element={<Callback />} />
      <Route path="/" element={isAuthenticated ? <Perfil /> : <Navigate to="/login" />} />
      <Route path="/perfil-publico" element={isAuthenticated ? <PerfilPublico /> : <Navigate to="/login" />} />
      <Route path="/game" element={isAuthenticated ? <Game /> : <Navigate to="/login" />} />
    </Routes>
  )
}

export default AppRoutes