import { Button } from 'primereact/button'
import { Card } from 'primereact/card'
import { InputText } from 'primereact/inputtext'
import { Password } from 'primereact/password'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../services/authAPI'
import { useAppDispatch } from '../store/hooks'
import { setUser } from '../store/authSlice'

type AuthMode = 'login' | 'register'

export function Login() {

  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [mode, setMode] = useState<AuthMode>('login')
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleOAuthLogin = () => {
    authAPI.initiateLogin()
  }

  const switchAuthMode = (nextMode: AuthMode) => {
    setMode(nextMode)
    setErrorMessage('')
  }

  const isRegisterMode = mode === 'register'

  const handleCredentialsSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalizedUsername = username.trim()
    const normalizedFullName = fullName.trim()
    const normalizedEmail = email.trim()

    if (!normalizedUsername || !password) {
      setErrorMessage('Completa usuario y contraseña.')
      return
    }

    if (isRegisterMode && (!normalizedFullName || !normalizedEmail)) {
      setErrorMessage('Completa nombre completo y correo electrónico.')
      return
    }

    if (isRegisterMode && password !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden.')
      return
    }

    setErrorMessage('')
    setIsSubmitting(true)

    try {
      const user = isRegisterMode
        ? await authAPI.registerWithCredentials(normalizedUsername, password, normalizedFullName, normalizedEmail)
        : await authAPI.loginWithCredentials(normalizedUsername, password)

      dispatch(setUser(user))
      navigate('/')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo completar la autenticación.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className='container-login'>
      <div className="login-shell">
        <Card className="shadow-8">
          <div className="text-center mb-5">
            <h1 className="font-semibold mb-2">Transcendence</h1>
            <p className="login-subtitle">Conecta y comparte con tu comunidad</p>
          </div>

          <div className="flex flex-column gap-4">
            <form className="login-form" onSubmit={handleCredentialsSubmit}>
              <label htmlFor="username" className="login-label">Usuario</label>
              <InputText
                id="username"
                className="w-full"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                maxLength={30}
              />

              {isRegisterMode && (
                <>
                  <label htmlFor="fullName" className="login-label">Nombre completo</label>
                  <InputText
                    id="fullName"
                    className="w-full"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    autoComplete="name"
                    maxLength={100}
                  />

                  <label htmlFor="email" className="login-label">Correo electrónico</label>
                  <InputText
                    id="email"
                    type="email"
                    className="w-full"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    maxLength={100}
                  />
                </>
              )}

              <label htmlFor="password" className="login-label">Contraseña</label>
              <Password
                inputId="password"
                className="inputPassword w-full"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                feedback={false}
                toggleMask
                autoComplete={isRegisterMode ? 'new-password' : 'current-password'}
              />

              {isRegisterMode && (
                <>
                  <label htmlFor="confirmPassword" className="login-label">Repetir contraseña</label>
                  <Password
                    inputId="confirmPassword"
                    className="inputPassword w-full"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    feedback={false}
                    toggleMask
                    autoComplete="new-password"
                  />
                </>
              )}

              {errorMessage && <small className="login-error">{errorMessage}</small>}

            <div className="row flex">
              <div className="col-6">
                <Button
                  type="submit"
                  className="button-login"
                  size="large"
                  loading={isSubmitting}
                  disabled={isSubmitting}
                  label={isRegisterMode ? 'Crear cuenta' : 'Entrar'}
                />
              </div>
              <div className="col-6">
                <Button
                  type="button"
                  className={`button-login ${mode === 'register' ? 'active' : ''}`}
                  label={isRegisterMode ? 'Volver a Iniciar sesión' : 'Registrarse'}
                  outlined={!isRegisterMode}
                  onClick={() => switchAuthMode(isRegisterMode ? 'login' : 'register' )}
                />
              </div>
              </div>
            </form>

            <div className="login-divider">
              <span>o</span>
            </div>

            <Button
              className="button-login"
              size="large"
              onClick={handleOAuthLogin}
              label="SIGN IN WITH 42"
            />
          </div>
        </Card>
      </div>
    </main>
  )
}