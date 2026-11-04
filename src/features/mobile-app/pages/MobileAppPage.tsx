import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Smartphone,
  Bell,
  HelpCircle,
  Send,
  CheckCircle2,
  XCircle,
  Trash2,
  Copy,
  Check,
  QrCode,
  Sparkles,
  RefreshCw,
  UserCheck,
} from 'lucide-react';
import { PageHeader } from '../../../components/shared/PageHeader';
import { StatCard } from '../../../components/shared/StatCard';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Select } from '../../../components/ui/select';
import { Textarea } from '../../../components/ui/textarea';
import { Badge } from '../../../components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../components/ui/tabs';
import { mobilePortalService } from '../services/mobilePortalService';
import { membersService } from '../../members/services/membersService';
import { attendanceDaysService } from '../../attendance-days/services/attendanceDaysService';
import { MOBILE_API_URL, SUPABASE_URL, supabase, isSupabaseEnabled } from '../../../lib/supabase';
import { formatArabicDateTime } from '../../../lib/date-utils';
import { formatPhoneNumber } from '../../../lib/formatters';
import { MobileNotification } from '../../../types/common';
import { toast } from 'sonner';

export const MobileAppPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'help' | 'notifications' | 'api'>('help');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifBody, setNotifBody] = useState('');
  const [notifType, setNotifType] = useState<MobileNotification['type']>('general');
  const [notifUserId, setNotifUserId] = useState<string>('all');
  const [isSendingNotif, setIsSendingNotif] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [simUserId, setSimUserId] = useState<string>('usr-1');
  const [isSimulating, setIsSimulating] = useState(false);

  const {
    data: helpRequests = [],
    isLoading: isHelpLoading,
    refetch: refetchHelp,
  } = useQuery({
    queryKey: ['mobile-help-requests'],
    queryFn: () => mobilePortalService.getHelpRequests(),
  });

  const {
    data: notifications = [],
    isLoading: isNotifLoading,
    refetch: refetchNotifications,
  } = useQuery({
    queryKey: ['mobile-notifications'],
    queryFn: () => mobilePortalService.getNotifications(),
  });

  const { data: activeUsers = [] } = useQuery({
    queryKey: ['mobile-eligible-users'],
    queryFn: () => membersService.getEligibleActiveUsers(),
  });

  const { data: daysData, refetch: refetchDays } = useQuery({
    queryKey: ['mobile-attendance-days'],
    queryFn: () => attendanceDaysService.getAttendanceDays({ page: 1, pageSize: 20 }),
  });

  const openSession = (daysData?.items || []).find(d => d.isOpen || d.status === 'Open');
  const pendingHelpCount = helpRequests.filter(h => h.status === 'Pending').length;

  const handleResolveHelp = async (id: string, markAttendance: boolean) => {
    try {
      await mobilePortalService.resolveHelpRequest(id, markAttendance);
      toast.success(
        markAttendance
          ? 'تم قبول طلب المساعدة وتسجيل حضور الطالب وإرسال إشعار له'
          : 'تمت معالجة طلب المساعدة بنجاح'
      );
      refetchHelp();
      refetchNotifications();
      refetchDays();
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء معالجة الطلب');
    }
  };

  const handleDismissHelp = async (id: string) => {
    try {
      await mobilePortalService.dismissHelpRequest(id);
      toast.success('تم إغلاق طلب المساعدة');
      refetchHelp();
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء إغلاق الطلب');
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifBody.trim()) {
      toast.error('يرجى إدخال عنوان ونص الإشعار');
      return;
    }

    try {
      setIsSendingNotif(true);
      await mobilePortalService.sendNotification({
        userId: notifUserId === 'all' ? null : notifUserId,
        title: notifTitle.trim(),
        body: notifBody.trim(),
        type: notifType,
      });
      toast.success('تم إرسال الإشعار لتطبيق الموبايل بنجاح');
      setNotifTitle('');
      setNotifBody('');
      refetchNotifications();
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء إرسال الإشعار');
    } finally {
      setIsSendingNotif(false);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      await mobilePortalService.deleteNotification(id);
      toast.success('تم حذف الإشعار');
      refetchNotifications();
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء حذف الإشعار');
    }
  };

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(key);
    toast.success('تم النسخ إلى الحافظة');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSimulateQrScan = async () => {
    if (!openSession) {
      toast.error('لا توجد جلسة مفتوحة حالياً لمحاكاة مسح QR');
      return;
    }
    try {
      setIsSimulating(true);
      if (isSupabaseEnabled()) {
        const qrPayload = JSON.stringify({
          app: 'Ecclesia',
          attendanceDayId: openSession.id,
          token: openSession.qrToken,
          date: openSession.date,
        });
        const { data, error } = await supabase.rpc('mobile_scan_qr', {
          p_user_id: simUserId,
          p_qr_payload: qrPayload,
        });
        if (error) throw new Error(error.message);
        const res = data as Record<string, unknown>;
        if (!res.success) {
          toast.error(String(res.message || 'تعذر تسجيل الحضور'));
        } else {
          toast.success(String(res.message || 'تم مسح الرمز وتسجيل الحضور بنجاح'));
          refetchDays();
          refetchNotifications();
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'فشل محاكاة مسح QR');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleSimulateHelpRequest = async () => {
    try {
      setIsSimulating(true);
      if (isSupabaseEnabled()) {
        const { data, error } = await supabase.rpc('mobile_request_help', {
          p_user_id: simUserId,
          p_message: 'طلب مساعدة تجريبي من شاشة ماسح الـ QR بالقاعة',
        });
        if (error) throw new Error(error.message);
        const res = data as Record<string, unknown>;
        toast.success(String(res.message || 'تم إرسال طلب المساعدة'));
        refetchHelp();
      }
    } catch (err: any) {
      toast.error(err.message || 'فشل إرسال طلب المساعدة');
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="بوابة تطبيق الموبايل (Angel Gabriel Flutter)"
        description="إدارة طلبات المساعدة الفورية بالقاعة، إرسال الإشعارات للطلاب، ومراقبة الربط السحابي المباشر"
        action={
          <Button
            variant="outline"
            onClick={() => {
              refetchHelp();
              refetchNotifications();
              refetchDays();
              toast.success('تم تحديث بيانات الموبايل');
            }}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>تحديث فوري</span>
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="طلبات مساعدة بالقاعة"
          value={pendingHelpCount}
          subtitle="بانتظار تدخل خادم النظام"
          icon={HelpCircle}
          color="coral"
        />
        <StatCard
          title="إجمالي الإشعارات"
          value={notifications.length}
          subtitle="إشعارات الطلاب والتنبيهات"
          icon={Bell}
          color="purple"
        />
        <StatCard
          title="الجلسة المفتوحة للموبايل"
          value={openSession ? openSession.sessionCode || 'مفتوحة' : 'مغلقة'}
          subtitle={openSession ? openSession.title : 'لا توجد جلسة مفتوحة حالياً'}
          icon={QrCode}
          color="mint"
        />
        <StatCard
          title="الطلاب المؤهلون بالموبايل"
          value={activeUsers.length}
          subtitle="حسابات نشطة جاهزة للمسح"
          icon={Smartphone}
          color="amber"
        />
      </div>

      <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
        <TabsList>
          <TabsTrigger value="help" badge={pendingHelpCount}>
            طلبات المساعدة بالقاعة
          </TabsTrigger>
          <TabsTrigger value="notifications" badge={notifications.length}>
            إشعارات تطبيق الموبايل
          </TabsTrigger>
          <TabsTrigger value="api">
            ربط ومحاكاة تطبيق الموبايل
          </TabsTrigger>
        </TabsList>

        <TabsContent value="help" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-[#E85D75]" />
                طلبات المساعدة الواردة من شاشة مسح QR
              </CardTitle>
              <CardDescription className="text-xs">
                عندما يتعذر على الطالب مسح رمز QR من هاتفه ويضغط على زر «طلب المساعدة من خادم النظام بالقاعة»، يظهر طلبه هنا فوراً لاعتماد حضوره بضغطة واحدة
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isHelpLoading ? (
                <div className="p-8 text-center text-xs text-[#A5A8B5]">
                  جاري تحميل طلبات المساعدة...
                </div>
              ) : helpRequests.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#A5A8B5]">
                  لا توجد طلبات مساعدة حالياً
                </div>
              ) : (
                <div className="space-y-3">
                  {helpRequests.map((req) => (
                    <div
                      key={req.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#20232B]/70 border border-[#30333E]"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-[#F1F2F7]">{req.userName}</span>
                          <span dir="ltr" className="text-xs font-mono text-[#A5A8B5]">
                            ({formatPhoneNumber(req.phoneNumber)})
                          </span>
                          {req.status === 'Pending' && (
                            <Badge variant="amber" dot>قيد الانتظار بالقاعة</Badge>
                          )}
                          {req.status === 'Resolved' && (
                            <Badge variant="mint" dot>تم الحل وتسجيل الحضور</Badge>
                          )}
                          {req.status === 'Dismissed' && (
                            <Badge variant="gray" dot>تم الإغلاق</Badge>
                          )}
                        </div>
                        <p className="text-xs text-[#A5A8B5]">{req.message}</p>
                        <div className="flex items-center gap-3 text-[11px] text-[#6C7080]">
                          <span>الوقت: {formatArabicDateTime(req.createdAtUtc)}</span>
                          {req.attendanceDayTitle && <span>الجلسة: {req.attendanceDayTitle}</span>}
                        </div>
                      </div>

                      {req.status === 'Pending' && (
                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() => handleResolveHelp(req.id, true)}
                            className="gap-1.5 text-xs"
                          >
                            <UserCheck className="h-3.5 w-3.5" />
                            <span>قبول وتسجيل الحضور</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDismissHelp(req.id)}
                            className="gap-1.5 text-xs text-[#E85D75] border-[#E85D75]/40 hover:bg-[#E85D75]/10"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            <span>تجاهل</span>
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-4 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <Card className="lg:col-span-5">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Send className="h-4 w-4 text-[#695CFF]" />
                  إرسال إشعار جديد لتطبيق الموبايل
                </CardTitle>
                <CardDescription className="text-xs">
                  يظهر الإشعار فوراً في تبويب «الإشعارات» داخل تطبيق الموبايل لدى الطلاب
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSendNotification} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-[#A5A8B5] mb-1">
                      المستلم
                    </label>
                    <Select
                      value={notifUserId}
                      onChange={(e) => setNotifUserId(e.target.value)}
                    >
                      <option value="all">جميع الطلاب (إشعار عام مشترك)</option>
                      {activeUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.phoneNumber})
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#A5A8B5] mb-1">
                      تصنيف الإشعار
                    </label>
                    <Select
                      value={notifType}
                      onChange={(e) => setNotifType(e.target.value as MobileNotification['type'])}
                    >
                      <option value="general">تنبيه عام</option>
                      <option value="attendance">تنبيه حضور واجتماع</option>
                      <option value="event">فعالية روحية / خلوة</option>
                      <option value="reminder">تذكير بموعد</option>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#A5A8B5] mb-1">
                      عنوان الإشعار <span className="text-[#E85D75]">*</span>
                    </label>
                    <Input
                      placeholder="مثال: موعد اجتماع أسرة الملاك غبريال"
                      value={notifTitle}
                      onChange={(e) => setNotifTitle(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#A5A8B5] mb-1">
                      نص الرسالة <span className="text-[#E85D75]">*</span>
                    </label>
                    <Textarea
                      rows={3}
                      placeholder="اكتب تفاصيل الرسالة التي ستظهر للطلاب..."
                      value={notifBody}
                      onChange={(e) => setNotifBody(e.target.value)}
                    />
                  </div>

                  <Button type="submit" isLoading={isSendingNotif} className="w-full gap-2">
                    <Send className="h-4 w-4" />
                    <span>إرسال الإشعار الآن</span>
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="lg:col-span-7">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Bell className="h-4 w-4 text-[#DDAA48]" />
                  سجل الإشعارات المرسلة ({notifications.length})
                </CardTitle>
                <CardDescription className="text-xs">
                  قائمة الإشعارات المحفوظة في قاعدة البيانات والمعروضة داخل تطبيق الموبايل
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isNotifLoading ? (
                  <div className="p-8 text-center text-xs text-[#A5A8B5]">
                    جاري تحميل الإشعارات...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#A5A8B5]">
                    لا توجد إشعارات مرسلة
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className="flex items-start justify-between gap-3 p-3.5 rounded-xl bg-[#20232B]/60 border border-[#30333E]"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs text-[#F1F2F7]">{n.title}</span>
                            <Badge variant={n.userId ? 'default' : 'mint'}>
                              {n.userName || (n.userId ? 'طالب محدد' : 'جميع الطلاب')}
                            </Badge>
                          </div>
                          <p className="text-xs text-[#A5A8B5] leading-relaxed">{n.body}</p>
                          <span className="block text-[10px] text-[#6C7080]">
                            {formatArabicDateTime(n.createdAtUtc)}
                          </span>
                        </div>
                        <Button
                          size="iconSm"
                          variant="ghost"
                          className="text-[#E85D75] hover:bg-[#E85D75]/10 shrink-0"
                          onClick={() => handleDeleteNotification(n.id)}
                          title="حذف الإشعار"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="api" className="mt-4 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-[#27CFA5]" />
                  إعدادات الربط السحابي لتطبيق Flutter
                </CardTitle>
                <CardDescription className="text-xs">
                  بيانات الاتصال المباشر بـ Supabase Edge Functions وقاعدة البيانات السحابية
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3.5 rounded-xl bg-[#101116] border border-[#30333E] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#A5A8B5]">Mobile REST API Base URL:</span>
                    <button
                      type="button"
                      onClick={() => handleCopy('api', MOBILE_API_URL)}
                      className="text-xs text-[#695CFF] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {copiedField === 'api' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>نسخ الرابط</span>
                    </button>
                  </div>
                  <p dir="ltr" className="text-xs font-mono text-[#27CFA5] break-all">
                    {MOBILE_API_URL}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#101116] border border-[#30333E] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#A5A8B5]">Supabase Project URL:</span>
                    <button
                      type="button"
                      onClick={() => handleCopy('url', SUPABASE_URL)}
                      className="text-xs text-[#695CFF] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {copiedField === 'url' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>نسخ</span>
                    </button>
                  </div>
                  <p dir="ltr" className="text-xs font-mono text-[#F1F2F7] break-all">
                    {SUPABASE_URL}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#20232B]/60 border border-[#30333E] space-y-2 text-xs">
                  <p className="font-bold text-[#F1F2F7]">حسابات طلاب جاهزة للتجربة على الموبايل:</p>
                  <div className="space-y-1 text-[#A5A8B5]" dir="ltr">
                    <p>• Phone: <strong className="text-[#F1F2F7]">01012345678</strong> | Pass: <strong className="text-[#27CFA5]">123456</strong> (بيشوي صبحي)</p>
                    <p>• Phone: <strong className="text-[#F1F2F7]">01123456789</strong> | Pass: <strong className="text-[#27CFA5]">123456</strong> (مريم جرجس)</p>
                    <p>• Phone: <strong className="text-[#F1F2F7]">01234567890</strong> | Pass: <strong className="text-[#27CFA5]">123456</strong> (كيرلس ملاك)</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-[#DDAA48]" />
                  محاكي إجراءات تطبيق الموبايل الفوري
                </CardTitle>
                <CardDescription className="text-xs">
                  اختبر تسجيل الحضور بمسح QR أو إرسال طلب مساعدة كما لو أن الطالب قام به من هاتفه الآن
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#A5A8B5] mb-1">
                    اختر الطالب للمحاكاة
                  </label>
                  <Select
                    value={simUserId}
                    onChange={(e) => setSimUserId(e.target.value)}
                  >
                    {activeUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} — {u.phoneNumber} ({u.points ?? 0} نقطة)
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="p-3.5 rounded-xl bg-[#20232B] border border-[#30333E] text-xs space-y-1">
                  <span className="text-[#A5A8B5]">الجلسة المفتوحة حالياً:</span>
                  {openSession ? (
                    <p className="font-bold text-[#27CFA5]">
                      {openSession.title} ({openSession.sessionCode}) — الرمز: {openSession.qrToken}
                    </p>
                  ) : (
                    <p className="font-bold text-[#E85D75]">
                      لا توجد جلسة مفتوحة حالياً (افتح جلسة من صفحة جلسات الحضور)
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <Button
                    type="button"
                    variant="success"
                    isLoading={isSimulating}
                    onClick={handleSimulateQrScan}
                    disabled={!openSession}
                    className="gap-2 text-xs"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>محاكاة مسح QR ناجح</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    isLoading={isSimulating}
                    onClick={handleSimulateHelpRequest}
                    className="gap-2 text-xs text-[#DDAA48] border-[#DDAA48]/40 hover:bg-[#DDAA48]/10"
                  >
                    <HelpCircle className="h-4 w-4" />
                    <span>محاكاة طلب مساعدة بالقاعة</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
