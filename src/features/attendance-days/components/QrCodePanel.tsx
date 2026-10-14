import React, { useRef, useState } from 'react';
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { AttendanceDay } from '../../../types/common';
import { attendanceDaysService } from '../services/attendanceDaysService';
import { 
  Download, 
  Printer, 
  RefreshCw, 
  Play, 
  Square, 
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

interface QrCodePanelProps {
  day: AttendanceDay;
  onRefresh: () => void;
}

export const QrCodePanel: React.FC<QrCodePanelProps> = ({ day, onRefresh }) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isRotating, setIsRotating] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  const qrValue = JSON.stringify({
    app: 'Ecclesia',
    attendanceDayId: day.id,
    token: day.qrToken,
    date: day.date,
    expiresAt: day.qrTokenExpiresAtUtc || null,
  });

  const handleDownloadPng = () => {
    const canvas = canvasRef.current?.querySelector('canvas');
    if (!canvas) {
      toast.error('تعذر إنشاء صورة الرمز');
      return;
    }
    const pngUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = pngUrl;
    link.download = `Ecclesia-QR-${day.date}-${day.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('تم تنزيل رمز QR بصيغة PNG بنجاح');
  };

  const handleDownloadSvg = () => {
    const svgElem = document.getElementById(`qr-svg-${day.id}`);
    if (!svgElem) {
      toast.error('تعذر العثور على ملف SVG');
      return;
    }
    const svgData = new XMLSerializer().serializeToString(svgElem);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    const link = document.createElement('a');
    link.href = svgUrl;
    link.download = `Ecclesia-QR-${day.date}-${day.id}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(svgUrl);
    toast.success('تم تنزيل رمز QR بصيغة SVG بنجاح');
  };

  const handlePrint = () => {
    const canvas = canvasRef.current?.querySelector('canvas');
    if (!canvas) return;
    const pngUrl = canvas.toDataURL('image/png');

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('يرجى السماح بالنوافذ المنبثقة للطباعة');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="utf-8" />
          <title>طباعة رمز تسجيل الحضور — ${day.title}</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              text-align: center;
              padding: 40px;
              color: #111;
            }
            .container {
              max-width: 500px;
              margin: 0 auto;
              border: 2px dashed #999;
              padding: 30px;
              border-radius: 20px;
            }
            h1 { font-size: 24px; margin-bottom: 8px; }
            h2 { font-size: 16px; color: #555; margin-top: 0; }
            .meta { font-size: 14px; margin: 15px 0; color: #444; }
            img { max-width: 320px; height: auto; margin: 20px 0; }
            .footer { font-size: 12px; color: #777; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Ecclesia — إدارة الحضور الكنسي</h1>
            <h2>${day.title}</h2>
            <div class="meta">
              <p>التاريخ: ${day.date}</p>
              <p>المكان: ${day.location}</p>
              <p>امسح الرمز عبر تطبيق الهاتف لتسجيل حضورك في الاجتماع</p>
            </div>
            <img src="${pngUrl}" alt="QR Code" />
            <div class="footer">
              رمز تسجيل معتمد صالح خلال وقت الاجتماع فقط
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleRotateToken = async () => {
    try {
      setIsRotating(true);
      await attendanceDaysService.refreshQrToken(day.id);
      toast.success('تم تدوير وتجديد مفتاح رمز QR بنجاح');
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء تجديد الرمز');
    } finally {
      setIsRotating(false);
    }
  };

  const handleToggleOpenClose = async () => {
    try {
      setIsTogglingStatus(true);
      if (day.isOpen) {
        await attendanceDaysService.closeAttendanceDay(day.id);
        toast.success('تم إغلاق استقبال التسجيل');
      } else {
        await attendanceDaysService.openAttendanceDay(day.id);
        toast.success('تم فتح استقبال تسجيل الحضور وتحديث الرمز');
      }
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء تغيير حالة الجلسة');
    } finally {
      setIsTogglingStatus(false);
    }
  };

  return (
    <Card className="hover:border-[#454958] transition-colors relative overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <span>رمز تسجيل الحضور (QR Code)</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            {day.isOpen ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#27CFA5]/15 text-[#27CFA5] border border-[#27CFA5]/30">
                <span className="h-2 w-2 rounded-full bg-[#27CFA5] animate-ping" />
                التسجيل مفتوح الآن
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#DDAA48]/15 text-[#DDAA48] border border-[#DDAA48]/30">
                <span className="h-2 w-2 rounded-full bg-[#DDAA48]" />
                التسجيل مغلق
              </span>
            )}
          </div>
        </div>
        <CardDescription className="text-xs">
          اعرض هذا الرمز على شاشة العرض بالقاعة أو قم بطباعته لمسحه بواسطة تطبيق المخدومين
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Visual QR Code Display Container */}
        <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-[#101116] border border-[#30333E] relative">
          <div
            ref={canvasRef}
            className="p-4 rounded-2xl bg-white shadow-2xl flex items-center justify-center border-4 border-[#20232B]"
          >
            <QRCodeCanvas
              value={qrValue}
              size={220}
              level="H"
              includeMargin={true}
            />
          </div>

          {/* Hidden SVG for SVG download export */}
          <div className="hidden">
            <QRCodeSVG
              id={`qr-svg-${day.id}`}
              value={qrValue}
              size={500}
              level="H"
              includeMargin={true}
            />
          </div>

          {/* Token String snippet */}
          <div className="mt-4 text-center space-y-1">
            <span className="text-[10px] text-[#A5A8B5] font-mono">
              معرّف الجلسة الرمزي:
            </span>
            <p className="text-xs font-mono font-semibold text-[#9D94FF] bg-[#20232B] px-3 py-1 rounded-lg border border-[#30333E] max-w-sm truncate" dir="ltr">
              {day.qrToken}
            </p>
          </div>

          {/* Demo Disclaimer notice */}
          <div className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-[#695CFF]/10 border border-[#695CFF]/25 text-[11px] text-[#9D94FF] max-w-md">
            <Sparkles className="h-4 w-4 shrink-0 text-[#DDAA48]" />
            <span>
              <strong>وضع المحاكاة التجريبي:</strong> رمز QR مرئي وحقيقي تقنيًا، ويحمل Token تجريبيًا يمكن قراءته بأي كاميرا أو تطبيق تجريبي.
            </span>
          </div>
        </div>

        {/* Action Controls Toolbar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#30333E]/60">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPng}
            className="gap-1.5 text-xs"
          >
            <Download className="h-4 w-4 text-[#27CFA5]" />
            <span>تنزيل PNG</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadSvg}
            className="gap-1.5 text-xs"
          >
            <Download className="h-4 w-4 text-[#9D94FF]" />
            <span>تنزيل SVG</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="gap-1.5 text-xs"
          >
            <Printer className="h-4 w-4 text-[#DDAA48]" />
            <span>طباعة الرمز</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRotateToken}
            isLoading={isRotating}
            className="gap-1.5 text-xs text-[#A5A8B5] hover:text-[#F1F2F7]"
            title="تجديد المفتاح لمنع تسريب لقطات الشاشة"
          >
            <RefreshCw className="h-4 w-4 text-[#695CFF]" />
            <span>تجديد الرمز</span>
          </Button>
        </div>

        {/* Status Toggle Button */}
        <div className="pt-1">
          {day.isOpen ? (
            <Button
              variant="outline"
              onClick={handleToggleOpenClose}
              isLoading={isTogglingStatus}
              className="w-full text-xs text-[#E85D75] border-[#E85D75]/40 hover:bg-[#E85D75]/10 gap-2"
            >
              <Square className="h-4 w-4" />
              <span>إغلاق استقبال تسجيل الحضور</span>
            </Button>
          ) : (
            <Button
              variant="success"
              onClick={handleToggleOpenClose}
              isLoading={isTogglingStatus}
              className="w-full text-xs gap-2 font-bold"
            >
              <Play className="h-4 w-4" />
              <span>فتح استقبال تسجيل الحضور الآن</span>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
