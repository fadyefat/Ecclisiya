import { 
  User, 
  AttendanceDay, 
  Attendance, 
  SpecialEvent, 
  AppSetting, 
  AuditLog, 
  UserStatus 
} from '../types/common';
import { 
  INITIAL_USERS, 
  INITIAL_ATTENDANCE_DAYS, 
  INITIAL_ATTENDANCES, 
  INITIAL_EVENTS, 
  INITIAL_SETTINGS, 
  INITIAL_AUDIT_LOGS 
} from './seed-data';
import { STORAGE_KEYS } from '../lib/constants';

function safeGetItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined' || !window.localStorage) {
    return defaultValue;
  }
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaultValue));
      return defaultValue;
    }
    return JSON.parse(raw) as T;
  } catch (e) {
    console.error(`Failed to load key ${key} from storage:`, e);
    return defaultValue;
  }
}

function safeSetItem<T>(key: string, val: T): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error(`Failed to save key ${key} to storage:`, e);
  }
}

export const mockStorage = {
  // Users
  getUsers(): User[] {
    return safeGetItem<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
  },
  saveUsers(users: User[]): void {
    safeSetItem(STORAGE_KEYS.USERS, users);
  },

  // Attendance Days
  getAttendanceDays(): AttendanceDay[] {
    return safeGetItem<AttendanceDay[]>(STORAGE_KEYS.ATTENDANCE_DAYS, INITIAL_ATTENDANCE_DAYS);
  },
  saveAttendanceDays(days: AttendanceDay[]): void {
    safeSetItem(STORAGE_KEYS.ATTENDANCE_DAYS, days);
  },

  // Attendances
  getAttendances(): Attendance[] {
    return safeGetItem<Attendance[]>(STORAGE_KEYS.ATTENDANCES, INITIAL_ATTENDANCES);
  },
  saveAttendances(attendances: Attendance[]): void {
    safeSetItem(STORAGE_KEYS.ATTENDANCES, attendances);
  },

  // Events
  getEvents(): SpecialEvent[] {
    return safeGetItem<SpecialEvent[]>(STORAGE_KEYS.EVENTS, INITIAL_EVENTS);
  },
  saveEvents(events: SpecialEvent[]): void {
    safeSetItem(STORAGE_KEYS.EVENTS, events);
  },

  // Settings
  getSettings(): AppSetting {
    return safeGetItem<AppSetting>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  },
  saveSettings(settings: AppSetting): void {
    safeSetItem(STORAGE_KEYS.SETTINGS, settings);
  },

  // Audit Logs
  getAuditLogs(): AuditLog[] {
    return safeGetItem<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
  },
  addAuditLog(entry: Omit<AuditLog, 'id' | 'timestamp'>): void {
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      ...entry,
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    logs.unshift(newLog);
    safeSetItem(STORAGE_KEYS.AUDIT_LOGS, logs.slice(0, 50)); // keep last 50
  },

  // Reset to initial seed data
  resetAllMockData(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(STORAGE_KEYS.USERS);
      localStorage.removeItem(STORAGE_KEYS.ATTENDANCE_DAYS);
      localStorage.removeItem(STORAGE_KEYS.ATTENDANCES);
      localStorage.removeItem(STORAGE_KEYS.EVENTS);
      localStorage.removeItem(STORAGE_KEYS.SETTINGS);
      localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);
    }
    this.saveUsers(INITIAL_USERS);
    this.saveAttendanceDays(INITIAL_ATTENDANCE_DAYS);
    this.saveAttendances(INITIAL_ATTENDANCES);
    this.saveEvents(INITIAL_EVENTS);
    this.saveSettings(INITIAL_SETTINGS);
    this.saveAuditLogs(INITIAL_AUDIT_LOGS);
  },

  saveAuditLogs(logs: AuditLog[]): void {
    safeSetItem(STORAGE_KEYS.AUDIT_LOGS, logs);
  },

  // Core Business Rule Helpers
  getEligibleActiveUsers(): User[] {
    return this.getUsers().filter(u => u.status === UserStatus.Active && !u.isDeleted);
  },

  recomputeDayMetrics(dayId: string): AttendanceDay | null {
    const days = this.getAttendanceDays();
    const day = days.find(d => d.id === dayId);
    if (!day) return null;

    const eligibleUsers = this.getEligibleActiveUsers();
    const attendances = this.getAttendances().filter(a => a.attendanceDayId === dayId);
    const eligibleIds = new Set(eligibleUsers.map(u => u.id));
    
    // Only count attendances from eligible active users
    const validAttendees = attendances.filter(a => eligibleIds.has(a.userId));
    const totalAttendees = validAttendees.length;
    const totalEligibleUsers = eligibleUsers.length;

    // Rule: Absentees are ONLY finalized for closed/finalized days!
    let totalAbsentees = 0;
    if (day.status === 'Finalized') {
      totalAbsentees = Math.max(0, totalEligibleUsers - totalAttendees);
    }

    const attendancePercentage = totalEligibleUsers > 0 
      ? Math.round((totalAttendees / totalEligibleUsers) * 1000) / 10 
      : 0;

    day.totalEligibleUsers = totalEligibleUsers;
    day.totalAttendees = totalAttendees;
    day.totalAbsentees = totalAbsentees;
    day.attendancePercentage = attendancePercentage;

    this.saveAttendanceDays(days);
    return day;
  }
};
