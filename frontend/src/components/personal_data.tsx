import { useEffect, useState } from 'react'
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
  const [avatarLoadError, setAvatarLoadError] = useState(false)
  const [localProfileDetails, setLocalProfileDetails] = useState({
    headline: 'Front-end enjoyer',
    about: 'Me gusta competir, aprender cosas nuevas y construir experiencias que se sientan fluidas.',
  })

  const activeUser = profileUser ?? user

  if (!activeUser) {
    return null
  }

  useEffect(() => {
    setAvatarLoadError(false)
  }, [activeUser.avatar_url])

  const hasValidAvatar = Boolean(activeUser.avatar_url?.trim()) && !avatarLoadError

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
            {hasValidAvatar ? (
            <img
              src={activeUser.avatar_url}
              alt={`Foto de perfil de ${activeUser.full_name || activeUser.username}`}
              style={{ width: '140px', height: '140px', borderRadius: '50%', objectFit: 'cover' }}
              onError={() => setAvatarLoadError(true)}
            />
            ) : (
            <Avatar
              icon="pi pi-user"
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
              <label className="profile-title text-sm">Profesión</label>
              <InputText
                className="profile-input w-full"
                placeholder="Indica tu profesion..."
                onChange={(e) => handleFieldChange('headline', e.target.value)}
              />
            </div>
            <div className="profile-details-free-text">
              <label className="profile-free-text text-sm" htmlFor="about">Descripción</label>
              <InputTextarea
                className="profile-input-textarea w-full"
                id="about"
                placeholder="Describete en unas pocas lineas..."
                onChange={(e) => handleFieldChange('about', e.target.value.slice(0, 140))}
                rows={6}
                maxLength={140}
              />
            </div>
          </section>   
        </div>
      </div>
    </div>
  )
}

export default PersonalData
