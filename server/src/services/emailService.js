import nodemailer from 'nodemailer';
import config from '../config/index.js';
import logger from '../config/logger.js';

let transporter = null;

/**
 * Lazily create a Nodemailer transporter. In development, if no SMTP creds are
 * provided, we create an Ethereal test account automatically and log the URL.
 */
const getTransporter = async () => {
  if (transporter) return transporter;

  if (config.email.user && config.email.pass) {
    transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.port === 465,
      auth: { user: config.email.user, pass: config.email.pass },
    });
    return transporter;
  }

  // Fallback: Ethereal test account for development
  try {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    logger.warn('⚠️ Using Ethereal test email account. Preview links logged on send.');
    config.email.user = testAccount.user;
    config.email.pass = testAccount.pass;
    return transporter;
  } catch (err) {
    logger.error('Email transporter init failed:', err.message);
    return null;
  }
};

const sendEmail = async ({ to, subject, html, text }) => {
  const t = await getTransporter();
  if (!t) {
    logger.warn(`Email not sent (no transporter). Would send to ${to}: ${subject}`);
    return null;
  }

  const info = await t.sendMail({
    from: config.email.from,
    to,
    subject,
    text,
    html,
  });

  if (!config.isProd) {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      logger.info(`📧 Email preview: ${previewUrl}`);
    }
  }
  return info;
};

export const sendVerificationEmail = async (to, url) =>
  sendEmail({
    to,
    subject: 'Verify your FoodHub account',
    text: `Verify your email: ${url}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto">
        <h2 style="color:#f97316">Welcome to FoodHub 🍔</h2>
        <p>Please verify your email address to activate your account.</p>
        <p><a href="${url}" style="background:#f97316;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Verify Email</a></p>
        <p style="color:#6b7280;font-size:12px">If you didn't create an account, you can ignore this email.</p>
      </div>`,
  });

export const sendPasswordResetEmail = async (to, url) =>
  sendEmail({
    to,
    subject: 'Reset your FoodHub password',
    text: `Reset password: ${url}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto">
        <h2 style="color:#f97316">Reset your password</h2>
        <p>Click the button below to set a new password. This link expires in 15 minutes.</p>
        <p><a href="${url}" style="background:#f97316;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Reset Password</a></p>
        <p style="color:#6b7280;font-size:12px">If you didn't request a reset, ignore this email.</p>
      </div>`,
  });

export const sendOrderConfirmationEmail = async (to, order) =>
  sendEmail({
    to,
    subject: `Order confirmed #${order.orderNumber}`,
    text: `Your order ${order.orderNumber} has been confirmed.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto">
        <h2 style="color:#f97316">Order Confirmed ✅</h2>
        <p>Thanks for your order! Your order number is <b>#${order.orderNumber}</b>.</p>
        <p>Total: <b>${order.grandTotal}</b></p>
        <p>We'll notify you when it's out for delivery.</p>
      </div>`,
  });

export default { sendEmail, sendVerificationEmail, sendPasswordResetEmail, sendOrderConfirmationEmail };
