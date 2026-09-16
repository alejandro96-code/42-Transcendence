import { Dropdown } from 'primereact/dropdown'
import { useTranslation } from 'react-i18next'

const LANGUAGE_OPTIONS = [
  { label: 'ES', value: 'es' },
  { label: 'EU', value: 'eu' },
  { label: 'EN', value: 'en' },
]

interface LanguageSwitcherProps {
  inputId: string
  name?: string
  className?: string
}

export function LanguageSwitcher({
  inputId,
  name,
  className = 'p-inputtext-sm',
}: LanguageSwitcherProps) {
  const { t, i18n } = useTranslation()

  const currentLanguage =
    LANGUAGE_OPTIONS.find((option) => i18n.language?.startsWith(option.value))
      ?.value || 'es'

  const handleLanguageChange = (e: { value: string }) => {
    void i18n.changeLanguage(e.value)
  }

  return (
    <Dropdown
      inputId={inputId}
      name={name}
      value={currentLanguage}
      options={LANGUAGE_OPTIONS}
      onChange={handleLanguageChange}
      className={className}
      aria-label={t('language_selector')}
    />
  )
}
