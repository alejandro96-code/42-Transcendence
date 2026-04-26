export interface FriendRequestPayload {
  nickname: string
}

const FRIEND_REQUEST_EVENT = 'friend-request:add'

export const emitFriendRequest = (payload: FriendRequestPayload): void => {
  window.dispatchEvent(new CustomEvent<FriendRequestPayload>(FRIEND_REQUEST_EVENT, { detail: payload }))
}

export const subscribeFriendRequests = (
  listener: (payload: FriendRequestPayload) => void,
): (() => void) => {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<FriendRequestPayload>
    listener(customEvent.detail)
  }

  window.addEventListener(FRIEND_REQUEST_EVENT, handler)

  return () => {
    window.removeEventListener(FRIEND_REQUEST_EVENT, handler)
  }
}
