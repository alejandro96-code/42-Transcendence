import { useState } from 'react'
import { Avatar } from 'primereact/avatar'
import { Button } from 'primereact/button'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import { useAppSelector } from '../store/hooks'

interface ProfileUser {
  full_name: string
  username: string
  email: string
  avatar_url?: string | null
}

interface ProfileDetails {
  headline: string
  about: string
}

interface PersonalDataProps {
  profileUser?: ProfileUser
  profileDetails?: ProfileDetails
  readOnly?: boolean
}
function PersonalData({ profileUser, readOnly = false }: PersonalDataProps) {
  const { user } = useAppSelector((state) => state.auth)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [localProfileDetails, setLocalProfileDetails] = useState({
    headline: 'Front-end enjoyer',
    about: 'Me gusta competir, aprender cosas nuevas y construir experiencias que se sientan fluidas.',
  })

  const activeUser = profileUser ?? user

  if (!activeUser) {
    return null
  }

  // Obtener iniciales del usuario
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleFieldChange = <K extends keyof typeof localProfileDetails>(
    key: K,
    value: (typeof localProfileDetails)[K],
  ) => {
    setLocalProfileDetails((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  return (
    <div className='personal_data-container'>

      <div className="surface-card border-round-sm p-4">
        
        <div className='profile-header'>
          <div className='profile-img'>
            {activeUser.avatar_url ? (
            <img
              src={activeUser.avatar_url}
              alt={`Foto de perfil de ${activeUser.full_name || activeUser.username}`}
              style={{ width: '140px', height: '140px', borderRadius: '50%', objectFit: 'cover' }}
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
            ) : (
            <Avatar
              label={getInitials(activeUser.full_name || activeUser.username)}
              size="xlarge"
              shape="circle"
              style={{ width: '140px', height: '140px', fontSize: '3rem', backgroundColor: '#2196F3', color: 'white' }}
            />
            )}
          </div>
          
          <div className="text-center">
            <h2 className="full-name m-1">{activeUser.full_name}</h2>
            <h3 className="user-name m-1">{activeUser.username}</h3>
            <h3 className="user-email m-1">{activeUser.email}</h3>
          </div>
        </div>

        <div className="profile-details">
          <section className="profile-header-section">
            <div className="profile-details-title">
              <label className="profile-title text-sm">Titular</label>
              <InputText
                className="profile-input w-full"
                placeholder="Profesion"
                onChange={(e) => handleFieldChange('headline', e.target.value)}
              />
            </div>
            <div className="profile-details-free-text">
              <label className="profile-free-text text-sm" htmlFor="about">Texto libre</label>
              <InputTextarea
                className="profile-input-textarea w-full"
                id="about"
                placeholder="Describete en 6 lineas"
                onChange={(e) => handleFieldChange('about', e.target.value.slice(0, 140))}
                rows={6}
                maxLength={140}
              />
            </div>
            <div className="profile-button">
              <Button
                className="p-button-sm p-button-outlined profile-details__edit"
                onClick={() => setIsEditOpen(true)}
              > Editar datos
              </Button>
            </div>
          </section>   
        </div>
      </div>
    </div>
  )
}

export default PersonalData
