import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import { InputText } from 'primereact/inputtext'
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog'
import { Toast } from 'primereact/toast'
import { friendsAPI, type Friend, type PendingFriendRequest } from '../services/friendsAPI'
import { useTranslation } from 'react-i18next'

interface FriendsProps {
  selectedFriendId?: number | null
  onOpenChat?: (friend: { id: number; name: string }) => void
  onFriendRemoved?: (friendId: number) => void
  readOnly?: boolean
  ownerUserId?: number | null
}

export function Friends({
  selectedFriendId = null,
  onOpenChat,
  onFriendRemoved,
  readOnly = false,
  ownerUserId = null,
}: FriendsProps) {
  const { t, i18n } = useTranslation()
  const toast = useRef<Toast>(null)
  const [friendsList, setFriendsList] = useState<Friend[]>([])
  const [pendingRequests, setPendingRequests] = useState<PendingFriendRequest[]>([])
  const [activeSection, setActiveSection] = useState<'friends' | 'requests'>('friends')
  const [isAddFriendOpen, setIsAddFriendOpen] = useState(false)
  const [friendNick, setFriendNick] = useState('')

  const loadFriends = async () => {
    try {
      setFriendsList(ownerUserId ? await friendsAPI.getUserFriends(ownerUserId) : await friendsAPI.getFriends())
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
    if (!readOnly && !ownerUserId) {
      void loadRequests()
    }
  }, [ownerUserId, readOnly])

  useEffect(() => {
    void friendsAPI.heartbeat()
    void loadFriends()

    const interval = setInterval(() => {
      void friendsAPI.heartbeat()
      void loadFriends()
    }, 10000)

    return () => {
      clearInterval(interval)
    }
  }, [ownerUserId])

  const sortedFriends = useMemo(() => (
    [...friendsList].sort((a, b) => a.username.localeCompare(b.username, i18n.language || 'es', { sensitivity: 'base' }))
  ), [friendsList, i18n.language])

  useEffect(() => {
    if (pendingRequests.length === 0 && activeSection === 'requests') setActiveSection('friends')
  }, [pendingRequests.length, activeSection])

  const handleAnswerRequest = (request: PendingFriendRequest, status: 'accepted' | 'rejected') => {
    const accepted = status === 'accepted'
    confirmDialog({
      message: `${t('friends_request_question_tooltip')}${accepted ? t('friends_request_accept_tooltip') : t('friends_confirm_accept_reject_msg')} ${request.username}?`,
      header: t('friends_confirm_header'),
      icon: accepted ? 'pi pi-check' : 'pi pi-times',
      accept: async () => {
        try {
          await friendsAPI.answerRequest(request.id, status)
          await loadRequests()
          if (accepted) await loadFriends()
          toast.current?.show({ 
            severity: accepted ? 'success' : 'info', 
            summary: accepted ? t('friends_request_accepted') : t('friends_request_rejected'), 
            detail: accepted ? `${request.username} ${t('friends_new_friend')}` : `${t('friends_no_new_fried')} ${request.username}.` 
          })
        } catch (error) {
          toast.current?.show({ severity: 'error', summary: 'Error', detail: error instanceof Error ? error.message : t('friends_request_response_error') })
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
      message: t('friends_confirm_remove_msg', { name: friend.username }),
      header: t('friends_confirm_header'),
      icon: 'pi pi-times',
      accept: async () => {
        try {
          await friendsAPI.removeFriend(friend.id)
          await loadFriends()
          onFriendRemoved?.(friend.id)
          toast.current?.show({ severity: 'info', summary: t('friends_toast_removed_title'), detail: `${friend.username} ${t('friends_removed_message')}` })
          toast.current?.show({ severity: 'info', summary: t('friends_toast_removed_title'), detail: `${friend.username} ${t('friends_removed_message')}` })
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
          <button type="button" className={`p-button-friends friends-tab ${activeSection === 'friends' ? 'is-active' : ''}`} onClick={() => setActiveSection('friends')}>
            <span>{t('friends_tab_friends', { count: friendsList.length })}</span>
            <span>{t('friends_tab_friends', { count: friendsList.length })}</span>
            {!readOnly && (
              <span className="friends-tab-add" onClick={(event) => { event.stopPropagation(); setIsAddFriendOpen(true) }}>+</span>
            )}
          </button>
          {!readOnly && !ownerUserId && pendingRequests.length > 0 && (
            <button type="button" className={`p-button-friends friends-tab ${activeSection === 'requests' ? 'is-active' : ''}`} onClick={() => setActiveSection('requests')}>
              {t('friends_tab_requests', { count: pendingRequests.length })}
              {t('friends_tab_requests', { count: pendingRequests.length })}
            </button>
          )}
        </div>
        <div className="friends-panel">
          {activeSection === 'friends' && (
            <section className="friends-section">
              {sortedFriends.length > 0 ? (
                <div className="friends-list">
                  {sortedFriends.map((friend) => (
                    <div key={friend.id} className="friend-card">
                      <div className="friend-info">
                        <div className="friend-details">
                          <h4 className="mb-0">
                            <span className={`online-status ${friend.is_online ? 'online' : 'offline'}`} />
                            <span>{friend.username}</span>
                          </h4>
                        </div>
                      </div>
                      <div className="friend-actions">
                        {!readOnly && !ownerUserId && (
                          <>
                            <Button 
                              icon="pi pi-eye" 
                              aria-label={t('friends_chat_aria_label', { name: friend.username })} 
                              className={`p-button-rounded p-button-text p-button-sm ${selectedFriendId === friend.id ? 'p-button-info' : ''}`} 
                              tooltip={t('friends_chat_tooltip', { name: friend.username })} 
                              onClick={() => onOpenChat?.({ id: friend.id, name: friend.username })} 
                            />
                            <Button 
                              icon="pi pi-times" 
                              label={t('friends_remove_message')} 
                              className="p-button-rounded p-button-danger p-button-text p-button-sm" 
                              tooltip={t('friends_remove_tooltip')} 
                              onClick={() => handleRemoveFriend(friend)} 
                            />
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <i className="pi pi-heart-fill" />
                  <p>{t('friends_empty_state')}</p>
                </div>
              )}
            </section>
          )}
          {!readOnly && !ownerUserId && activeSection === 'requests' && pendingRequests.length > 0 && (
            <section className="friends-section">
              <div className="requests-list">
                {pendingRequests.map((request) => (
                  <div key={request.id} className="request-card">
                    <div className="request-info">
                      <div className="request-details">
                        <h4 className="mb-0">{request.username}</h4>
                        <small className="text-secondary">
                          {new Date(request.created_at).toLocaleDateString(i18n.language === 'en' ? 'en-US' : (i18n.language === 'eu' ? 'eu-ES' : 'es-ES'))}
                        </small>
                      </div>
                    </div>
                    <div className="request-actions">
                      <Button 
                        icon="pi pi-check" 
                        label={t('friends_request_accept')} 
                        className="p-button-rounded p-button-success p-button-text p-button-sm" 
                        tooltip={t('friends_request_accept_tooltip')} 
                        onClick={() => handleAnswerRequest(request, 'accepted')} 
                      />
                      <Button 
                        icon="pi pi-times" 
                        label={t('friends_request_reject')} 
                        className="p-button-rounded p-button-danger p-button-text p-button-sm" 
                        tooltip={t('friends_request_reject_tooltip')} 
                        onClick={() => handleAnswerRequest(request, 'rejected')} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
      {!readOnly && !ownerUserId && (
        <Dialog 
          header={t('friends_dialog_header')} 
          visible={isAddFriendOpen} 
          onHide={() => { setIsAddFriendOpen(false); setFriendNick('') }} 
          className="add-friend-dialog"
        >
          <div className="flex flex-column gap-3">
            <span>{t('friends_dialog_description')}</span>
            <span>{t('friends_dialog_42_note')}</span>
            <InputText 
              value={friendNick} 
              onChange={(event) => setFriendNick(event.target.value)} 
              placeholder={t('friends_dialog_placeholder')} 
              autoFocus 
              onKeyDown={(event) => { if (event.key === 'Enter') void handleSendFriendRequest() }} 
            />
            <div className="flex justify-content-end gap-2">
              <Button label={t('friends_dialog_cancel')} text onClick={() => { setIsAddFriendOpen(false); setFriendNick('') }} />
              <Button label={t('friends_dialog_send')} icon="pi pi-send" onClick={() => void handleSendFriendRequest()} />
            </div>
          </div>
        </Dialog>
      )}
    </div>
  )
}