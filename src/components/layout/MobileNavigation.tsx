import React from 'react';
import { AppSidebar } from './AppSidebar';
import { X } from 'lucide-react';

interface MobileNavigationProps {
  open: boolean;
  onClose: () => void;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({ open, onClose }) => {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-72 max-w-[85vw] bg-[#17191F] shadow-2xl transition-transform transform translate-x-0 z-50 flex flex-col">
        <div className="absolute left-3 top-3.5 z-10">
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#20232B] border border-[#30333E] text-[#A5A8B5] hover:text-[#F1F2F7]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <AppSidebar
          collapsed={false}
          onToggleCollapse={onClose}
          onItemClick={onClose}
          className="border-none w-full"
        />
      </div>
    </div>
  );
};
