import { Link } from 'react-router-dom'
import { Header } from '../components/header'
import { Footer } from '../components/footer'

export function TermsOfService() {
  return (
    <div className='app-shell legal-layout'>
      <Header />

      <main className='legal-content'>
        <article className='legal-card'>
          <h1>Terms of Service</h1>

          <p className='legal-updated'>
            Last updated: August 15, 2026
          </p>

          <section>
            <h2>1. Acceptance of the Terms</h2>
            <p>
              By accessing or using Transcendence, you agree to comply
              with these Terms of Service. If you do not agree with these
              terms, you should not use the application.
            </p>
          </section>

          <section>
            <h2>2. About Transcendence</h2>
            <p>
              Transcendence is a social web application developed as part
              of an educational project. It provides features including
              user accounts, profiles, posts, friendships and private
              messaging.
            </p>
          </section>

          <section>
            <h2>3. User Accounts</h2>
            <p>
              You are responsible for the information associated with
              your account and for keeping your authentication credentials
              secure.
            </p>

            <p>
              You must not impersonate another person or create an account
              using information intended to deceive other users.
            </p>
          </section>

          <section>
            <h2>4. Acceptable Use</h2>
            <p>
              You agree to use Transcendence responsibly and not to use
              the application to:
            </p>

            <ul>
              <li>Harass, threaten or abuse other users.</li>
              <li>Impersonate another person or organization.</li>
              <li>Publish illegal or harmful content.</li>
              <li>Distribute malicious software or attempt to compromise the application.</li>
              <li>Attempt to gain unauthorized access to another user's account.</li>
              <li>Abuse, overload or intentionally disrupt the service.</li>
              <li>Use the application for fraudulent or deceptive purposes.</li>
            </ul>
          </section>

          <section>
            <h2>5. User-Generated Content</h2>
            <p>
              You retain responsibility for the content you submit,
              including posts, profile information and messages.
            </p>

            <p>
              By submitting content to Transcendence, you grant the
              application the limited permission necessary to store,
              process and display that content as part of the application's
              features.
            </p>
          </section>

          <section>
            <h2>6. Prohibited Content</h2>
            <p>
              Content that is illegal, threatening, abusive, fraudulent,
              excessively offensive or intended to harm other users is
              not permitted.
            </p>

            <p>
              The application may restrict or remove content that violates
              these terms or interferes with the safe operation of the
              service.
            </p>
          </section>

          <section>
            <h2>7. 42 Authentication</h2>
            <p>
              If you choose to authenticate using 42, your use of that
              authentication method is also subject to the applicable
              terms and policies of the 42 platform.
            </p>
          </section>

          <section>
            <h2>8. Account Suspension</h2>
            <p>
              Access to an account may be restricted or suspended when
              necessary to protect the application, its users or its
              infrastructure, particularly in cases involving abuse,
              unauthorized access or violations of these Terms of Service.
            </p>
          </section>

          <section>
            <h2>9. Availability</h2>
            <p>
              Transcendence is an educational project and is provided on
              an as-is basis. Availability, functionality and features may
              change during development, and continuous availability cannot
              be guaranteed.
            </p>
          </section>

          <section>
            <h2>10. Security</h2>
            <p>
              You must not attempt to bypass security mechanisms, access
              restricted resources or interfere with the operation of the
              application.
            </p>
          </section>

          <section>
            <h2>11. Changes to These Terms</h2>
            <p>
              These Terms of Service may be updated when the application
              or its functionality changes. The latest version will be
              available through the Terms of Service link in the
              application.
            </p>
          </section>

          <section>
            <h2>12. Contact</h2>
            <p>
              Questions regarding these Terms of Service can be directed
              to the project administrators through the available project
              channels.
            </p>
          </section>

          <div className='legal-back-link'>
            <Link to='/'>Back to login</Link>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  )
}