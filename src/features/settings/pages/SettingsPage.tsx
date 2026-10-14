import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery } from '@tanstack/react-query';
import { 
  Save, 
  RotateCcw, 
  Church, 
  Phone, 
  Mail, 
  MessageCircle, 
  Users, 
  Share2, 
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { PageHeader } from '../../../components/shared/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { ConfirmDialog } from '../../../components/shared/ConfirmDialog';
import { settingsService } from '../services/settingsService';
import { AppSetting } from '../../../types/common';
import { toast } from 'sonner';

const schema = z.object({
  churchName: z.string().min(3, 'اسم الكنيسة يجب ألا يقل عن 3 أحرف'),
  contactPhone: z.string().min(5, 'يرجى إدخال رقم هاتف التواصل'),
  contactEmail: z.string().email('صيغة البريد الإلكتروني غير صحيحة').or(z.literal('')),
  maleContactWhatsAppUrl: z.string().url('رابط واتساب يجب أن يبدأ بـ https://').or(z.literal('')),
  maleGroupWhatsAppUrl: z.string().url('رابط مجموعة واتساب يجب أن يبدأ بـ https://').or(z.literal('')),
  femaleGroupWhatsAppUrl: z.string().url('رابط مجموعة واتساب يجب أن يبدأ بـ https://').or(z.literal('')),
  facebookPageUrl: z.string().url('رابط صفحة فيسبوك يجب أن يبدأ بـ https://').or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

export const SettingsPage: React.FC = () => {
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { data: settings, isLoading, refetch } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsService.getSettings(),
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (settings) {
      reset(settings);
    }
  }, [settings, reset]);

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSaving(true);
      await settingsService.updateSettings(values as AppSetting);
      toast.success('تم حفظ إعدادات الكنيسة وروابط التواصل بنجاح');
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء حفظ الإعدادات');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetAllData = async () => {
    try {
      await settingsService.resetAllData();
      toast.success('تمت إعادة تعيين جميع البيانات التجريبية إلى حالتها الابتدائية');
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (err: any) {
      toast.error('حدث خطأ أثناء إعادة التعيين');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-xs text-[#A5A8B5]">
        جاري تحميل الإعدادات...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="إعدادات الكنيسة والتواصل"
        description="إدارة الاسم الرسمي للكنيسة وبيانات الاتصال وروابط مجموعات واتساب وفيسبوك التي تظهر للمخدومين"
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Church Identity */}
        <Card className="hover:border-[#454958] transition-colors">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Church className="h-5 w-5 text-[#695CFF]" />
              الهوية الرسمية وبيانات الاتصال
            </CardTitle>
            <CardDescription className="text-xs">
              تظهر هذه البيانات في رأس لوحة التحكم وتطبيق الهاتف ومستندات الطباعة
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#A5A8B5] mb-1">
                اسم الكنيسة الرسمي <span className="text-[#E85D75]">*</span>
              </label>
              <Input
                placeholder="اسم الكنيسة"
                {...register('churchName')}
                error={errors.churchName?.message}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#A5A8B5] mb-1">
                  رقم الهاتف الرسمي للاتصال <span className="text-[#E85D75]">*</span>
                </label>
                <Input
                  placeholder="01001234567"
                  dir="ltr"
                  className="text-right"
                  icon={<Phone className="h-4 w-4" />}
                  {...register('contactPhone')}
                  error={errors.contactPhone?.message}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#A5A8B5] mb-1">
                  البريد الإلكتروني الرسمي
                </label>
                <Input
                  placeholder="info@church.org"
                  dir="ltr"
                  className="text-right"
                  icon={<Mail className="h-4 w-4" />}
                  {...register('contactEmail')}
                  error={errors.contactEmail?.message}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Social & WhatsApp Links */}
        <Card className="hover:border-[#454958] transition-colors">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Share2 className="h-5 w-5 text-[#27CFA5]" />
              روابط التواصل الاجتماعي ومجموعات الواتساب
            </CardTitle>
            <CardDescription className="text-xs">
              روابط مخصصة تظهر في الصفحة الرئيسية لتطبيق الهاتف وفق جنس المخدوم (ذكور / إناث)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-[#A5A8B5]">
                  رابط التواصل المباشر مع مسؤول الشباب (واتساب)
                </label>
                {watch('maleContactWhatsAppUrl') && (
                  <a
                    href={watch('maleContactWhatsAppUrl')}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-[#27CFA5] hover:underline flex items-center gap-1"
                  >
                    <span>اختبار الرابط</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              <Input
                placeholder="https://wa.me/201001234567"
                dir="ltr"
                icon={<MessageCircle className="h-4 w-4 text-[#27CFA5]" />}
                {...register('maleContactWhatsAppUrl')}
                error={errors.maleContactWhatsAppUrl?.message}
              />
              <p className="mt-1 text-[11px] text-[#A5A8B5]">
                الرابط المخصص لخدمة الشباب ومسؤول المرحلة للتواصل السريع
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#A5A8B5] mb-1">
                  رابط مجموعة واتساب (للذكور)
                </label>
                <Input
                  placeholder="https://chat.whatsapp.com/..."
                  dir="ltr"
                  icon={<Users className="h-4 w-4 text-[#695CFF]" />}
                  {...register('maleGroupWhatsAppUrl')}
                  error={errors.maleGroupWhatsAppUrl?.message}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#A5A8B5] mb-1">
                  رابط مجموعة واتساب (للإناث)
                </label>
                <Input
                  placeholder="https://chat.whatsapp.com/..."
                  dir="ltr"
                  icon={<Users className="h-4 w-4 text-[#E85D75]" />}
                  {...register('femaleGroupWhatsAppUrl')}
                  error={errors.femaleGroupWhatsAppUrl?.message}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-[#A5A8B5]">
                  رابط صفحة الكنيسة على Facebook
                </label>
                {watch('facebookPageUrl') && (
                  <a
                    href={watch('facebookPageUrl')}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-[#9D94FF] hover:underline flex items-center gap-1"
                  >
                    <span>فتح الصفحة</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              <Input
                placeholder="https://facebook.com/church.page"
                dir="ltr"
                icon={<Share2 className="h-4 w-4 text-[#9D94FF]" />}
                {...register('facebookPageUrl')}
                error={errors.facebookPageUrl?.message}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end pt-4 border-t border-[#30333E]/60">
            <Button
              type="submit"
              isLoading={isSaving}
              className="gap-2 shadow-md shadow-[#695CFF]/25 font-semibold"
            >
              <Save className="h-4 w-4" />
              <span>حفظ التغييرات</span>
            </Button>
          </CardFooter>
        </Card>
      </form>

      {/* Demo Mode & Reset Data Zone */}
      <Card className="border-[#DDAA48]/30 bg-[#DDAA48]/5">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-[#DDAA48]">
            <Sparkles className="h-5 w-5" />
            إدارة بيئة المحاكاة التجريبية (Demo Mode)
          </CardTitle>
          <CardDescription className="text-xs">
            يتم تخزين جميع التعديلات والإضافات التي تجريها في المتصفح عبر localStorage. يمكنك إعادة تعيين كافة البيانات إلى حالتها الأصلية المبدئية في أي وقت.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#17191F] border border-[#30333E]">
            <div className="space-y-1">
              <span className="text-xs font-bold text-[#F1F2F7]">
                إعادة ضبط قاعدة البيانات التجريبية
              </span>
              <p className="text-[11px] text-[#A5A8B5]">
                استعادة الأعضاء الأوليين والجلسات النموذجية وسجلات الحضور الافتراضية
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setResetConfirmOpen(true)}
              className="text-[#DDAA48] border-[#DDAA48]/40 hover:bg-[#DDAA48]/10 gap-1.5 shrink-0"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>إعادة تعيين البيانات الأصلية</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Confirm Reset Dialog */}
      <ConfirmDialog
        open={resetConfirmOpen}
        onOpenChange={setResetConfirmOpen}
        title="تأكيد إعادة تعيين البيانات التجريبية"
        description="سيتم مسح كافة التعديلات والجلسات والأعضاء المضافين وإعادة تحميل البيانات الابتدائية المعتمدة للنظام. هل ترغب بالاستمرار؟"
        confirmText="نعم، إعادة التعيين"
        cancelText="إلغاء"
        variant="amber"
        onConfirm={handleResetAllData}
      />
    </div>
  );
};
