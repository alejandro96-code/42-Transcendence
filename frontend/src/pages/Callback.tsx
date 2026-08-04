import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch } from '../store/hooks'
import { setUser, setLoading } from '../store/authSlice'
import { authAPI } from '../services/authAPI'
import { ProgressSpinner } from 'primereact/progressspinner'

export function Callback() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  useEffect(() => {
    let mounted = true

    const handleCallback = async () => {
      try {
        const user = await authAPI.getCurrentUser()
        if (!mounted) {
          return
        }
        
        if (user) {
          dispatch(setUser(user))
          navigate('/')
        } else {
          navigate('/login')
        }
      } catch (error) {
        console.error('Error en callback:', error)
        if (mounted) {
          navigate('/login')
        }
      } finally {
        if (mounted) {
          dispatch(setLoading(false))
        }
      }
    }

    handleCallback()

    return () => {
      mounted = false
    }
  }, [dispatch, navigate])

  return (
    <div className="flex align-items-center justify-content-center min-h-screen">
      <div className="text-center">
        <ProgressSpinner />
        <p className="mt-3 text-color-secondary">Iniciando sesión...</p>
      </div>
    </div>
  )
}