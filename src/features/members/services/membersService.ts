import { User, UserStatus, UserRole, PagedResponse, Gender } from '../../../types/common';
import { CreateUserDto, UpdateUserDto } from '../../../types/api';
import { mockStorage } from '../../../mocks/mock-storage';
import { simulateNetworkDelay } from '../../../lib/api/api-config';
import { CHURCH_LEVELS } from '../../../lib/constants';
import {
  supabase,
  isSupabaseEnabled,
  mapDbUser,
  insertSupabaseAuditLog,
} from '../../../lib/supabase';

export interface GetUsersParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: UserStatus;
  gender?: Gender;
  levelId?: string;
  sortBy?: 'name' | 'createdAtUtc' | 'status';
  sortDirection?: 'asc' | 'desc';
}

export const membersService = {
  async getUsers(params: GetUsersParams = {}): Promise<PagedResponse<User>> {
    const {
      page = 1,
      pageSize = 10,
      search = '',
      status,
      gender,
      levelId,
      sortBy = 'createdAtUtc',
      sortDirection = 'desc',
    } = params;

    let users: User[] = [];

    if (isSupabaseEnabled()) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('is_deleted', false);
      if (error) throw new Error(error.message);
      users = (data || []).map(r => mapDbUser(r as Record<string, unknown>));
    } else {
      await simulateNetworkDelay();
      users = mockStorage.getUsers().filter(u => !u.isDeleted);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      users = users.filter(
        u =>
          u.name.toLowerCase().includes(q) ||
          u.phoneNumber.includes(q) ||
          (u.confessionFather && u.confessionFather.toLowerCase().includes(q)) ||
          (u.university && u.university.toLowerCase().includes(q)) ||
          (u.studyYear && u.studyYear.toLowerCase().includes(q))
      );
    }

    if (status !== undefined) {
      users = users.filter(u => u.status === Number(status));
    }

    if (gender !== undefined) {
      users = users.filter(u => u.gender === Number(gender));
    }

    if (levelId && levelId !== 'all') {
      users = users.filter(u => u.levelId === levelId);
    }

    users.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'name') {
        cmp = a.name.localeCompare(b.name, 'ar');
      } else if (sortBy === 'createdAtUtc') {
        cmp = new Date(a.createdAtUtc).getTime() - new Date(b.createdAtUtc).getTime();
      } else if (sortBy === 'status') {
        cmp = a.status - b.status;
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });

    const totalCount = users.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const startIdx = (page - 1) * pageSize;
    const paginatedItems = users.slice(startIdx, startIdx + pageSize);

    return {
      items: paginatedItems,
      page,
      pageSize,
      totalCount,
      totalPages,
    };
  },

  async getEligibleActiveUsers(): Promise<User[]> {
    if (isSupabaseEnabled()) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('is_deleted', false)
        .eq('status', UserStatus.Active)
        .eq('role', UserRole.User)
        .order('name', { ascending: true });
      if (error) throw new Error(error.message);
      return (data || []).map(r => mapDbUser(r as Record<string, unknown>));
    }
    await simulateNetworkDelay();
    return mockStorage.getEligibleActiveUsers();
  },

  async getUserById(id: string): Promise<User | null> {
    if (isSupabaseEnabled()) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .eq('is_deleted', false)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data ? mapDbUser(data as Record<string, unknown>) : null;
    }
    await simulateNetworkDelay();
    const user = mockStorage.getUsers().find(u => u.id === id && !u.isDeleted);
    return user || null;
  },

  async createUser(dto: CreateUserDto): Promise<User> {
    const levelObj = CHURCH_LEVELS.find(l => l.id === dto.levelId);
    const studyYearVal = dto.studyYear || (levelObj ? levelObj.name : 'الفرقة الأولى');

    if (isSupabaseEnabled()) {
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('phone_number', dto.phoneNumber)
        .eq('is_deleted', false)
        .maybeSingle();

      if (existing) {
        throw new Error('رقم الهاتف مسجل مسبقًا لعضو آخر');
      }

      const id = `usr-${Date.now()}`;
      const status = dto.status ?? UserStatus.Pending;
      const nowIso = new Date().toISOString();

      const { data, error } = await supabase
        .from('users')
        .insert({
          id,
          name: dto.name,
          phone_number: dto.phoneNumber,
          gender: dto.gender,
          age: dto.age ?? null,
          level_id: dto.levelId ?? 'lvl-1',
          level_name: levelObj ? levelObj.name : studyYearVal,
          university: dto.university || 'جامعة عين شمس',
          study_year: studyYearVal,
          confession_father: dto.confessionFather || null,
          address: dto.address || null,
          status,
          role: UserRole.User,
          points: dto.points ?? 0,
          accept_notifications: true,
          created_at_utc: nowIso,
          approved_at_utc: status === UserStatus.Active ? nowIso : null,
          is_deleted: false,
        })
        .select('*')
        .single();

      if (error) throw new Error(error.message);

      if (dto.password && dto.password.trim()) {
        await supabase.rpc('admin_set_user_password', {
          p_user_id: id,
          p_password: dto.password.trim(),
        });
      }

      const createdUser = mapDbUser(data as Record<string, unknown>);

      await insertSupabaseAuditLog({
        action: 'إضافة عضو جديد',
        targetType: 'User',
        targetId: createdUser.id,
        details: `تم تسجيل العضو ${createdUser.name} بحالة ${createdUser.status === UserStatus.Active ? 'نشط' : 'معلق'}`,
        performedBy: 'المدير العام (أدمن)',
      });

      return createdUser;
    }

    await simulateNetworkDelay();
    const users = mockStorage.getUsers();
    const exists = users.find(u => u.phoneNumber === dto.phoneNumber && !u.isDeleted);
    if (exists) {
      throw new Error('رقم الهاتف مسجل مسبقًا لعضو آخر');
    }

    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: dto.name,
      phoneNumber: dto.phoneNumber,
      gender: dto.gender,
      age: dto.age,
      levelId: dto.levelId,
      levelName: levelObj ? levelObj.name : undefined,
      university: dto.university,
      studyYear: studyYearVal,
      confessionFather: dto.confessionFather,
      address: dto.address,
      status: dto.status ?? UserStatus.Pending,
      role: UserRole.User,
      points: dto.points ?? 0,
      createdAtUtc: new Date().toISOString(),
      approvedAtUtc: dto.status === UserStatus.Active ? new Date().toISOString() : null,
    };

    users.unshift(newUser);
    mockStorage.saveUsers(users);

    mockStorage.addAuditLog({
      action: 'إضافة عضو جديد',
      targetType: 'User',
      targetId: newUser.id,
      details: `تم تسجيل العضو ${newUser.name} بحالة ${newUser.status === UserStatus.Active ? 'نشط' : 'معلق'}`,
      performedBy: 'المدير العام (أدمن)',
    });

    return newUser;
  },

  async updateUser(id: string, dto: UpdateUserDto): Promise<User> {
    const levelObj = CHURCH_LEVELS.find(l => l.id === dto.levelId);

    if (isSupabaseEnabled()) {
      const updatePayload: Record<string, unknown> = {
        name: dto.name,
        age: dto.age ?? null,
        level_id: dto.levelId ?? null,
        confession_father: dto.confessionFather ?? null,
        address: dto.address ?? null,
      };
      if (levelObj) {
        updatePayload.level_name = levelObj.name;
      }
      if (dto.university !== undefined) {
        updatePayload.university = dto.university;
      }
      if (dto.studyYear !== undefined) {
        updatePayload.study_year = dto.studyYear;
      }
      if (dto.points !== undefined) {
        updatePayload.points = dto.points;
      }

      const { data, error } = await supabase
        .from('users')
        .update(updatePayload)
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw new Error(error.message);

      if (dto.password && dto.password.trim()) {
        await supabase.rpc('admin_set_user_password', {
          p_user_id: id,
          p_password: dto.password.trim(),
        });
      }

      const updated = mapDbUser(data as Record<string, unknown>);

      await insertSupabaseAuditLog({
        action: 'تعديل بيانات عضو',
        targetType: 'User',
        targetId: id,
        details: `تم تحديث البيانات الشخصية للعضو ${updated.name}`,
        performedBy: 'المدير العام (أدمن)',
      });

      return updated;
    }

    await simulateNetworkDelay();
    const users = mockStorage.getUsers();
    const index = users.findIndex(u => u.id === id);
    if (index === -1) throw new Error('العضو غير موجود');

    users[index] = {
      ...users[index],
      name: dto.name,
      age: dto.age,
      levelId: dto.levelId,
      levelName: levelObj ? levelObj.name : users[index].levelName,
      university: dto.university !== undefined ? dto.university : users[index].university,
      studyYear: dto.studyYear !== undefined ? dto.studyYear : users[index].studyYear,
      confessionFather: dto.confessionFather,
      address: dto.address,
      points: dto.points !== undefined ? dto.points : users[index].points,
    };

    mockStorage.saveUsers(users);

    mockStorage.addAuditLog({
      action: 'تعديل بيانات عضو',
      targetType: 'User',
      targetId: id,
      details: `تم تحديث البيانات الشخصية للعضو ${users[index].name}`,
      performedBy: 'المدير العام (أدمن)',
    });

    return users[index];
  },

  async updateUserStatus(id: string, newStatus: UserStatus): Promise<User> {
    const statusLabels: Record<UserStatus, string> = {
      [UserStatus.Pending]: 'معلق',
      [UserStatus.Active]: 'نشط',
      [UserStatus.Suspended]: 'موقوف',
    };

    if (isSupabaseEnabled()) {
      const existing = await this.getUserById(id);
      if (!existing) throw new Error('العضو غير موجود');

      const oldStatus = existing.status;
      const approvedAtUtc =
        newStatus === UserStatus.Active && !existing.approvedAtUtc
          ? new Date().toISOString()
          : existing.approvedAtUtc;

      const { data, error } = await supabase
        .from('users')
        .update({
          status: newStatus,
          approved_at_utc: approvedAtUtc,
        })
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw new Error(error.message);
      const updated = mapDbUser(data as Record<string, unknown>);

      if (newStatus === UserStatus.Active && oldStatus !== UserStatus.Active) {
        await supabase.from('notifications').insert({
          id: `notif-${Date.now()}`,
          user_id: id,
          title: 'تم تفعيل عضويتك بنجاح',
          body: `مرحباً بك يا ${updated.name} في أسرة الملاك غبريال! يمكنك الآن تسجيل الحضور بمسح رمز QR.`,
          type: 'approval',
          is_read: false,
          created_at_utc: new Date().toISOString(),
        });
      }

      await insertSupabaseAuditLog({
        action: newStatus === UserStatus.Active ? 'قبول عضوية' : 'تغيير حالة عضو',
        targetType: 'User',
        targetId: id,
        details: `تم تغيير حالة ${updated.name} من (${statusLabels[oldStatus]}) إلى (${statusLabels[newStatus]})`,
        performedBy: 'المدير العام (أدمن)',
      });

      return updated;
    }

    await simulateNetworkDelay();
    const users = mockStorage.getUsers();
    const user = users.find(u => u.id === id);
    if (!user) throw new Error('العضو غير موجود');

    const oldStatus = user.status;
    user.status = newStatus;
    if (newStatus === UserStatus.Active && !user.approvedAtUtc) {
      user.approvedAtUtc = new Date().toISOString();
    }

    mockStorage.saveUsers(users);

    mockStorage.addAuditLog({
      action: newStatus === UserStatus.Active ? 'قبول عضوية' : 'تغيير حالة عضو',
      targetType: 'User',
      targetId: id,
      details: `تم تغيير حالة ${user.name} من (${statusLabels[oldStatus]}) إلى (${statusLabels[newStatus]})`,
      performedBy: 'المدير العام (أدمن)',
    });

    return user;
  },

  async deactivateUser(id: string): Promise<void> {
    if (isSupabaseEnabled()) {
      const existing = await this.getUserById(id);
      if (!existing) throw new Error('العضو غير موجود');

      const { error } = await supabase
        .from('users')
        .update({
          is_deleted: true,
          status: UserStatus.Suspended,
        })
        .eq('id', id);

      if (error) throw new Error(error.message);

      await insertSupabaseAuditLog({
        action: 'تعطيل حساب عضو',
        targetType: 'User',
        targetId: id,
        details: `تم تعطيل حساب ${existing.name} (حذف منطقي Soft Delete)`,
        performedBy: 'المدير العام (أدمن)',
      });
      return;
    }

    await simulateNetworkDelay();
    const users = mockStorage.getUsers();
    const user = users.find(u => u.id === id);
    if (!user) throw new Error('العضو غير موجود');

    user.isDeleted = true;
    user.status = UserStatus.Suspended;
    mockStorage.saveUsers(users);

    mockStorage.addAuditLog({
      action: 'تعطيل حساب عضو',
      targetType: 'User',
      targetId: id,
      details: `تم تعطيل حساب ${user.name} (حذف منطقي Soft Delete)`,
      performedBy: 'المدير العام (أدمن)',
    });
  },
};
