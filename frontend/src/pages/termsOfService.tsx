import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Header } from '../components/header'
import { Footer } from '../components/footer'
import { PageHeading } from '../components/ui/PageHeading'
import { SkipLink } from '../components/ui/SkipLink'

export function TermsOfService() {
  const { t } = useTranslation()

  return (
    <div className='app-shell legal-layout'>
      <SkipLink targetId="main-content" label={t('skip_to_content')} />
      <Header />

      <main className='legal-content' id="main-content" tabIndex={-1}>
        <article className='legal-card'>
          <PageHeading
            title={t('terms_title')}
            subtitle={t('terms_updated')}
            subtitleClassName='legal-updated'
          />

          <section>
            <h2>{t('terms_s1_title')}</h2>
            <p>{t('terms_s1_p1')}</p>
          </section>

          <section>
            <h2>{t('terms_s2_title')}</h2>
            <p>{t('terms_s2_p1')}</p>
          </section>

          <section>
            <h2>{t('terms_s3_title')}</h2>
            <p>{t('terms_s3_p1')}</p>
            <p>{t('terms_s3_p2')}</p>
          </section>

          <section>
            <h2>{t('terms_s4_title')}</h2>
            <p>{t('terms_s4_p1')}</p>

            <ul>
              <li>{t('terms_s4_item1')}</li>
              <li>{t('terms_s4_item2')}</li>
              <li>{t('terms_s4_item3')}</li>
              <li>{t('terms_s4_item4')}</li>
              <li>{t('terms_s4_item5')}</li>
              <li>{t('terms_s4_item6')}</li>
              <li>{t('terms_s4_item7')}</li>
            </ul>
          </section>

          <section>
            <h2>{t('terms_s5_title')}</h2>
            <p>{t('terms_s5_p1')}</p>
            <p>{t('terms_s5_p2')}</p>
          </section>

          <section>
            <h2>{t('terms_s6_title')}</h2>
            <p>{t('terms_s6_p1')}</p>
            <p>{t('terms_s6_p2')}</p>
          </section>

          <section>
            <h2>{t('terms_s7_title')}</h2>
            <p>{t('terms_s7_p1')}</p>
          </section>

          <section>
            <h2>{t('terms_s8_title')}</h2>
            <p>{t('terms_s8_p1')}</p>
          </section>

          <section>
            <h2>{t('terms_s9_title')}</h2>
            <p>{t('terms_s9_p1')}</p>
          </section>

          <section>
            <h2>{t('terms_s10_title')}</h2>
            <p>{t('terms_s10_p1')}</p>
          </section>

          <section>
            <h2>{t('terms_s11_title')}</h2>
            <p>{t('terms_s11_p1')}</p>
          </section>

          <section>
            <h2>{t('terms_s12_title')}</h2>
            <p>{t('terms_s12_p1')}</p>
          </section>

          <div className='legal-back-link'>
            <Link to='/'>{t('terms_back_link')}</Link>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  )
}