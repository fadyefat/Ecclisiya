import {
  User,
  AttendanceDay,
  Attendance,
  SpecialEvent,
  AppSetting,
  AuditLog,
  HelpRequest,
  MobileNotification,
} from '../types/common';

export const INITIAL_USERS: User[] = [];

export const INITIAL_ATTENDANCE_DAYS: AttendanceDay[] = [];

export const INITIAL_ATTENDANCES: Attendance[] = [];

export const INITIAL_EVENTS: SpecialEvent[] = [];

export const INITIAL_SETTINGS: AppSetting = {
  churchName: 'كنيسة السيدة العذراء مريم بالزيتون — أسرة الملاك غبريال',
  contactPhone: '',
  contactEmail: '',
  maleContactWhatsAppUrl: '',
  maleGroupWhatsAppUrl: '',
  femaleGroupWhatsAppUrl: '',
  facebookPageUrl: '',
  verseOfTheDay: '«طُوبَى لِمَنِ اخْتَرْتَهُ وَقَبِلْتَهُ لِيَسْكُنَ فِي دِيَارِكَ» (مز ٦٥: ٤)',
  themeMode: 'light',
};

export const INITIAL_AUDIT_LOGS: AuditLog[] = [];

export const INITIAL_HELP_REQUESTS: HelpRequest[] = [];

export const INITIAL_NOTIFICATIONS: MobileNotification[] = [];
