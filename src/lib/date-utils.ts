import { format, parseISO, isValid } from 'date-fns';
import { arEG } from 'date-fns/locale';

/**
 * Formats a date string or Date object into Arabic readable date
 * e.g., "14 أكتوبر 2026"
 */
export function formatArabicDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '—';
  try {
    const d = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
    if (!isValid(d)) return '—';
    return format(d, 'd MMMM yyyy', { locale: arEG });
  } catch {
    return '—';
  }
}

/**
 * Formats a date into short date "yyyy/MM/dd"
 */
export function formatShortDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '—';
  try {
    const d = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
    if (!isValid(d)) return '—';
    return format(d, 'yyyy/MM/dd');
  } catch {
    return '—';
  }
}

/**
 * Formats time "hh:mm a" in Arabic (e.g., "05:00 م")
 */
export function formatArabicTime(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '—';
  try {
    const d = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
    if (!isValid(d)) return '—';
    return format(d, 'hh:mm a', { locale: arEG });
  } catch {
    return '—';
  }
}

/**
 * Formats date and time together
 */
export function formatArabicDateTime(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '—';
  try {
    const d = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
    if (!isValid(d)) return '—';
    return format(d, 'd MMMM yyyy - hh:mm a', { locale: arEG });
  } catch {
    return '—';
  }
}

/**
 * Get day name in Arabic (e.g., "الجمعة")
 */
export function getArabicDayName(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '';
  try {
    const d = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
    if (!isValid(d)) return '';
    return format(d, 'EEEE', { locale: arEG });
  } catch {
    return '';
  }
}
