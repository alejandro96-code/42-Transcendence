import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Header } from '../components/header'
import { Footer } from '../components/footer'
import { PersonalData } from '../components/personal_data'
import { PostFeed } from '../components/posts'
import { Friends } from '../components/friends'
import { Chat } from '../components/chat'
import { friendsAPI, type FriendProfile } from '../services/friendsAPI'

export function Perfil() {
  const { friendId } = useParams()
  const [activeChatFriend, setActiveChatFriend] = useState<{ id: number; name: string } | null>(null)
  const [profileUser, setProfileUser] = useState<FriendProfile | null>(null)
  const isFriendProfile = Boolean(friendId)

  useEffect(() => {
    let mounted = true

    if (isFriendProfile) {
      setActiveChatFriend(null)
    }

    const loadProfile = async () => {
      if (!friendId) {
        setProfileUser(null)
        return
      }

      try {
        const result = await friendsAPI.getFriendProfile(Number(friendId))
        if (mounted) {
          setProfileUser(result)
        }
      } catch {
        if (mounted) {
          setProfileUser(null)
        }
      }
    }

    void loadProfile()

    return () => {
      mounted = false
    }
  }, [friendId, isFriendProfile])

  return (
    <div className="app-shell perfil-layout">
      <Header />
      <main className="app-content">
        <h1 className="sr-only">Perfil de Transcendence</h1>
        <div className="grid content-grid">
          <div className="col-12 lg:col-3 left-pane">
            <PersonalData profileUser={profileUser ?? undefined} readOnly={isFriendProfile} />
          </div>
          <div className="col-12 lg:col-6 middle-pane">
            <PostFeed readOnly={isFriendProfile} />
          </div>
          <div className="col-12 lg:col-3 right-pane">
            <div className="right-pane-item">
              <Friends
                selectedFriendId={isFriendProfile ? null : activeChatFriend?.id ?? null}
                onOpenChat={!isFriendProfile ? (friend) => setActiveChatFriend({ id: friend.id, name: friend.name }) : undefined}
                onFriendRemoved={!isFriendProfile ? (friendId) => {
                  if (activeChatFriend?.id === friendId) setActiveChatFriend(null)
                } : undefined}
                readOnly={isFriendProfile}
                ownerUserId={isFriendProfile && profileUser ? profileUser.id : null}
              />
            </div>
            {!isFriendProfile && (
              <div className="right-pane-item">
                <Chat activeFriend={activeChatFriend} />
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
