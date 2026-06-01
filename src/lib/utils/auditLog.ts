// Audit log placeholder — record admin/system actions for compliance.
type AuditEvent = {
  action: string
  resource: string
  resource_id?: string
  performed_by?: string
  metadata?: Record<string, unknown>
}

export function logAuditEvent(event: AuditEvent): void {
  // TODO: persist to audit_logs table or external service
  console.log('[Audit stub]', event)
}
