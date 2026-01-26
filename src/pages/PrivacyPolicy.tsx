import { Link } from 'react-router-dom'
import { LEGAL_CONFIG } from '../config/legal'
import './LegalPage.css'

export function PrivacyPolicy() {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <div className="legal-header">
          <div className="legal-logo">🔥 {LEGAL_CONFIG.appName}</div>
          <h1>Privacy Policy</h1>
          <p className="legal-effective-date">Effective Date: {LEGAL_CONFIG.effectiveDate}</p>
        </div>

        <div className="legal-content">
          <section>
            <h2>1. Introduction</h2>
            <p>Welcome to Ignite ("we," "our," or "us"). We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our application.</p>
            <p>By using Ignite, you agree to the collection and use of information in accordance with this policy.</p>
          </section>

          <section>
            <h2>2. Information We Collect</h2>

            <h3>2.1 Information You Provide</h3>
            <p>When you use Ignite, we may collect the following information:</p>
            <ul>
              <li><strong>Google Account Information:</strong> When you sign in with Google, we receive your basic profile information including your name, email address, and profile picture as authorized by you.</li>
              <li><strong>Thought Content:</strong> The thoughts and notes you create and save within the application.</li>
            </ul>

            <h3>2.2 Automatically Collected Information</h3>
            <ul>
              <li><strong>Usage Data:</strong> Information about how you access and use the application, including your interactions with features.</li>
              <li><strong>Device Information:</strong> Information about your device, including browser type, operating system, and device identifiers.</li>
              <li><strong>Local Storage:</strong> Data stored locally on your device for offline functionality and sync queue management.</li>
            </ul>
          </section>

          <section>
            <h2>3. How We Use Your Information</h2>
            <p>We use the collected information for the following purposes:</p>
            <ul>
              <li><strong>Service Delivery:</strong> To provide, maintain, and improve Ignite's core functionality, including saving your thoughts to Google Drive.</li>
              <li><strong>Authentication:</strong> To verify your identity and manage your access to the application.</li>
              <li><strong>Offline Functionality:</strong> To enable offline access and sync your thoughts when you reconnect to the internet.</li>
              <li><strong>User Support:</strong> To respond to your inquiries and provide customer support.</li>
              <li><strong>Security:</strong> To protect against, identify, and prevent fraud and other illegal activities.</li>
              <li><strong>Improvements:</strong> To understand how users interact with our service and improve the user experience.</li>
            </ul>
          </section>

          <section>
            <h2>4. Data Storage and Security</h2>

            <h3>4.1 Google Drive Storage</h3>
            <p>Your thoughts are stored directly in your personal Google Drive account in a file named "ignite-thoughts.md". We do not store your thought content on our servers. You maintain full control and ownership of this data through your Google Drive account.</p>

            <h3>4.2 Local Storage</h3>
            <p>For offline functionality, we store data locally on your device using IndexedDB. This includes:</p>
            <ul>
              <li>Pending thoughts awaiting sync to Google Drive</li>
              <li>Application state and preferences</li>
            </ul>

            <h3>4.3 Security Measures</h3>
            <p>We implement appropriate technical and organizational security measures to protect your information, including:</p>
            <ul>
              <li>Encryption of data in transit using HTTPS</li>
              <li>OAuth 2.0 authentication through Google</li>
              <li>Secure token management</li>
              <li>Regular security assessments</li>
            </ul>
            <p>However, no method of transmission over the internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your information, we cannot guarantee absolute security.</p>
          </section>

          <section>
            <h2>5. Third-Party Services</h2>
            <p>Ignite integrates with the following third-party services:</p>

            <h3>5.1 Google Services</h3>
            <ul>
              <li><strong>Google Sign-In:</strong> For authentication and authorization</li>
              <li><strong>Google Drive API:</strong> For storing your thought content</li>
            </ul>
            <p>These services are governed by Google's Privacy Policy, which can be found at <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">https://policies.google.com/privacy</a></p>

            <p style={{ marginTop: '15px' }}><strong>Permissions We Request:</strong></p>
            <ul>
              <li>Access to create and modify files in your Google Drive</li>
              <li>Access to your basic profile information (name and email)</li>
            </ul>
            <p>We only request the minimum permissions necessary to provide our service. You can revoke these permissions at any time through your Google Account settings.</p>
          </section>

          <section>
            <h2>6. Data Retention and Deletion</h2>
            <p>We retain your information only for as long as necessary to provide you with our service and as described in this Privacy Policy. Specifically:</p>
            <ul>
              <li><strong>Thought Content:</strong> Stored in your Google Drive and controlled by you. We do not retain copies on our servers.</li>
              <li><strong>Local Data:</strong> Stored on your device until you clear your browser data or uninstall the application.</li>
              <li><strong>Authentication Tokens:</strong> Stored temporarily and cleared when you sign out or revoke access.</li>
            </ul>

            <h3>Deleting Your Data</h3>
            <p>You can delete your data at any time:</p>
            <ul>
              <li>Sign out from Ignite to clear local authentication data</li>
              <li>Clear your browser's local storage and cache</li>
              <li>Delete the "ignite-thoughts.md" file from your Google Drive</li>
              <li>Revoke Ignite's access from your Google Account settings</li>
            </ul>
          </section>

          <section>
            <h2>7. Your Rights and Choices</h2>
            <p>You have the following rights regarding your personal information:</p>
            <ul>
              <li><strong>Access:</strong> You can access your thought content directly through Google Drive.</li>
              <li><strong>Correction:</strong> You can edit or correct your thoughts within the application.</li>
              <li><strong>Deletion:</strong> You can delete your thoughts and revoke application access at any time.</li>
              <li><strong>Data Portability:</strong> Your data is stored in markdown format, making it easy to export and use with other applications.</li>
              <li><strong>Withdrawal of Consent:</strong> You can withdraw consent for data processing by signing out and revoking access permissions.</li>
            </ul>
          </section>

          <section>
            <h2>8. Children's Privacy</h2>
            <p>Ignite is not intended for use by children under the age of 13. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us, and we will take steps to delete such information.</p>
          </section>

          <section>
            <h2>9. International Data Transfers</h2>
            <p>Your information, including personal data, may be transferred to and maintained on computers located outside of your state, province, country, or other governmental jurisdiction where data protection laws may differ. Your consent to this Privacy Policy followed by your submission of such information represents your agreement to that transfer.</p>
          </section>

          <section>
            <h2>10. Do Not Track Signals</h2>
            <p>We do not track users across third-party websites. However, some third-party sites may keep track of your browsing activities. If you are visiting such sites, your browser may allow you to set the DNT signal so that third parties know you do not want to be tracked.</p>
          </section>

          <section>
            <h2>11. Changes to This Privacy Policy</h2>
            <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Effective Date" at the top of this policy.</p>
            <p>You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.</p>
          </section>

          <section>
            <h2>12. Contact Us</h2>
            <div className="legal-contact-info">
              <p>If you have any questions about this Privacy Policy, please contact us:</p>
              <ul>
                <li><strong>Application:</strong> {LEGAL_CONFIG.appName}</li>
                <li><strong>Email:</strong> {LEGAL_CONFIG.contactEmail}</li>
                <li><strong>Website:</strong> {LEGAL_CONFIG.websiteUrl}</li>
              </ul>
            </div>
          </section>

          <section>
            <h2>13. Your California Privacy Rights</h2>
            <p>If you are a California resident, you have specific rights regarding access to your personal information under the California Consumer Privacy Act (CCPA). This includes:</p>
            <ul>
              <li>The right to know what personal information is collected</li>
              <li>The right to know whether your personal information is sold or disclosed</li>
              <li>The right to say no to the sale of personal information</li>
              <li>The right to access your personal information</li>
              <li>The right to equal service and price</li>
            </ul>
            <p><strong>Note:</strong> We do not sell your personal information to third parties.</p>
          </section>

          <section>
            <h2>14. GDPR Compliance (European Users)</h2>
            <p>If you are located in the European Economic Area (EEA), you have certain data protection rights under the General Data Protection Regulation (GDPR), including:</p>
            <ul>
              <li>The right to access, update, or delete your information</li>
              <li>The right of rectification</li>
              <li>The right to object to processing</li>
              <li>The right of restriction</li>
              <li>The right to data portability</li>
              <li>The right to withdraw consent</li>
            </ul>
            <p>Our legal basis for processing your personal data includes:</p>
            <ul>
              <li><strong>Consent:</strong> You have given explicit consent for processing your personal information</li>
              <li><strong>Contract:</strong> Processing is necessary for the performance of our service</li>
              <li><strong>Legitimate Interests:</strong> Processing is necessary for our legitimate interests (improving our service, security)</li>
            </ul>
          </section>

          <Link to="/" className="legal-back-link">← Back to {LEGAL_CONFIG.appName}</Link>
        </div>
      </div>
    </div>
  )
}
