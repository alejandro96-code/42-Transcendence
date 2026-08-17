export interface AvailableAvatar {
  id: string
  name: string
  url: string
}

export const availableAvatars: AvailableAvatar[] = [
  {
    id: 'boy',
    name: 'Chico',
    url: '/img/avatar1.png',
  },
  {
    id: 'girl',
    name: 'Chica',
    url: '/img/avatar2.png',
  }
]