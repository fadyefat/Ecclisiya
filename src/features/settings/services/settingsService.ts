import { AppSetting } from '../../../types/common';
import { mockStorage } from '../../../mocks/mock-storage';
import { simulateNetworkDelay } from '../../../lib/api/api-config';
import {
  supabase,
  isSupabaseEnabled,
  mapDbAppSettings,
  insertSupabaseAuditLog,
} from '../../../lib/supabase';

export const settingsService = {
  async getSettings(): Promise<AppSetting> {
    if (isSupabaseEnabled()) {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (data) {
        return mapDbAppSettings(data as Record<string, unknown>);
      }
    }
    await simulateNetworkDelay();
    return mockStorage.getSettings();
  },

  async updateSettings(dto: AppSetting): Promise<AppSetting> {
    if (isSupabaseEnabled()) {
      const { data, error } = await supabase
        .from('app_settings')
        .upsert({
          id: 1,
          church_name: dto.churchName,
          contact_phone: dto.contactPhone,
          contact_email: dto.contactEmail,
          male_contact_whatsapp_url: dto.maleContactWhatsAppUrl,
          male_group_whatsapp_url: dto.maleGroupWhatsAppUrl,
          female_group_whatsapp_url: dto.femaleGroupWhatsAppUrl,
          facebook_page_url: dto.facebookPageUrl,
          verse_of_the_day: dto.verseOfTheDay || '',
          theme_mode: dto.themeMode || 'light',
          updated_at_utc: new Date().toISOString(),
        })
        .select('*')
        .single();

      if (error) throw new Error(error.message);
      const updated = mapDbAppSettings(data as Record<string, unknown>);

      await insertSupabaseAuditLog({
        action: 'تحديث إعدادات الكنيسة',
        targetType: 'Settings',
        details: 'تم تحديث بيانات الكنيسة وآية الأسبوع وروابط التواصل',
        performedBy: 'المدير العام (أدمن)',
      });

      return updated;
    }

    await simulateNetworkDelay();
    mockStorage.saveSettings(dto);

    mockStorage.addAuditLog({
      action: 'تحديث إعدادات الكنيسة',
      targetType: 'Settings',
      details: 'تم تحديث بيانات الكنيسة وروابط التواصل ومجموعات واتساب',
      performedBy: 'المدير العام (أدمن)',
    });

    return dto;
  },

  async resetAllData(): Promise<void> {
    await simulateNetworkDelay();
    mockStorage.resetAllMockData();
  },
};
