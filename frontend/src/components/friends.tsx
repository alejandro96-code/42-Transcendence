import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from 'primereact/button'
import { Avatar } from 'primereact/avatar'
import { Dialog } from 'primereact/dialog'
import { InputText } from 'primereact/inputtext'
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog'
import { Toast } from 'primereact/toast'
import { emitFriendRequest, subscribeFriendRequests } from '../services/friendEvents'

interface Friend {
  id: number
  name: string
  online: boolean
}

interface PendingRequest {
  id: number
  name: string
  email: string
  avatar?: string
  requestedAt: string
}

interface FriendsProps {
  readOnly?: boolean
  initialFriends?: Friend[]
}

const INITIAL_FRIENDS: Friend[] = [
  { id: 1, name: 'alejanr2', online: true },
  { id: 2, name: 'Andefern', online: false },
  { id: 3, name: 'fcasaubo', online: true },
  { id: 4, name: 'xortega', online: false },
  { id: 1, name: 'alejanr2', online: true },
  { id: 2, name: 'Andefern', online: false },
  { id: 3, name: 'fcasaubo', online: true },
  { id: 4, name: 'xortega', online: false },
  { id: 1, name: 'alejanr2', online: true },
  { id: 2, name: 'Andefern', online: false },
  { id: 3, name: 'fcasaubo', online: true },
  { id: 4, name: 'xortega', online: false },
  { id: 1, name: 'alejanr2', online: true },
  { id: 2, name: 'Andefern', online: false },
  { id: 3, name: 'fcasaubo', online: true },
  { id: 4, name: 'xortega', online: false },
]

const INITIAL_PENDING_REQUESTS: PendingRequest[] = [
  { id: 10, name: 'varysito', email: 'varysito@student.42', avatar: 'https://via.placeholder.com/40?text=VY', requestedAt: '2025-04-24' },
  { id: 11, name: 'mgarcia', email: 'mgarcia@student.42', avatar: 'https://via.placeholder.com/40?text=MG', requestedAt: '2025-04-23' },
  { id: 12, name: 'jperez', email: 'jperez@student.42', avatar: 'https://via.placeholder.com/40?text=JP', requestedAt: '2025-04-22' },
  { id: 13, name: 'alopez', email: 'alopez@student.42', avatar: 'https://via.placeholder.com/40?text=AL', requestedAt: '2025-04-21' },
]

function Friends({ readOnly = false, initialFriends }: FriendsProps) {
  const toast = useRef<Toast>(null)
  
  const [friendsList, setFriendsList] = useState<Friend[]>(initialFriends ?? INITIAL_FRIENDS)
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>(INITIAL_PENDING_REQUESTS)
  const [activeSection, setActiveSection] = useState<'friends' | 'requests'>('friends')
  const [isAddFriendOpen, setIsAddFriendOpen] = useState(false)
  const [friendNick, setFriendNick] = useState('')

  const sortedFriends = useMemo(() => (
    [...friendsList].sort((a, b) => {
      if (a.online !== b.online) {
        return a.online ? -1 : 1
      }

      return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
    })
  ), [friendsList])

  useEffect(() => {
    if (readOnly) {
      return
    }

    const unsubscribe = subscribeFriendRequests(({ nickname }) => {
      const normalizedNickname = nickname.trim().toLowerCase()
      if (!normalizedNickname) {
        return
      }

      setPendingRequests((currentRequests) => {
        const exists = currentRequests.some((request) => request.name.toLowerCase() === normalizedNickname)
        if (exists) {
          toast.current?.show({
            severity: 'info',
            summary: 'Solicitud existente',
            detail: `Ya hay una solicitud pendiente para ${nickname}`,
          })
          return currentRequests
        }

        const capitalized = nickname.trim()
        toast.current?.show({
          severity: 'success',
          summary: 'Solicitud enviada',
          detail: `Se envió la solicitud a ${capitalized}`,
        })

        return [
          {
            id: Date.now(),
            name: capitalized,
            email: `${normalizedNickname}@student.42`,
            requestedAt: new Date().toISOString().split('T')[0],
          },
          ...currentRequests,
        ]
      })
    })

    return unsubscribe
  }, [readOnly])

  useEffect(() => {
    if (readOnly) {
      return
    }

    if (pendingRequests.length === 0 && activeSection !== 'friends') {
      setActiveSection('friends')
    }
  }, [pendingRequests.length, activeSection, readOnly])

  const handleAcceptRequest = (request: PendingRequest) => {
    confirmDialog({
      message: `¿Aceptar la solicitud de amistad de ${request.name}?`,
      header: 'Confirmar',
      icon: 'pi pi-check',
      accept: () => {
        setFriendsList((currentFriends) => [
          ...currentFriends,
          {
            id: request.id,
            name: request.name,
            online: false,
          },
        ])
        setPendingRequests((currentRequests) => currentRequests.filter((r) => r.id !== request.id))
        toast.current?.show({ severity: 'success', summary: 'Éxito', detail: `${request.name} ha sido añadido como amigo` })
      }
    })
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

  const handleRejectRequest = (request: PendingRequest) => {
    confirmDialog({
      message: `¿Rechazar la solicitud de ${request.name}?`,
      header: 'Confirmar',
      icon: 'pi pi-times',
      accept: () => {
        setPendingRequests((currentRequests) => currentRequests.filter((r) => r.id !== request.id))
        toast.current?.show({ severity: 'info', summary: 'Rechazada', detail: `Solicitud de ${request.name} rechazada` })
      }
    })
  }

  const handleRemoveFriend = (friend: Friend) => {
    confirmDialog({
      message: `¿Eliminar a ${friend.name} de tus amigos?`,
      header: 'Confirmar',
      icon: 'pi pi-times',
      accept: () => {
        setFriendsList((currentFriends) => currentFriends.filter((f) => f.id !== friend.id))
        toast.current?.show({ severity: 'info', summary: 'Eliminado', detail: `${friend.name} ha sido eliminado` })
      }
    })
  }

  return (
    <div className='friends-container'>
      {!readOnly && <Toast ref={toast} />}
      {!readOnly && <ConfirmDialog />}
      
      <div className="surface-card border-round-sm p-3">
        {!readOnly && (
          <div className="friends-tabs">
            <button
              type="button"
              className={`friends-tab ${activeSection === 'friends' ? 'is-active' : ''}`}
              onClick={() => setActiveSection('friends')}
            >
              <span>Amigos ({friendsList.length})</span>
              <span
                className="friends-tab-add"
                role="button"
                tabIndex={0}
                onClick={(event) => {
                  event.stopPropagation()
                  setIsAddFriendOpen(true)
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    setIsAddFriendOpen(true)
                  }
                }}
                aria-label="Agregar amigo"
              >
                +
              </span>
            </button>
            {pendingRequests.length > 0 && (
              <button
                type="button"
                className={`friends-tab ${activeSection === 'requests' ? 'is-active' : ''}`}
                onClick={() => setActiveSection('requests')}
              >
                Solicitudes ({pendingRequests.length})
              </button>
            )}
          </div>
        )}

        <div className="friends-panel">
          {(readOnly || activeSection === 'friends') && (
            <section className="friends-section">
              {!readOnly && (
                <div className="section-header">
                  <h4>Amigos</h4>
                  <span className="section-meta">{friendsList.length}</span>
                </div>
              )}
              {friendsList.length > 0 ? (
                <div className="friends-list">
                  {sortedFriends.map((friend) => (
                    <div key={friend.id} className="friend-card">
                      <div className="friend-info">
                        <div className="friend-details">
                          <h4 className="mb-0">
                            <span className={`status-dot ${friend.online ? 'online' : 'offline'}`} />
                            {friend.name}
                          </h4>
                          <small className="text-secondary">
                            {friend.online ? 'Online' : 'Offline'}
                          </small>
                        </div>
                      </div>
                      {!readOnly && (
                        <div className="friend-actions">
                          <Button
                            icon="pi pi-times"
                            className="p-button-rounded p-button-danger p-button-text p-button-sm"
                            tooltip="Eliminar"
                            onClick={() => handleRemoveFriend(friend)}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <i className="pi pi-heart-fill"></i>
                  <p>No tienes amigos aún</p>
                </div>
              )}
            </section>
          )}

          {!readOnly && activeSection === 'requests' && pendingRequests.length > 0 && (
            <section className="friends-section">
              <div className="section-header">
                <h4>Solicitudes</h4>
                <span className="section-meta">{pendingRequests.length}</span>
              </div>
              <div className="requests-list">
                {pendingRequests.map((request) => (
                  <div key={request.id} className="request-card">
                    <div className="request-info">
                      <Avatar image={request.avatar} label={request.name[0].toUpperCase()} />
                      <div className="request-details">
                        <h4 className="mb-0">{request.name}</h4>
                        <small className="text-secondary">{request.requestedAt}</small>
                      </div>
                    </div>
                    <div className="request-actions">
                      <Button
                        icon="pi pi-check"
                        className="p-button-rounded p-button-success p-button-text p-button-sm"
                        tooltip="Aceptar"
                        onClick={() => handleAcceptRequest(request)}
                      />
                      <Button
                        icon="pi pi-times"
                        className="p-button-rounded p-button-danger p-button-text p-button-sm"
                        tooltip="Rechazar"
                        onClick={() => handleRejectRequest(request)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

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

export default Friends
