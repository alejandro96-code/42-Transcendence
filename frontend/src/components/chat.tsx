import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useAppSelector } from '../store/hooks'
import { chatAPI, type ChatMessage } from '../services/chatAPI'
import { useI18n } from '../hooks/useI18n'

interface ChatProps {
  activeFriend?: { id: number; name: string } | null
}
 
export function Chat({ activeFriend = null }: ChatProps) {
  const { t } = useI18n()
  const currentUser = useAppSelector((state) => state.auth.user)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [messageText, setMessageText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)


  useEffect(() => {
    if (!activeFriend) {
      setMessages([])
      setError(null)
      return
    }

    let cancelled = false
    setIsLoading(true)
    setError(null)
    chatAPI.getMessages(activeFriend.id)
      .then((data) => {
        if (!cancelled) setMessages(data)
      })
      .catch((requestError: Error) => {
        if (!cancelled) setError(requestError.message)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => { cancelled = true }
  }, [activeFriend?.id])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [messages])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const content = messageText.trim()
    if (!activeFriend || !content || isSending) return

    setIsSending(true)
    setError(null)
    try {
      const message = await chatAPI.sendMessage(activeFriend.id, content)
      setMessages((current) => [...current, message])
      setMessageText('')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t('chat_error_message'))
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className='chat-container'>
      <div className="surface-card border-round-sm p-3">
        <div className="chat-friend-name border-round-sm">
          {activeFriend ? t('chat_active_friend', { name: activeFriend.name }) : t('chat_select_friend')}
        </div>
        <div className="chat-panel">
          <section className="chat-section">
            <div className="chat-list" ref={listRef} aria-live="polite">
              {isLoading && <p className="chat-status">{t('chat_loading_placeholder')}</p>}
              {!isLoading && activeFriend && messages.length === 0 && !error && <p className="chat-status">{t('chat_no_message_placeholder')}</p>}
              {messages.map((message) => (
                <p key={message.id} className={message.sender_id === currentUser?.id ? 'personal-comment' : 'friend-comment'}>
                  {message.content}
                </p>
              ))}
              {error && <p className="chat-error" role="alert">{error}</p>}
            </div>
          </section>
        </div>
        <form onSubmit={handleSubmit}>
          <label htmlFor="send-message" className="sr-only">{t('chat_input_aria_label   ')}</label>
          <input
            id="send-message"
            type="text"
            className="send-text p-inputtext"
            placeholder={activeFriend ? t('chat_active_friend') : t('chat_select_friend')}
            value={messageText}
            onChange={(event) => setMessageText(event.target.value)}
            disabled={!activeFriend || isSending}
            maxLength={1000}
          />
        </form>
      </div>
    </div>
  )
}