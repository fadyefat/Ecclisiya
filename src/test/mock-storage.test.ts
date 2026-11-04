import { describe, it, expect, beforeEach } from 'vitest';
import { mockStorage } from '../mocks/mock-storage';
import { UserStatus } from '../types/common';

describe('MockStorage and Core Business Rules', () => {
  beforeEach(() => {
    mockStorage.resetAllMockData();
  });

  it('loads initial users and filters active eligible users', () => {
    const eligible = mockStorage.getEligibleActiveUsers();
    expect(eligible.length).toBeGreaterThan(0);

    eligible.forEach(user => {
      expect(user.status).toBe(UserStatus.Active);
      expect(user.isDeleted).toBeFalsy();
    });
  });

  it('computes attendance metrics and enforces finalized rule for absentees', () => {

    const day1 = mockStorage.recomputeDayMetrics('att-day-1');
    expect(day1).not.toBeNull();
    expect(day1?.status).toBe('Finalized');
    expect(day1?.totalAttendees).toBe(9);
    expect(day1?.totalAbsentees).toBe(1);
    expect(day1?.attendancePercentage).toBe(90);

    const day5 = mockStorage.recomputeDayMetrics('att-day-5');
    expect(day5).not.toBeNull();
    expect(day5?.status).toBe('Open');
    expect(day5?.totalAbsentees).toBe(0);
  });
});
