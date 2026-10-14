import { Gender, UserStatus, AttendanceMethod, EventStatus } from './common';

export interface UserSummaryDto {
  id: string;
  name: string;
  phoneNumber: string;
  role: string;
  status: string;
}

export interface UserProfileDto {
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
  createdAtUtc: string;
  approvedAtUtc?: string | null;
}

export interface CreateUserDto {
  name: string;
  phoneNumber: string;
  gender: Gender;
  age?: number;
  levelId?: string;
  confessionFather?: string;
  address?: string;
  status?: UserStatus;
}

export interface UpdateUserDto {
  name: string;
  age?: number;
  levelId?: string;
  confessionFather?: string;
  address?: string;
}

export interface CreateAttendanceDayDto {
  title: string;
  date: string;
  startAt: string;
  endAt: string;
  location: string;
  notes?: string;
  isOpen?: boolean;
}

export interface UpdateAttendanceDayDto {
  title: string;
  date: string;
  startAt: string;
  endAt: string;
  location: string;
  notes?: string;
}

export interface AttendanceDayListItemDto {
  id: string;
  title: string;
  date: string;
  startAt: string;
  endAt: string;
  isOpen: boolean;
  status: string;
  totalAttendees: number;
  totalAbsentees: number;
  attendancePercentage: number;
}

export interface AttendanceDaySummaryDto {
  attendanceDayId: string;
  title: string;
  date: string;
  isOpen: boolean;
  status: string;
  location: string;
  totalEligibleUsers: number;
  totalAttendees: number;
  totalAbsentees: number;
  attendancePercentage: number;
}

export interface AttendanceUserItemDto {
  userId: string;
  name: string;
  phoneNumber: string;
  gender: Gender;
  levelName?: string;
  isAttended: boolean;
  markedAtUtc?: string | null;
  method?: AttendanceMethod | null;
}

export interface ManualAttendanceRequestDto {
  attendanceDayId: string;
  userId: string;
  reason?: string;
}

export interface AdminDashboardSummaryDto {
  totalUsers: number;
  totalPendingUsers: number;
  totalAttendanceDays: number;
  totalAttendees: number;
  totalAbsentees: number;
  lastAttendanceDayDate?: string | null;
  lastDayAttendees: number;
  lastDayAbsentees: number;
  attendancePercentage: number;
}

export interface AttendanceTrendItemDto {
  date: string;
  title: string;
  attendees: number;
  absentees: number;
  attendancePercentage: number;
}

export interface SpecialEventDto {
  id: string;
  title: string;
  description?: string;
  startAt: string;
  endAt?: string;
  location?: string;
  imageUrl?: string;
  status: EventStatus;
  linkedAttendanceDayId?: string | null;
}

export interface CreateSpecialEventDto {
  title: string;
  description?: string;
  startAt: string;
  endAt?: string;
  location?: string;
  status: EventStatus;
  createLinkedAttendanceDay?: boolean;
}

export interface AppLinksDto {
  churchName: string;
  contactPhone: string;
  contactEmail: string;
  maleContactWhatsAppUrl?: string;
  maleGroupWhatsAppUrl?: string;
  femaleGroupWhatsAppUrl?: string;
  facebookPageUrl?: string;
}
