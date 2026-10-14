import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { mockStorage } from '../../../mocks/mock-storage';
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
  const [notes, setNotes] = useState('تسجيل يدوي بواسطة الإدارة');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Find eligible users who have not yet attended this day
  const eligibleUsers = mockStorage.getEligibleActiveUsers();
  const attendedIds = new Set(
    mockStorage.getAttendances()
      .filter(a => a.attendanceDayId === dayId)
      .map(a => a.userId)
  );

  const availableUsers = eligibleUsers.filter(u => !attendedIds.has(u.id));

  const filteredUsers = search.trim()
    ? availableUsers.filter(u => 
        u.name.toLowerCase().includes(search.trim().toLowerCase()) ||
        u.phoneNumber.includes(search.trim())
      )
    : availableUsers;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      toast.error('يرجى اختيار العضو المراد تسجيل حضوره');
      return;
    }

    try {
      setIsSubmitting(true);
      await attendanceService.markManualAttendance(dayId, selectedUserId, notes);
      toast.success('تم تسجيل الحضور اليدوي بنجاح');
      setSelectedUserId('');
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
            تسجيل حضور يدوي استثنائي
          </DialogTitle>
          <DialogDescription>
            جلسة: «{dayTitle}» — تسجيل حضور مخدوم لتعذر مسح رمز QR أو لأسباب تنظيمية
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
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
              {filteredUsers.length === 0 ? (
                <div className="p-4 text-center text-xs text-[#A5A8B5]">
                  لا يوجد أعضاء غير مسجلين مطابقين للبحث
                </div>
              ) : (
                filteredUsers.map((u) => (
                  <label
                    key={u.id}
                    className={`flex items-center justify-between p-3 cursor-pointer hover:bg-[#20232B] transition-colors ${
                      selectedUserId === u.id ? 'bg-[#695CFF]/15 border-l-4 border-l-[#695CFF]' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="selectedUser"
                        value={u.id}
                        checked={selectedUserId === u.id}
                        onChange={() => setSelectedUserId(u.id)}
                        className="text-[#695CFF] focus:ring-[#695CFF]"
                      />
                      <div>
                        <p className="text-xs font-semibold text-[#F1F2F7]">{u.name}</p>
                        <p className="text-[11px] text-[#A5A8B5]">{u.levelName || 'عام'}</p>
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
              سبب / ملاحظة التسجيل اليدوي
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
              تسجيل الحضور
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
