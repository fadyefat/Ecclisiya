import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Church, Lock, User, Eye, EyeOff, LogIn } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { authService } from '../services/authService';
import { APP_NAME, APP_SUBTITLE } from '../../../lib/constants';
import { toast } from 'sonner';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      toast.error('يرجى إدخال رقم الهاتف أو اسم المستخدم وكلمة المرور');
      return;
    }

    try {
      setIsLoading(true);
      const session = await authService.login(identifier, password);
      toast.success(`مرحباً بك، ${session.admin.name}`);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      toast.error(err.message || 'بيانات الدخول غير صحيحة');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center bg-[#101116] px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#695CFF] text-white shadow-xl shadow-[#695CFF]/30">
            <Church className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#F1F2F7] tracking-tight">
              {APP_NAME} — لوحة الإدارة
            </h1>
            <p className="text-xs text-[#A5A8B5] mt-1">{APP_SUBTITLE}</p>
          </div>
        </div>

        <div className="rounded-2xl bg-[#17191F] border border-[#30333E] p-6 sm:p-8 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-[#F1F2F7]">تسجيل دخول المسؤول</h2>
            <p className="text-xs text-[#A5A8B5] mt-1">
              أدخل بيانات حساب الإدارة للوصول إلى نظام متابعة الحضور والأعضاء
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#A5A8B5] mb-1.5">
                رقم الهاتف أو اسم المستخدم
              </label>
              <Input
                placeholder="01000000000 أو admin"
                dir="ltr"
                className="text-right"
                icon={<User className="h-4 w-4" />}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#A5A8B5] mb-1.5">
                كلمة المرور
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  dir="ltr"
                  className="text-right pl-10"
                  icon={<Lock className="h-4 w-4" />}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#A5A8B5] hover:text-[#F1F2F7] cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                isLoading={isLoading}
                className="w-full h-11 gap-2 font-bold shadow-lg shadow-[#695CFF]/25"
              >
                <LogIn className="h-4 w-4" />
                <span>تسجيل الدخول</span>
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
