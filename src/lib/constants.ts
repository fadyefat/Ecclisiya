export const APP_NAME = 'Ecclesia';
export const APP_SUBTITLE = 'اجتماع الملاك غبريال الجامعي';

export const STORAGE_KEYS = {
  USERS: 'ecclisiya_users_v1',
  ATTENDANCE_DAYS: 'ecclisiya_attendance_days_v1',
  ATTENDANCES: 'ecclisiya_attendances_v1',
  EVENTS: 'ecclisiya_events_v1',
  SETTINGS: 'ecclisiya_settings_v1',
  AUDIT_LOGS: 'ecclisiya_audit_logs_v1',
  HELP_REQUESTS: 'ecclisiya_help_requests_v1',
  NOTIFICATIONS: 'ecclisiya_notifications_v1',
};

export const EGYPT_PHONE_REGEX = /^01[0125]\d{8}$/;

export const CHURCH_LEVELS = [
  { id: 'lvl-prep', name: 'المرحلة الإعدادية' },
  { id: 'lvl-sec', name: 'المرحلة الثانوية' },
  { id: 'lvl-univ', name: 'المرحلة الجامعية' },
  { id: 'lvl-grad', name: 'الخريجون والشباب' },
  { id: 'lvl-general', name: 'الاجتماع العام' },
];

export const STUDY_YEARS = [
  'الفرقة الأولى',
  'الفرقة الثانية',
  'الفرقة الثالثة',
  'الفرقة الرابعة',
  'الفرقة الخامسة',
  'الفرقة السادسة',
  'خريج',
];

export const MEETING_TYPES = [
  { key: 'youth', label: 'اجتماع شباب وجامعيين' },
  { key: 'bible', label: 'درس كتاب' },
  { key: 'prayer', label: 'صلاة وتسبيح' },
  { key: 'mass', label: 'قداس إلهي' },
  { key: 'other', label: 'لقاء روحي عام' },
];

export const GENDER_OPTIONS = [
  { value: 1, label: 'ذكر' },
  { value: 2, label: 'أنثى' },
];

export const USER_STATUS_OPTIONS = [
  { value: 1, key: 'Pending', label: 'معلق', color: 'amber' },
  { value: 2, key: 'Active', label: 'نشط', color: 'mint' },
  { value: 3, key: 'Suspended', label: 'موقوف', color: 'coral' },
];

export const ATTENDANCE_DAY_STATUS_OPTIONS = [
  { key: 'Scheduled', label: 'مجدولة', color: 'gray' },
  { key: 'Open', label: 'مفتوحة للتسجيل', color: 'mint' },
  { key: 'Closed', label: 'مغلقة أمام التسجيل', color: 'amber' },
  { key: 'Finalized', label: 'مكتملة ومعتمدة', color: 'purple' },
];

export const ATTENDANCE_METHODS = [
  { value: 1, key: 'QrCode', label: 'رمز QR', icon: 'QrCode' },
  { value: 2, key: 'Manual', label: 'يدوي', icon: 'UserCheck' },
  { value: 3, key: 'Excused', label: 'غياب بعذر', icon: 'CalendarOff' },
];
