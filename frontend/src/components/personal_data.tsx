import { useState } from 'react'
import { Divider } from 'primereact/divider'
import { Avatar } from 'primereact/avatar'
import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import { Chips } from 'primereact/chips'
import { useAppSelector } from '../store/hooks'

interface ProfileUser {
  full_name: string
  username: string
  email: string
  avatar_url?: string | null
}

interface ProfileDetails {
  headline: string
  interests: string[]
  about: string
}

interface PersonalDataProps {
  profileUser?: ProfileUser
  profileDetails?: ProfileDetails
  readOnly?: boolean
}
function PersonalData({ profileUser, profileDetails, readOnly = false }: PersonalDataProps) {
  const { user } = useAppSelector((state) => state.auth)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [localProfileDetails, setLocalProfileDetails] = useState({
    headline: 'Front-end enjoyer',
    interests: ['Pong', 'eSports', 'UI', 'musica'],
    about: 'Me gusta competir, aprender cosas nuevas y construir experiencias que se sientan fluidas.',
  })

  const activeUser = profileUser ?? user
  const activeDetails = profileDetails ?? localProfileDetails

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

  const sanitizeInterests = (value: string[]) => {
    const trimmed = value
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => item.slice(0, 6))

    return trimmed.slice(0, 5)
  }

  const handleSave = () => {
    setIsEditOpen(false)
  }

  return (
    <div className='personal_data-container'>
      <div className="surface-card border-round-sm p-4 flex flex-column align-items-center gap-3">
        {activeUser.avatar_url ? (
          <img
            src={activeUser.avatar_url}
            alt="Foto de perfil"
            style={{ width: '140px', height: '140px', borderRadius: '50%', objectFit: 'cover' }}
            onError={(e) => {
              // Si la imagen falla al cargar, mostrar avatar con iniciales
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
        <div className="text-center">
          <p className="font-bold text-xl m-0">{activeUser.full_name}</p>
          <p className="text-color-secondary m-0">@{activeUser.username}</p>
        </div>
        <Divider className="my-1" />
        <div className="w-full flex flex-column gap-2">
          <div className="flex align-items-center gap-2">
            <i className="pi pi-user text-color-secondary" />
            <span className="text-sm">{activeUser.full_name}</span>
          </div>
          <div className="flex align-items-center gap-2">
            <i className="pi pi-at text-color-secondary" />
            <span className="text-sm">{activeUser.username}</span>
          </div>
          <div className="flex align-items-center gap-2">
            <i className="pi pi-envelope text-color-secondary" />
            <span className="text-sm">{activeUser.email}</span>
          </div>
        </div>
        <Divider className="my-2" />
        <div className="w-full profile-details">
          <div className="profile-details__header">
            <div>
              <p className="text-sm m-0 text-color-secondary">Sobre mi</p>
              <p className="text-base m-0">{activeDetails.headline}</p>
            </div>
            {!readOnly && (
              <Button
                label="Editar datos"
                icon="pi pi-pencil"
                className="p-button-sm p-button-outlined profile-details__edit"
                onClick={() => setIsEditOpen(true)}
              />
            )}
          </div>
          <div className="profile-details__grid">
            <div className="profile-details__item profile-details__item--wide">
              <span className="text-xs text-color-secondary">Intereses</span>
              <div className="profile-details__tags">
                {activeDetails.interests.length > 0 ? (
                  activeDetails.interests.map((interest) => (
                    <span key={interest} className="profile-details__tag">{interest}</span>
                  ))
                ) : (
                  <span className="text-sm">Sin intereses</span>
                )}
              </div>
            </div>
            <div className="profile-details__item profile-details__item--wide profile-details__item--about">
              <span className="text-xs text-color-secondary">Texto libre</span>
              <div className="text-sm profile-details__about">{activeDetails.about}</div>
            </div>
          </div>
        </div>
      </div>
      {!readOnly && (
        <Dialog
          header="Editar datos personales"
          visible={isEditOpen}
          onHide={() => setIsEditOpen(false)}
          className="profile-details__dialog"
          modal
        >
          <div className="profile-details__form">
            <label className="text-sm" htmlFor="headline">Titular</label>
            <InputText
              id="headline"
              value={localProfileDetails.headline}
              onChange={(e) => handleFieldChange('headline', e.target.value)}
            />
            <label className="text-sm" htmlFor="interests">Intereses</label>
            <Chips
              id="interests"
              value={localProfileDetails.interests}
              onChange={(e) => handleFieldChange('interests', sanitizeInterests(e.value ?? []))}
              className="profile-details__chips"
            />
            <label className="text-sm" htmlFor="about">Texto libre</label>
            <InputTextarea
              id="about"
              value={localProfileDetails.about}
              onChange={(e) => handleFieldChange('about', e.target.value.slice(0, 140))}
              rows={6}
              maxLength={140}
            />
            <small className="profile-details__counter">
              {localProfileDetails.about.length}/140
            </small>
            <div className="profile-details__actions">
              <Button
                label="Cancelar"
                className="p-button-text"
                onClick={() => setIsEditOpen(false)}
              />
              <Button
                label="Guardar"
                icon="pi pi-check"
                onClick={handleSave}
              />
            </div>
          </div>
        </Dialog>
      )}
    </div>
  )
}

export default PersonalData
