import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { attendanceService } from '../services/attendanceService';
import { Search, UserCheck } from 'lucide-react';
import { toast } from 'sonner';

interface ManualAttendanceModalProps {
  dayId: string;
  dayTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const ManualAttendanceModal: React.FC<ManualAttendanceModalProps> = ({
  dayId,
  dayTitle,
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [isExcused, setIsExcused] = useState(false);
  const [notes, setNotes] = useState('تسجيل يدوي بواسطة الإدارة');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: availableUsers = [], isLoading } = useQuery({
    queryKey: ['manual-attendance-absentees', dayId],
    queryFn: () => attendanceService.getAbsenteesForDay(dayId),
    enabled: open && !!dayId,
  });

  const filteredUsers = search.trim()
    ? availableUsers.filter(
        u =>
          u.name.toLowerCase().includes(search.trim().toLowerCase()) ||
          u.phoneNumber.includes(search.trim())
      )
    : availableUsers;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      toast.error('يرجى اختيار العضو المراد تسجيله');
      return;
    }

    try {
      setIsSubmitting(true);
      await attendanceService.markManualAttendance(dayId, selectedUserId, notes, isExcused);
      toast.success(isExcused ? 'تم تسجيل الغياب بعذر مقبول' : 'تم تسجيل الحضور اليدوي بنجاح');
      setSelectedUserId('');
      setIsExcused(false);
      setNotes('تسجيل يدوي بواسطة الإدارة');
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء تسجيل الحضور');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-[#27CFA5]" />
            تسجيل حضور يدوي أو عذر
          </DialogTitle>
          <DialogDescription>
            جلسة: «{dayTitle}» — تسجيل حضور مخدوم لتعذر مسح رمز QR أو تسجيل غياب بعذر مقبول
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setIsExcused(false);
                setNotes('تسجيل يدوي بواسطة الإدارة');
              }}
              className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                !isExcused
                  ? 'bg-[#27CFA5]/15 border-[#27CFA5] text-[#27CFA5]'
                  : 'bg-[#17191F] border-[#30333E] text-[#A5A8B5]'
              }`}
            >
              حضور فعلي (يدوي)
            </button>
            <button
              type="button"
              onClick={() => {
                setIsExcused(true);
                setNotes('اعتذار مسبق / عذر مقبول');
              }}
              className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isExcused
                  ? 'bg-[#DDAA48]/15 border-[#DDAA48] text-[#DDAA48]'
                  : 'bg-[#17191F] border-[#30333E] text-[#A5A8B5]'
              }`}
            >
              غياب بعذر (يظهر في الموبايل)
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#A5A8B5] mb-1">
              البحث عن العضو من قائمة غير المسجلين
            </label>
            <Input
              placeholder="ابحث بالاسم أو رقم الهاتف..."
              icon={<Search className="h-4 w-4" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#A5A8B5] mb-1">
              اختر العضو ({filteredUsers.length} متاح) <span className="text-[#E85D75]">*</span>
            </label>
            <div className="max-h-48 overflow-y-auto rounded-xl border border-[#30333E] bg-[#101116] divide-y divide-[#30333E]/50">
              {isLoading ? (
                <div className="p-4 text-center text-xs text-[#A5A8B5]">
                  جاري تحميل قائمة الأعضاء...
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-4 text-center text-xs text-[#A5A8B5]">
                  لا يوجد أعضاء غير مسجلين مطابقين للبحث
                </div>
              ) : (
                filteredUsers.map((u) => (
                  <label
                    key={u.userId}
                    className={`flex items-center justify-between p-3 cursor-pointer hover:bg-[#20232B] transition-colors ${
                      selectedUserId === u.userId ? 'bg-[#695CFF]/15 border-l-4 border-l-[#695CFF]' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="selectedUser"
                        value={u.userId}
                        checked={selectedUserId === u.userId}
                        onChange={() => setSelectedUserId(u.userId)}
                        className="text-[#695CFF] focus:ring-[#695CFF]"
                      />
                      <div>
                        <p className="text-xs font-semibold text-[#F1F2F7]">{u.name}</p>
                        <p className="text-[11px] text-[#A5A8B5]">{u.studyYear || u.levelName || 'عام'}</p>
                      </div>
                    </div>
                    <span dir="ltr" className="text-[11px] font-mono text-[#A5A8B5]">
                      {u.phoneNumber}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#A5A8B5] mb-1">
              سبب / ملاحظة التسجيل
            </label>
            <Textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: عطل في كاميرا الهاتف، حضور متأخر بعذر..."
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              variant="success"
              isLoading={isSubmitting}
              disabled={!selectedUserId}
            >
              {isExcused ? 'تسجيل الغياب بعذر' : 'تسجيل الحضور'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
