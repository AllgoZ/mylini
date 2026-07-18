import { Resend } from 'resend'
import { captureError } from '@/lib/utils/sentry'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

type SendEmailOptions = {
  to: string
  subject: string
  html: string
  from?: string
}

// Every caller in this module treats a send failure as non-fatal (logged, never thrown) —
// an email provider outage must never break checkout or any other flow that triggers mail.
export async function sendEmail({ to, subject, html, from }: SendEmailOptions): Promise<void> {
  if (!resend) {
    console.warn('[Resend] RESEND_API_KEY not set — skipping email:', subject)
    return
  }

  const { error } = await resend.emails.send({
    from: from ?? 'MYLINI <onboarding@resend.dev>',
    to,
    subject,
    html,
  })

  if (error) {
    captureError(new Error(`Resend send failed: ${error.message}`), { source: 'sendEmail', to, subject })
  }
}

export async function sendOrderConfirmation(to: string, orderId: string): Promise<void> {
  await sendEmail({
    to,
    subject: 'Your MYLINI order is confirmed!',
    html: `<p>Thank you for your order <strong>#${orderId}</strong>. We'll notify you when it ships.</p>`,
  })
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const formatInr = (amount: number) => `₹${amount.toFixed(2)}`

export type OrderPlacedNotificationDetails = {
  orderId: string
  subtotal: number
  discount: number
  total: number
  customerName: string | null
  customerPhone: string
  customerEmail: string | null
  address: {
    name: string
    line1: string
    line2: string | null
    city: string
    state: string
    pincode: string
    country: string
  }
  items: {
    productName: string
    variant: string | null
    quantity: number
    unitPrice: number
    totalPrice: number
  }[]
}

// Internal admin/store-owner alert (ORDER_NOTIFICATION_EMAIL, or the settings-panel
// override passed via `toOverride`) — not a customer-facing email. Fires whenever a new
// order is placed; see OrderService.create.
export async function sendOrderPlacedNotification(order: OrderPlacedNotificationDetails, toOverride?: string | null): Promise<void> {
  const to = toOverride || process.env.ORDER_NOTIFICATION_EMAIL
  if (!to) {
    console.warn('[Resend] ORDER_NOTIFICATION_EMAIL not set — skipping order notification email')
    return
  }

  const itemRows = order.items
    .map((item) => {
      const label = item.variant ? `${item.productName} (${item.variant})` : item.productName
      return `<tr><td>${escapeHtml(label)}</td><td>${item.quantity}</td><td>${formatInr(item.unitPrice)}</td><td>${formatInr(item.totalPrice)}</td></tr>`
    })
    .join('')

  const addr = order.address
  const addressLines = [addr.line1, addr.line2]
    .filter((line): line is string => Boolean(line))
    .map(escapeHtml)
    .join(', ')

  const html = `
    <h2>New order placed &mdash; #${escapeHtml(order.orderId.slice(0, 8))}</h2>
    <p><strong>Total:</strong> ${formatInr(order.total)} (subtotal ${formatInr(order.subtotal)}, discount ${formatInr(order.discount)})</p>
    <h3>Customer</h3>
    <p>
      ${escapeHtml(order.customerName ?? 'N/A')}<br/>
      Phone: ${escapeHtml(order.customerPhone)}
      ${order.customerEmail ? `<br/>Email: ${escapeHtml(order.customerEmail)}` : ''}
    </p>
    <h3>Shipping address</h3>
    <p>
      ${escapeHtml(addr.name)}<br/>
      ${addressLines}<br/>
      ${escapeHtml(addr.city)}, ${escapeHtml(addr.state)} ${escapeHtml(addr.pincode)}<br/>
      ${escapeHtml(addr.country)}
    </p>
    <h3>Items</h3>
    <table cellpadding="6" style="border-collapse:collapse">
      <thead><tr><th align="left">Product</th><th align="left">Qty</th><th align="left">Unit price</th><th align="left">Total</th></tr></thead>
      <tbody>${itemRows}</tbody>
    </table>
  `

  await sendEmail({
    to,
    subject: `New order #${order.orderId.slice(0, 8)} — ${formatInr(order.total)}`,
    html,
  })
}
