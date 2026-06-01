// Resend — transactional email for order confirmations and notifications.
// Install: npm install resend

// TODO: import { Resend } from 'resend'
// export const resend = new Resend(process.env.RESEND_API_KEY)

type SendEmailOptions = {
  to: string
  subject: string
  html: string
  from?: string
}

export async function sendEmail({ to, subject, html, from }: SendEmailOptions): Promise<void> {
  // TODO:
  // await resend.emails.send({
  //   from: from ?? 'MYLINI <noreply@mylini.in>',
  //   to,
  //   subject,
  //   html,
  // })
  console.log('[Resend stub] email to:', to, 'subject:', subject)
}

export async function sendOrderConfirmation(to: string, orderId: string): Promise<void> {
  await sendEmail({
    to,
    subject: 'Your MYLINI order is confirmed!',
    html: `<p>Thank you for your order <strong>#${orderId}</strong>. We'll notify you when it ships.</p>`,
  })
}
