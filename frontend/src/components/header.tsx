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
        <div className="header-nav">
              <Link to="/" className="header-brand">
                <img src={logo42} alt="imagen de 42" style={{ height: '36px' }} className="header-brand__logo" />
              </Link>
              <Link to="/" className="header-nav__link">
                <i className="pi pi-user mr-2"/>
                <span>Perfil personal</span>
              </Link>
              <Link to="/perfil-publico" className="header-nav__link">
                <i className="pi pi-users mr-2"/>
                <span>Perfil público</span>
              </Link>
        </div>

        <div className="header-actions">
          <label htmlFor="header-search" className="sr-only">Buscar contenido en Transcendence</label>
          <InputText
            id="header-search"
            placeholder="Buscar..."
            className="p-inputtext-sm"
          />
          <Button
            type="button"
            label="Logout"
            icon="pi pi-sign-out"
            severity="danger"
            outlined
            size="small"
            onClick={handleLogout}
          />
        </div>
      </div>
    </div>
  )
}

export default Header
