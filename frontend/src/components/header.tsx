import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { InputText } from 'primereact/inputtext'
import { Button } from 'primereact/button'
import { useAppDispatch } from '../store/hooks'
import { clearUser } from '../store/authSlice'
import { authAPI } from '../services/authAPI'
import logo42 from '../img/42.png'

function Header() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleLogout = async () => {
    await authAPI.logout()
    dispatch(clearUser())
    navigate('/login')
    setIsMenuOpen(false)
  }

  return (
    <div className="header-container">
      <div className="header-bar">

        {/* 42 icon and mocks profile)*/}
        <div className="header-nav">
              <Link to="/" className="header-brand">
                <img src={logo42} alt="Logo de Transcendence" className="header-brand-logo" />
              </Link>
              {/* Solo visualizar para tener como ejemplo
              <Link to="/" className="header-nav__link">
                <span>Perfil personal</span>
              </Link>
              <Link to="/perfil-publico" className="header-nav__link">
                <span>Perfil público</span>
              </Link>
              */}
        </div>

        <Button
          type="button"
          className="header-menu-toggle p-button-text"
          icon="pi pi-bars"
          aria-label="Abrir menú"
          aria-expanded={isMenuOpen}
          aria-controls="header-mobile-menu"
          onClick={() => setIsMenuOpen((currentValue) => !currentValue)}
        />
        
        {/* Search Label and Logout Label (Añadir Dropdown de lenguajes)*/}
        <div className="header-actions">
          <label htmlFor="header-search" className="sr-only">Buscar contenido en Transcendence</label>
          <InputText
            id="header-search"
            placeholder="Search..."
            className="header-search p-inputtext-sm"
          />
          <Button
            type="button"
            severity="danger"
            className="header-logout p-inputtext-sm"
            outlined
            size="small"
            onClick={handleLogout}
          > Logout
          </Button>
        </div>

        <div id="header-mobile-menu" className={`header-mobile-menu ${isMenuOpen ? 'is-open' : ''}`}>
          <label htmlFor="header-search-mobile" className="sr-only">Buscar contenido en Transcendence</label>
          <InputText
            id="header-search-mobile"
            placeholder="Search..."
            className="header-search header-search--mobile p-inputtext-sm"
          />
          <Button
            type="button"
            severity="danger"
            className="header-logout header-logout--mobile p-inputtext-sm"
            outlined
            size="small"
            onClick={handleLogout}
          > Logout
          </Button>
        </div>

      </div>
    </div>
  )
}

export default Header
