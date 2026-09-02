import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Header } from '../components/header'
import { Footer } from '../components/footer'
import { PersonalData } from '../components/personal_data'
import { PostFeed } from '../components/posts'
import { Friends } from '../components/friends'
import { Chat } from '../components/chat'
import { friendsAPI, type FriendProfile } from '../services/friendsAPI'

export function Profile() {
  const { friendId } = useParams()

 const [activeChatFriend, setActiveChatFriend] = useState<{
    id: number
    name: string
  } | null>(() => {
    const savedFriend = localStorage.getItem('activeChatFriend')

    if (!savedFriend) {
      return null
    }

    try {
      return JSON.parse(savedFriend)
    } catch {
      localStorage.removeItem('activeChatFriend')
      return null
    }
  })

  const [profileUser, setProfileUser] = useState<FriendProfile | null>(null)

  const isFriendProfile = Boolean(friendId)

  useEffect(() => {
    if (isFriendProfile) {
      return
    }

    const savedFriend = localStorage.getItem('activeChatFriend')

    if (!savedFriend) {
      return
    }

    try {
      setActiveChatFriend(JSON.parse(savedFriend))
    } catch {
      localStorage.removeItem('activeChatFriend')
    }
  }, [isFriendProfile])

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
    <div className="app-shell profile-layout">
      <Header />

      <main className="app-content">
        <h1 className="sr-only">Profile de Transcendence</h1>

        <div className="grid content-grid">

          <div className="col-12 lg:col-3 left-pane">
            <PersonalData profileUser={profileUser ?? undefined} readOnly={isFriendProfile}/>
          </div>

          <div className="col-12 lg:col-6 middle-pane">
            <PostFeed
              readOnly={isFriendProfile}
              userId={
                isFriendProfile && profileUser
                  ? profileUser.id
                  : undefined
              }
            />
          </div>

          <div className="col-12 lg:col-3 right-pane">

            <div className="right-pane-item">
              <Friends
                selectedFriendId={
                  isFriendProfile
                    ? null
                    : activeChatFriend?.id ?? null
                }
                onOpenChat={
                  !isFriendProfile
                    ? (friend) => {
                        const chatFriend = {
                          id: friend.id,
                          name: friend.name,
                        }

                        setActiveChatFriend(chatFriend)
                        localStorage.setItem(
                          'activeChatFriend',
                          JSON.stringify(chatFriend)
                        )
                      }
                    : undefined
                }
                onFriendRemoved={
                  !isFriendProfile
                    ? (removedFriendId) => {
                        if (activeChatFriend?.id === removedFriendId) {
                          setActiveChatFriend(null)
                          localStorage.removeItem('activeChatFriend')
                        }
                      }
                    : undefined
                }
                readOnly={isFriendProfile}
                ownerUserId={
                  isFriendProfile && profileUser
                    ? profileUser.id
                    : null
                }
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