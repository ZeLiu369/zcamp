// In backend/src/emailService.ts

import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);

interface EmailParams {
  to: string;
  subject: string;
  html: string;
}

export const emailService = {
  sendEmail: async ({ to, subject, html }: EmailParams) => {
    const msg = {
      to: to,
      from: process.env.SENDER_EMAIL_ADDRESS as string, // Your verified sender
      subject: subject,
      html: html,
    };

    try {
      await sgMail.send(msg);
      console.log(`Email sent successfully to ${to}`);
    } catch (error) {
      console.error('Error sending email:', error);
      // In a real production app, you'd have more robust error handling here
      throw new Error('Failed to send email.');
    }
  },

  sendPasswordResetEmail: async (to: string, resetLink: string) => {
    const subject = 'Your Password Reset Link for CampFinder';
    const html = `<p>Please click the following link to reset your password:</p><p><a href="${resetLink}">${resetLink}</a></p>`;

    await emailService.sendEmail({ to, subject, html });
  }
};