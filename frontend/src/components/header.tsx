import { useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { InputText } from 'primereact/inputtext'
import { Button } from 'primereact/button'
import { Dropdown } from 'primereact/dropdown'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { clearUser } from '../store/authSlice'
import { authAPI } from '../services/authAPI'
import { friendsAPI, type Friend } from '../services/friendsAPI'
import type { User } from '../types/auth'
import logo42 from '../img/42.png'

export function Header() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { t, i18n } = useTranslation()
  const location = useLocation()

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [friendResults, setFriendResults] = useState<Friend[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  const searchTimeout = useRef<number | null>(null)

  const isFriendProfile = /^\/perfil\/\d+$/.test(location.pathname)

  const { user } = useAppSelector((state) => state.auth)

  useEffect(() => {
    const loadCurrentUser = async () => {
      const loadedUser = await authAPI.getCurrentUser()
      setCurrentUser(loadedUser)
    }

    void loadCurrentUser()
  }, [])

  useEffect(() => {
    if (user) {
      setCurrentUser(user)
    }
  }, [user])

  useEffect(() => {
    return () => {
      if (searchTimeout.current) {
        window.clearTimeout(searchTimeout.current)
      }
    }
  }, [])

  useEffect(() => {
    if (searchTimeout.current) {
      window.clearTimeout(searchTimeout.current)
    }

    const query = searchValue.trim()

    if (!query) {
      setFriendResults([])
      setShowResults(false)
      return
    }

    searchTimeout.current = window.setTimeout(async () => {
      setIsSearching(true)

      try {
        const results = await friendsAPI.searchFriends(query)
        setFriendResults(results)
        setShowResults(true)
      } catch {
        setFriendResults([])
        setShowResults(false)
      } finally {
        setIsSearching(false)
      }
    }, 250)
  }, [searchValue])

  const handleOpenFriendProfile = (friendId: number) => {
    setShowResults(false)
    setSearchValue('')
    navigate(`/perfil/${friendId}`)
    setIsMenuOpen(false)
  }

  const handleOpenMyProfile = () => {
    navigate('/perfil')
    setIsMenuOpen(false)
  }

  const languageOptions = [
    { label: 'ES', value: 'es' },
    { label: 'EU', value: 'eu' },
    { label: 'EN', value: 'en' },
  ]

  const [selectedLanguage, setSelectedLanguage] = useState(
    i18n.language || 'es',
  )

  const handleLanguageChange = (e: { value: string }) => {
    const newLang = e.value
    setSelectedLanguage(newLang)
    i18n.changeLanguage(newLang)
  }

  const handleLogout = async () => {
    await authAPI.logout()
    dispatch(clearUser())
    navigate('/')
    setIsMenuOpen(false)
  }

  return (
    <div className='header-container'>
      <div className='header-bar'>
        <div className='header-nav'>
          <div className='header-brand'>
            <img
              src={logo42}
              alt='Logo de Transcendence'
              className='header-brand-logo'
            />
          </div>
        </div>

        <div className='header-mobile-controls'>
          <div className='header-mobile-language'>
            <Dropdown
              value={selectedLanguage}
              options={languageOptions}
              onChange={handleLanguageChange}
              className='p-inputtext-sm'
            />
          </div>

          {isFriendProfile && currentUser && (
            <button
              type='button'
              className='header-avatar-button'
              onClick={handleOpenMyProfile}
              title={currentUser.username}
            >
              <img
                src={currentUser.avatar_url || '/img/Not_image.png'}
                alt={`Avatar de ${currentUser.username}`}
                className='header-avatar'
              />
            </button>
          )}

          <Button
            type='button'
            className='header-menu-toggle p-button-text'
            icon='pi pi-bars'
            aria-label={t('header_menu_aria_label')}
            aria-expanded={isMenuOpen}
            aria-controls='header-mobile-menu'
            onClick={() => setIsMenuOpen((currentValue) => !currentValue)}
          />
        </div>

        <div className='header-actions'>
          <div className='header-languages-wrapper'>
            <Dropdown
              value={selectedLanguage}
              options={languageOptions}
              onChange={handleLanguageChange}
              className='p-inputtext-sm'
            />
          </div>

          {isFriendProfile && currentUser && (
            <button
              type='button'
              className='header-avatar-button'
              onClick={handleOpenMyProfile}
              title={currentUser.username}
            >
              <img
                src={currentUser.avatar_url || '/img/Not_image.png'}
                alt={`Avatar de ${currentUser.username}`}
                className='header-avatar'
              />
            </button>
          )}

          <div className='header-search-wrapper'>
            <label htmlFor='header-search' className='sr-only'>
              Buscar amigos
            </label>

            <InputText
              id='header-search'
              placeholder='Buscar amigos...'
              className='header-search p-inputtext-sm'
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              onFocus={() => searchValue.trim() && setShowResults(true)}
              onBlur={() =>
                window.setTimeout(() => setShowResults(false), 150)
              }
            />

            {showResults && (
              <div className='header-search-results'>
                {isSearching ? (
                  <div className='header-search-result header-search-result--empty'>
                    Buscando...
                  </div>
                ) : friendResults.length > 0 ? (
                  friendResults.map((friend) => (
                    <button
                      key={friend.id}
                      type='button'
                      className='header-search-result'
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => handleOpenFriendProfile(friend.id)}
                    >
                      <span className='header-search-result__name'>
                        {friend.username}
                      </span>

                      {friend.full_name && (
                        <span className='header-search-result__meta'>
                          {friend.full_name}
                        </span>
                      )}
                    </button>
                  ))
                ) : (
                  <div className='header-search-result header-search-result--empty'>
                    No hay amigos que coincidan
                  </div>
                )}
              </div>
            )}
          </div>

          <Button
            type='button'
            severity='danger'
            className='header-logout p-inputtext-sm'
            outlined
            size='small'
            onClick={handleLogout}
          >
            {t('header_logout')}
          </Button>
        </div>

        <div
          id='header-mobile-menu'
          className={`header-mobile-menu ${isMenuOpen ? 'is-open' : ''}`}
        >
          <div className='header-search-wrapper header-search-wrapper--mobile'>
            <label htmlFor='header-search-mobile' className='sr-only'>
              Buscar amigos
            </label>

            <InputText
              id='header-search-mobile'
              placeholder='Buscar amigos...'
              className='header-search header-search--mobile p-inputtext-sm'
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              onFocus={() => searchValue.trim() && setShowResults(true)}
              onBlur={() =>
                window.setTimeout(() => setShowResults(false), 150)
              }
            />

            {showResults && (
              <div className='header-search-results header-search-results--mobile'>
                {isSearching ? (
                  <div className='header-search-result header-search-result--empty'>
                    Buscando...
                  </div>
                ) : friendResults.length > 0 ? (
                  friendResults.map((friend) => (
                    <button
                      key={friend.id}
                      type='button'
                      className='header-search-result'
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => handleOpenFriendProfile(friend.id)}
                    >
                      <span className='header-search-result__name'>
                        {friend.username}
                      </span>

                      {friend.full_name && (
                        <span className='header-search-result__meta'>
                          {friend.full_name}
                        </span>
                      )}
                    </button>
                  ))
                ) : (
                  <div className='header-search-result header-search-result--empty'>
                    No hay amigos que coincidan
                  </div>
                )}
              </div>
            )}
          </div>

          <Button
            type='button'
            severity='danger'
            className='header-logout header-logout--mobile p-inputtext-sm'
            outlined
            size='small'
            onClick={handleLogout}
          >
            {t('header_logout')}
          </Button>
        </div>
      </div>
    </div>
  )
}