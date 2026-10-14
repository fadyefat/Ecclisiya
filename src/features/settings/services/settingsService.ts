import { AppSetting } from '../../../types/common';
import { mockStorage } from '../../../mocks/mock-storage';
import { simulateNetworkDelay } from '../../../lib/api/api-config';

export const settingsService = {
  async getSettings(): Promise<AppSetting> {
    await simulateNetworkDelay();
    return mockStorage.getSettings();
  },

  async updateSettings(dto: AppSetting): Promise<AppSetting> {
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
