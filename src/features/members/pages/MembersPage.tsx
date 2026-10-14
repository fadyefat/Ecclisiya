import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { 
  UserPlus, 
  Search, 
  Filter, 
  RotateCcw, 
  CheckCircle, 
  Eye, 
  Edit3, 
  Trash2,
  PauseCircle,
  PlayCircle
} from 'lucide-react';
import { PageHeader } from '../../../components/shared/PageHeader';
import { DataTable, Column } from '../../../components/shared/DataTable';
import { UserStatusBadge } from '../../../components/shared/StatusBadge';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Select } from '../../../components/ui/select';
import { ConfirmDialog } from '../../../components/shared/ConfirmDialog';
import { AddMemberDialog } from '../components/AddMemberDialog';
import { EditMemberDialog } from '../components/EditMemberDialog';
import { MemberDetailsModal } from '../components/MemberDetailsModal';
import { membersService } from '../services/membersService';
import { User, UserStatus, Gender } from '../../../types/common';
import { CHURCH_LEVELS } from '../../../lib/constants';
import { formatArabicDate } from '../../../lib/date-utils';
import { formatPhoneNumber } from '../../../lib/formatters';
import { toast } from 'sonner';

export const MembersPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = searchParams.get('status');

  // Filter & Pagination State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<UserStatus | undefined>(
    initialStatus ? Number(initialStatus) : undefined
  );
  const [genderFilter, setGenderFilter] = useState<Gender | undefined>(undefined);
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal states
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [userToDeactivate, setUserToDeactivate] = useState<User | null>(null);

  // Query
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['members', page, pageSize, search, statusFilter, genderFilter, levelFilter],
    queryFn: () =>
      membersService.getUsers({
        page,
        pageSize,
        search,
        status: statusFilter,
        gender: genderFilter,
        levelId: levelFilter,
      }),
  });

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter(undefined);
    setGenderFilter(undefined);
    setLevelFilter('all');
    setPage(1);
    setSearchParams({});
  };

  const handleApproveUser = async (user: User) => {
    try {
      await membersService.updateUserStatus(user.id, UserStatus.Active);
      toast.success(`تمت الموافقة على تفعيل حساب ${user.name}`);
      refetch();
      if (detailsModalOpen) setDetailsModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء تفعيل الحساب');
    }
  };

  const handleToggleStatus = async (user: User) => {
    const newStatus = user.status === UserStatus.Active ? UserStatus.Suspended : UserStatus.Active;
    try {
      await membersService.updateUserStatus(user.id, newStatus);
      toast.success(
        newStatus === UserStatus.Active
          ? `تم إعادة تفعيل حساب ${user.name}`
          : `تم إيقاف حساب ${user.name}`
      );
      refetch();
      if (detailsModalOpen) setDetailsModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء تعديل حالة الحساب');
    }
  };

  const handleConfirmDeactivate = async () => {
    if (!userToDeactivate) return;
    try {
      await membersService.deactivateUser(userToDeactivate.id);
      toast.success(`تم تعطيل حساب ${userToDeactivate.name}`);
      setUserToDeactivate(null);
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء تعطيل الحساب');
    }
  };

  const columns: Column<User>[] = [
    {
      header: 'اسم العضو',
      cell: (user) => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#20232B] border border-[#30333E] text-xs font-bold text-[#695CFF]">
            {user.name.slice(0, 1)}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-[#F1F2F7] truncate">{user.name}</span>
            <span className="text-[11px] text-[#A5A8B5]">
              {user.gender === Gender.Male ? 'ذكر' : 'أنثى'} • {user.age ? `${user.age} سنة` : ''}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: 'رقم الهاتف',
      cell: (user) => (
        <span dir="ltr" className="text-xs font-mono text-[#A5A8B5]">
          {formatPhoneNumber(user.phoneNumber)}
        </span>
      ),
    },
    {
      header: 'المرحلة',
      cell: (user) => (
        <span className="text-xs text-[#F1F2F7] bg-[#20232B] px-2 py-0.5 rounded-lg border border-[#30333E]">
          {user.levelName || 'عام'}
        </span>
      ),
    },
    {
      header: 'أب الاعتراف',
      cell: (user) => (
        <span className="text-xs text-[#A5A8B5]">
          {user.confessionFather || '—'}
        </span>
      ),
    },
    {
      header: 'تاريخ التسجيل',
      cell: (user) => (
        <span className="text-xs text-[#A5A8B5]">
          {formatArabicDate(user.createdAtUtc)}
        </span>
      ),
    },
    {
      header: 'الحالة',
      cell: (user) => <UserStatusBadge status={user.status} />,
    },
    {
      header: 'الإجراءات',
      className: 'text-left',
      cell: (user) => (
        <div className="flex items-center justify-end gap-1">
          {user.status === UserStatus.Pending && (
            <Button
              size="iconSm"
              variant="outline"
              className="text-[#27CFA5] border-[#27CFA5]/40 hover:bg-[#27CFA5]/10"
              onClick={() => handleApproveUser(user)}
              title="قبول الطلب"
            >
              <CheckCircle className="h-3.5 w-3.5" />
            </Button>
          )}

          {user.status === UserStatus.Active && (
            <Button
              size="iconSm"
              variant="ghost"
              className="text-[#E85D75] hover:bg-[#E85D75]/10"
              onClick={() => handleToggleStatus(user)}
              title="إيقاف الحساب"
            >
              <PauseCircle className="h-3.5 w-3.5" />
            </Button>
          )}

          {user.status === UserStatus.Suspended && (
            <Button
              size="iconSm"
              variant="ghost"
              className="text-[#27CFA5] hover:bg-[#27CFA5]/10"
              onClick={() => handleToggleStatus(user)}
              title="إعادة التفعيل"
            >
              <PlayCircle className="h-3.5 w-3.5" />
            </Button>
          )}

          <Button
            size="iconSm"
            variant="ghost"
            onClick={() => {
              setSelectedUser(user);
              setDetailsModalOpen(true);
            }}
            title="عرض التفاصيل"
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>

          <Button
            size="iconSm"
            variant="ghost"
            onClick={() => {
              setSelectedUser(user);
              setEditModalOpen(true);
            }}
            title="تعديل"
          >
            <Edit3 className="h-3.5 w-3.5" />
          </Button>

          <Button
            size="iconSm"
            variant="ghost"
            className="text-[#E85D75] hover:bg-[#E85D75]/10"
            onClick={() => {
              setUserToDeactivate(user);
              setDeactivateModalOpen(true);
            }}
            title="تعطيل الحساب"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="إدارة الأعضاء والمخدومين"
        description="استعراض طلبات العضوية، مراجعة وتعديل بيانات الأعضاء ومتابعة حالات الحسابات"
        action={
          <Button onClick={() => setAddModalOpen(true)} className="gap-2 shadow-md shadow-[#695CFF]/20">
            <UserPlus className="h-4 w-4" />
            <span>إضافة عضو جديد</span>
          </Button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[#17191F] border border-[#30333E] space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="lg:col-span-1">
            <Input
              placeholder="البحث بالاسم أو رقم الهاتف..."
              icon={<Search className="h-4 w-4" />}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          {/* Status Filter */}
          <div>
            <Select
              value={statusFilter !== undefined ? String(statusFilter) : 'all'}
              onChange={(e) => {
                const val = e.target.value;
                setStatusFilter(val === 'all' ? undefined : (Number(val) as UserStatus));
                setPage(1);
              }}
            >
              <option value="all">جميع الحالات</option>
              <option value={UserStatus.Active}>نشط</option>
              <option value={UserStatus.Pending}>معلق (طلبات جديدة)</option>
              <option value={UserStatus.Suspended}>موقوف</option>
            </Select>
          </div>

          {/* Gender Filter */}
          <div>
            <Select
              value={genderFilter !== undefined ? String(genderFilter) : 'all'}
              onChange={(e) => {
                const val = e.target.value;
                setGenderFilter(val === 'all' ? undefined : (Number(val) as Gender));
                setPage(1);
              }}
            >
              <option value="all">جميع الأنواع (ذكور وإناث)</option>
              <option value={Gender.Male}>ذكور فقط</option>
              <option value={Gender.Female}>إناث فقط</option>
            </Select>
          </div>

          {/* Level Filter */}
          <div>
            <Select
              value={levelFilter}
              onChange={(e) => {
                setLevelFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">جميع المراحل</option>
              {CHURCH_LEVELS.map((lvl) => (
                <option key={lvl.id} value={lvl.id}>
                  {lvl.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {/* Quick status tabs & Reset button */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#30333E]/50 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-[#A5A8B5] flex items-center gap-1 ml-1 font-medium">
              <Filter className="h-3 w-3" />
              تصفية سريعة:
            </span>
            <button
              onClick={() => { setStatusFilter(undefined); setPage(1); }}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                statusFilter === undefined ? 'bg-[#695CFF] text-white font-semibold' : 'text-[#A5A8B5] hover:bg-[#20232B]'
              }`}
            >
              الكل
            </button>
            <button
              onClick={() => { setStatusFilter(UserStatus.Pending); setPage(1); }}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                statusFilter === UserStatus.Pending ? 'bg-[#DDAA48] text-[#101116] font-semibold' : 'text-[#A5A8B5] hover:bg-[#20232B]'
              }`}
            >
              المعلقون فقط
            </button>
            <button
              onClick={() => { setStatusFilter(UserStatus.Active); setPage(1); }}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                statusFilter === UserStatus.Active ? 'bg-[#27CFA5] text-[#101116] font-semibold' : 'text-[#A5A8B5] hover:bg-[#20232B]'
              }`}
            >
              النشطون فقط
            </button>
          </div>

          {(search || statusFilter !== undefined || genderFilter !== undefined || levelFilter !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-7 text-xs text-[#A5A8B5] hover:text-[#F1F2F7] gap-1"
            >
              <RotateCcw className="h-3 w-3" />
              إعادة ضبط الفلاتر
            </Button>
          )}
        </div>
      </div>

      {/* Members DataTable */}
      <DataTable
        columns={columns}
        data={data?.items || []}
        isLoading={isLoading}
        emptyTitle="لا يوجد أعضاء مطابقون للبحث"
        emptyDescription="جرّب تعديل معايير التصفية أو قم بإضافة عضو جديد للمنظومة"
        page={page}
        pageSize={pageSize}
        totalPages={data?.totalPages || 1}
        totalCount={data?.totalCount}
        onPageChange={setPage}
        onPageSizeChange={(newSize) => {
          setPageSize(newSize);
          setPage(1);
        }}
        keyExtractor={(item) => item.id}
      />

      {/* Add Member Dialog */}
      <AddMemberDialog
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        onSuccess={() => refetch()}
      />

      {/* Edit Member Dialog */}
      <EditMemberDialog
        user={selectedUser}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onSuccess={() => refetch()}
      />

      {/* Member Details Modal */}
      <MemberDetailsModal
        user={selectedUser}
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        onApprove={handleApproveUser}
        onToggleStatus={handleToggleStatus}
        onEdit={(user) => {
          setDetailsModalOpen(false);
          setSelectedUser(user);
          setEditModalOpen(true);
        }}
      />

      {/* Deactivate User Confirmation Dialog */}
      <ConfirmDialog
        open={deactivateModalOpen}
        onOpenChange={setDeactivateModalOpen}
        title="تأكيد تعطيل حساب العضو"
        description={`هل أنت متأكد من رغبتك في تعطيل حساب العضو (${userToDeactivate?.name})؟ لن يتم حذف سجلات حضوره التاريخية للحفاظ على دقة الإحصائيات (حذف منطقي).`}
        confirmText="تعطيل الحساب"
        cancelText="تراجع"
        variant="destructive"
        onConfirm={handleConfirmDeactivate}
      />
    </div>
  );
};
