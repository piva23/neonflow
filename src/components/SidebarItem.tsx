import React from 'react';
import { NavLink } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';
import { useTheme } from '../hooks';
import { getThemeColors } from '../utils/themeHelpers';

interface SidebarItemProps {
  to: string;
  label: string;
  icon: LucideIcon;
  onClick?: () => void;
  collapsed?: boolean;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({
  to,
  label,
  icon: Icon,
  onClick,
  collapsed = false,
}) => {
  const { activeTheme } = useTheme();
  const themeColors = getThemeColors(activeTheme);

  return (
    <NavLink
      to={to}
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={({ isActive }) => `
        group relative flex items-center gap-3.5 ${collapsed ? 'px-3 justify-center' : 'px-4'} py-3.5 rounded-xl font-medium text-sm transition-all duration-300 select-none
        ${isActive
          ? `bg-gradient-to-r from-brand-surface to-brand-surface/40 text-white ${themeColors.border} shadow-[0_4px_20px_rgba(0,0,0,0.15)]`
          : 'text-brand-text-muted hover:text-brand-text hover:bg-white/5'
        }
      `}
    >
      {({ isActive }) => (
        <>
          {/* Active side indicator glow */}
          {isActive && (
            <span className={`absolute left-0 top-1/4 bottom-1/4 w-1 rounded-r-full bg-brand-purple shadow-[0_0_10px_#7b2cbf]`}
              style={{
                backgroundColor: activeTheme === 'blue' ? '#00b4d8' : activeTheme === 'cyan' ? '#06d6a0' : activeTheme === 'pink' ? '#ff007f' : '#7b2cbf',
                boxShadow: `0 0 10px ${activeTheme === 'blue' ? '#00b4d8' : activeTheme === 'cyan' ? '#06d6a0' : activeTheme === 'pink' ? '#ff007f' : '#7b2cbf'}`
              }}
            />
          )}

          {/* Icon */}
          <Icon className={`w-5 h-5 shrink-0 transition-transform duration-300 group-hover:scale-105
            ${isActive ? themeColors.text : 'text-brand-text-muted group-hover:text-brand-text'}
          `} />

          {/* Label */}
          {!collapsed && <span className="tracking-wide truncate">{label}</span>}
        </>
      )}
    </NavLink>
  );
};
