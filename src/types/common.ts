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

export enum AttendanceMethod {
  QrCode = 1,
  Manual = 2,
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
  confessionFather?: string;
  address?: string;
  status: UserStatus;
  role: UserRole;
  createdAtUtc: string;
  approvedAtUtc?: string | null;
  isDeleted?: boolean;
}

export interface AttendanceDay {
  id: string;
  title: string;
  date: string; // ISO date string YYYY-MM-DD
  startAt: string; // ISO datetime
  endAt: string; // ISO datetime
  status: AttendanceDayStatus;
  isOpen: boolean;
  location: string;
  notes?: string;
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
}

export interface AuditLog {
  id: string;
  action: string;
  targetType: 'User' | 'AttendanceDay' | 'Attendance' | 'Event' | 'Settings';
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
  from?: string; // YYYY-MM-DD
  to?: string;   // YYYY-MM-DD
  label: string;
}
