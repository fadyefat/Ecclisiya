import { format, parseISO, isValid } from 'date-fns';
import { arEG } from 'date-fns/locale';

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
