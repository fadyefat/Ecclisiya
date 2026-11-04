import { createClient } from '@supabase/supabase-js';
import {
  AppSetting,
  Attendance,
  AttendanceDay,
  AttendanceDayStatus,
  AttendanceMethod,
  AuditLog,
  EventStatus,
  Gender,
  HelpRequest,
  MeetingType,
  MobileNotification,
  SpecialEvent,
  User,
  UserRole,
  UserStatus,
} from '../types/common';

export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://oatyiqiuyrxpfypiekhk.supabase.co';

export const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_9ad5sLij9x5YvtAD33pJdw_2ELU6E8y';

export const MOBILE_API_URL =
  import.meta.env.VITE_API_BASE_URL ||
  `${SUPABASE_URL}/functions/v1/mobile-api`;

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: false,
  },
});

export function isSupabaseEnabled(): boolean {
  if (typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'test') {
    return false;
  }
  return Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);
}

export function mapDbUser(row: Record<string, unknown>): User {
  return {
    id: String(row.id),
    name: String(row.name || ''),
    phoneNumber: String(row.phone_number || ''),
    gender: Number(row.gender || 1) as Gender,
    age: row.age !== null && row.age !== undefined ? Number(row.age) : undefined,
    levelId: row.level_id ? String(row.level_id) : undefined,
    levelName: row.level_name ? String(row.level_name) : undefined,
    university: row.university ? String(row.university) : undefined,
    studyYear: row.study_year ? String(row.study_year) : undefined,
    confessionFather: row.confession_father ? String(row.confession_father) : undefined,
    address: row.address ? String(row.address) : undefined,
    status: Number(row.status || 1) as UserStatus,
    role: Number(row.role || 1) as UserRole,
    points: row.points !== null && row.points !== undefined ? Number(row.points) : 0,
    acceptNotifications: row.accept_notifications !== undefined ? Boolean(row.accept_notifications) : true,
    createdAtUtc: row.created_at_utc ? String(row.created_at_utc) : new Date().toISOString(),
    approvedAtUtc: row.approved_at_utc ? String(row.approved_at_utc) : null,
    isDeleted: Boolean(row.is_deleted),
  };
}

export function mapDbAttendanceDay(row: Record<string, unknown>): AttendanceDay {
  return {
    id: String(row.id),
    title: String(row.title || ''),
    date: String(row.date || ''),
    startAt: String(row.start_at || ''),
    endAt: String(row.end_at || ''),
    status: String(row.status || 'Scheduled') as AttendanceDayStatus,
    isOpen: Boolean(row.is_open),
    location: String(row.location || ''),
    notes: row.notes ? String(row.notes) : undefined,
    meetingType: (row.meeting_type ? String(row.meeting_type) : 'youth') as MeetingType,
    sessionCode: row.session_code ? String(row.session_code) : undefined,
    pointsReward: row.points_reward !== null && row.points_reward !== undefined ? Number(row.points_reward) : 10,
    totalEligibleUsers: Number(row.total_eligible_users || 0),
    totalAttendees: Number(row.total_attendees || 0),
    totalAbsentees: Number(row.total_absentees || 0),
    attendancePercentage: Number(row.attendance_percentage || 0),
    qrToken: String(row.qr_token || ''),
    qrTokenExpiresAtUtc: row.qr_token_expires_at_utc ? String(row.qr_token_expires_at_utc) : undefined,
    finalizedAtUtc: row.finalized_at_utc ? String(row.finalized_at_utc) : null,
  };
}

export function mapDbAttendance(row: Record<string, unknown>): Attendance {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    attendanceDayId: String(row.attendance_day_id),
    markedAtUtc: String(row.marked_at_utc || new Date().toISOString()),
    method: Number(row.method || 1) as AttendanceMethod,
    isExcused: Boolean(row.is_excused),
    pointsAwarded: row.points_awarded !== null && row.points_awarded !== undefined ? Number(row.points_awarded) : 10,
    notes: row.notes ? String(row.notes) : undefined,
  };
}

export function mapDbSpecialEvent(row: Record<string, unknown>): SpecialEvent {
  return {
    id: String(row.id),
    title: String(row.title || ''),
    description: String(row.description || ''),
    startAt: String(row.start_at || ''),
    endAt: row.end_at ? String(row.end_at) : undefined,
    location: String(row.location || ''),
    imageUrl: row.image_url ? String(row.image_url) : undefined,
    status: String(row.status || 'Published') as EventStatus,
    linkedAttendanceDayId: row.linked_attendance_day_id ? String(row.linked_attendance_day_id) : null,
  };
}

export function mapDbAppSettings(row: Record<string, unknown>): AppSetting {
  return {
    churchName: String(row.church_name || ''),
    contactPhone: String(row.contact_phone || ''),
    contactEmail: String(row.contact_email || ''),
    maleContactWhatsAppUrl: String(row.male_contact_whatsapp_url || ''),
    maleGroupWhatsAppUrl: String(row.male_group_whatsapp_url || ''),
    femaleGroupWhatsAppUrl: String(row.female_group_whatsapp_url || ''),
    facebookPageUrl: String(row.facebook_page_url || ''),
    verseOfTheDay: row.verse_of_the_day ? String(row.verse_of_the_day) : '',
    themeMode: (row.theme_mode ? String(row.theme_mode) : 'light') as 'light' | 'dark' | 'system',
  };
}

export function mapDbNotification(row: Record<string, unknown>, userName?: string): MobileNotification {
  return {
    id: String(row.id),
    userId: row.user_id ? String(row.user_id) : null,
    userName,
    title: String(row.title || ''),
    body: String(row.body || ''),
    type: (row.type ? String(row.type) : 'general') as MobileNotification['type'],
    isRead: Boolean(row.is_read),
    createdAtUtc: String(row.created_at_utc || new Date().toISOString()),
  };
}

export function mapDbHelpRequest(row: Record<string, unknown>, attendanceDayTitle?: string): HelpRequest {
  return {
    id: String(row.id),
    userId: row.user_id ? String(row.user_id) : null,
    userName: String(row.user_name || ''),
    phoneNumber: String(row.phone_number || ''),
    attendanceDayId: row.attendance_day_id ? String(row.attendance_day_id) : null,
    attendanceDayTitle,
    message: String(row.message || ''),
    status: (row.status ? String(row.status) : 'Pending') as HelpRequest['status'],
    createdAtUtc: String(row.created_at_utc || new Date().toISOString()),
    resolvedAtUtc: row.resolved_at_utc ? String(row.resolved_at_utc) : null,
  };
}

export function mapDbAuditLog(row: Record<string, unknown>): AuditLog {
  return {
    id: String(row.id),
    action: String(row.action || ''),
    targetType: (row.target_type ? String(row.target_type) : 'Settings') as AuditLog['targetType'],
    targetId: row.target_id ? String(row.target_id) : undefined,
    details: String(row.details || ''),
    performedBy: String(row.performed_by || 'المدير العام (أدمن)'),
    timestamp: String(row.timestamp || new Date().toISOString()),
  };
}

export async function insertSupabaseAuditLog(entry: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void> {
  if (!isSupabaseEnabled()) return;
  await supabase.from('audit_logs').insert({
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    action: entry.action,
    target_type: entry.targetType,
    target_id: entry.targetId || null,
    details: entry.details,
    performed_by: entry.performedBy,
    timestamp: new Date().toISOString(),
  });
}
