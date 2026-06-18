/**
 * Stub Email Strategy (SMTP Placeholder)
 *
 * Placeholder for a production email provider (SendGrid, SES, etc.).
 * Throws when called — replace with a real implementation before
 * enabling forgot-password in production.
 *
 * @module strategies/email/stubEmail
 */

class StubEmailStrategy {
  /**
   * Send an email — not implemented
   *
   * @param {Object}   options
   * @param {string}   options.to      - Recipient email address
   * @param {string}   options.subject - Email subject line
   * @param {string}   options.text    - Plain-text body
   * @param {string}   [options.html]  - HTML body
   * @returns {Promise<never>}
   */
  async sendEmail({ to, subject, text, html }) {
    throw new Error(
      `[StubEmailStrategy] No email provider configured. ` +
      `Would have sent email to ${to} with subject "${subject}".`
    );
  }
}

module.exports = StubEmailStrategy;
