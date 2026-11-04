import { describe, it, expect, beforeEach } from 'vitest';
import { mockStorage } from '../mocks/mock-storage';
import { AttendanceMethod, Gender, UserRole, UserStatus } from '../types/common';

describe('MockStorage and Core Business Rules', () => {
  beforeEach(() => {
    mockStorage.resetAllMockData();
    mockStorage.saveUsers([
      {
        id: 'u-1',
        name: 'عضو اختبار 1',
        phoneNumber: '01012345678',
        gender: Gender.Male,
        status: UserStatus.Active,
        role: UserRole.User,
        createdAtUtc: '2026-01-01T00:00:00Z',
      },
      {
        id: 'u-2',
        name: 'عضو اختبار 2',
        phoneNumber: '01112345678',
        gender: Gender.Female,
        status: UserStatus.Active,
        role: UserRole.User,
        createdAtUtc: '2026-01-01T00:00:00Z',
      },
    ]);
    mockStorage.saveAttendanceDays([
      {
        id: 'att-day-1',
        title: 'اجتماع 1',
        date: '2026-10-01',
        startAt: '2026-10-01T18:00:00Z',
        endAt: '2026-10-01T20:00:00Z',
        status: 'Finalized',
        isOpen: false,
        location: 'القاعة',
        totalEligibleUsers: 2,
        totalAttendees: 0,
        totalAbsentees: 0,
        attendancePercentage: 0,
        qrToken: 'TOKEN-1',
      },
      {
        id: 'att-day-5',
        title: 'اجتماع 2',
        date: '2026-10-08',
        startAt: '2026-10-08T18:00:00Z',
        endAt: '2026-10-08T20:00:00Z',
        status: 'Open',
        isOpen: true,
        location: 'القاعة',
        totalEligibleUsers: 2,
        totalAttendees: 0,
        totalAbsentees: 0,
        attendancePercentage: 0,
        qrToken: 'TOKEN-2',
      },
    ]);
    mockStorage.saveAttendances([
      {
        id: 'at-1',
        userId: 'u-1',
        attendanceDayId: 'att-day-1',
        markedAtUtc: '2026-10-01T18:10:00Z',
        method: AttendanceMethod.QrCode,
      },
    ]);
  });

  it('loads users and filters active eligible users', () => {
    const eligible = mockStorage.getEligibleActiveUsers();
    expect(eligible.length).toBe(2);

    eligible.forEach(user => {
      expect(user.status).toBe(UserStatus.Active);
      expect(user.isDeleted).toBeFalsy();
    });
  });

  it('computes attendance metrics and enforces finalized rule for absentees', () => {
    const day1 = mockStorage.recomputeDayMetrics('att-day-1');
    expect(day1).not.toBeNull();
    expect(day1?.status).toBe('Finalized');
    expect(day1?.totalAttendees).toBe(1);
    expect(day1?.totalAbsentees).toBe(1);
    expect(day1?.attendancePercentage).toBe(50);

    const day5 = mockStorage.recomputeDayMetrics('att-day-5');
    expect(day5).not.toBeNull();
    expect(day5?.status).toBe('Open');
    expect(day5?.totalAbsentees).toBe(0);
  });
});
