import { User, UserStatus, UserRole, PagedResponse, Gender } from '../../../types/common';
import { CreateUserDto, UpdateUserDto } from '../../../types/api';
import { mockStorage } from '../../../mocks/mock-storage';
import { simulateNetworkDelay } from '../../../lib/api/api-config';
import { CHURCH_LEVELS } from '../../../lib/constants';

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
    await simulateNetworkDelay();
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

    let users = mockStorage.getUsers().filter(u => !u.isDeleted);

    // Search by name or phone
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      users = users.filter(u => 
        u.name.toLowerCase().includes(q) || 
        u.phoneNumber.includes(q) ||
        (u.confessionFather && u.confessionFather.toLowerCase().includes(q))
      );
    }

    // Filter by status
    if (status !== undefined) {
      users = users.filter(u => u.status === Number(status));
    }

    // Filter by gender
    if (gender !== undefined) {
      users = users.filter(u => u.gender === Number(gender));
    }

    // Filter by level
    if (levelId && levelId !== 'all') {
      users = users.filter(u => u.levelId === levelId);
    }

    // Sorting
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

  async getUserById(id: string): Promise<User | null> {
    await simulateNetworkDelay();
    const user = mockStorage.getUsers().find(u => u.id === id && !u.isDeleted);
    return user || null;
  },

  async createUser(dto: CreateUserDto): Promise<User> {
    await simulateNetworkDelay();
    const users = mockStorage.getUsers();

    // Check duplicate phone
    const exists = users.find(u => u.phoneNumber === dto.phoneNumber && !u.isDeleted);
    if (exists) {
      throw new Error('رقم الهاتف مسجل مسبقًا لعضو آخر');
    }

    const levelObj = CHURCH_LEVELS.find(l => l.id === dto.levelId);

    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: dto.name,
      phoneNumber: dto.phoneNumber,
      gender: dto.gender,
      age: dto.age,
      levelId: dto.levelId,
      levelName: levelObj ? levelObj.name : undefined,
      confessionFather: dto.confessionFather,
      address: dto.address,
      status: dto.status ?? UserStatus.Pending,
      role: UserRole.User,
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
    await simulateNetworkDelay();
    const users = mockStorage.getUsers();
    const index = users.findIndex(u => u.id === id);
    if (index === -1) throw new Error('العضو غير موجود');

    const levelObj = CHURCH_LEVELS.find(l => l.id === dto.levelId);

    users[index] = {
      ...users[index],
      name: dto.name,
      age: dto.age,
      levelId: dto.levelId,
      levelName: levelObj ? levelObj.name : users[index].levelName,
      confessionFather: dto.confessionFather,
      address: dto.address,
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

    const statusLabels: Record<UserStatus, string> = {
      [UserStatus.Pending]: 'معلق',
      [UserStatus.Active]: 'نشط',
      [UserStatus.Suspended]: 'موقوف',
    };

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
