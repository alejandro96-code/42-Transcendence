import { Link } from 'react-router-dom'
import { useI18n } from '../hooks/useI18n'

export function Footer() {
  const { t } = useI18n();

  return (
    <div className="footer-container">
      <div className="surface-card px-4 py-3 flex flex-column align-items-center gap-2">
        <small className="text-color-secondary">{t('footer_rights')}</small>
        <div className="flex align-items-center gap-3">
          <Link to="/privacy-policy" className="text-primary no-underline hover:underline">Privacy Policy</Link>
          <span className="text-color-secondary">|</span>
          <Link to="/terms-of-service" className="text-primary no-underline hover:underline">Terms of Service</Link>
        </div>
      </div>
    </div>
  )
}