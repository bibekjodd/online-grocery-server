import { env } from '@/config/env.config';
import nodemailer from 'nodemailer';

export type SendMailOptions = {
  text: string;
  mail: string;
  subject: string;
};

export const sendMail = async (...data: SendMailOptions[]) => {
  if (env.NODE_ENV !== 'production') return;
  const transporter = nodemailer.createTransport({
    service: env.SMTP_SERVICE,
    auth: {
      user: env.SMTP_MAIL,
      pass: env.SMTP_PASS
    }
  });

  const promises: Promise<unknown>[] = [];
  for (const { mail, text, subject } of data) {
    promises.push(
      transporter.sendMail({
        html: text,
        to: mail,
        subject
      })
    );
  }

  return Promise.all(promises);
};
