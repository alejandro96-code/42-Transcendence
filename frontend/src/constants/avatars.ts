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
  },
  {
    id: 'senior-boy',
    name: 'Chico senior',
    url: '/img/avatar3.png',
  },
  {
    id: 'senior-girl',
    name: 'Chica senior',
    url: '/img/avatar4.png',
  },
  {
    id: 'admin',
    name: 'Administrador',
    url: '/img/avatar5.png',
  },
]