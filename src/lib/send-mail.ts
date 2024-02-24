import { env } from '@/config/env.config';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: env.SMTP_SERVICE,
  auth: {
    user: env.SMTP_MAIL,
    pass: env.SMTP_PASS
  }
});

export const sendMail = ({
  to,
  body,
  subject
}: {
  to: string;
  subject: string;
  body: string;
}) => {
  return transporter.sendMail({ to, subject, html: body });
};
