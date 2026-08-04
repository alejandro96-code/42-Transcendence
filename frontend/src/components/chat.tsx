import { useTranslation } from 'react-i18next'//importar libreria de idiomas
interface ChatProps {
  activeFriendName?: string | null
}

export function Chat({ activeFriendName = null }: ChatProps) {
  const { t } = useTranslation()
  return (
    <div className='chat-container'>
      <div className="surface-card border-round-sm p-3">
        <div className="chat-friend-name border-round-sm">
          {activeFriendName ? t('chat_active_friend', { name: activeFriendName }) : t('chat_select_friend')}
        </div>
        <div className="chat-panel">
          <section className="chat-section">
            <div className="chat-list">
              <p className="personal-comment">hola!</p>
              <p className="friend-comment">eyy que tal</p>
              <p className="personal-comment">Todo bien y tu!</p>
              <p className="friend-comment">Lo mismo digo!</p>
              <p className="personal-comment">Todo bien y tu!</p>
              <p className="friend-comment">Lo mismo digo!</p>
              <p className="personal-comment">Todo bien y tu!</p>
              <p className="friend-comment">Lo mismo digo!</p>
            </div>
          </section>
        </div>
        <label htmlFor="send-message" className="sr-only">{t('chat_label_send_message')}</label>
        <input
          id="send-message"
          type="input"
          accept="text"
          className="send-text p-inputtext"
          placeholder={t('chat_input_placeholder')}
        />
      </div>
    </div>
  )
}