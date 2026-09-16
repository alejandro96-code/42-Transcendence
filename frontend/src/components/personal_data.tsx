import { useRef, useState } from 'react'
import { Button } from 'primereact/button'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { setUser } from '../store/authSlice'
import { authAPI } from '../services/authAPI'
import { translateApiError } from '../services/apiError'
import { Avatar } from './ui/Avatar'
import { IconButton } from './ui/IconButton'
import { LoadingSpinner } from './ui/LoadingSpinner'

const MAX_AVATAR_SIZE = 2 * 1024 * 1024
const ACCEPTED_AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/webp']

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

export function PersonalData({
  profileUser,
  readOnly = false,
}: PersonalDataProps) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((state) => state.auth)
  const activeUser = profileUser ?? user
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const [form, setForm] = useState(() => ({
    profession: activeUser?.profession ?? '',
    description: activeUser?.description ?? '',
  }))

  if (!activeUser) {
    return null
  }

  const canChangeAvatar =
    !readOnly &&
    !profileUser &&
    Boolean(user) &&
    !user?.is_intra_user &&
    isEditing

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
    setForm({
      profession: activeUser.profession ?? '',
      description: activeUser.description ?? '',
    })
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
      setForm({
        profession: updatedUser.profession ?? '',
        description: updatedUser.description ?? '',
      })
      setIsEditing(false)
    } catch (error) {
      setErrorMessage(translateApiError(t, error, 'personal_data_save_error'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleAvatarChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    setErrorMessage('')

    if (!ACCEPTED_AVATAR_TYPES.includes(file.type)) {
      setErrorMessage(t('api_error_auth_avatar_invalid_format'))

      if (avatarInputRef.current) {
        avatarInputRef.current.value = ''
      }

      return
    }

    if (file.size > MAX_AVATAR_SIZE) {
      setErrorMessage(t('api_error_auth_avatar_too_large', { maxSizeMB: 2 }))

      if (avatarInputRef.current) {
        avatarInputRef.current.value = ''
      }

      return
    }

    setIsUploadingAvatar(true)

    try {
      const updatedUser = await authAPI.uploadAvatar(file)

      dispatch(setUser(updatedUser))
    } catch (error) {
      setErrorMessage(translateApiError(t, error, 'personal_data_avatar_error'))
    } finally {
      setIsUploadingAvatar(false)

      if (avatarInputRef.current) {
        avatarInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="personal_data-container">
      <div className="surface-card border-round-sm p-4">
        <div className="profile-header">
          <div className="profile-img">
            <Avatar
              src={activeUser.avatar_url}
              name={activeUser.full_name || activeUser.username}
              size="xl"
            />

            {canChangeAvatar && (
              <div className="profile-avatar-selector">
                <input
                  id="avatar-upload"
                  name="avatar"
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(event) =>
                    void handleAvatarChange(event)
                  }
                />

                {isUploadingAvatar ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <IconButton
                    icon="pi pi-upload"
                    variant="solid"
                    ariaLabel={t('personal_data_change_avatar')}
                    onClick={() => avatarInputRef.current?.click()}
                  />
                )}
              </div>
            )}
          </div>

          <div className="text-center">
            <h2 className="full-name m-1">
              {activeUser.full_name}
            </h2>

            <h3 className="user-name m-1">
              {activeUser.username}
            </h3>

            <h3 className="user-email m-1">
              {activeUser.email}
            </h3>
          </div>
        </div>

        <div className="profile-details">
          <section className="profile-header-section">
            <div className="profile-details-title">
              {isEditing && !readOnly ? (
                <>
                  <label
                    className="profile-title text-sm"
                    htmlFor="profession"
                  >
                    {t('personal_data_headline_label')}
                  </label>

                  <InputText
                    id="profession"
                    className="profile-input w-full"
                    placeholder={t(
                      'personal_data_headline_placeholder',
                    )}
                    value={form.profession}
                    onChange={(e) =>
                      handleChange(
                        'profession',
                        e.target.value,
                      )
                    }
                    maxLength={80}
                  />
                </>
              ) : (
                <>
                  <span className="profile-title text-sm">
                    {t('personal_data_headline_label')}
                  </span>

                  <p className="profile-value">
                    {activeUser.profession?.trim() ||
                      t('personal_data_no_profession')}
                  </p>
                </>
              )}
            </div>

            <div className="profile-details-free-text">
              {isEditing && !readOnly ? (
                <>
                  <label
                    className="profile-free-text text-sm"
                    htmlFor="about"
                  >
                    {t('personal_data_about_label')}
                  </label>

                  <InputTextarea
                    className="profile-input-textarea w-full"
                    id="about"
                    placeholder={t(
                      'personal_data_about_placeholder',
                    )}
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
                </>
              ) : (
                <>
                  <span className="profile-free-text text-sm">
                    {t('personal_data_about_label')}
                  </span>

                  <p className="profile-value profile-description">
                    {activeUser.description?.trim() ||
                      t('personal_data_no_description')}
                  </p>
                </>
              )}
            </div>

            {!readOnly && (
              <div className="profile-actions">
                {!isEditing ? (
                  <Button
                    label={t(
                      'personal_data_edit_profile',
                    )}
                    icon="pi pi-pencil"
                    className="p-button-sm"
                    onClick={handleEditClick}
                  />
                ) : (
                  <div className="profile-actions__group">
                    <Button
                      label={t(
                        'personal_data_save_changes',
                      )}
                      className="p-button-sm"
                      loading={isSaving}
                      onClick={() => void handleSave()}
                    />
                  </div>
                )}
              </div>
            )}

            {errorMessage && (
              <p className="profile-error">
                {errorMessage}
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}