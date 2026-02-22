import { ReactNode, useEffect } from 'react';
import { AppSidebar } from './AppSidebar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  useEffect(() => {
    // Global Notice Listener
    const channel = supabase
      .channel('global-announcements')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notices' },
        (payload) => {
          toast.info(`New Announcement: ${payload.new.title}`, {
            description: payload.new.content.substring(0, 100) + (payload.new.content.length > 100 ? '...' : ''),
            duration: 10000,
            action: {
              label: 'View All',
              onClick: () => window.location.href = '/staff/notices'
            }
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className="pl-64">
        <div className="min-h-screen p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
