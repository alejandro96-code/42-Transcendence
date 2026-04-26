import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menubar } from 'primereact/menubar'
import { InputText } from 'primereact/inputtext'
import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import { Toast } from 'primereact/toast'
import type { MenuItem } from 'primereact/menuitem'
import { useRef } from 'react'
import { useAppDispatch } from '../store/hooks'
import { clearUser } from '../store/authSlice'
import { authAPI } from '../services/authAPI'
import { emitFriendRequest } from '../services/friendEvents'
import logo42 from '../img/42.png'

function Header() {

  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const toast = useRef<Toast>(null)
  const [isAddFriendOpen, setIsAddFriendOpen] = useState(false)
  const [friendNick, setFriendNick] = useState('')

  const handleLogout = async () => {
    await authAPI.logout()
    dispatch(clearUser())
    navigate('/login')
  }

  const handleSendFriendRequest = () => {
    const nickname = friendNick.trim()
    if (!nickname) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Nick requerido',
        detail: 'Introduce un nick para enviar la solicitud.',
      })
      return
    }

    emitFriendRequest({ nickname })
    setFriendNick('')
    setIsAddFriendOpen(false)
  }

  const items: MenuItem[] = [
    { label: 'Perfil', icon: 'pi pi-user', command: () => navigate('/') },
    { label: 'Publicaciones', icon: 'pi pi-file', command: () => navigate('/')},
    { label: 'Game', icon: 'pi pi-play', command: () => navigate('/game') },
    { separator: true, className: 'lg:hidden' },
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
            label="Agregar amigo"
            icon="pi pi-user-plus"
            outlined
            className="w-full mb-2"
            onClick={() => setIsAddFriendOpen(true)}
          />
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
        label="Agregar"
        icon="pi pi-user-plus"
        outlined
        size="small"
        onClick={() => setIsAddFriendOpen(true)}
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
      <Toast ref={toast} />
      <Menubar model={items} start={start} end={end} className="mb-3" />
      <Dialog
        header="Nueva solicitud de amistad"
        visible={isAddFriendOpen}
        onHide={() => {
          setIsAddFriendOpen(false)
          setFriendNick('')
        }}
        className="add-friend-dialog"
        style={{ width: 'min(92vw, 28rem)' }}
      >
        <div className="flex flex-column gap-3">
          <span>Escribe el nick del usuario al que quieres enviar la solicitud.</span>
          <InputText
            value={friendNick}
            onChange={(e) => setFriendNick(e.target.value)}
            placeholder="ejemplo: alejanr2"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSendFriendRequest()
              }
            }}
          />
          <div className="flex justify-content-end gap-2">
            <Button
              label="Cancelar"
              text
              onClick={() => {
                setIsAddFriendOpen(false)
                setFriendNick('')
              }}
            />
            <Button label="Enviar solicitud" icon="pi pi-send" onClick={handleSendFriendRequest} />
          </div>
        </div>
      </Dialog>
    </div>
  )
}

export default Header
