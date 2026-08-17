import { useEffect, useMemo, useState } from 'react'
import { Avatar } from 'primereact/avatar'
import { Button } from 'primereact/button'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { setUser } from '../store/authSlice'
import { authAPI } from '../services/authAPI'
import type { User } from '../types/auth'
import { availableAvatars } from '../hooks/avatars'

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
  onAvatarChange?: (avatarUrl: string) => User | Promise<User>
}

export function PersonalData({
  profileUser,
  readOnly = false,
  onAvatarChange,
}: PersonalDataProps) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((state) => state.auth)
  const activeUser = profileUser ?? user
  const [showAvatarSelector, setShowAvatarSelector] = useState(false)
  const [avatarLoadError, setAvatarLoadError] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isChangingAvatar, setIsChangingAvatar] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const [form, setForm] = useState({
    profession: '',
    description: '',
  })

  const canChangeAvatar =
    !readOnly &&
    !profileUser &&
    Boolean(user) &&
    !user?.is_intra_user &&
    Boolean(onAvatarChange) &&
    isEditing

  useEffect(() => {
    if (!activeUser) {
      return
    }

    setAvatarLoadError(false)

    setForm({
      profession: activeUser.profession ?? '',
      description: activeUser.description ?? '',
    })
  }, [
    activeUser?.avatar_url,
    activeUser?.profession,
    activeUser?.description,
  ])

  const hasValidAvatar = useMemo(
    () =>
      Boolean(activeUser?.avatar_url?.trim()) &&
      !avatarLoadError,
    [activeUser?.avatar_url, avatarLoadError],
  )

  if (!activeUser) {
    return null
  }

  const handleChange = <K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K],
  ) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleEditClick = () => {
    setErrorMessage('')
    setIsEditing(true)
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
      setShowAvatarSelector(false)
      setIsEditing(false)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : t('personal_data_save_error'),
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleAvatarSelect = async (avatarUrl: string) => {
    if (!canChangeAvatar || !onAvatarChange) {
      return
    }

    if (avatarUrl === activeUser.avatar_url) {
      setShowAvatarSelector(false)
      return
    }

    setIsChangingAvatar(true)
    setErrorMessage('')

    try {
      const updatedUser = await onAvatarChange(avatarUrl)

      if (updatedUser) {
        dispatch(setUser(updatedUser))
      }

      setAvatarLoadError(false)
      setShowAvatarSelector(false)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : t('personal_data_avatar_error'),
      )
    } finally {
      setIsChangingAvatar(false)
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
              alt={t('personal_data_avatar_alt', {
                name: activeUser.full_name || activeUser.username,
              })}
              style={{
                width: '140px',
                height: '140px',
                borderRadius: '50%',
                objectFit: 'cover',
              }}
              onError={() => setAvatarLoadError(true)}
            />
          ) : (
            <Avatar
              icon='pi pi-user'
              size='xlarge'
              shape='circle'
              style={{
                width: '140px',
                height: '140px',
                fontSize: '3rem',
                backgroundColor: '#2196F3',
                color: 'white',
              }}
            />
          )}
          {canChangeAvatar && (
          <div className='profile-avatar-selector'>

            {!showAvatarSelector ? (
              <Button
                type='button'
                icon='pi pi-upload'
                className='p-button-sm'
                onClick={() => setShowAvatarSelector(true)}
              />
            ) : (
              <>
                <div className='profile-avatar-selector-header'>
                  <Button
                    type='button'
                    icon='pi pi-times'
                    className='p-button-text p-button-sm'
                    onClick={() => setShowAvatarSelector(false)}
                    disabled={isChangingAvatar}
                    aria-label={t('personal_data_close_avatar_selector')}
                  />
                </div>

                <div className='profile-avatar-options'>
                  {availableAvatars.map((avatar) => (
                    <button
                      key={avatar.id}
                      type='button'
                      className={`profile-avatar-option ${
                        activeUser.avatar_url === avatar.url
                          ? 'profile-avatar-option--selected'
                          : ''
                      }`}
                      onClick={() =>
                        void handleAvatarSelect(avatar.url)
                      }
                      disabled={isChangingAvatar}
                      title={avatar.name}
                    >
                      <img
                        src={avatar.url}
                        alt={avatar.name}
                      />
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
        </div>

          <div className='text-center'>
            <h2 className='full-name m-1'>
              {activeUser.full_name}
            </h2>

            <h3 className='user-name m-1'>
              {activeUser.username}
            </h3>

            <h3 className='user-email m-1'>
              {activeUser.email}
            </h3>
          </div>
        </div>

        

        {/* DATOS DEL PERFIL */}
        <div className='profile-details'>
          <section className='profile-header-section'>

            <div className='profile-details-title'>
              <label
                className='profile-title text-sm'
                htmlFor='profession'
              >
                {t('personal_data_headline_label')}
              </label>

              {isEditing && !readOnly ? (
                <InputText
                  id='profession'
                  className='profile-input w-full'
                  placeholder={t('personal_data_headline_placeholder')}
                  value={form.profession}
                  onChange={(e) =>
                    handleChange(
                      'profession',
                      e.target.value,
                    )
                  }
                  maxLength={80}
                />
              ) : (
                <p className='profile-value'>
                  {activeUser.profession?.trim() ||
                    t('personal_data_no_profession')}
                </p>
              )}
            </div>

            <div className='profile-details-free-text'>
              <label
                className='profile-free-text text-sm'
                htmlFor='about'
              >
                {t('personal_data_about_label')}
              </label>

              {isEditing && !readOnly ? (
                <InputTextarea
                  className='profile-input-textarea w-full'
                  id='about'
                  placeholder={t('personal_data_about_placeholder')}
                  value={form.description}
                  onChange={(e) =>
                    handleChange(
                      'description',
                      e.target.value.slice(0, 200),
                    )
                  }
                  rows={6}
                  maxLength={200}
                />
              ) : (
                <p className='profile-value profile-description'>
                  {activeUser.description?.trim() ||
                    t('personal_data_no_description')}
                </p>
              )}
            </div>

            {/* BOTONES DEL PERFIL */}
            {!readOnly && (
              <div className='profile-actions'>
                {!isEditing ? (
                  <Button
                    label={t('personal_data_edit_profile')}
                    icon='pi pi-pencil'
                    className='p-button-sm'
                    onClick={handleEditClick}
                  />
                ) : (
                  <div className='profile-actions__group'>

                    <Button
                      label={t('personal_data_save_changes')}
                      icon='pi pi-check'
                      className='p-button-sm'
                      loading={isSaving}
                      onClick={handleSave}
                    />

                  </div>
                )}
              </div>
            )}

            {errorMessage && (
              <p className='profile-error'>
                {errorMessage}
              </p>
            )}

          </section>
        </div>
      </div>
    </div>
  )
}