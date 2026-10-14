import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { UserStatusBadge } from '../../../components/shared/StatusBadge';
import { User, UserStatus, Gender } from '../../../types/common';
import { formatArabicDateTime } from '../../../lib/date-utils';
import { formatPhoneNumber } from '../../../lib/formatters';
import { 
  Phone, 
  MapPin, 
  Calendar, 
  ShieldCheck, 
  CheckCircle, 
  PauseCircle, 
  PlayCircle,
  MessageCircle,
  Edit
} from 'lucide-react';

interface MemberDetailsModalProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove: (user: User) => void;
  onToggleStatus: (user: User) => void;
  onEdit: (user: User) => void;
}

export const MemberDetailsModal: React.FC<MemberDetailsModalProps> = ({
  user,
  open,
  onOpenChange,
  onApprove,
  onToggleStatus,
  onEdit,
}) => {
  if (!user) return null;

  const isPending = user.status === UserStatus.Pending;
  const isActive = user.status === UserStatus.Active;
  const isSuspended = user.status === UserStatus.Suspended;

  const waUrl = `https://wa.me/2${user.phoneNumber}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-lg">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#695CFF] to-[#7A70FF] text-white font-bold text-lg shadow-md">
                {user.name.split(' ').slice(0, 2).map(n => n[0]).join('')}
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">{user.name}</DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  <UserStatusBadge status={user.status} />
                  <span className="text-xs text-[#A5A8B5]">
                    {user.gender === Gender.Male ? 'ذكر' : 'أنثى'} • {user.age ? `${user.age} سنة` : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 my-4 text-xs">
          {/* Contact Details Card */}
          <div className="p-4 rounded-xl bg-[#20232B]/80 border border-[#30333E] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#A5A8B5]">
                <Phone className="h-4 w-4 text-[#27CFA5]" />
                <span className="font-medium text-[#F1F2F7]" dir="ltr">
                  {formatPhoneNumber(user.phoneNumber)}
                </span>
              </div>
              <a
                href={waUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#27CFA5]/15 text-[#27CFA5] hover:bg-[#27CFA5]/25 border border-[#27CFA5]/30 transition-colors"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span>مراسلة واتساب</span>
              </a>
            </div>

            <div className="flex items-center gap-2 text-[#A5A8B5]">
              <MapPin className="h-4 w-4 text-[#DDAA48]" />
              <span>العنوان: {user.address || 'غير محدد'}</span>
            </div>
          </div>

          {/* Spiritual & Service Data */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-[#20232B]/50 border border-[#30333E] space-y-1">
              <span className="text-[#A5A8B5] text-[11px]">المرحلة الكنسية:</span>
              <p className="font-semibold text-[#F1F2F7]">{user.levelName || 'عام'}</p>
            </div>

            <div className="p-3 rounded-xl bg-[#20232B]/50 border border-[#30333E] space-y-1">
              <span className="text-[#A5A8B5] text-[11px]">أب الاعتراف:</span>
              <p className="font-semibold text-[#F1F2F7]">{user.confessionFather || 'غير مسجل'}</p>
            </div>
          </div>

          {/* System Timeline */}
          <div className="p-3 rounded-xl bg-[#101116] border border-[#30333E] space-y-1.5 text-[#A5A8B5] text-[11px]">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-[#695CFF]" />
                تاريخ التسجيل:
              </span>
              <span className="text-[#F1F2F7]">{formatArabicDateTime(user.createdAtUtc)}</span>
            </div>
            {user.approvedAtUtc && (
              <div className="flex items-center justify-between border-t border-[#30333E]/50 pt-1.5">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#27CFA5]" />
                  تاريخ اعتماد الحساب:
                </span>
                <span className="text-[#F1F2F7]">{formatArabicDateTime(user.approvedAtUtc)}</span>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex-wrap gap-2">
          {isPending && (
            <Button
              variant="success"
              size="sm"
              onClick={() => onApprove(user)}
              className="gap-1.5 text-xs"
            >
              <CheckCircle className="h-4 w-4" />
              قبول طلب العضوية
            </Button>
          )}

          {isActive && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onToggleStatus(user)}
              className="gap-1.5 text-xs text-[#E85D75] hover:bg-[#E85D75]/10 hover:border-[#E85D75]"
            >
              <PauseCircle className="h-4 w-4" />
              إيقاف الحساب
            </Button>
          )}

          {isSuspended && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onToggleStatus(user)}
              className="gap-1.5 text-xs text-[#27CFA5] hover:bg-[#27CFA5]/10 hover:border-[#27CFA5]"
            >
              <PlayCircle className="h-4 w-4" />
              إعادة تفعيل الحساب
            </Button>
          )}

          <Button
            variant="secondary"
            size="sm"
            onClick={() => onEdit(user)}
            className="gap-1.5 text-xs"
          >
            <Edit className="h-4 w-4" />
            تعديل البيانات
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
