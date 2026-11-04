import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase, isSupabaseEnabled } from './supabase';

export function useRealtimeSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isSupabaseEnabled()) return;

    const channel = supabase
      .channel('ecclisiya-admin-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'users' },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['members'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard-recent-days'] });

          if (payload.eventType === 'INSERT') {
            const newUser = payload.new as { name?: string; university?: string; study_year?: string; role?: number };
            if (newUser.role !== 2) {
              const name = newUser.name || 'طالب جديد';
              const details = [newUser.university, newUser.study_year].filter(Boolean).join(' • ');
              toast.info(`طلب تسجيل جديد: ${name}`, {
                description: details || 'تم إرسال طلب عضوية جديد عبر تطبيق الموبايل وبحاجة للموافقة',
                duration: 6000,
              });
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'attendances' },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['attendance-days'] });
          queryClient.invalidateQueries({ queryKey: ['attendance-day-details'] });
          queryClient.invalidateQueries({ queryKey: ['day-attendances'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard-trend'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard-recent-days'] });
          queryClient.invalidateQueries({ queryKey: ['reports-summary'] });

          if (payload.eventType === 'INSERT') {
            const att = payload.new as { is_excused?: boolean };
            if (!att.is_excused) {
              toast.success('تسجيل حضور جديد عبر رمز QR بالقاعة', {
                duration: 4000,
              });
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'attendance_days' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['attendance-days'] });
          queryClient.invalidateQueries({ queryKey: ['attendance-day-details'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard-recent-days'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard-trend'] });
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'help_requests' },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['dashboard-audit-logs'] });
          const req = payload.new as { user_name?: string; message?: string };
          toast.warning(`طلب مساعدة بالقاعة: ${req.user_name || 'طالب'}`, {
            description: req.message || 'يواجه مشكلة في مسح رمز QR بالقاعة',
            duration: 7000,
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'audit_logs' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['dashboard-audit-logs'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
