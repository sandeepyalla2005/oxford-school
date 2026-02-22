import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Bus,
  ShoppingBag,
  History,
  AlertCircle,
  Settings,
  UserCog,
  MessageSquare,
  LogOut,
  CalendarDays,
  CalendarRange,
  UserRoundCog,
  BarChart3,
  UserCheck,
  ClipboardList
} from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';



const adminNavigation = [
  { name: 'Fee Structure', href: '/fee-structure', icon: Settings, roles: ['admin', 'feeInCharge'] },
  { name: 'Staff Login', href: '/staff-login', icon: UserRoundCog, roles: ['admin'] },
  { name: 'Settings', href: '/settings', icon: Settings, roles: ['admin'] },
];

const staffNavigation = [
  { name: 'My Profile', href: '/staff/profile', icon: UserCog, roles: ['staff'] },
  { name: 'Students', href: '/students', icon: GraduationCap, roles: ['staff'] },
  { name: 'My Schedule', href: '/staff/schedule', icon: CalendarDays, roles: ['staff'] },
  { name: 'Attendance', href: '/staff/attendance', icon: CalendarRange, roles: ['staff'] },
  { name: 'Homework', href: '/staff/homework', icon: BookOpen, roles: ['staff'] },
  { name: 'Academic Calendar', href: '/academic-calendar', icon: CalendarRange, roles: ['staff'] },
];

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'staff', 'feeInCharge'] },
  { name: 'Notices', href: '/staff/notices', icon: MessageSquare, roles: ['admin', 'staff', 'feeInCharge'] },
  { name: 'SMS', href: '/sms', icon: MessageSquare, roles: ['admin'] },
  { name: 'Students', href: '/students', icon: GraduationCap, roles: ['admin', 'feeInCharge'] },
  { name: 'Attendance', href: '/admin/attendance', icon: UserCheck, roles: ['admin'] },
  { name: 'Homework', href: '/admin/homework', icon: ClipboardList, roles: ['admin'] },
  { name: 'Time Table', href: '/time-table', icon: CalendarDays, roles: ['admin', 'feeInCharge'] },
  { name: 'Academic Calendar', href: '/academic-calendar', icon: CalendarRange, roles: ['admin', 'feeInCharge'] },

  // Financial Modules - Admin Only
  { name: 'Course Fees', href: '/course-fees', icon: BookOpen, roles: ['admin', 'feeInCharge'] },
  { name: 'Books Fees', href: '/books-fees', icon: BookOpen, roles: ['admin', 'feeInCharge'] },
  { name: 'Transport Fees', href: '/transport-fees', icon: Bus, roles: ['admin', 'feeInCharge'] },
  { name: 'Fee History', href: '/fee-history', icon: History, roles: ['admin', 'feeInCharge'] },
  { name: 'Pending Fees', href: '/pending-fees', icon: AlertCircle, roles: ['admin', 'feeInCharge'] },
  { name: 'Accessories', href: '/accessories', icon: ShoppingBag, roles: ['admin', 'feeInCharge'] },
];

export function AppSidebar() {
  const location = useLocation();
  const { userRole, signOut, user } = useAuth();

  const isActive = (href: string) => location.pathname === href;

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      signOut();
    }
  };

  const filteredNav = navigation.filter(item =>
    item.roles.includes(userRole || '')
  );

  const filteredStaffNav = staffNavigation.filter(item =>
    item.roles.includes(userRole || '')
  );

  const filteredAdminNav = adminNavigation.filter(item =>
    item.roles.includes(userRole || '')
  );

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar border-r border-sidebar-border shadow-xl">
      <div className="flex h-full flex-col">
        {/* Logo Section */}
        <div className="flex h-24 flex-col justify-center gap-1 border-b border-sidebar-border px-6 py-4 bg-sidebar-accent/30">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white p-1.5 shadow-sm">
              <img
                src="/school-logo.png"
                alt="Adarsh Oxford Logo"
                className="h-full w-full object-contain"
              />
            </div>
            <div className="flex flex-col">
              <h1 className="font-display text-base font-bold leading-tight text-sidebar-foreground tracking-tight">
                Adarsh Oxford
              </h1>
              <p className="text-[10px] font-semibold leading-tight text-sidebar-foreground/70 uppercase tracking-widest">
                English Medium School
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-4 py-6 scrollbar-hide">
          <div className="mb-4 px-2 text-[11px] font-bold uppercase tracking-[0.15em] text-sidebar-foreground/40">
            Main Menu
          </div>
          <div className="space-y-1">
            {filteredNav.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'sidebar-link group relative overflow-hidden',
                  isActive(item.href) && 'sidebar-link-active'
                )}
              >
                <item.icon className={cn(
                  "h-5 w-5 transition-transform group-hover:scale-110",
                  isActive(item.href) ? "text-sidebar-foreground" : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground"
                )} />
                <span className="relative z-10">{item.name}</span>
                {isActive(item.href) && (
                  <motion.div
                    layoutId="active-nav"
                    className="absolute inset-0 bg-sidebar-accent/50"
                    transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                  />
                )}
              </Link>
            ))}
            {filteredStaffNav.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'sidebar-link group relative overflow-hidden',
                  isActive(item.href) && 'sidebar-link-active'
                )}
              >
                <item.icon className={cn(
                  "h-5 w-5 transition-transform group-hover:scale-110",
                  isActive(item.href) ? "text-sidebar-foreground" : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground"
                )} />
                <span className="relative z-10">{item.name}</span>
                {isActive(item.href) && (
                  <motion.div
                    layoutId="active-nav"
                    className="absolute inset-0 bg-sidebar-accent/50"
                    transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                  />
                )}
              </Link>
            ))}
          </div>

          <div className="mt-8 mb-4 px-2 text-[11px] font-bold uppercase tracking-[0.15em] text-sidebar-foreground/40">
            Administration
          </div>
          <div className="space-y-1">
            {filteredAdminNav.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'sidebar-link group relative overflow-hidden',
                  isActive(item.href) && 'sidebar-link-active'
                )}
              >
                <item.icon className={cn(
                  "h-5 w-5 transition-transform group-hover:scale-110",
                  isActive(item.href) ? "text-sidebar-foreground" : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground"
                )} />
                <span className="relative z-10">{item.name}</span>
              </Link>
            ))}
          </div>
        </nav>

        {/* User profile section */}
        <div className="mt-auto border-t border-sidebar-border bg-sidebar-accent/10 p-4">
          <div className="mb-4 flex items-center gap-3 px-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sidebar-accent border border-sidebar-border shadow-inner">
              <Users className="h-5 w-5 text-sidebar-foreground" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-semibold text-sidebar-foreground">
                {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Administrator'}
              </p>
              <p className="text-[10px] font-medium uppercase tracking-wider text-sidebar-foreground/50">
                {userRole}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all duration-200"
            onClick={handleLogout}
          >
            <LogOut className="mr-3 h-4 w-4" />
            <span className="text-sm font-medium">Log Out</span>
          </Button>
        </div>
      </div>
    </aside>
  );
}
