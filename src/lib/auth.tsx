import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type UserRole = 'admin' | 'staff' | 'feeInCharge' | null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  isLoading: boolean;
  signIn: (
    email: string,
    password: string,
    expectedRole?: Exclude<UserRole, null>
  ) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  setMockUser: (role: 'admin' | 'staff' | 'feeInCharge') => void;
  isAdmin: boolean;
  isStaff: boolean;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Robust fetch with longer safety timeout (15s)
  const fetchUserRoleWithTimeout = async (userId: string, timeoutMs = 15000): Promise<UserRole> => {
    console.log('Fetching role for ID:', userId);

    const timeoutPromise = new Promise<null>((resolve) =>
      setTimeout(() => {
        console.warn('User role fetch timed out after', timeoutMs, 'ms');
        resolve(null);
      }, timeoutMs)
    );

    const roleFetchPromise = (async () => {
      try {
        // Try RPC first (more secure/direct)
        const { data, error } = await supabase.rpc('get_user_roles', {
          p_user_id: userId
        });

        if (error) {
          console.error('RPC Role Error:', error);
          // Fallback to direct table query
          const { data: tableData, error: tableError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', userId);

          if (tableError) {
            console.error('Table Fallback Error:', tableError);
            return null;
          }

          const roles = (tableData || []).map((r: any) => r.role as string);
          console.log('Fallback Roles Found:', roles);
          if (roles.includes('admin')) return 'admin';
          if (roles.includes('staff')) return 'staff';
          return null;
        }

        // Handle various return formats from RPC
        const rolesList = (data as any[] || []).map((r: any) =>
          (typeof r === 'string' ? r : (r.role || r)) as string
        );

        console.log('RPC Roles Found:', rolesList);
        if (rolesList.includes('admin')) return 'admin';
        if (rolesList.includes('staff')) return 'staff';
        return null;
      } catch (err) {
        console.error('Critical Role Fetch Failure:', err);
        return null;
      }
    })();

    const winner = await Promise.race([roleFetchPromise, timeoutPromise]);
    return winner as UserRole;
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        console.log('🚀 Starting Auth Discovery...');

        // Get session with timeout to prevent hanging
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Session fetch timeout')), 3000)
        );

        let existingSession;
        try {
          const { data } = await Promise.race([sessionPromise, timeoutPromise]) as any;
          existingSession = data?.session;
        } catch (err) {
          console.error('⚠️ Session fetch failed or timed out:', err);
          setIsLoading(false);
          return;
        }

        if (existingSession) {
          console.log('✅ Found existing session for:', existingSession.user.email);
          setSession(existingSession);
          setUser(existingSession.user);

          // 🔥 INSTANT ADMIN ACCESS - Email-based detection (no database needed)
          const email = existingSession.user.email?.toLowerCase() || '';
          const isAdmin = email.includes('sandeep') || email.includes('admin');

          console.log('📧 Email:', email);
          console.log('🔍 Is Admin?', isAdmin);

          if (isAdmin) {
            console.log('🔑 ADMIN EMAIL DETECTED - GRANTING IMMEDIATE ACCESS');
            setUserRole('admin');
            setIsLoading(false);

            // Save to Supabase in background (non-blocking)
            (async () => {
              try {
                console.log('💾 Syncing admin profile to Supabase...');

                // Upsert profile
                await supabase.from('profiles').upsert({
                  user_id: existingSession.user.id,
                  email: existingSession.user.email,
                  full_name: existingSession.user.user_metadata?.full_name ||
                    existingSession.user.email?.split('@')[0] || 'Admin'
                }, { onConflict: 'user_id' });

                // Upsert role
                await supabase.from('user_roles').upsert({
                  user_id: existingSession.user.id,
                  role: 'admin'
                }, { onConflict: 'user_id,role' });

                console.log('✅ Admin data synced to Supabase');
              } catch (err) {
                console.error('⚠️ Supabase sync failed (non-critical):', err);
              }
            })();

            return; // Exit immediately - admin has access
          }

          // For non-admin users, fetch role from database
          console.log('👤 Non-admin user, fetching role from database...');
          setIsLoading(false); // Don't block UI

          // Try to get role from database
          try {
            const { data: roleData } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', existingSession.user.id)
              .limit(1);

            if (roleData && roleData.length > 0) {
              console.log('✅ Role found:', roleData[0].role);
              setUserRole(roleData[0].role as 'admin' | 'staff');
            } else {
              console.log('⚠️ No role found, creating staff role...');
              // Create profile and staff role
              await supabase.from('profiles').upsert({
                user_id: existingSession.user.id,
                email: existingSession.user.email,
                full_name: existingSession.user.user_metadata?.full_name ||
                  existingSession.user.email?.split('@')[0] || 'User'
              });

              await supabase.from('user_roles').insert({
                user_id: existingSession.user.id,
                role: 'staff'
              });

              setUserRole('staff');
            }
          } catch (err) {
            console.error('❌ Database error:', err);
            // If database fails, default to staff for non-admin emails
            setUserRole('staff');
          }
        } else {
          console.log('❌ No active session found');
          setIsLoading(false);
        }
      } catch (err) {
        console.error('💥 Auth initialization error:', err);
        setIsLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('🔄 Auth state changed:', event);

      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (event === 'SIGNED_OUT') {
        setUserRole(null);
        setIsLoading(false);
        return;
      }

      if (newSession?.user) {
        const email = newSession.user.email?.toLowerCase() || '';
        const isAdmin = email.includes('sandeep') || email.includes('admin');

        if (isAdmin) {
          setUserRole('admin');
          setIsLoading(false);
        } else {
          // Fetch role from database for non-admin
          const role = await fetchUserRoleWithTimeout(newSession.user.id);
          setUserRole(role);
          setIsLoading(false);
        }
      } else {
        setUserRole(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string, expectedRole?: Exclude<UserRole, null>) => {
    try {
      console.log('Sign-in attempt for:', email, 'Expected Role:', expectedRole);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error || !data.user) {
        console.error('Sign-in credentials rejected:', error?.message);
        return { error: error as Error | null };
      }

      console.log('Credentials valid, verifying role permissions...');
      // During LOGIN, we wait longer for the role check to ensure RBAC enforcement
      const activeRole = await fetchUserRoleWithTimeout(data.user.id, 20000);

      if (expectedRole) {
        // Enforce role matches expectation
        const isMatched = (expectedRole === 'admin' && activeRole === 'admin') ||
          (expectedRole === 'staff' && (activeRole === 'staff' || activeRole === 'admin'));

        if (!isMatched) {
          console.warn('Role mismatch! Expected:', expectedRole, 'but found:', activeRole);
          await supabase.auth.signOut();
          return {
            error: new Error(`This account does not have permission to access the ${expectedRole} portal. Current role: ${activeRole || 'none'}`)
          };
        }
      }

      setUserRole(activeRole);
      return { error: null };
    } catch (err) {
      console.error('Sign-in crash:', err);
      return { error: err as Error };
    }
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` }
    });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } }
    });
    if (error) return { error: error as Error };
    if (data.user) {
      // Best effort profile creation
      await supabase.from('profiles').upsert({ user_id: data.user.id, full_name: fullName, email });
      await supabase.from('user_roles').upsert({ user_id: data.user.id, role: 'staff' });
    }
    return { error: null };
  };

  const signOut = async () => {
    console.log('User logout initiated');
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserRole(null);
  };

  const setMockUser = (role: 'admin' | 'staff' | 'feeInCharge') => {
    console.log('Activating Mock Portal Access for:', role);
    const mockUser = {
      id: `mock-${role}-${Date.now()}`,
      aud: 'authenticated',
      app_metadata: {},
      user_metadata: { full_name: `Demo ${role === 'feeInCharge' ? 'Fee In-charge' : role}`, is_mock: true },
      email: `${role.toLowerCase()}@demo.com`,
      created_at: new Date().toISOString(),
    } as unknown as User;

    setUser(mockUser);
    setUserRole(role);
    setSession({
      access_token: 'mock_token',
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: 'mock_refresh',
      user: mockUser
    });
  };

  return (
    <AuthContext.Provider value={{
      user, session, userRole, setUserRole, isLoading, signIn, signInWithGoogle, signUp, signOut, setMockUser,
      isAdmin: userRole === 'admin',
      isStaff: userRole === 'staff',
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
