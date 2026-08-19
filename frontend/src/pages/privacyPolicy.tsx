import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Header } from '../components/header'
import { Footer } from '../components/footer'

export function PrivacyPolicy() {
  const { t } = useTranslation()

  return (
    <div className='app-shell legal-layout'>
      <Header />

      <main className='legal-content'>
        <article className='legal-card'>
          <h1>{t('privacy_title')}</h1>

          <p className='legal-updated'>
            {t('privacy_updated')}
          </p>

          <section>
            <h2>{t('privacy_s1_title')}</h2>
            <p>{t('privacy_s1_p1')}</p>
          </section>

          <section>
            <h2>{t('privacy_s2_title')}</h2>
            <p>{t('privacy_s2_p1')}</p>

            <ul>
              <li>{t('privacy_s2_item1')}</li>
              <li>{t('privacy_s2_item2')}</li>
              <li>{t('privacy_s2_item3')}</li>
              <li>{t('privacy_s2_item4')}</li>
              <li>{t('privacy_s2_item5')}</li>
              <li>{t('privacy_s2_item6')}</li>
              <li>{t('privacy_s2_item7')}</li>
              <li>{t('privacy_s2_item8')}</li>
            </ul>
          </section>

          <section>
            <h2>{t('privacy_s3_title')}</h2>
            <p>{t('privacy_s3_p1')}</p>
            <p>{t('privacy_s3_p2')}</p>
          </section>

          <section>
            <h2>{t('privacy_s4_title')}</h2>
            <p>{t('privacy_s4_p1')}</p>

            <ul>
              <li>{t('privacy_s4_item1')}</li>
              <li>{t('privacy_s4_item2')}</li>
              <li>{t('privacy_s4_item3')}</li>
              <li>{t('privacy_s4_item4')}</li>
              <li>{t('privacy_s4_item5')}</li>
              <li>{t('privacy_s4_item6')}</li>
              <li>{t('privacy_s4_item7')}</li>
            </ul>
          </section>

          <section>
            <h2>{t('privacy_s5_title')}</h2>
            <p>{t('privacy_s5_p1')}</p>
            <p>{t('privacy_s5_p2')}</p>
          </section>

          <section>
            <h2>{t('privacy_s6_title')}</h2>
            <p>{t('privacy_s6_p1')}</p>
            <p>{t('privacy_s6_p2')}</p>
          </section>

          <section>
            <h2>{t('privacy_s7_title')}</h2>
            <p>{t('privacy_s7_p1')}</p>
          </section>

          <section>
            <h2>{t('privacy_s8_title')}</h2>
            <p>{t('privacy_s8_p1')}</p>
          </section>

          <section>
            <h2>{t('privacy_s9_title')}</h2>
            <p>{t('privacy_s9_p1')}</p>
          </section>

          <section>
            <h2>{t('privacy_s10_title')}</h2>
            <p>{t('privacy_s10_p1')}</p>
          </section>

          <section>
            <h2>{t('privacy_s11_title')}</h2>
            <p>{t('privacy_s11_p1')}</p>
          </section>

          <section>
            <h2>{t('privacy_s12_title')}</h2>
            <p>{t('privacy_s12_p1')}</p>
          </section>

          <div className='legal-back-link'>
            <Link to='/'>{t('privacy_back_link')}</Link>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  )
}