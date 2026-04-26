import { useEffect, useRef, useState } from 'react'
import { Button } from 'primereact/button'
import { TabView, TabPanel } from 'primereact/tabview'
import { Avatar } from 'primereact/avatar'
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog'
import { Toast } from 'primereact/toast'
import { subscribeFriendRequests } from '../services/friendEvents'

interface Friend {
  id: number
  name: string
  email: string
  avatar?: string
  online: boolean
  lastSeen?: string
}

interface PendingRequest {
  id: number
  name: string
  email: string
  avatar?: string
  requestedAt: string
}

const INITIAL_FRIENDS: Friend[] = [
  { id: 1, name: 'alejanr2', email: 'alejanr2@student.42', avatar: 'https://via.placeholder.com/40?text=AR', online: true, lastSeen: 'Ahora' },
  { id: 2, name: 'Andefern', email: 'andefern@student.42', avatar: 'https://via.placeholder.com/40?text=AF', online: false, lastSeen: 'Hace 2 horas' },
  { id: 3, name: 'fcasaubo', email: 'fcasaubo@student.42', avatar: 'https://via.placeholder.com/40?text=FC', online: true, lastSeen: 'Ahora' },
  { id: 4, name: 'xortega', email: 'xortega@student.42', avatar: 'https://via.placeholder.com/40?text=XO', online: false, lastSeen: 'Hace 5 horas' },
]

const INITIAL_PENDING_REQUESTS: PendingRequest[] = [
  { id: 10, name: 'varysito', email: 'varysito@student.42', avatar: 'https://via.placeholder.com/40?text=VY', requestedAt: '2025-04-24' },
  { id: 11, name: 'mgarcia', email: 'mgarcia@student.42', avatar: 'https://via.placeholder.com/40?text=MG', requestedAt: '2025-04-23' },
  { id: 12, name: 'jperez', email: 'jperez@student.42', avatar: 'https://via.placeholder.com/40?text=JP', requestedAt: '2025-04-22' },
  { id: 13, name: 'alopez', email: 'alopez@student.42', avatar: 'https://via.placeholder.com/40?text=AL', requestedAt: '2025-04-21' },
]

function Friends() {
  const toast = useRef<Toast>(null)
  
  const [friendsList, setFriendsList] = useState<Friend[]>(INITIAL_FRIENDS)
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>(INITIAL_PENDING_REQUESTS)

  useEffect(() => {
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
  }, [])

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
            email: request.email,
            avatar: request.avatar,
            online: false,
            lastSeen: 'Nunca',
          },
        ])
        setPendingRequests((currentRequests) => currentRequests.filter((r) => r.id !== request.id))
        toast.current?.show({ severity: 'success', summary: 'Éxito', detail: `${request.name} ha sido añadido como amigo` })
      }
    })
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
      <Toast ref={toast} />
      <ConfirmDialog />
      
      <div className="surface-card border-round-sm p-4">
        <TabView>
          {/* TAB 1: Amigos */}
          <TabPanel header={`Amigos (${friendsList.length})`} >
            {friendsList.length > 0 ? (
              <div className="friends-list">
                {friendsList.map((friend) => (
                  <div key={friend.id} className="friend-card">
                    <div className="friend-info">
                      <div className="friend-avatar">
                        <Avatar image={friend.avatar} label={friend.name[0].toUpperCase()} />
                        <div className={`status-indicator ${friend.online ? 'online' : 'offline'}`}></div>
                      </div>
                      <div className="friend-details">
                        <h4 className="mb-0">{friend.name}</h4>
                        <small className="text-secondary">
                          {friend.online ? <span className="text-success">● Online</span> : <span>Visto: {friend.lastSeen}</span>}
                        </small>
                      </div>
                    </div>
                    <div className="friend-actions">
                      <Button 
                        icon="pi pi-times" 
                        className="p-button-rounded p-button-danger p-button-text p-button-sm"
                        tooltip="Eliminar"
                        onClick={() => handleRemoveFriend(friend)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <i className="pi pi-heart-fill"></i>
                <p>No tienes amigos aún</p>
              </div>
            )}
          </TabPanel>

          {/* TAB 2: Solicitudes pendientes */}
          <TabPanel header={`Solicitudes (${pendingRequests.length})`}>
            {pendingRequests.length > 0 ? (
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
            ) : (
              <div className="empty-state">
                <i className="pi pi-inbox"></i>
                <p>Sin solicitudes</p>
              </div>
            )}
          </TabPanel>

        </TabView>
      </div>
    </div>
  )
}

export default Friends
