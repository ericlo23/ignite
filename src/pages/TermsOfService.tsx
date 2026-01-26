import { Link } from 'react-router-dom'
import { LEGAL_CONFIG } from '../config/legal'
import './LegalPage.css'

export function TermsOfService() {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <div className="legal-header">
          <div className="legal-logo">🔥 {LEGAL_CONFIG.appName}</div>
          <h1>Terms of Service</h1>
          <p className="legal-effective-date">Effective Date: {LEGAL_CONFIG.effectiveDate}</p>
        </div>

        <div className="legal-content">
          <section>
            <h2>1. Agreement to Terms</h2>
            <p>By accessing or using Ignite (the "Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these Terms, you may not access the Service.</p>
            <p>These Terms apply to all visitors, users, and others who access or use the Service.</p>
            <div className="legal-important-notice">
              <strong>Important:</strong> Please read these Terms carefully before using Ignite. By using the Service, you acknowledge that you have read, understood, and agree to be bound by these Terms.
            </div>
          </section>

          <section>
            <h2>2. Description of Service</h2>
            <p>Ignite is a Progressive Web Application (PWA) that enables users to capture and save their thoughts. The Service provides:</p>
            <ul>
              <li>Authentication through Google Sign-In</li>
              <li>Automatic saving of thoughts to your personal Google Drive</li>
              <li>Offline functionality with automatic synchronization</li>
              <li>Progressive Web App features for installation on devices</li>
            </ul>
            <p>All thought content is saved directly to a file named "ignite-thoughts.md" in your Google Drive account.</p>
          </section>

          <section>
            <h2>3. User Accounts and Authentication</h2>

            <h3>3.1 Google Account Requirement</h3>
            <p>To use Ignite, you must have a valid Google account and authorize our application to access your Google Drive. By signing in, you grant Ignite permission to:</p>
            <ul>
              <li>Access your basic profile information (name and email address)</li>
              <li>Create and modify files in your Google Drive</li>
              <li>Read and write to the "ignite-thoughts.md" file</li>
            </ul>

            <h3>3.2 Account Security</h3>
            <p>You are responsible for maintaining the security of your Google account. You agree to:</p>
            <ul>
              <li>Keep your account credentials confidential</li>
              <li>Notify us immediately of any unauthorized access</li>
              <li>Accept responsibility for all activities under your account</li>
            </ul>

            <h3>3.3 Revoking Access</h3>
            <p>You may revoke Ignite's access to your Google account at any time through your Google Account settings. Revoking access will prevent the Service from saving new thoughts but will not delete existing data from your Google Drive.</p>
          </section>

          <section>
            <h2>4. User Responsibilities and Acceptable Use</h2>

            <h3>4.1 Acceptable Use</h3>
            <p>You agree to use the Service only for lawful purposes and in accordance with these Terms. You agree NOT to:</p>
            <ul>
              <li>Use the Service in any way that violates applicable laws or regulations</li>
              <li>Impersonate or attempt to impersonate any person or entity</li>
              <li>Engage in any conduct that restricts or inhibits anyone's use of the Service</li>
              <li>Use the Service to transmit malicious code, viruses, or harmful data</li>
              <li>Attempt to gain unauthorized access to the Service or related systems</li>
              <li>Use automated systems or software to extract data from the Service</li>
              <li>Interfere with or disrupt the Service or servers connected to the Service</li>
            </ul>

            <h3>4.2 Content Responsibility</h3>
            <p>You are solely responsible for the content of your thoughts saved through the Service. You represent and warrant that:</p>
            <ul>
              <li>You own or have the necessary rights to the content you save</li>
              <li>Your content does not violate any third-party rights</li>
              <li>Your content complies with all applicable laws</li>
            </ul>
          </section>

          <section>
            <h2>5. Intellectual Property Rights</h2>

            <h3>5.1 Your Content</h3>
            <p>You retain all rights to the content you create and save through Ignite. We do not claim ownership of your thoughts, notes, or any content you generate using the Service.</p>

            <h3>5.2 Service Content</h3>
            <p>The Service itself, including its original content, features, and functionality, is owned by us and is protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.</p>

            <h3>5.3 Limited License</h3>
            <p>We grant you a limited, non-exclusive, non-transferable, revocable license to use the Service for your personal, non-commercial use, subject to these Terms.</p>
          </section>

          <section>
            <h2>6. Data Storage and Privacy</h2>
            <p>Your use of the Service is also governed by our Privacy Policy. Key points include:</p>
            <ul>
              <li>Your thought content is stored directly in your Google Drive</li>
              <li>We do not store your content on our servers</li>
              <li>Local data is stored on your device for offline functionality</li>
              <li>We implement security measures to protect your information</li>
            </ul>
            <p>For complete information about how we collect, use, and protect your data, please review our <Link to="/privacy-policy">Privacy Policy</Link>.</p>
          </section>

          <section>
            <h2>7. Service Availability and Modifications</h2>

            <h3>7.1 Service Availability</h3>
            <p>We strive to maintain high availability of the Service but do not guarantee that:</p>
            <ul>
              <li>The Service will be uninterrupted, secure, or error-free</li>
              <li>The Service will be available at all times</li>
              <li>Defects will be corrected immediately</li>
              <li>The Service will be compatible with all devices or browsers</li>
            </ul>

            <h3>7.2 Modifications to Service</h3>
            <p>We reserve the right to:</p>
            <ul>
              <li>Modify, suspend, or discontinue the Service at any time</li>
              <li>Change features or functionality</li>
              <li>Impose limits on certain features</li>
            </ul>
            <p>We will make reasonable efforts to notify users of significant changes, but we are not obligated to do so.</p>

            <h3>7.3 Third-Party Services</h3>
            <p>The Service depends on third-party services, particularly Google Drive and Google Sign-In. We are not responsible for:</p>
            <ul>
              <li>Changes to Google's services or APIs</li>
              <li>Google's service availability or performance</li>
              <li>Google's terms of service or privacy policies</li>
            </ul>
          </section>

          <section>
            <h2>8. Disclaimer of Warranties</h2>
            <p>THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:</p>
            <ul>
              <li>Warranties of merchantability</li>
              <li>Fitness for a particular purpose</li>
              <li>Non-infringement</li>
              <li>Title</li>
            </ul>
            <p>WE DO NOT WARRANT THAT:</p>
            <ul>
              <li>The Service will meet your requirements</li>
              <li>The Service will be uninterrupted, timely, secure, or error-free</li>
              <li>Results obtained from the Service will be accurate or reliable</li>
              <li>Any errors in the Service will be corrected</li>
            </ul>
            <p>YOUR USE OF THE SERVICE IS AT YOUR SOLE RISK. You understand and agree that you download or obtain content or services through the Service at your own discretion and risk.</p>
          </section>

          <section>
            <h2>9. Limitation of Liability</h2>
            <p>TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL WE, OUR DIRECTORS, EMPLOYEES, PARTNERS, AGENTS, SUPPLIERS, OR AFFILIATES BE LIABLE FOR ANY:</p>
            <ul>
              <li>INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES</li>
              <li>LOSS OF PROFITS, REVENUE, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES</li>
              <li>DAMAGES RESULTING FROM:
                <ul style={{ marginTop: '10px' }}>
                  <li>Your access to or use of (or inability to access or use) the Service</li>
                  <li>Any conduct or content of any third party on the Service</li>
                  <li>Unauthorized access, use, or alteration of your content</li>
                  <li>Loss or corruption of data</li>
                </ul>
              </li>
            </ul>
            <p>WHETHER BASED ON WARRANTY, CONTRACT, TORT (INCLUDING NEGLIGENCE), OR ANY OTHER LEGAL THEORY, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.</p>
          </section>

          <section>
            <h2>10. Indemnification</h2>
            <p>You agree to defend, indemnify, and hold harmless us and our affiliates, licensors, and service providers from and against any claims, liabilities, damages, judgments, awards, losses, costs, expenses, or fees (including reasonable attorneys' fees) arising out of or relating to:</p>
            <ul>
              <li>Your violation of these Terms</li>
              <li>Your use of the Service</li>
              <li>Your violation of any third-party rights</li>
              <li>Any content you submit through the Service</li>
              <li>Your violation of any applicable laws or regulations</li>
            </ul>
          </section>

          <section>
            <h2>11. Termination</h2>

            <h3>11.1 Termination by You</h3>
            <p>You may stop using the Service at any time by:</p>
            <ul>
              <li>Signing out of the application</li>
              <li>Revoking access through your Google Account settings</li>
              <li>Uninstalling the Progressive Web App from your device</li>
            </ul>

            <h3>11.2 Termination by Us</h3>
            <p>We may terminate or suspend your access to the Service immediately, without prior notice or liability, for any reason, including but not limited to:</p>
            <ul>
              <li>Breach of these Terms</li>
              <li>Fraudulent, abusive, or illegal activity</li>
              <li>Upon your request</li>
              <li>Discontinuation of the Service</li>
            </ul>

            <h3>11.3 Effect of Termination</h3>
            <p>Upon termination:</p>
            <ul>
              <li>Your right to use the Service will immediately cease</li>
              <li>Your data stored in Google Drive will remain under your control</li>
              <li>Local data on your device may be cleared</li>
              <li>Provisions of these Terms that by their nature should survive termination shall survive</li>
            </ul>
          </section>

          <section>
            <h2>12. Governing Law and Dispute Resolution</h2>

            <h3>12.1 Governing Law</h3>
            <p>These Terms shall be governed by and construed in accordance with the laws of {LEGAL_CONFIG.jurisdiction}, without regard to its conflict of law provisions.</p>

            <h3>12.2 Dispute Resolution</h3>
            <p>Any disputes arising out of or relating to these Terms or the Service shall be resolved through:</p>
            <ul>
              <li>Good faith negotiations between the parties</li>
              <li>Mediation, if negotiations fail</li>
              <li>Binding arbitration or litigation in {LEGAL_CONFIG.jurisdiction}, as applicable</li>
            </ul>

            <h3>12.3 Class Action Waiver</h3>
            <p>You agree that any dispute resolution proceedings will be conducted only on an individual basis and not in a class, consolidated, or representative action.</p>
          </section>

          <section>
            <h2>13. Changes to Terms</h2>
            <p>We reserve the right to modify or replace these Terms at any time at our sole discretion. If a revision is material, we will:</p>
            <ul>
              <li>Provide at least 30 days' notice prior to new terms taking effect</li>
              <li>Update the "Effective Date" at the top of these Terms</li>
              <li>Notify users through the Service or via email (if provided)</li>
            </ul>
            <p>By continuing to access or use the Service after revisions become effective, you agree to be bound by the revised Terms. If you do not agree to the new Terms, you must stop using the Service.</p>
          </section>

          <section>
            <h2>14. General Provisions</h2>

            <h3>14.1 Entire Agreement</h3>
            <p>These Terms, together with our Privacy Policy, constitute the entire agreement between you and us regarding the Service and supersede all prior agreements and understandings.</p>

            <h3>14.2 Severability</h3>
            <p>If any provision of these Terms is held to be invalid or unenforceable, the remaining provisions will continue in full force and effect.</p>

            <h3>14.3 Waiver</h3>
            <p>No waiver of any term of these Terms shall be deemed a further or continuing waiver of such term or any other term.</p>

            <h3>14.4 Assignment</h3>
            <p>You may not assign or transfer these Terms or your rights hereunder without our prior written consent. We may assign these Terms without restriction.</p>

            <h3>14.5 Force Majeure</h3>
            <p>We shall not be liable for any failure or delay in performance due to circumstances beyond our reasonable control, including but not limited to acts of God, war, terrorism, riots, natural disasters, or failures of third-party services.</p>

            <h3>14.6 Electronic Communications</h3>
            <p>By using the Service, you consent to receive electronic communications from us. You agree that all agreements, notices, disclosures, and other communications that we provide electronically satisfy any legal requirement that such communications be in writing.</p>
          </section>

          <section>
            <h2>15. Contact Information</h2>
            <div className="legal-contact-info">
              <p>If you have any questions about these Terms, please contact us:</p>
              <ul>
                <li><strong>Application:</strong> {LEGAL_CONFIG.appName}</li>
                <li><strong>Email:</strong> {LEGAL_CONFIG.contactEmail}</li>
                <li><strong>Website:</strong> {LEGAL_CONFIG.websiteUrl}</li>
              </ul>
              <p style={{ marginTop: '15px' }}>For support inquiries, please include your Google account email (for verification purposes) and a detailed description of your question or issue.</p>
            </div>
          </section>

          <section>
            <h2>16. Acknowledgment</h2>
            <p>BY USING THE SERVICE, YOU ACKNOWLEDGE THAT YOU HAVE READ THESE TERMS OF SERVICE AND AGREE TO BE BOUND BY THEM.</p>
            <p>If you do not agree to these Terms, you must not access or use the Service.</p>
          </section>

          <Link to="/" className="legal-back-link">← Back to {LEGAL_CONFIG.appName}</Link>
        </div>
      </div>
    </div>
  )
}
