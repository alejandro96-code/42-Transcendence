import { Link, useNavigate } from 'react-router-dom'
import { InputText } from 'primereact/inputtext'
import { Button } from 'primereact/button'
import { useAppDispatch } from '../store/hooks'
import { clearUser } from '../store/authSlice'
import { authAPI } from '../services/authAPI'
import logo42 from '../img/42.png'

function Header() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  const handleLogout = async () => {
    await authAPI.logout()
    dispatch(clearUser())
    navigate('/login')
  }

  return (
    <div className="header-container">
      <div className="header-bar">

        {/* 42 icon and mocks profile)*/}
        <div className="header-nav">
              <Link to="/" className="header-brand">
                <img src={logo42} alt="Logo de Transcendence" style={{ height: '36px' }} className="header-brand__logo" />
              </Link>
              {/* Solo visualizar para tener como ejemplo
              <Link to="/" className="header-nav__link">
                <i className="pi pi-user mr-2"/>
                <span>Perfil personal</span>
              </Link>
              <Link to="/perfil-publico" className="header-nav__link">
                <i className="pi pi-users mr-2"/>
                <span>Perfil público</span>
              </Link>
              */}
        </div>
        
        {/* Search Label and Logout Label (Añadir Dropdown de lenguajes)*/}
        <div className="header-actions">
          <label htmlFor="header-search" className="sr-only">Buscar contenido en Transcendence</label>
          <InputText
            id="header-search"
            placeholder="Search..."
            className="p-inputtext-sm"
          />
          <Button
            type="button"
            severity="danger"
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
