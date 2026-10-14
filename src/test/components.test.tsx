import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatCard } from '../components/shared/StatCard';
import { UserStatusBadge, AttendanceDayStatusBadge } from '../components/shared/StatusBadge';
import { Users } from 'lucide-react';
import { UserStatus } from '../types/common';

describe('Shared UI Components', () => {
  it('renders StatCard with title, value, and subtitle', () => {
    render(
      <StatCard
        title="إجمالي الأعضاء"
        value={120}
        subtitle="جميع المراحل"
        icon={Users}
        color="mint"
      />
    );

    expect(screen.getByText('إجمالي الأعضاء')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.getByText('جميع المراحل')).toBeInTheDocument();
  });

  it('renders correct UserStatusBadge labels', () => {
    const { rerender } = render(<UserStatusBadge status={UserStatus.Active} />);
    expect(screen.getByText('نشط')).toBeInTheDocument();

    rerender(<UserStatusBadge status={UserStatus.Pending} />);
    expect(screen.getByText('معلق')).toBeInTheDocument();

    rerender(<UserStatusBadge status={UserStatus.Suspended} />);
    expect(screen.getByText('موقوف')).toBeInTheDocument();
  });

  it('renders correct AttendanceDayStatusBadge', () => {
    const { rerender } = render(<AttendanceDayStatusBadge status="Open" isOpen={true} />);
    expect(screen.getByText('مفتوحة للتسجيل')).toBeInTheDocument();

    rerender(<AttendanceDayStatusBadge status="Finalized" isOpen={false} />);
    expect(screen.getByText('معتمدة')).toBeInTheDocument();
  });
});
