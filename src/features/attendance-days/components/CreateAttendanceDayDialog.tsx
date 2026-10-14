import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { attendanceDaysService } from '../services/attendanceDaysService';
import { toast } from 'sonner';

const schema = z.object({
  title: z.string().min(3, 'عنوان الاجتماع يجب ألا يقل عن 3 أحرف').max(200, 'الحد الأقصى 200 حرف'),
  date: z.string().min(1, 'يرجى تحديد تاريخ الجلسة'),
  startTime: z.string().min(1, 'يرجى تحديد وقت بداية الاجتماع'),
  endTime: z.string().min(1, 'يرجى تحديد وقت نهاية الاجتماع'),
  location: z.string().min(2, 'يرجى إدخال مكان الاجتماع'),
  notes: z.string().optional(),
  isOpen: z.boolean().optional(),
}).refine(data => {
  if (data.startTime && data.endTime) {
    return data.endTime > data.startTime;
  }
  return true;
}, {
  message: 'وقت النهاية يجب أن يكون بعد وقت البداية',
  path: ['endTime'],
});

type FormValues = {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  notes?: string;
  isOpen?: boolean;
};

interface CreateAttendanceDayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const CreateAttendanceDayDialog: React.FC<CreateAttendanceDayDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      title: '',
      date: new Date().toISOString().split('T')[0],
      startTime: '18:00',
      endTime: '20:30',
      location: 'القاعة الرئيسية — كنيسة العذراء',
      notes: '',
      isOpen: false,
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      const startAt = `${values.date}T${values.startTime}:00Z`;
      const endAt = `${values.date}T${values.endTime}:00Z`;

      await attendanceDaysService.createAttendanceDay({
        title: values.title,
        date: values.date,
        startAt,
        endAt,
        location: values.location,
        notes: values.notes,
        isOpen: !!values.isOpen,
      });

      toast.success('تم إنشاء جلسة الحضور بنجاح');
      reset();
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء إنشاء الجلسة');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-lg">
        <DialogHeader>
          <DialogTitle>إنشاء جلسة حضور جديدة</DialogTitle>
          <DialogDescription>
            أدخل تفاصيل الاجتماع أو الخدمة لتسجيل الحضور وتوليد رمز QR
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div>
            <label className="block text-xs font-medium text-[#A5A8B5] mb-1">
              عنوان الاجتماع / الخدمة <span className="text-[#E85D75]">*</span>
            </label>
            <Input
              placeholder="مثال: اجتماع شباب الجمعة — الأسبوع الثالث"
              {...register('title')}
              error={errors.title?.message}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#A5A8B5] mb-1">
                التاريخ <span className="text-[#E85D75]">*</span>
              </label>
              <Input
                type="date"
                {...register('date')}
                error={errors.date?.message}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#A5A8B5] mb-1">
                وقت البداية <span className="text-[#E85D75]">*</span>
              </label>
              <Input
                type="time"
                {...register('startTime')}
                error={errors.startTime?.message}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#A5A8B5] mb-1">
                وقت النهاية <span className="text-[#E85D75]">*</span>
              </label>
              <Input
                type="time"
                {...register('endTime')}
                error={errors.endTime?.message}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#A5A8B5] mb-1">
              مكان الاجتماع <span className="text-[#E85D75]">*</span>
            </label>
            <Input
              placeholder="مثال: القاعة الكبرى / كنيسة مارمرقس"
              {...register('location')}
              error={errors.location?.message}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#A5A8B5] mb-1">
              ملاحظات أو تعليمات إضافية
            </label>
            <Textarea
              placeholder="ملاحظات تنظيمية، موضوع الكلمة الروحية..."
              rows={2}
              {...register('notes')}
              error={errors.notes?.message}
            />
          </div>

          <div className="flex items-center gap-2 p-3 rounded-xl bg-[#20232B] border border-[#30333E]">
            <input
              type="checkbox"
              id="isOpen"
              {...register('isOpen')}
              className="h-4 w-4 rounded border-[#30333E] text-[#695CFF] focus:ring-[#695CFF] cursor-pointer"
            />
            <label htmlFor="isOpen" className="text-xs text-[#F1F2F7] cursor-pointer select-none">
              بدء الجلسة فورًا كمفتوحة لتسجيل الحضور وتوليد رمز QR المباشر
            </label>
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
            <Button type="submit" isLoading={isSubmitting}>
              إنشاء الجلسة
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
