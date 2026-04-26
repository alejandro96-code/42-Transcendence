import { useNavigate } from 'react-router-dom'
import { Menubar } from 'primereact/menubar'
import { InputText } from 'primereact/inputtext'
import { Button } from 'primereact/button'
import type { MenuItem } from 'primereact/menuitem'
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

  const items: MenuItem[] = [
    { label: 'Perfil', icon: 'pi pi-user', command: () => navigate('/') },
    { label: 'Publicaciones', icon: 'pi pi-file', command: () => navigate('/login')},
    { label: 'Game', icon: 'pi pi-play', command: () => navigate('/game') },
    { separator: true, className: 'lg:hidden' },
    { label: 'Opciones', icon: 'pi pi-wrench' },
    {
      className: 'lg:hidden',
      template: () => (
        <div className="px-3 py-2">
          <InputText
            placeholder="Buscar..."
            className="w-full"
          />
        </div>
      ),
    },
    {
      className: 'lg:hidden',
      template: () => (
        <div className="px-3 py-2">
          <Button
            label="Logout"
            icon="pi pi-sign-out"
            severity="danger"
            outlined
            className="w-full"
            onClick={handleLogout}
          />
        </div>
      ),
    },
  ]

  const start = <img src={logo42} alt="42 logo" style={{ height: '36px' }} className="mr-3"/>

  const end = (
    <div className="hidden lg:flex align-items-center gap-2" >
      <InputText
        placeholder="Buscar..."
        className="p-inputtext-sm"
      />
      <Button
        label="Logout"
        icon="pi pi-sign-out"
        severity="danger"
        outlined
        size="small"
        onClick={handleLogout}
      />
    </div>
  )

  return (
    <div className="header-container">
      <Menubar model={items} start={start} end={end} className="mb-3" />
    </div>
  )
}

export default Header
