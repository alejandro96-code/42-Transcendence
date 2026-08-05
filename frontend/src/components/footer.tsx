import { useI18n } from '../hooks/useI18n'


export function Footer() {
  const { t } = useI18n()
  return (
    <div className="footer-container">
      <div className="surface-card px-4 py-3 flex flex-column align-items-center gap-1">
        <small className="text-color-secondary">
        {t('footer_rights')}
        </small>
        <small className="text-color-secondary">
          {t('footer_license_prefix')}{' '}
          <a
            href="https://opensource.org/licenses/MIT"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary no-underline hover:underline"
          >
            {t('footer_license_name')}
          </a>
          {t('footer_license_disclaimer')}
        </small>
      </div>
    </div>
  )
}