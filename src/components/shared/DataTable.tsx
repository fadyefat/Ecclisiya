import React from 'react';
import { TableSkeleton } from './LoadingSkeleton';
import { EmptyState } from './EmptyState';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '../ui/button';

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  page?: number;
  pageSize?: number;
  totalPages?: number;
  totalCount?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  keyExtractor: (item: T) => string;
}

export function DataTable<T>({
  columns,
  data,
  isLoading,
  emptyTitle = 'لا توجد بيانات متاحة',
  emptyDescription,
  page = 1,
  pageSize = 10,
  totalPages = 1,
  totalCount,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50],
  keyExtractor,
}: DataTableProps<T>) {
  if (isLoading) {
    return <TableSkeleton rows={pageSize > 10 ? 10 : pageSize} cols={columns.length} />;
  }

  if (!data || data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="w-full space-y-4">
      <div className="overflow-x-auto rounded-2xl border border-[#30333E] bg-[#17191F]">
        <table className="w-full text-right text-sm">
          <thead className="border-b border-[#30333E] bg-[#20232B]/60 text-xs text-[#A5A8B5] font-semibold">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`px-4 py-3.5 whitespace-nowrap ${col.className || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#30333E]/50">
            {data.map((item) => (
              <tr
                key={keyExtractor(item)}
                className="transition-colors hover:bg-[#20232B]/40"
              >
                {columns.map((col, colIdx) => (
                  <td
                    key={colIdx}
                    className={`px-4 py-3.5 text-[#F1F2F7] align-middle ${col.className || ''}`}
                  >
                    {col.cell
                      ? col.cell(item)
                      : col.accessorKey
                      ? String(item[col.accessorKey] ?? '—')
                      : null}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      {onPageChange && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 text-xs text-[#A5A8B5]">
          <div className="flex items-center gap-2">
            <span>
              عرض {data.length} من أصل {totalCount !== undefined ? totalCount : data.length} سجل
            </span>
            {onPageSizeChange && (
              <div className="flex items-center gap-1.5 mr-3">
                <span>لكل صفحة:</span>
                <select
                  value={pageSize}
                  onChange={(e) => onPageSizeChange(Number(e.target.value))}
                  className="rounded-lg border border-[#30333E] bg-[#101116] px-2 py-1 text-xs text-[#F1F2F7] focus:outline-none focus:border-[#695CFF]"
                >
                  {pageSizeOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            <span className="ml-2 font-medium">
              الصفحة {page} من {totalPages}
            </span>
            <Button
              variant="outline"
              size="iconSm"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              title="الصفحة السابقة"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="iconSm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              title="الصفحة التالية"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
