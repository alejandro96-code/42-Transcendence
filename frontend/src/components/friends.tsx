import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import { InputText } from 'primereact/inputtext'
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog'
import { Toast } from 'primereact/toast'
import { friendsAPI, type Friend, type PendingFriendRequest } from '../services/friendsAPI'

interface FriendsProps {
  selectedFriendId?: number | null
  onOpenChat?: (friend: { id: number; name: string }) => void
  onFriendRemoved?: (friendId: number) => void
}

export function Friends({ selectedFriendId = null, onOpenChat, onFriendRemoved }: FriendsProps) {
  const toast = useRef<Toast>(null)
  const [friendsList, setFriendsList] = useState<Friend[]>([])
  const [pendingRequests, setPendingRequests] = useState<PendingFriendRequest[]>([])
  const [activeSection, setActiveSection] = useState<'friends' | 'requests'>('friends')
  const [isAddFriendOpen, setIsAddFriendOpen] = useState(false)
  const [friendNick, setFriendNick] = useState('')

  const loadFriends = async () => {
    try {
      setFriendsList(await friendsAPI.getFriends())
    } catch (error) {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: error instanceof Error ? error.message : 'No se pudieron cargar los amigos.' })
    }
  }

  const loadRequests = async () => {
    try {
      setPendingRequests(await friendsAPI.getPendingRequests())
    } catch (error) {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: error instanceof Error ? error.message : 'No se pudieron cargar las solicitudes.' })
    }
  }

  useEffect(() => {
    void loadFriends()
    void loadRequests()
  }, [])

  const sortedFriends = useMemo(() => (
    [...friendsList].sort((a, b) => a.username.localeCompare(b.username, 'es', { sensitivity: 'base' }))
  ), [friendsList])

  useEffect(() => {
    if (pendingRequests.length === 0 && activeSection === 'requests') setActiveSection('friends')
  }, [pendingRequests.length, activeSection])

  const handleAnswerRequest = (request: PendingFriendRequest, status: 'accepted' | 'rejected') => {
    const accepted = status === 'accepted'
    confirmDialog({
      message: `¿${accepted ? 'Aceptar' : 'Rechazar'} la solicitud de amistad de ${request.username}?`,
      header: 'Confirmar',
      icon: accepted ? 'pi pi-check' : 'pi pi-times',
      accept: async () => {
        try {
          await friendsAPI.answerRequest(request.id, status)
          await loadRequests()
          if (accepted) await loadFriends()
          toast.current?.show({ severity: accepted ? 'success' : 'info', summary: accepted ? 'Solicitud aceptada' : 'Solicitud rechazada', detail: accepted ? `${request.username} ya es tu amigo.` : `Has rechazado la solicitud de ${request.username}.` })
        } catch (error) {
          toast.current?.show({ severity: 'error', summary: 'Error', detail: error instanceof Error ? error.message : 'No se pudo responder a la solicitud.' })
        }
      },
    })
  }

  const handleSendFriendRequest = async () => {
    const nickname = friendNick.trim()
    if (!nickname) {
      toast.current?.show({ severity: 'warn', summary: 'Nick requerido', detail: 'Introduce un nick para enviar la solicitud.' })
      return
    }

    try {
      await friendsAPI.sendRequest(nickname)
      setFriendNick('')
      setIsAddFriendOpen(false)
      toast.current?.show({ severity: 'success', summary: 'Solicitud enviada', detail: `Se envió la solicitud a ${nickname}.` })
    } catch (error) {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: error instanceof Error ? error.message : 'No se pudo enviar la solicitud.' })
    }
  }

  const handleRemoveFriend = (friend: Friend) => {
    confirmDialog({
      message: `¿Eliminar a ${friend.username} de tus amigos?`,
      header: 'Confirmar',
      icon: 'pi pi-times',
      accept: async () => {
        try {
          await friendsAPI.removeFriend(friend.id)
          await loadFriends()
          onFriendRemoved?.(friend.id)
          toast.current?.show({ severity: 'info', summary: 'Eliminado', detail: `${friend.username} ha sido eliminado.` })
        } catch (error) {
          toast.current?.show({ severity: 'error', summary: 'Error', detail: error instanceof Error ? error.message : 'No se pudo eliminar el amigo.' })
        }
      },
    })
  }

  return (
    <div className='friends-container'>
      <Toast ref={toast} />
      <ConfirmDialog />
      <div className="surface-card border-round-sm p-3">
        <div className="friends-tabs">
          <button type="button" className={`friends-tab ${activeSection === 'friends' ? 'is-active' : ''}`} onClick={() => setActiveSection('friends')}>
            <span>Amigos ({friendsList.length})</span>
            <span className="friends-tab-add" onClick={(event) => { event.stopPropagation(); setIsAddFriendOpen(true) }}>+</span>
          </button>
          {pendingRequests.length > 0 && (
            <button type="button" className={`friends-tab ${activeSection === 'requests' ? 'is-active' : ''}`} onClick={() => setActiveSection('requests')}>
              Solicitudes ({pendingRequests.length})
            </button>
          )}
        </div>
        <div className="friends-panel">
          {activeSection === 'friends' && (
            <section className="friends-section">
              {sortedFriends.length > 0 ? <div className="friends-list">{sortedFriends.map((friend) => (
                <div key={friend.id} className="friend-card">
                  <div className="friend-info"><div className="friend-details"><h4 className="mb-0"><span className="status-dot offline" />{friend.username}</h4></div></div>
                  <div className="friend-actions">
                    <Button icon="pi pi-eye" aria-label={`Abrir chat con ${friend.username}`} className={`p-button-rounded p-button-text p-button-sm ${selectedFriendId === friend.id ? 'p-button-info' : ''}`} tooltip={`Abrir chat con ${friend.username}`} onClick={() => onOpenChat?.({ id: friend.id, name: friend.username })} />
                    <Button icon="pi pi-times" label="Eliminar amigo" className="p-button-rounded p-button-danger p-button-text p-button-sm" tooltip="Eliminar" onClick={() => handleRemoveFriend(friend)}>Eliminar amigos</Button>
                  </div>
                </div>
              ))}</div> : <div className="empty-state"><i className="pi pi-heart-fill" /><p>No tienes amigos aún</p></div>}
            </section>
          )}
          {activeSection === 'requests' && pendingRequests.length > 0 && (
            <section className="friends-section"><div className="requests-list">{pendingRequests.map((request) => (
              <div key={request.id} className="request-card">
                <div className="request-info"><div className="request-details"><h4 className="mb-0">{request.username}</h4><small className="text-secondary">{new Date(request.created_at).toLocaleDateString('es-ES')}</small></div></div>
                <div className="request-actions">
                  <Button icon="pi pi-check" label="Aceptar solicitud" className="p-button-rounded p-button-success p-button-text p-button-sm" tooltip="Aceptar" onClick={() => handleAnswerRequest(request, 'accepted')} />
                  <Button icon="pi pi-times" label="Rechazar solicitud" className="p-button-rounded p-button-danger p-button-text p-button-sm" tooltip="Rechazar" onClick={() => handleAnswerRequest(request, 'rejected')} />
                </div>
              </div>
            ))}</div></section>
          )}
        </div>
      </div>
      <Dialog header="Nueva solicitud de amistad" visible={isAddFriendOpen} onHide={() => { setIsAddFriendOpen(false); setFriendNick('') }} className="add-friend-dialog">
        <div className="flex flex-column gap-3">
          <span>Escribe el nick del usuario al que quieres enviar la solicitud.</span>
          <InputText value={friendNick} onChange={(event) => setFriendNick(event.target.value)} placeholder="ejemplo: alejanr2" autoFocus onKeyDown={(event) => { if (event.key === 'Enter') void handleSendFriendRequest() }} />
          <div className="flex justify-content-end gap-2">
            <Button label="Cancelar" text onClick={() => { setIsAddFriendOpen(false); setFriendNick('') }} />
            <Button label="Enviar solicitud" icon="pi pi-send" onClick={() => void handleSendFriendRequest()} />
          </div>
        </div>
      </Dialog>
    </div>
  )
}
