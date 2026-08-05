import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { InputText } from 'primereact/inputtext'
import { Button } from 'primereact/button'
import { Dropdown } from 'primereact/dropdown'
import { useTranslation } from 'react-i18next'
import { useAppDispatch } from '../store/hooks'
import { clearUser } from '../store/authSlice'
import { authAPI } from '../services/authAPI'
import logo42 from '../img/42.png'

export function Header() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { t, i18n } = useTranslation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const languageOptions = [
    { label: 'ES', value: 'es' },
    { label: 'EU', value: 'eu' },
    { label: 'EN', value: 'en' }
  ]

  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language || 'es')

  const handleLanguageChange = (e: { value: string }) => {
    const newLang = e.value
    setSelectedLanguage(newLang)
    i18n.changeLanguage(newLang)
  }

  const handleLogout = async () => {
    await authAPI.logout()
    dispatch(clearUser())
    navigate('/login')
    setIsMenuOpen(false)
  }

  return (
    <div className="header-container">
      <div className="header-bar">

        <div className="header-nav">
          <Link to="/" className="header-brand">
            <img src={logo42} alt="Logo de Transcendence" className="header-brand-logo" />
          </Link>
        </div>

        <Button
          type="button"
          className="header-menu-toggle p-button-text"
          icon="pi pi-bars"
          aria-label={t('header_menu_aria_label')}
          aria-expanded={isMenuOpen}
          aria-controls="header-mobile-menu"
          onClick={() => setIsMenuOpen((currentValue) => !currentValue)}
        />
        
        <div className="header-actions">
          <Dropdown
            value={selectedLanguage}
            options={languageOptions}
            onChange={handleLanguageChange}
            className="p-inputtext-sm"
          />

          <label htmlFor="header-search" className="sr-only">
            {t('header_search_aria_label')}
          </label>
          <InputText
            id="header-search"
            placeholder={t('header_search_placeholder')}
            className="header-search p-inputtext-sm"
          />

          <Button
            type="button"
            severity="danger"
            className="header-logout p-inputtext-sm"
            outlined
            size="small"
            onClick={handleLogout}
          > 
            {t('header_logout')}
          </Button>
        </div>

        <div className={`header-mobile-menu ${isMenuOpen ? 'is-open' : ''}`}>
          <label htmlFor="header-search-mobile" className="sr-only">
            {t('header_search_aria_label')}
          </label>
          <InputText
            id="header-search-mobile"
            placeholder={t('header_search_placeholder')}
            className="header-search header-search--mobile p-inputtext-sm"
          />
          <Button
            type="button"
            severity="danger"
            className="header-logout header-logout--mobile p-inputtext-sm"
            outlined
            size="small"
            onClick={handleLogout}
          > 
            {t('header_logout')}
          </Button>
        </div>

      </div>
    </div>
  )
}