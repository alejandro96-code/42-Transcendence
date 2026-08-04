import { useEffect, useMemo, useState } from 'react'
import { Avatar } from 'primereact/avatar'
import { Button } from 'primereact/button'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { setUser } from '../store/authSlice'
import { authAPI } from '../services/authAPI'

interface ProfileUser {
  full_name: string
  username: string
  email: string
  avatar_url?: string | null
  profession?: string | null
  description?: string | null
}

interface PersonalDataProps {
  profileUser?: ProfileUser
  readOnly?: boolean
}

export function PersonalData({ profileUser, readOnly = false }: PersonalDataProps) {
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((state) => state.auth)
  const activeUser = profileUser ?? user

  const [avatarLoadError, setAvatarLoadError] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [form, setForm] = useState({
    profession: '',
    description: '',
  })

  useEffect(() => {
    if (!activeUser) {
      return
    }

    setAvatarLoadError(false)
    setForm({
      profession: activeUser.profession ?? '',
      description: activeUser.description ?? '',
    })
  }, [activeUser?.avatar_url, activeUser?.profession, activeUser?.description])

  const hasValidAvatar = useMemo(
    () => Boolean(activeUser?.avatar_url?.trim()) && !avatarLoadError,
    [activeUser?.avatar_url, avatarLoadError],
  )

  if (!activeUser) {
    return null
  }

  const handleChange = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleEditClick = () => {
    setErrorMessage('')
    setIsEditing(true)
  }

  const handleCancel = () => {
    setForm({
      profession: activeUser.profession ?? '',
      description: activeUser.description ?? '',
    })
    setErrorMessage('')
    setIsEditing(false)
  }

  const handleSave = async () => {
    setIsSaving(true)
    setErrorMessage('')

    try {
      const updatedUser = await authAPI.updateMyProfile({
        profession: form.profession.trim(),
        description: form.description.trim(),
      })

      dispatch(setUser(updatedUser))
      setIsEditing(false)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo guardar el perfil.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className='personal_data-container'>
      <div className='surface-card border-round-sm p-4'>
        <div className='profile-header'>
          <div className='profile-img'>
            {hasValidAvatar ? (
              <img
                src={activeUser.avatar_url ?? ''}
                alt={`Foto de perfil de ${activeUser.full_name || activeUser.username}`}
                style={{ width: '140px', height: '140px', borderRadius: '50%', objectFit: 'cover' }}
                onError={() => setAvatarLoadError(true)}
              />
            ) : (
              <Avatar
                icon='pi pi-user'
                size='xlarge'
                shape='circle'
                style={{ width: '140px', height: '140px', fontSize: '3rem', backgroundColor: '#2196F3', color: 'white' }}
              />
            )}
          </div>

          <div className='text-center'>
            <h2 className='full-name m-1'>{activeUser.full_name}</h2>
            <h3 className='user-name m-1'>{activeUser.username}</h3>
            <h3 className='user-email m-1'>{activeUser.email}</h3>
          </div>
        </div>

        <div className='profile-details'>
          <section className='profile-header-section'>
            <div className='profile-details-title'>
              <label className='profile-title text-sm' htmlFor='profession'>Profesión</label>
              {isEditing && !readOnly ? (
                <InputText
                  id='profession'
                  className='profile-input w-full'
                  placeholder='Indica tu profesión...'
                  value={form.profession}
                  onChange={(e) => handleChange('profession', e.target.value)}
                  maxLength={80}
                />
              ) : (
                <p className='profile-value'>{activeUser.profession?.trim() || 'Sin profesión indicada'}</p>
              )}
            </div>

            <div className='profile-details-free-text'>
              <label className='profile-free-text text-sm' htmlFor='about'>Descripción</label>
              {isEditing && !readOnly ? (
                <InputTextarea
                  className='profile-input-textarea w-full'
                  id='about'
                  placeholder='Descríbete en unas pocas líneas...'
                  value={form.description}
                  onChange={(e) => handleChange('description', e.target.value.slice(0, 200))}
                  rows={6}
                  maxLength={200}
                />
              ) : (
                <p className='profile-value profile-description'>
                  {activeUser.description?.trim() || 'Sin descripción todavía'}
                </p>
              )}
            </div>

            {!readOnly && (
              <div className='profile-actions'>
                {!isEditing ? (
                  <Button
                    label='Editar perfil'
                    icon='pi pi-pencil'
                    className='p-button-sm'
                    onClick={handleEditClick}
                  />
                ) : (
                  <div className='profile-actions__group'>
                    <Button
                      label='Guardar cambios'
                      icon='pi pi-check'
                      className='p-button-sm'
                      loading={isSaving}
                      onClick={handleSave}
                    />
                    <Button
                      label='Cancelar'
                      icon='pi pi-times'
                      className='p-button-sm p-button-secondary'
                      onClick={handleCancel}
                      disabled={isSaving}
                    />
                  </div>
                )}
              </div>
            )}

            {errorMessage && <p className='profile-error'>{errorMessage}</p>}
          </section>
        </div>
      </div>
    </div>
  )
}