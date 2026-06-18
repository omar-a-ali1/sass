/**
 * SMTP Email Strategy
 *
 * Sends emails via SMTP using nodemailer. Configured via environment
 * variables: EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS.
 *
 * Falls back to the ConsoleEmailStrategy if nodemailer is not installed
 * or SMTP is not configured, logging a warning instead of throwing.
 *
 * @module strategies/email/smtpEmail
 */

const env = require('../../config/environment');

class SmtpEmailStrategy
{
  constructor() {
    this._transporter = null;
    this._warned = false;
  }

  async _getTransporter() {
    if (this._transporter) return this._transporter;

    const host = env.email.smtpHost;
    const port = env.email.smtpPort;
    const user = env.email.smtpUser;
    const pass = env.email.smtpPass;

    if (!host || !port) {
      if (!this._warned) {
        console.warn('[SmtpEmailStrategy] SMTP not configured (EMAIL_HOST/EMAIL_PORT missing). Falling back to console log.');
        this._warned = true;
      }
      return null;
    }

    try {
      const nodemailer = require('nodemailer');
      this._transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: user && pass ? { user, pass } : undefined,
      });
      return this._transporter;
    } catch (err) {
      if (!this._warned) {
        console.warn('[SmtpEmailStrategy] nodemailer not available. Falling back to console log.');
        this._warned = true;
      }
      return null;
    }
  }

  async sendEmail({ to, subject, text, html }) {
    const transporter = await this._getTransporter();

    if (!transporter) {
      console.log('[SmtpEmailStrategy] (fallback) Would send email:', JSON.stringify({ to, subject, text }, null, 2));
      return { success: true, fallback: true };
    }

    const info = await transporter.sendMail({
      from: env.email.from,
      to,
      subject,
      text,
      html,
    });

    return { success: true, messageId: info.messageId };
  }
}

module.exports = SmtpEmailStrategy;
