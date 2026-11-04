import { supabase, isSupabaseEnabled } from '../../../lib/supabase';

export interface AdminUserSession {
  token: string;
  admin: {
    id: string;
    name: string;
    phoneNumber: string;
    role: number;
  };
}

const ADMIN_SESSION_KEY = 'ecclisiya_admin_session_v1';

export const authService = {
  getSession(): AdminUserSession | null {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    try {
      const raw = localStorage.getItem(ADMIN_SESSION_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as AdminUserSession;
    } catch {
      return null;
    }
  },

  isAuthenticated(): boolean {
    const session = this.getSession();
    return Boolean(session && session.token && session.admin?.id);
  },

  async login(identifier: string, password: string): Promise<AdminUserSession> {
    const cleanId = identifier.trim();
    const cleanPass = password.trim();

    if (!cleanId || !cleanPass) {
      throw new Error('يرجى إدخال اسم المستخدم أو رقم الهاتف وكلمة المرور');
    }

    if (isSupabaseEnabled()) {
      const { data, error } = await supabase.rpc('admin_login', {
        p_identifier: cleanId,
        p_password: cleanPass,
      });

      if (error) throw new Error(error.message);

      const res = (data || {}) as Record<string, unknown>;
      if (!res.success) {
        throw new Error(String(res.message || 'بيانات الدخول غير صحيحة'));
      }

      const adminObj = (res.admin || {}) as Record<string, unknown>;
      const session: AdminUserSession = {
        token: String(res.token || ''),
        admin: {
          id: String(adminObj.id || 'admin-1'),
          name: String(adminObj.name || 'مدير النظام'),
          phoneNumber: String(adminObj.phoneNumber || '01000000000'),
          role: Number(adminObj.role || 2),
        },
      };

      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
      }

      return session;
    }

    if ((cleanId === 'admin' || cleanId === '01000000000') && cleanPass === 'admin123') {
      const session: AdminUserSession = {
        token: 'local-admin-token',
        admin: {
          id: 'admin-1',
          name: 'مدير النظام',
          phoneNumber: '01000000000',
          role: 2,
        },
      };
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
      }
      return session;
    }

    throw new Error('بيانات الدخول غير صحيحة');
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const session = this.getSession();
    if (!session) throw new Error('يرجى تسجيل الدخول أولاً');

    if (newPassword.trim().length < 6) {
      throw new Error('كلمة المرور الجديدة يجب ألا تقل عن 6 أحرف');
    }

    if (isSupabaseEnabled()) {
      const { data, error } = await supabase.rpc('admin_change_password', {
        p_admin_id: session.admin.id,
        p_current_password: currentPassword.trim(),
        p_new_password: newPassword.trim(),
      });

      if (error) throw new Error(error.message);
      const res = (data || {}) as Record<string, unknown>;
      if (!res.success) {
        throw new Error(String(res.message || 'فشل تغيير كلمة المرور'));
      }
    }
  },

  logout(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(ADMIN_SESSION_KEY);
    }
  },
};
