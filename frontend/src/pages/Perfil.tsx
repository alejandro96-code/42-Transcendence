import { useState } from 'react'
import Header from '../components/header'
import Footer from '../components/footer'
import PersonalData from '../components/personal_data'
import PostFeed from '../components/posts'
import Friends from '../components/friends'
import Chat from '../components/chat'

function Perfil() {
  const [activeChatFriend, setActiveChatFriend] = useState<{ id: number; name: string } | null>(null)

  return (
    <div className="app-shell perfil-layout">
      <Header />
      <main className="app-content">
        <h1 className="sr-only">Perfil de Transcendence</h1>
        <div className="grid content-grid">
          <div className="col-12 lg:col-3 left-pane">
            <PersonalData />
          </div>
          <div className="col-12 lg:col-6 middle-pane">
            <PostFeed />
          </div>
          <div className="col-12 lg:col-3 right-pane">
            <div className="right-pane-item">
              <Friends
                selectedFriendId={activeChatFriend?.id ?? null}
                onOpenChat={(friend) => setActiveChatFriend({ id: friend.id, name: friend.name })}
              />
            </div>
            <div className="right-pane-item">
              <Chat activeFriendName={activeChatFriend?.name ?? null} />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default Perfil
