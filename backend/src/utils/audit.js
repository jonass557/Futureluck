import AuditLog from '../models/AuditLog.js';

export async function recordAudit({
  actor,
  action,
  targetType = '',
  targetId = '',
  amount = undefined,
  details = '',
  ip = '',
}) {
  try {
    await AuditLog.create({
      actor: actor._id,
      actorName: actor.fullName,
      actorRole: actor.role,
      action,
      targetType,
      targetId: String(targetId || ''),
      amount,
      details,
      ip,
    });
  } catch (err) {
    console.error('Erreur AuditLog:', err.message);
  }
}

export function generateReference(prefix = 'FL') {
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${rand}`;
}
