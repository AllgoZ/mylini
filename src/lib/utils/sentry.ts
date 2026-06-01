// Sentry integration placeholder — wire up @sentry/nextjs when ready.
export function captureError(error: unknown, context?: Record<string, unknown>): void {
  // TODO: Sentry.captureException(error, { extra: context })
  console.error('[Sentry stub]', error, context)
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
  // TODO: Sentry.captureMessage(message, level)
  console.log(`[Sentry stub] [${level}]`, message)
}
