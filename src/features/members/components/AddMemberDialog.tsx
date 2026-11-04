import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Select } from '../../../components/ui/select';
import { Textarea } from '../../../components/ui/textarea';
import { membersService } from '../services/membersService';
import { Gender, UserStatus } from '../../../types/common';
import { CHURCH_LEVELS, STUDY_YEARS, EGYPT_PHONE_REGEX } from '../../../lib/constants';
import { toast } from 'sonner';

const schema = z.object({
  name: z.string().min(3, 'الاسم يجب ألا يقل عن 3 أحرف').max(200, 'الاسم طويل جدًا'),
  phoneNumber: z.string().regex(EGYPT_PHONE_REGEX, 'يرجى إدخال رقم هاتف مصري صحيح (مثال: 01012345678)'),
  password: z.string().optional(),
  gender: z.any(),
  age: z.any().optional(),
  levelId: z.string().min(1, 'يرجى اختيار المرحلة'),
  university: z.string().optional(),
  studyYear: z.string().optional(),
  confessionFather: z.string().optional(),
  address: z.string().optional(),
  points: z.any().optional(),
  status: z.any().optional(),
});

type FormValues = {
  name: string;
  phoneNumber: string;
  password?: string;
  gender: number;
  age?: number;
  levelId: string;
  university?: string;
  studyYear?: string;
  confessionFather?: string;
  address?: string;
  points?: number;
  status: number;
};

interface AddMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const AddMemberDialog: React.FC<AddMemberDialogProps> = ({
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
      name: '',
      phoneNumber: '',
      password: '',
      gender: Gender.Male,
      age: 20,
      levelId: 'lvl-1',
      university: 'جامعة عين شمس - كلية الهندسة',
      studyYear: 'الفرقة الأولى',
      confessionFather: '',
      address: '',
      points: 0,
      status: UserStatus.Active,
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      await membersService.createUser({
        name: values.name,
        phoneNumber: values.phoneNumber,
        password: values.password || undefined,
        gender: Number(values.gender) as Gender,
        age: values.age ? Number(values.age) : undefined,
        levelId: values.levelId,
        university: values.university,
        studyYear: values.studyYear,
        confessionFather: values.confessionFather,
        address: values.address,
        points: values.points !== undefined ? Number(values.points) : 0,
        status: Number(values.status) as UserStatus,
      });

      toast.success('تمت إضافة العضو بنجاح');
      reset();
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء إضافة العضو');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-lg">
        <DialogHeader>
          <DialogTitle>إضافة عضو / طالب جديد</DialogTitle>
          <DialogDescription>
            تسجيل مخدوم جديد في قاعدة بيانات الكنيسة وتطبيق الموبايل
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#A5A8B5] mb-1">
                الاسم بالكامل <span className="text-[#E85D75]">*</span>
              </label>
              <Input
                placeholder="مثال: بيشوي صبحي مسعد"
                {...register('name')}
                error={errors.name?.message}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#A5A8B5] mb-1">
                رقم الهاتف (مصري) <span className="text-[#E85D75]">*</span>
              </label>
              <Input
                placeholder="01012345678"
                dir="ltr"
                className="text-right"
                {...register('phoneNumber')}
                error={errors.phoneNumber?.message}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#A5A8B5] mb-1">
                الجامعة والكلية (لتطبيق الموبايل)
              </label>
              <Input
                placeholder="مثال: جامعة عين شمس - كلية الهندسة"
                {...register('university')}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#A5A8B5] mb-1">
                الفرقة الدراسية
              </label>
              <Select {...register('studyYear')}>
                {STUDY_YEARS.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#A5A8B5] mb-1">
                النوع / الجنس <span className="text-[#E85D75]">*</span>
              </label>
              <Select {...register('gender')}>
                <option value={Gender.Male}>ذكر</option>
                <option value={Gender.Female}>أنثى</option>
              </Select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#A5A8B5] mb-1">
                العمر
              </label>
              <Input
                type="number"
                min={5}
                max={120}
                {...register('age')}
                error={errors.age?.message as any}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#A5A8B5] mb-1">
                المرحلة <span className="text-[#E85D75]">*</span>
              </label>
              <Select {...register('levelId')}>
                {CHURCH_LEVELS.map((lvl) => (
                  <option key={lvl.id} value={lvl.id}>
                    {lvl.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#A5A8B5] mb-1">
                أب الاعتراف
              </label>
              <Input
                placeholder="مثال: أبونا داود لمعي"
                {...register('confessionFather')}
                error={errors.confessionFather?.message}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#A5A8B5] mb-1">
                كلمة مرور تطبيق الموبايل (افتراضي: 123456)
              </label>
              <Input
                type="password"
                placeholder="123456"
                dir="ltr"
                {...register('password')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#A5A8B5] mb-1">
                حالة الحساب
              </label>
              <Select {...register('status')}>
                <option value={UserStatus.Active}>نشط (مباشرة)</option>
                <option value={UserStatus.Pending}>معلق (قيد المراجعة)</option>
              </Select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#A5A8B5] mb-1">
                رصيد النقاط الابتدائي
              </label>
              <Input
                type="number"
                min={0}
                {...register('points')}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#A5A8B5] mb-1">
              العنوان / المنطقة
            </label>
            <Textarea
              rows={2}
              placeholder="مثال: شبرا، القاهرة"
              {...register('address')}
              error={errors.address?.message}
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
            <Button type="submit" isLoading={isSubmitting}>
              إضافة العضو
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
