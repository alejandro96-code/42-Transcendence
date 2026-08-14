import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Header } from '../components/header'
import { Footer } from '../components/footer'
import { PersonalData } from '../components/personal_data'
import { PostFeed } from '../components/posts'
import { Friends } from '../components/friends'
import { Chat } from '../components/chat'
import { friendsAPI, type FriendProfile } from '../services/friendsAPI'
import { authAPI } from '../services/authAPI'
import type { User } from '../types/auth'

export function Perfil() {
  const { friendId } = useParams()

  const [activeChatFriend, setActiveChatFriend] = useState<{
    id: number
    name: string
  } | null>(null)

  const [profileUser, setProfileUser] = useState<FriendProfile | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  const isFriendProfile = Boolean(friendId)

  useEffect(() => {
    let mounted = true

    const loadCurrentUser = async () => {
      if (isFriendProfile) {
        return
      }

      const user = await authAPI.getCurrentUser()

      if (mounted) {
        setCurrentUser(user)
      }
    }

    void loadCurrentUser()

    return () => {
      mounted = false
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

const handleAvatarChange = async (avatarUrl: string): Promise<User> => {
  if (!currentUser) {
    throw new Error('No hay un usuario autenticado.')
  }

  const updatedUser = await authAPI.updateMyProfile({
    profession: currentUser.profession ?? '',
    description: currentUser.description ?? '',
    avatarUrl,
  })

  setCurrentUser(updatedUser)

  return updatedUser
}

  return (
    <div className="app-shell perfil-layout">
      <Header />

      <main className="app-content">
        <h1 className="sr-only">Perfil de Transcendence</h1>

        <div className="grid content-grid">

          {/* PERFIL */}
          <div className="col-12 lg:col-3 left-pane">
            <PersonalData
              profileUser={profileUser ?? undefined}
              readOnly={isFriendProfile}
              onAvatarChange={
                !isFriendProfile && currentUser
                  ? handleAvatarChange
                  : undefined
              }
            />
          </div>

          {/* PUBLICACIONES */}
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

          {/* AMIGOS + CHAT */}
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
                    ? (friend) =>
                        setActiveChatFriend({
                          id: friend.id,
                          name: friend.name,
                        })
                    : undefined
                }
                onFriendRemoved={
                  !isFriendProfile
                    ? (removedFriendId) => {
                        if (
                          activeChatFriend?.id === removedFriendId
                        ) {
                          setActiveChatFriend(null)
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