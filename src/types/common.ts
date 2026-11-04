export enum Gender {
  Male = 1,
  Female = 2,
}

export enum UserStatus {
  Pending = 1,
  Active = 2,
  Suspended = 3,
}

export enum UserRole {
  User = 1,
  Admin = 2,
}

export type AttendanceDayStatus = 'Scheduled' | 'Open' | 'Closed' | 'Finalized';

export type MeetingType = 'youth' | 'bible' | 'prayer' | 'mass' | 'other';

export enum AttendanceMethod {
  QrCode = 1,
  Manual = 2,
  Excused = 3,
}

export type EventStatus = 'Published' | 'Draft' | 'Cancelled';

export interface User {
  id: string;
  name: string;
  phoneNumber: string;
  gender: Gender;
  age?: number;
  levelId?: string;
  levelName?: string;
  university?: string;
  studyYear?: string;
  confessionFather?: string;
  address?: string;
  status: UserStatus;
  role: UserRole;
  points?: number;
  acceptNotifications?: boolean;
  createdAtUtc: string;
  approvedAtUtc?: string | null;
  isDeleted?: boolean;
}

export interface AttendanceDay {
  id: string;
  title: string;
  date: string;
  startAt: string;
  endAt: string;
  status: AttendanceDayStatus;
  isOpen: boolean;
  location: string;
  notes?: string;
  meetingType?: MeetingType;
  sessionCode?: string;
  pointsReward?: number;
  totalEligibleUsers: number;
  totalAttendees: number;
  totalAbsentees: number;
  attendancePercentage: number;
  qrToken: string;
  qrTokenExpiresAtUtc?: string;
  finalizedAtUtc?: string | null;
}

export interface Attendance {
  id: string;
  userId: string;
  attendanceDayId: string;
  markedAtUtc: string;
  method: AttendanceMethod;
  isExcused?: boolean;
  pointsAwarded?: number;
  notes?: string;
}

export interface SpecialEvent {
  id: string;
  title: string;
  description: string;
  startAt: string;
  endAt?: string;
  location: string;
  status: EventStatus;
  linkedAttendanceDayId?: string | null;
  imageUrl?: string;
}

export interface AppSetting {
  churchName: string;
  contactPhone: string;
  contactEmail: string;
  maleContactWhatsAppUrl: string;
  maleGroupWhatsAppUrl: string;
  femaleGroupWhatsAppUrl: string;
  facebookPageUrl: string;
  verseOfTheDay?: string;
  themeMode?: 'light' | 'dark' | 'system';
}

export interface MobileNotification {
  id: string;
  userId?: string | null;
  userName?: string;
  title: string;
  body: string;
  type: 'general' | 'attendance' | 'event' | 'approval' | 'reminder';
  isRead: boolean;
  createdAtUtc: string;
}

export interface HelpRequest {
  id: string;
  userId?: string | null;
  userName: string;
  phoneNumber: string;
  attendanceDayId?: string | null;
  attendanceDayTitle?: string;
  message: string;
  status: 'Pending' | 'Resolved' | 'Dismissed';
  createdAtUtc: string;
  resolvedAtUtc?: string | null;
}

export interface AuditLog {
  id: string;
  action: string;
  targetType: 'User' | 'AttendanceDay' | 'Attendance' | 'Event' | 'Settings' | 'Notification' | 'HelpRequest';
  targetId?: string;
  details: string;
  performedBy: string;
  timestamp: string;
}

export interface PagedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface DateRangeFilterValue {
  key: 'today' | '7days' | '30days' | 'thisMonth' | 'custom' | 'all';
  from?: string;
  to?: string;
  label: string;
}
