import { Button } from 'primereact/button'
import { Card } from 'primereact/card'
import { InputText } from 'primereact/inputtext'
import { Password } from 'primereact/password'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../services/authAPI'
import { useAppDispatch } from '../store/hooks'
import { setUser } from '../store/authSlice'
import { Dropdown } from 'primereact/dropdown'
import { useTranslation } from 'react-i18next'

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
  const { t, i18n } = useTranslation()

  const handleOAuthLogin = () => {
    authAPI.initiateLogin()
  }
  
  const languageOptions = [
    { label: 'ES', value: 'es' },
    { label: 'EU', value: 'eu' },
    { label: 'EN', value: 'en' },
  ]

  const currentLanguage = languageOptions.find((opt) => i18n.language?.startsWith(opt.value))?.value || 'es'

  const handleLanguageChange = (e: { value: string }) => {
    i18n.changeLanguage(e.value)
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
      setErrorMessage(t('login_complete_credentials'))
      return
    }

    if (isRegisterMode && (!normalizedFullName || !normalizedEmail)) {
      setErrorMessage(t('login_complete_registration'))
      return
    }

    if (isRegisterMode && password !== confirmPassword) {
      setErrorMessage(t('login_passwords_mismatch'))
      return
    }

    setErrorMessage('')
    setIsSubmitting(true)

    try {
      const user = isRegisterMode
        ? await authAPI.registerWithCredentials(
            normalizedUsername,
            password,
            normalizedFullName,
            normalizedEmail,
          )
        : await authAPI.loginWithCredentials(
            normalizedUsername,
            password,
          )

      dispatch(setUser(user))
      navigate('/profile')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t('login_authentication_error'),)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className='container-login'>
      <div className="login-shell">
        <Card className="shadow-8">
          <div className='header-languages-wrapper'>
            <Dropdown
              inputId='language-select-normal'
              value={currentLanguage}
              options={languageOptions}
              onChange={handleLanguageChange}
              className='p-inputtext-sm'
              aria-label={t('language_selector')}
            />
          </div>

          <div className="text-center mb-5">
            <h1 className="font-semibold mb-2">Transcendence</h1>
            <p className="login-subtitle">{t('login_subtitle')}</p>
          </div>
          
          <div className="flex flex-column gap-4">
            <form className="login-form" onSubmit={handleCredentialsSubmit}>
              <label htmlFor="username" className="login-label">{t('login_username')}</label>
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
                  <label htmlFor="fullName" className="login-label">{t('login_full_name')}</label>
                  <InputText
                    id="fullName"
                    className="w-full"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    autoComplete="name"
                    maxLength={100}
                  />
                  <label htmlFor="email" className="login-label">{t('login_email')}</label>
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
              <label htmlFor="password" className="login-label">{t('login_password')}</label>
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
                  <label htmlFor="confirmPassword" className="login-label">{t('login_confirm_password')}</label>
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

              {errorMessage && (<small className="login-error">{errorMessage}</small>)}

              <div className="row flex">
                <div className="col-6">
                  <Button
                    type="submit"
                    className="button-login"
                    size="large"
                    loading={isSubmitting}
                    disabled={isSubmitting}
                    label={isRegisterMode? t('login_create_account'): t('login_submit')}
                  />
                </div>

                <div className="col-6">
                  <Button
                    type="button"
                    className={`button-login ${mode === 'register' ? 'active' : ''}`}
                    label={isRegisterMode ? t('login_back_to_login') : t('login_register')}
                    outlined={!isRegisterMode}
                    onClick={() =>switchAuthMode(isRegisterMode ? 'login' : 'register')}
                  />
                </div>
              </div>
            </form>

            <div className="login-divider"><span>{t('login_or')}</span></div>
            <Button
              className="button-login"
              size="large"
              onClick={handleOAuthLogin}
              label={t('login_42')}
            />
          </div>
        </Card>
      </div>
    </main>
  )
}