import React from 'react';
import { Badge } from '../ui/badge';
import { UserStatus, AttendanceDayStatus, EventStatus, AttendanceMethod } from '../../types/common';
import { QrCode, UserCheck } from 'lucide-react';

interface UserStatusBadgeProps {
  status: UserStatus;
}

export const UserStatusBadge: React.FC<UserStatusBadgeProps> = ({ status }) => {
  switch (status) {
    case UserStatus.Active:
      return <Badge variant="mint" dot>نشط</Badge>;
    case UserStatus.Pending:
      return <Badge variant="amber" dot>معلق</Badge>;
    case UserStatus.Suspended:
      return <Badge variant="coral" dot>موقوف</Badge>;
    default:
      return <Badge variant="gray">غير محدد</Badge>;
  }
};

interface AttendanceDayStatusBadgeProps {
  status: AttendanceDayStatus;
  isOpen?: boolean;
}

export const AttendanceDayStatusBadge: React.FC<AttendanceDayStatusBadgeProps> = ({ status, isOpen }) => {
  if (isOpen || status === 'Open') {
    return <Badge variant="mint" dot>مفتوحة للتسجيل</Badge>;
  }
  switch (status) {
    case 'Scheduled':
      return <Badge variant="gray" dot>مجدولة</Badge>;
    case 'Closed':
      return <Badge variant="amber" dot>مغلقة</Badge>;
    case 'Finalized':
      return <Badge variant="default" dot>معتمدة</Badge>;
    default:
      return <Badge variant="gray">{status}</Badge>;
  }
};

interface EventStatusBadgeProps {
  status: EventStatus;
}

export const EventStatusBadge: React.FC<EventStatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'Published':
      return <Badge variant="mint" dot>منشورة</Badge>;
    case 'Draft':
      return <Badge variant="gray" dot>مسودة</Badge>;
    case 'Cancelled':
      return <Badge variant="coral" dot>ملغاة</Badge>;
    default:
      return <Badge variant="gray">{status}</Badge>;
  }
};

interface MethodBadgeProps {
  method: AttendanceMethod | null | undefined;
}

export const AttendanceMethodBadge: React.FC<MethodBadgeProps> = ({ method }) => {
  if (method === AttendanceMethod.QrCode) {
    return (
      <Badge variant="default" className="gap-1">
        <QrCode className="h-3 w-3" />
        رمز QR
      </Badge>
    );
  }
  if (method === AttendanceMethod.Manual) {
    return (
      <Badge variant="amber" className="gap-1">
        <UserCheck className="h-3 w-3" />
        يدوي
      </Badge>
    );
  }
  return <span className="text-xs text-[#6C7080]">—</span>;
};
