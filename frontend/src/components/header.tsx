
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { InputText } from 'primereact/inputtext'
import { Button } from 'primereact/button'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { clearUser } from '../store/authSlice'
import { authAPI } from '../services/authAPI'
import { friendsAPI, type Friend } from '../services/friendsAPI'
import { LanguageSwitcher } from './LanguageSwitcher'
import { Avatar } from './ui/Avatar'
import logo42 from '../../public/img/42.png'

export function Header() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const location = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [friendResults, setFriendResults] = useState<Friend[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchTimeout = useRef<number | null>(null)
  const isFriendProfile = /^\/profile\/\d+$/.test(location.pathname)
  const { user } = useAppSelector((state) => state.auth)

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
      searchTimeout.current = window.setTimeout(() => {
        setFriendResults([])
        setShowResults(false)
      }, 0)
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

    return () => {
      if (searchTimeout.current) {
        window.clearTimeout(searchTimeout.current)
      }
    }
  }, [searchValue])

  const handleOpenFriendProfile = (friendId: number) => {
    setShowResults(false)
    setSearchValue('')
    navigate(`/profile/${friendId}`)
    setIsMenuOpen(false)
  }

  const handleOpenMyProfile = () => {
    navigate('/profile')
    setIsMenuOpen(false)
  }

  const handleLogout = async () => {
    dispatch(clearUser())
    navigate('/')
    setIsMenuOpen(false)
    await authAPI.logout()
  }

  return (
    <header className="header-container">
      <div className="header-bar">
        <nav className="header-nav" aria-label={t('header_nav_aria_label')}>
          <div className="header-brand">
            <Link to="/profile" className="header-brand">
              <img
                src={logo42}
                alt={t('header_logo_alt')}
                className="header-brand-logo"
              />
            </Link>
          </div>
        </nav>

        <div className="header-mobile-controls">
          <div className="header-mobile-language">
            <LanguageSwitcher
              inputId="language-select-mobile"
              name="language-mobile"
            />
          </div>

          {isFriendProfile && user && (
            <button
              type="button"
              className="header-avatar-button"
              onClick={handleOpenMyProfile}
              title={user.username}
            >
              <Avatar
                src={user.avatar_url}
                name={user.username}
                size="sm"
                className="header-avatar"
              />
            </button>
          )}

          <Button
            type="button"
            className="header-menu-toggle p-button-text"
            icon="pi pi-bars"
            aria-label={t('header_menu_aria_label')}
            aria-expanded={isMenuOpen}
            aria-controls="header-mobile-menu"
            onClick={() => setIsMenuOpen((currentValue) => !currentValue)}
          />
        </div>

        <div className="header-actions">
          <div className="header-languages-wrapper">
            <LanguageSwitcher inputId="language-select-normal" name="language" />
          </div>

          {isFriendProfile && user && (
            <button
              type="button"
              className="header-avatar-button"
              onClick={handleOpenMyProfile}
              title={user.username}
            >
              <Avatar
                src={user.avatar_url}
                name={user.username}
                size="sm"
                className="header-avatar"
              />
            </button>
          )}

          <div className="header-search-wrapper">
            <label htmlFor="header-search" className="sr-only">
              {t('header_search_aria_label')}
            </label>

            <InputText
              id="header-search"
              placeholder={t('header_search_friends_placeholder')}
              className="header-search p-inputtext-sm"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              onFocus={() => {
                if (searchValue.trim()) {
                  setShowResults(true)
                }
              }}
              onBlur={() =>
                window.setTimeout(() => setShowResults(false), 150)
              }
            />

            {showResults && (
              <div className="header-search-results">
                {isSearching ? (
                  <div className="header-search-result header-search-result--empty">
                    {t('header_search_loading')}
                  </div>
                ) : friendResults.length > 0 ? (
                  friendResults.map((friend) => (
                    <button
                      key={friend.id}
                      type="button"
                      className="header-search-result"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => handleOpenFriendProfile(friend.id)}
                    >
                      <span className="header-search-result__name">
                        {friend.username}
                      </span>

                      {friend.full_name && (
                        <span className="header-search-result__meta">
                          {friend.full_name}
                        </span>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="header-search-result header-search-result--empty">
                    {t('header_search_no_match')}
                  </div>
                )}
              </div>
            )}
          </div>

          <Button
            type="button"
            severity="danger"
            className="header-logout p-inputtext-sm"
            outlined
            size="small"
            onClick={handleLogout}
          >
            {t('header_logout')}
          </Button>
        </div>

        <div
          id="header-mobile-menu"
          className={`header-mobile-menu ${isMenuOpen ? 'is-open' : ''}`}
        >
          <div className="header-search-wrapper header-search-wrapper--mobile">
            <label htmlFor="header-search-mobile" className="sr-only">
              {t('header_search_aria_label')}
            </label>

            <InputText
              id="header-search-mobile"
              placeholder={t('header_search_friends_placeholder')}
              className="header-search header-search--mobile p-inputtext-sm"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              onFocus={() => {
                if (searchValue.trim()) {
                  setShowResults(true)
                }
              }}
              onBlur={() =>
                window.setTimeout(() => setShowResults(false), 150)
              }
            />

            {showResults && (
              <div className="header-search-results header-search-results--mobile">
                {isSearching ? (
                  <div className="header-search-result header-search-result--empty">
                    {t('header_search_loading')}
                  </div>
                ) : friendResults.length > 0 ? (
                  friendResults.map((friend) => (
                    <button
                      key={friend.id}
                      type="button"
                      className="header-search-result"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => handleOpenFriendProfile(friend.id)}
                    >
                      <span className="header-search-result__name">
                        {friend.username}
                      </span>

                      {friend.full_name && (
                        <span className="header-search-result__meta">
                          {friend.full_name}
                        </span>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="header-search-result header-search-result--empty">
                    {t('header_search_no_match')}
                  </div>
                )}
              </div>
            )}
          </div>

          <Button
            type="button"
            severity="danger"
            className="header-logout header-logout--mobile p-inputtext-sm"
            outlined
            size="small"
            onClick={handleLogout}
          >
            {t('header_logout')}
          </Button>
        </div>
      </div>
    </header>
  )
}