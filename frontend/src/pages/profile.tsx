import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Header } from '../components/header'
import { Footer } from '../components/footer'
import { PersonalData } from '../components/personal_data'
import { PostFeed } from '../components/posts'
import { Friends } from '../components/friends'
import { Chat } from '../components/chat'
import {friendsAPI,type FriendProfile,} from '../services/friendsAPI'
import { useAppSelector } from '../store/hooks'

function readStoredChatFriend(): { id: number; name: string } | null {
  const savedFriend = localStorage.getItem('activeChatFriend')

  if (!savedFriend) {
    return null
  }

  try {
    const parsed = JSON.parse(savedFriend)

    if (
      parsed &&
      typeof parsed === 'object' &&
      typeof parsed.id === 'number' &&
      typeof parsed.name === 'string'
    ) {
      return parsed
    }
  } catch {
    // Fall through to clear the corrupted entry below.
  }

  localStorage.removeItem('activeChatFriend')
  return null
}

export function Profile() {
  const { t } = useTranslation()
  const { friendId } = useParams()
  const currentUser = useAppSelector((state) => state.auth.user)
  const [activeChatFriend, setActiveChatFriend] = useState<{
    id: number
    name: string
  } | null>(readStoredChatFriend)

  const [profileUser, setProfileUser] = useState<FriendProfile | null>(null)

  const isFriendProfile = Boolean(friendId)

  const safeActiveChatFriend =
    currentUser && activeChatFriend?.id === currentUser.id
      ? null
      : activeChatFriend

  useEffect(() => {
    if (currentUser && activeChatFriend?.id === currentUser.id) {
      localStorage.removeItem('activeChatFriend')
    }
  }, [currentUser, activeChatFriend])

  useEffect(() => {
    let mounted = true

    const loadProfile = async () => {
      if (!friendId) {
        if (mounted) {
          setProfileUser(null)
        }
        return
      }

      try {
        const result = await friendsAPI.getFriendProfile(Number(friendId),)
        if (mounted) {setProfileUser(result)}
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
  }, [friendId])

  return (
    <div className="app-shell profile-layout">
      <Header />

      <main className="app-content">
        <h1 className="sr-only">
          {t('profile_page_title')}
        </h1>

        <div className="grid content-grid">
          <div className="col-12 lg:col-3 left-pane">
            <PersonalData
              profileUser={
                profileUser ?? undefined
              }
              readOnly={isFriendProfile}
            />
          </div>

          <div className="col-12 lg:col-6 middle-pane">
            <PostFeed
              readOnly={isFriendProfile}
              userId={
                isFriendProfile &&
                profileUser
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
                    : safeActiveChatFriend?.id ?? null
                }
                onOpenChat={
                  !isFriendProfile
                    ? (friend) => {
                        const chatFriend = {
                          id: friend.id,
                          name: friend.name,
                        }

                        setActiveChatFriend(
                          chatFriend,
                        )

                        localStorage.setItem(
                          'activeChatFriend',
                          JSON.stringify(
                            chatFriend,
                          ),
                        )
                      }
                    : undefined
                }
                onFriendRemoved={
                  !isFriendProfile
                    ? (removedFriendId) => {
                        if (
                          safeActiveChatFriend?.id ===
                          removedFriendId
                        ) {
                          setActiveChatFriend(null)
                          localStorage.removeItem(
                            'activeChatFriend',
                          )
                        }
                      }
                    : undefined
                }
                readOnly={isFriendProfile}
                ownerUserId={
                  isFriendProfile &&
                  profileUser
                    ? profileUser.id
                    : null
                }
              />
            </div>

            {!isFriendProfile && (
              <div className="right-pane-item">
                <Chat
                  activeFriend={safeActiveChatFriend}
                />
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}