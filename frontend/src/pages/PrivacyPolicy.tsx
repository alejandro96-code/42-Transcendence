import { Link } from 'react-router-dom'
import { Header } from '../components/header'
import { Footer } from '../components/footer'

export function PrivacyPolicy() {
  return (
    <div className='app-shell legal-layout'>
      <Header />

      <main className='legal-content'>
        <article className='legal-card'>
          <h1>Privacy Policy</h1>

          <p className='legal-updated'>
            Last updated: August 15, 2026
          </p>

          <section>
            <h2>1. Introduction</h2>
            <p>
              This Privacy Policy explains how Transcendence collects,
              uses and protects information when you use our application.
              Transcendence is a social web application developed as part
              of an educational project.
            </p>
          </section>

          <section>
            <h2>2. Information We Collect</h2>
            <p>
              Depending on how you use the application, we may store the
              following information:
            </p>

            <ul>
              <li>Username and display name.</li>
              <li>Email address.</li>
              <li>Password information in securely hashed form.</li>
              <li>Profile avatar.</li>
              <li>Profile description and profession.</li>
              <li>Posts and content submitted by you.</li>
              <li>Messages and friend relationships within the application.</li>
              <li>Information provided through 42 authentication.</li>
            </ul>
          </section>

          <section>
            <h2>3. Authentication with 42</h2>
            <p>
              Transcendence may allow you to authenticate using your 42
              account. When using this option, the application receives
              information provided by the 42 authentication service, such
              as your 42 identifier, username, email address and profile
              information.
            </p>

            <p>
              This information is used only to create and maintain your
              Transcendence account and provide the application's
              functionality.
            </p>
          </section>

          <section>
            <h2>4. How We Use Your Information</h2>
            <p>
              The information stored by Transcendence is used to:
            </p>

            <ul>
              <li>Create and manage your account.</li>
              <li>Authenticate you and maintain your session.</li>
              <li>Display your profile.</li>
              <li>Allow you to interact with other users.</li>
              <li>Display posts and other content you publish.</li>
              <li>Provide the application's social and communication features.</li>
              <li>Maintain the security and proper operation of the application.</li>
            </ul>
          </section>

          <section>
            <h2>5. User-Generated Content</h2>
            <p>
              Content that you voluntarily publish through Transcendence,
              including posts, profile information and messages, may be
              stored by the application in order to provide its features.
            </p>

            <p>
              You are responsible for the content you submit and should
              avoid publishing information that you do not want to share
              with other users.
            </p>
          </section>

          <section>
            <h2>6. Data Storage and Security</h2>
            <p>
              Account and application data is stored in the application's
              database. Passwords for accounts created with username and
              password authentication are stored using password hashing
              rather than as plain text.
            </p>

            <p>
              We take reasonable technical measures to protect stored
              information. However, no online service can guarantee
              absolute security.
            </p>
          </section>

          <section>
            <h2>7. Cookies and Sessions</h2>
            <p>
              Transcendence uses session information to keep users
              authenticated while they use the application. These
              sessions are necessary for features such as login,
              profile management, friends and messaging.
            </p>
          </section>

          <section>
            <h2>8. Data Sharing</h2>
            <p>
              We do not sell your personal information. Information may
              be processed by external authentication services when you
              explicitly choose to use them, such as the 42 authentication
              service.
            </p>
          </section>

          <section>
            <h2>9. Data Retention</h2>
            <p>
              Account and user-generated information may remain stored
              while your account is active and for as long as necessary
              to provide the application's functionality.
            </p>
          </section>

          <section>
            <h2>10. Your Rights</h2>
            <p>
              Depending on applicable data protection law, you may have
              rights concerning your personal information, including the
              right to access, correct or request deletion of your data.
            </p>
          </section>

          <section>
            <h2>11. Changes to This Policy</h2>
            <p>
              This Privacy Policy may be updated when the application's
              functionality or data practices change. The latest version
              will always be available through the application's Privacy
              Policy link.
            </p>
          </section>

          <section>
            <h2>12. Contact</h2>
            <p>
              If you have questions about this Privacy Policy or the
              handling of information within Transcendence, please
              contact the project administrators through the available
              project channels.
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