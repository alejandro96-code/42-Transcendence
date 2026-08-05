import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import { InputText } from 'primereact/inputtext'
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog'
import { Toast } from 'primereact/toast'
import { friendsAPI, type Friend, type PendingFriendRequest } from '../services/friendsAPI'
import { useI18n } from '../hooks/useI18n'

interface FriendsProps {
  selectedFriendId?: number | null
  onOpenChat?: (friend: { id: number; name: string }) => void
  onFriendRemoved?: (friendId: number) => void
}

export function Friends({ selectedFriendId = null, onOpenChat, onFriendRemoved }: FriendsProps) {
  const { t } = useI18n()
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
      toast.current?.show({ severity: 'error', summary: 'Error', detail: error instanceof Error ? error.message : t('friends_load_error') })
    }
  }

  const loadRequests = async () => {
    try {
      setPendingRequests(await friendsAPI.getPendingRequests())
    } catch (error) {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: error instanceof Error ? error.message : t('friends_load_dialog_error') })
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
      message: `${t('friends_request_question_tooltip')}${accepted ? t('friends_request_accept_tooltip') : t('friends_confirm_accept_reject_msg')} ${(t('friends_confirm_accept_msg'))} ${request.username}?`,
      header: 'Confirmar',
      icon: accepted ? 'pi pi-check' : 'pi pi-times',
      accept: async () => {
        try {
          await friendsAPI.answerRequest(request.id, status)
          await loadRequests()
          if (accepted) await loadFriends()
          toast.current?.show({ severity: accepted ? 'success' : 'info', summary: accepted ? t('friends_request_accepted') : t('friends_request_rejected'), detail: accepted ? `${request.username} ${t('friends_new_friend')}` : `${t('friends_no_new_fried')} ${request.username}.` })
        } catch (error) {
          toast.current?.show({ severity: 'error', summary: 'Error', detail: error instanceof Error ? error.message : t('friends_request_response_error')})
        }
      },
    })
  }

  const handleSendFriendRequest = async () => {
    const nickname = friendNick.trim()
    if (!nickname) {
      toast.current?.show({ severity: 'warn', summary: t('friends_toast_req_title'), detail: t('friends_toast_req_detail') })
      return
    }

    try {
      await friendsAPI.sendRequest(nickname)
      setFriendNick('')
      setIsAddFriendOpen(false)
      toast.current?.show({ severity: 'success', summary: t('friends_toast_sent_title'), detail: `${t('friends_toast_sent_detail')} ${nickname}.` })
    } catch (error) {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: error instanceof Error ? error.message : t('friends_request_send_error') })
    }
  }

  const handleRemoveFriend = (friend: Friend) => {
    confirmDialog({
      message: `¿Eliminar a ${friend.username} de tus amigos?`, //transate pendent
      header: 'Confirmar',
      icon: 'pi pi-times',
      accept: async () => {
        try {
          await friendsAPI.removeFriend(friend.id)
          await loadFriends()
          onFriendRemoved?.(friend.id)
          toast.current?.show({ severity: 'info', summary: 'Eliminado', detail: `${friend.username} ${t('friends_removed_message')}` })
        } catch (error) {
          toast.current?.show({ severity: 'error', summary: 'Error', detail: error instanceof Error ? error.message : t('friends_remove_error') })
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
                    <Button icon="pi pi-times" label={t('friends_remove_label')} className="p-button-rounded p-button-danger p-button-text p-button-sm" tooltip={t('friends_remove_button')} onClick={() => handleRemoveFriend(friend)}>{t('friends_remove_button')}</Button>
                  </div>
                </div>
              ))}</div> : <div className="empty-state"><i className="pi pi-heart-fill" /><p>{t('friends_empty_state')}</p></div>}
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
          <span>{t('friends_dialog_description')}</span>
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
