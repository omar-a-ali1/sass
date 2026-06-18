/**
 * Console Email Strategy
 *
 * Logs email content to the console. Suitable for development
 * and testing. In production, swap with a real SMTP provider.
 *
 * @module strategies/email/consoleEmail
 */

class ConsoleEmailStrategy {
  /**
   * Send an email by logging it to the console
   *
   * @param {Object}   options
   * @param {string}   options.to      - Recipient email address
   * @param {string}   options.subject - Email subject line
   * @param {string}   options.text    - Plain-text body
   * @param {string}   [options.html]  - HTML body (optional)
   * @returns {Promise<Object>} Result indicating the email was logged
   */
  async sendEmail({ to, subject, text, html }) {
    const logData = {
      to,
      subject,
      text,
      html: html ? '[HTML content omitted from console log]' : undefined,
      timestamp: new Date().toISOString(),
    };
    console.log('[ConsoleEmailStrategy] Sending email:', JSON.stringify(logData, null, 2));
    return { success: true, logged: true };
  }
}

module.exports = ConsoleEmailStrategy;
