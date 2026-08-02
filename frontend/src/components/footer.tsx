export function Footer() {
  return (
    <div className="footer-container">
      <div className="surface-card px-4 py-3 flex flex-column align-items-center gap-1">
        <small className="text-color-secondary">
          © 2026 Transcendence. Todos los derechos reservados.
        </small>
        <small className="text-color-secondary">
          Distribuido bajo la licencia{' '}
          <a
            href="https://opensource.org/licenses/MIT"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary no-underline hover:underline"
          >
            MIT License
          </a>
          . Este software se proporciona "tal cual", sin garantía de ningún tipo.
        </small>
      </div>
    </div>
  )
}