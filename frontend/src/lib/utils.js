import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatFCFA(amount = 0) {
  return `${Number(amount || 0).toLocaleString('fr-FR')} FCFA`;
}

export function formatDateFR(dateStr) {
  if (!dateStr) return '—';
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(dateStr));
}

export function formatShortDateFR(dateStr) {
  if (!dateStr) return '—';
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateStr));
}

export function formatTimeFR(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const h = String(d.getUTCHours()).padStart(2, '0');
  const m = String(d.getUTCMinutes()).padStart(2, '0');
  return `${h}h${m}`;
}
