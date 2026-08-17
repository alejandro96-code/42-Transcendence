import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export function Footer() {
  const { t } = useTranslation()

  return (
    <div className="footer-container">
      <div className="surface-card px-4 py-3 flex flex-column align-items-center gap-2">
        <small className="text-color-secondary">{t('footer_rights')}</small>
        <div className="flex align-items-center gap-3">
          <Link to="/privacy-policy" className="footer-legal-link">
            {t('footer_privacy_policy')}
          </Link>
          <span className="footer-legal-separator">|</span>
          <Link to="/terms-of-service" className="footer-legal-link">
            {t('footer_terms_of_service')}
          </Link>
        </div>
      </div>
    </div>
  )
}