import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { Select } from '../../../components/ui/select';
import { eventsService } from '../services/eventsService';
import { toast } from 'sonner';

const schema = z.object({
  title: z.string().min(3, 'عنوان الفعالية يجب ألا يقل عن 3 أحرف').max(200, 'الحد الأقصى 200 حرف'),
  description: z.string().optional(),
  date: z.string().min(1, 'يرجى تحديد تاريخ الفعالية'),
  startTime: z.string().min(1, 'يرجى تحديد وقت البدء'),
  endTime: z.string().optional(),
  location: z.string().min(2, 'يرجى إدخال مكان الفعالية'),
  status: z.enum(['Published', 'Draft', 'Cancelled']),
  createLinkedAttendanceDay: z.boolean().optional(),
});

type FormValues = {
  title: string;
  description?: string;
  date: string;
  startTime: string;
  endTime?: string;
  location: string;
  status: 'Published' | 'Draft' | 'Cancelled';
  createLinkedAttendanceDay?: boolean;
};

interface CreateEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const CreateEventDialog: React.FC<CreateEventDialogProps> = ({
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
      description: '',
      date: new Date().toISOString().split('T')[0],
      startTime: '10:00',
      endTime: '15:00',
      location: 'مقر الكنيسة',
      status: 'Published',
      createLinkedAttendanceDay: true,
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      const startAt = `${values.date}T${values.startTime}:00Z`;
      const endAt = values.endTime ? `${values.date}T${values.endTime}:00Z` : undefined;

      await eventsService.createEvent({
        title: values.title,
        description: values.description,
        startAt,
        endAt,
        location: values.location,
        status: values.status,
        createLinkedAttendanceDay: !!values.createLinkedAttendanceDay,
      });

      toast.success('تم إنشاء الفعالية بنجاح');
      reset();
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء إنشاء الفعالية');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-lg">
        <DialogHeader>
          <DialogTitle>إنشاء فعالية كنسية جديدة</DialogTitle>
          <DialogDescription>
            إضافة مؤتمر، قداس احتفالي، لقاء روحي أو نشاط ترفيهي
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div>
            <label className="block text-xs font-medium text-[#A5A8B5] mb-1">
              عنوان الفعالية <span className="text-[#E85D75]">*</span>
            </label>
            <Input
              placeholder="مثال: مؤتمر الشباب السنوي 2026"
              {...register('title')}
              error={errors.title?.message}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#A5A8B5] mb-1">
              الوصف والبرنامج
            </label>
            <Textarea
              placeholder="وصف الفعالية، الفقرات والأنشطة..."
              rows={3}
              {...register('description')}
              error={errors.description?.message}
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
                وقت البدء <span className="text-[#E85D75]">*</span>
              </label>
              <Input
                type="time"
                {...register('startTime')}
                error={errors.startTime?.message}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#A5A8B5] mb-1">
                وقت الانتهاء
              </label>
              <Input
                type="time"
                {...register('endTime')}
                error={errors.endTime?.message}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#A5A8B5] mb-1">
                المكان <span className="text-[#E85D75]">*</span>
              </label>
              <Input
                placeholder="مكان إقامة الفعالية"
                {...register('location')}
                error={errors.location?.message}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#A5A8B5] mb-1">
                حالة النشر
              </label>
              <Select {...register('status')}>
                <option value="Published">منشورة (ظاهرة للمخدومين)</option>
                <option value="Draft">مسودة (تحت الإعداد)</option>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-xl bg-[#20232B] border border-[#30333E]">
            <input
              type="checkbox"
              id="createLinkedDay"
              {...register('createLinkedAttendanceDay')}
              className="h-4 w-4 rounded border-[#30333E] text-[#695CFF] focus:ring-[#695CFF] cursor-pointer"
            />
            <label htmlFor="createLinkedDay" className="text-xs text-[#F1F2F7] cursor-pointer select-none">
              إنشاء جلسة تسجيل حضور مرتبطة بهذه الفعالية تلقائيًا
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
              حفظ الفعالية
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
