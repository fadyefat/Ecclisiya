import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Select } from '../../../components/ui/select';
import { Textarea } from '../../../components/ui/textarea';
import { membersService } from '../services/membersService';
import { User } from '../../../types/common';
import { CHURCH_LEVELS } from '../../../lib/constants';
import { toast } from 'sonner';

const schema = z.object({
  name: z.string().min(3, 'الاسم يجب ألا يقل عن 3 أحرف').max(200, 'الاسم طويل جدًا'),
  age: z.any().optional(),
  levelId: z.string().min(1, 'يرجى اختيار المرحلة'),
  confessionFather: z.string().optional(),
  address: z.string().optional(),
});

type FormValues = {
  name: string;
  age?: number;
  levelId: string;
  confessionFather?: string;
  address?: string;
};

interface EditMemberDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const EditMemberDialog: React.FC<EditMemberDialogProps> = ({
  user,
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
  });

  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        age: user.age || undefined,
        levelId: user.levelId || 'lvl-univ',
        confessionFather: user.confessionFather || '',
        address: user.address || '',
      });
    }
  }, [user, reset]);

  if (!user) return null;

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      await membersService.updateUser(user.id, {
        name: values.name,
        age: values.age ? Number(values.age) : undefined,
        levelId: values.levelId,
        confessionFather: values.confessionFather,
        address: values.address,
      });

      toast.success('تم تحديث بيانات العضو بنجاح');
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء تعديل البيانات');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-lg">
        <DialogHeader>
          <DialogTitle>تعديل بيانات العضو</DialogTitle>
          <DialogDescription>
            تعديل البيانات الشخصية والمرحلة وأب الاعتراف
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#A5A8B5] mb-1">
                الاسم بالكامل <span className="text-[#E85D75]">*</span>
              </label>
              <Input
                placeholder="اسم العضو"
                {...register('name')}
                error={errors.name?.message}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#A5A8B5] mb-1">
                رقم الهاتف (غير متاح للتعديل المباشر)
              </label>
              <Input
                value={user.phoneNumber}
                disabled
                className="bg-[#20232B] text-[#A5A8B5] cursor-not-allowed"
                title="رقم الهاتف هو معرّف الحساب ولا يمكن تعديله إلا عبر إجراء أمني مستقل"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

          <div>
            <label className="block text-xs font-medium text-[#A5A8B5] mb-1">
              أب الاعتراف
            </label>
            <Input
              placeholder="اسم أب الاعتراف"
              {...register('confessionFather')}
              error={errors.confessionFather?.message}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#A5A8B5] mb-1">
              العنوان / المنطقة
            </label>
            <Textarea
              rows={2}
              placeholder="العنوان السكني"
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
              حفظ التعديلات
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
