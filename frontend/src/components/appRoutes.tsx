import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ProgressSpinner } from 'primereact/progressspinner'
import { Profile } from '../pages/profile'
import { Login } from '../pages/login'
import { PrivacyPolicy } from '../pages/privacyPolicy'
import { TermsOfService } from '../pages/termsOfService'
import { authAPI } from '../services/authAPI'
import { friendsAPI } from '../services/friendsAPI'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { setUser, clearUser, setLoading } from '../store/authSlice'


export function AppRoutes() {
  const dispatch = useAppDispatch()
  const { isAuthenticated, isLoading } = useAppSelector(
    (state) => state.auth,
  )

  useEffect(() => {
    let mounted = true;
    const checkAuth = async () => {
      const user = await authAPI.getCurrentUser();
      if (!mounted) {return}
      if (user) {dispatch(setUser(user))} else {dispatch(clearUser())};
      dispatch(setLoading(false))
    }
    void checkAuth();
    return () => {mounted = false}
  }, [dispatch])

  useEffect(() => {
    if (!isAuthenticated) {return}

    const sendHeartbeat = async () => {
      try {await friendsAPI.heartbeat()} catch (error) {console.error('Error enviando heartbeat:', error);}
    }

    void sendHeartbeat();
    const interval = setInterval(() => {void sendHeartbeat()}, 10000);
    return () => {clearInterval(interval)}

  }, [isAuthenticated])

  if (isLoading) {
    return (
      <div className="flex align-items-center justify-content-center min-h-screen">
        <ProgressSpinner />
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/" element={isAuthenticated ? <Navigate to="/profile" replace /> : <Login />}/>
      <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/" replace />}/>
      <Route path="/profile/:friendId" element={isAuthenticated ? <Profile /> : <Navigate to="/" replace />}/>
      <Route path="*" element={<Navigate to="/" replace />}/>
      <Route path="/privacy-policy" element={<PrivacyPolicy />}/>
      <Route path="/terms-of-service" element={<TermsOfService />}/>
    </Routes>
  )
}