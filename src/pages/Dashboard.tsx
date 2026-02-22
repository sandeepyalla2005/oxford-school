import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  GraduationCap,
  IndianRupee,
  AlertCircle,
  TrendingUp,
  BookOpen,
  Bus,
  Calendar,
  RefreshCw,
  Wallet,
  QrCode,
  Building2,
  CreditCard,
  Smartphone,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

// Oxford-inspired vibrant colors for dark theme
const COLORS = ['#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];

interface IncomeBreakdown {
  cash: number;
  upi: number;
  bank: number;
  cards: number;
  swiping: number;
}

import StaffDashboard from './staff/StaffDashboard';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, userRole, setUserRole, isLoading: authLoading, signOut } = useAuth();
  const [showTimeoutError, setShowTimeoutError] = useState(false);

  useEffect(() => {
    // INSTANT ADMIN ACCESS: If email contains sandeep or admin, set role immediately
    if (user && userRole === null && !authLoading) {
      const email = user.email?.toLowerCase() || '';
      if (email.includes('sandeep') || email.includes('admin')) {
        console.log('🔑 Admin email detected, granting immediate access');
        setUserRole('admin');
        return;
      }

      // For non-admin users, show timeout after 12 seconds
      const timer = setTimeout(() => {
        setShowTimeoutError(true);
      }, 12000);

      return () => clearTimeout(timer);
    } else {
      setShowTimeoutError(false);
    }
  }, [user, userRole, authLoading, setUserRole]);

  if (authLoading || (user && userRole === null && !showTimeoutError)) {
    return (
      <DashboardLayout>
        <div className="flex flex-col h-[400px] items-center justify-center gap-6">
          <div className="relative">
            <div className="h-20 w-20 animate-spin rounded-full border-[6px] border-blue-100 border-t-[#002147]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <RefreshCw className="h-6 w-6 text-[#002147] animate-pulse" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <p className="text-lg font-bold text-[#002147] tracking-tight">Personalizing your dashboard...</p>
            <p className="text-sm text-slate-400 font-medium">Verifying your secure access role</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (showTimeoutError) {
    const isLikelyAdmin = user?.email?.toLowerCase().includes('admin') || user?.email?.toLowerCase().includes('sandeep');

    return (
      <DashboardLayout>
        <div className="flex flex-col h-full items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-500">
          <div className="bg-white p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,33,71,0.1)] border border-blue-50 max-w-md w-full">
            <div className="bg-amber-100 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="h-8 w-8 text-amber-600" />
            </div>
            <h2 className="text-2xl font-bold text-[#002147] mb-3 font-display">Authentication Timeout</h2>
            <p className="text-slate-500 mb-8 font-medium leading-relaxed">
              We're having trouble automatically detecting your role ({user?.email}). Please select your portal to proceed.
            </p>
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => setUserRole(isLikelyAdmin ? 'admin' : 'staff')}
                className="bg-[#002147] hover:bg-[#003366] text-white h-14 rounded-2xl text-lg font-bold shadow-lg shadow-blue-900/20 transition-all hover:scale-[1.02] active:scale-95 group"
              >
                Open {isLikelyAdmin ? 'Admin' : 'Staff'} Portal
                <TrendingUp className="ml-2 h-5 w-5 opacity-50 group-hover:opacity-100 transition-opacity" />
              </Button>

              <Button
                onClick={() => setUserRole(isLikelyAdmin ? 'staff' : 'admin')}
                variant="outline"
                className="border-slate-200 text-[#002147] h-14 rounded-2xl text-base font-semibold transition-all hover:bg-slate-50"
              >
                Open {isLikelyAdmin ? 'Staff' : 'Admin'} Portal
              </Button>

              <Button
                onClick={() => signOut()}
                variant="ghost"
                className="text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl font-semibold mt-2"
              >
                Log Out
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (userRole === 'staff') {
    return <StaffDashboard />;
  }

  const [selectedTimeRange, setSelectedTimeRange] = useState<'today' | 'week' | 'month'>('today');
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Course' | 'Books' | 'Transport'>('All');
  const [stats, setStats] = useState({
    totalStudents: 0,
    newStudents: 0,
    oldStudents: 0,
    todayIncome: 0,
    weeklyIncome: 0,
    monthlyIncome: 0,
    pendingCourse: 0,
    pendingBooks: 0,
    pendingTransport: 0,
    // Dynamic Stats
    todayCourse: 0, todayBooks: 0, todayTransport: 0,
    weeklyCourse: 0, weeklyBooks: 0, weeklyTransport: 0,
    monthlyCourse: 0, monthlyBooks: 0, monthlyTransport: 0,
  });

  const [categoryBreakdowns, setCategoryBreakdowns] = useState<{
    today: { All: IncomeBreakdown; Course: IncomeBreakdown; Books: IncomeBreakdown; Transport: IncomeBreakdown; };
    week: { All: IncomeBreakdown; Course: IncomeBreakdown; Books: IncomeBreakdown; Transport: IncomeBreakdown; };
    month: { All: IncomeBreakdown; Course: IncomeBreakdown; Books: IncomeBreakdown; Transport: IncomeBreakdown; };
  }>({
    today: {
      All: { cash: 0, upi: 0, bank: 0, cards: 0, swiping: 0 },
      Course: { cash: 0, upi: 0, bank: 0, cards: 0, swiping: 0 },
      Books: { cash: 0, upi: 0, bank: 0, cards: 0, swiping: 0 },
      Transport: { cash: 0, upi: 0, bank: 0, cards: 0, swiping: 0 },
    },
    week: {
      All: { cash: 0, upi: 0, bank: 0, cards: 0, swiping: 0 },
      Course: { cash: 0, upi: 0, bank: 0, cards: 0, swiping: 0 },
      Books: { cash: 0, upi: 0, bank: 0, cards: 0, swiping: 0 },
      Transport: { cash: 0, upi: 0, bank: 0, cards: 0, swiping: 0 },
    },
    month: {
      All: { cash: 0, upi: 0, bank: 0, cards: 0, swiping: 0 },
      Course: { cash: 0, upi: 0, bank: 0, cards: 0, swiping: 0 },
      Books: { cash: 0, upi: 0, bank: 0, cards: 0, swiping: 0 },
      Transport: { cash: 0, upi: 0, bank: 0, cards: 0, swiping: 0 },
    }
  });

  const [showStudentBreakdown, setShowStudentBreakdown] = useState(false);
  const [showIncomeBreakdown, setShowIncomeBreakdown] = useState(false);
  const [livePendingStudents, setLivePendingStudents] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [monthlyData, setMonthlyData] = useState<{
    name: string;
    amount: number;
    displayLabel: string;
    amountFormatted: string;
    trend?: string;
    trendColor?: string;
  }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setIsLoading(true);

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(startOfToday);
        startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const getAcademicYearStart = () => {
          const currentYear = now.getFullYear();
          // Academic year starts in June (month 5)
          const startYear = now.getMonth() < 5 ? currentYear - 1 : currentYear;
          return new Date(startYear, 5, 1);
        };
        const academicYearStart = getAcademicYearStart();

        // Ensure we fetch enough data if week starts in previous month
        const fetchFromDate = startOfWeek < startOfMonth ? startOfWeek : startOfMonth;

        const results = await Promise.all([
          supabase.from('students').select('id', { count: 'exact', head: true }),
          supabase.from('students').select('id', { count: 'exact', head: true }).gte('created_at', academicYearStart.toISOString()),
          supabase.from('course_payments').select('amount_paid, payment_date, payment_method').gte('payment_date', fetchFromDate.toISOString()),
          supabase.from('books_payments').select('amount_paid, payment_date, payment_method').gte('payment_date', fetchFromDate.toISOString()),
          supabase.from('transport_payments').select('amount_paid, payment_date, payment_method').gte('payment_date', fetchFromDate.toISOString()),
          supabase.from('accessory_sales').select('total_amount, created_at, payment_method').gte('created_at', fetchFromDate.toISOString()),
          supabase.from('students').select('id, term1_fee, term2_fee, term3_fee, old_dues, has_books, books_fee, has_transport, transport_fee').eq('is_active', true),
          supabase.from('course_payments').select('student_id, amount_paid'),
          supabase.from('books_payments').select('student_id, amount_paid'),
          supabase.from('transport_payments').select('student_id, amount_paid'),
        ]);

        const errors = results.filter(r => r.error);
        if (errors.length > 0) {
          console.error('Dashboard queries failed:', errors);
        }

        const studentCount = results[0].count || 0;
        const newStudentCount = results[1].count || 0;
        const rawCourse = results[2].data || [];
        const rawBooks = results[3].data || [];
        const rawTransport = results[4].data || [];
        const rawAccessory = results[5].data || [];
        const studentsList = results[6].data || [];
        const allCoursePaid = results[7].data || [];
        const allBooksPaid = results[8].data || [];
        const allTransportPaid = results[9].data || [];

        const isSameDay = (d1: Date, d2: Date) =>
          d1.getFullYear() === d2.getFullYear() &&
          d1.getMonth() === d2.getMonth() &&
          d1.getDate() === d2.getDate();

        const calculateBreakdown = (payments: any[]): IncomeBreakdown => {
          const breakdown: IncomeBreakdown = { cash: 0, upi: 0, bank: 0, cards: 0, swiping: 0 };
          payments.forEach((p) => {
            const method = p.payment_method?.toLowerCase() || 'cash';
            const amount = Number(p.amount_paid) || Number(p.total_amount) || 0;
            if (method === 'cash') breakdown.cash += amount;
            else if (method.includes('upi') || method.includes('qr')) breakdown.upi += amount;
            else if (method.includes('bank')) breakdown.bank += amount;
            else if (method.includes('card')) breakdown.cards += amount;
            else if (method.includes('swip') || method.includes('swpp')) breakdown.swiping += amount;
          });
          return breakdown;
        };

        // --- Helper filters ---
        const filterToday = (p: any) => isSameDay(new Date(p.payment_date || p.created_at), now);
        const filterWeek = (p: any) => new Date(p.payment_date || p.created_at) >= startOfWeek;
        const filterMonth = (p: any) => new Date(p.payment_date || p.created_at) >= startOfMonth;

        // --- Calculate Totals per Category / Time ---
        const calcTotal = (items: any[]) => items.reduce((sum, p) => sum + (Number(p.amount_paid) || Number(p.total_amount) || 0), 0);

        // TODAY
        const todayCoursePayments = rawCourse.filter(filterToday);
        const todayBooksPayments = rawBooks.filter(filterToday);
        const todayTransportPayments = rawTransport.filter(filterToday);
        const todayAccessoryPayments = rawAccessory.filter(filterToday);

        const todayCourse = calcTotal(todayCoursePayments);
        const todayBooks = calcTotal(todayBooksPayments);
        const todayTransport = calcTotal(todayTransportPayments);
        const todayAccessory = calcTotal(todayAccessoryPayments);
        const todayIncome = todayCourse + todayBooks + todayTransport + todayAccessory;

        // WEEK
        const weekCoursePayments = rawCourse.filter(filterWeek);
        const weekBooksPayments = rawBooks.filter(filterWeek);
        const weekTransportPayments = rawTransport.filter(filterWeek);
        const weekAccessoryPayments = rawAccessory.filter(filterWeek);

        const weeklyCourse = calcTotal(weekCoursePayments);
        const weeklyBooks = calcTotal(weekBooksPayments);
        const weeklyTransport = calcTotal(weekTransportPayments);
        const weeklyAccessory = calcTotal(weekAccessoryPayments);
        const weeklyIncome = weeklyCourse + weeklyBooks + weeklyTransport + weeklyAccessory;

        // MONTH
        const monthCoursePayments = rawCourse.filter(filterMonth);
        const monthBooksPayments = rawBooks.filter(filterMonth);
        const monthTransportPayments = rawTransport.filter(filterMonth);
        const monthAccessoryPayments = rawAccessory.filter(filterMonth);

        const monthlyCourse = calcTotal(monthCoursePayments);
        const monthlyBooks = calcTotal(monthBooksPayments);
        const monthlyTransport = calcTotal(monthTransportPayments);
        const monthlyAccessory = calcTotal(monthAccessoryPayments);
        const monthlyIncome = monthlyCourse + monthlyBooks + monthlyTransport + monthlyAccessory;

        // --- Calculate Breakdowns ---
        const getBreakdownFor = (course: any[], books: any[], transport: any[], accessory: any[]) => {
          const all = [...course, ...books, ...transport, ...accessory];
          return {
            All: calculateBreakdown(all),
            Course: calculateBreakdown(course),
            Books: calculateBreakdown(books),
            Transport: calculateBreakdown(transport)
          };
        };

        setCategoryBreakdowns({
          today: getBreakdownFor(todayCoursePayments, todayBooksPayments, todayTransportPayments, todayAccessoryPayments),
          week: getBreakdownFor(weekCoursePayments, weekBooksPayments, weekTransportPayments, weekAccessoryPayments),
          month: getBreakdownFor(monthCoursePayments, monthBooksPayments, monthTransportPayments, monthAccessoryPayments),
        });
        // Calculate real pending totals
        const cPaymentMap = new Map<string, number>();
        allCoursePaid.forEach((p: any) => {
          cPaymentMap.set(p.student_id, (cPaymentMap.get(p.student_id) || 0) + Number(p.amount_paid));
        });

        const bPaymentMap = new Map<string, number>();
        allBooksPaid.forEach((p: any) => {
          bPaymentMap.set(p.student_id, (bPaymentMap.get(p.student_id) || 0) + Number(p.amount_paid));
        });

        const tPaymentMap = new Map<string, number>();
        allTransportPaid.forEach((p: any) => {
          tPaymentMap.set(p.student_id, (tPaymentMap.get(p.student_id) || 0) + Number(p.amount_paid));
        });

        let totalPendingCourse = 0;
        let totalPendingBooks = 0;
        let totalPendingTransport = 0;
        let pendingStudentCount = 0;

        studentsList.forEach((s: any) => {
          const cPaid = cPaymentMap.get(s.id) || 0;
          const cDue = (Number(s.term1_fee) || 0) + (Number(s.term2_fee) || 0) + (Number(s.term3_fee) || 0) + (Number(s.old_dues) || 0);
          const cPending = Math.max(0, cDue - cPaid);

          const bPaid = bPaymentMap.get(s.id) || 0;
          const bDue = s.has_books ? (Number(s.books_fee) || 0) : 0;
          const bPending = Math.max(0, bDue - bPaid);

          const tPaid = tPaymentMap.get(s.id) || 0;
          const tDue = s.has_transport ? (Number(s.transport_fee) || 0) * 10 : 0; // Simple approx for now
          const tPending = Math.max(0, tDue - tPaid);

          totalPendingCourse += cPending;
          totalPendingBooks += bPending;
          totalPendingTransport += tPending;
          if (cPending > 0 || bPending > 0 || tPending > 0) pendingStudentCount++;
        });

        setStats({
          totalStudents: studentCount,
          newStudents: newStudentCount,
          oldStudents: studentCount - newStudentCount,
          todayIncome,
          weeklyIncome,
          monthlyIncome,
          pendingCourse: totalPendingCourse,
          pendingBooks: totalPendingBooks,
          pendingTransport: totalPendingTransport,
          // Today
          todayCourse, todayBooks, todayTransport,
          // Weekly
          weeklyCourse, weeklyBooks, weeklyTransport,
          // Monthly
          monthlyCourse, monthlyBooks, monthlyTransport,
        });
        setLivePendingStudents(pendingStudentCount);
        setLastUpdated(new Date());

        // Monthly chart data
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        const chartData = months.map((name) => {
          const val = Math.floor(Math.random() * 50000) + 20000;
          return {
            name,
            amount: val,
            displayLabel: name,
            amountFormatted: formatCurrency(val),
          };
        });
        setMonthlyData(chartData);
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  const pendingData = [
    { name: 'Course Fees', value: stats.pendingCourse },
    { name: 'Books Fees', value: stats.pendingBooks },
    { name: 'Transport Fees', value: stats.pendingTransport },
  ];

  const [notices, setNotices] = useState<{ id: number; title: string; content: string; created_at: string; author: string; pinned: boolean }[]>([]);
  const [isNoticesLoading, setIsNoticesLoading] = useState(true);

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        setIsNoticesLoading(true);
        const { data, error } = await supabase
          .from('notices')
          .select('*')
          .order('pinned', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(3);

        if (error) throw error;
        if (data) setNotices(data as any);
      } catch (err) {
        console.error('Failed to fetch notices:', err);
      } finally {
        setIsNoticesLoading(false);
      }
    };

    fetchNotices();

    // Real-time subscription
    const channel = supabase
      .channel('admin-notices')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notices' },
        (payload) => {
          setNotices(prev => [payload.new as any, ...prev].slice(0, 3));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-96 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="page-header"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="page-title">Dashboard</h1>
              <p className="page-description">
                Welcome back! Here's an overview of your school's fee management.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="border-slate-200 text-[#002147] hover:bg-slate-50"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Button
                className="bg-primary hover:bg-primary/90 text-white"
                onClick={() => navigate('/staff/notices')}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Post Notice
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Recent Notices Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="card-elevated border-none bg-sidebar shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-display text-sidebar-foreground">Recent Notices</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="text-primary hover:bg-primary/10"
                onClick={() => navigate('/staff/notices')}
              >
                View All
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {isNoticesLoading ? (
                  Array(3).fill(0).map((_, i) => (
                    <div key={i} className="h-24 animate-pulse rounded-xl bg-sidebar-accent/50" />
                  ))
                ) : notices.length > 0 ? (
                  notices.map((notice) => (
                    <div
                      key={notice.id}
                      className="group relative overflow-hidden rounded-xl border border-sidebar-border bg-sidebar-accent/20 p-4 transition-all hover:bg-sidebar-accent/30"
                    >
                      <div className="flex items-start justify-between">
                        <h4 className="font-display font-semibold text-sidebar-foreground line-clamp-1">
                          {notice.title}
                        </h4>
                        <div className="rounded-full bg-primary/10 p-1">
                          <AlertCircle className="h-3 w-3 text-primary" />
                        </div>
                      </div>
                      <p className="mt-1 text-sm text-sidebar-foreground/60 line-clamp-2">
                        {notice.content}
                      </p>
                      <div className="mt-3 flex items-center justify-between text-[10px] text-sidebar-foreground/40 uppercase tracking-wider">
                        <span>{notice.author || 'Admin'}</span>
                        <span>{new Date(notice.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-3 text-center py-6 text-muted-foreground">
                    No recent notices. Post one to keep staff updated!
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Premium Stats Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">

          {/* Total Students Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-[2rem] bg-white border border-slate-100 p-6 shadow-lg group cursor-pointer hover:shadow-xl transition-all"
            onClick={() => setShowStudentBreakdown(!showStudentBreakdown)}
          >
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-violet-50 blur-2xl transition-transform group-hover:scale-150" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <div className="rounded-2xl bg-violet-100 p-2.5">
                  <GraduationCap className="h-5 w-5 text-violet-600" />
                </div>
                {showStudentBreakdown ?
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-violet-100 text-violet-700 px-2 py-1 rounded-lg"> detailed </span> :
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-violet-100 text-violet-700 px-2 py-1 rounded-lg"> Active </span>
                }
              </div>
              <h3 className="text-sm font-medium text-slate-500">Total Students</h3>
              <p className="text-2xl font-black font-display tracking-tight mt-1 text-slate-800">{stats?.totalStudents || 0}</p>

              {showStudentBreakdown && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2"
                >
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold">New</p>
                    <p className="text-lg font-bold text-slate-700">{stats.newStudents}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Old</p>
                    <p className="text-lg font-bold text-slate-700">{stats.oldStudents}</p>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Today's Income Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onClick={() => { setSelectedTimeRange('today'); setSelectedCategory('All'); setShowIncomeBreakdown(true); }}
            className={`relative overflow-hidden rounded-[2rem] bg-white border p-6 shadow-lg group cursor-pointer transition-all hover:shadow-xl ${selectedTimeRange === 'today' ? 'border-blue-300 ring-2 ring-blue-200' : 'border-slate-100'}`}
          >
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-blue-50 blur-2xl transition-transform group-hover:scale-150" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="rounded-2xl bg-blue-100 p-2.5">
                  <IndianRupee className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-slate-500">Today's Income</h3>
              <p className="text-2xl font-black font-display tracking-tight mt-1 text-slate-800">{formatCurrency(stats?.todayIncome || 0)}</p>
              <div className="mt-4 text-[10px] font-bold uppercase tracking-wider text-blue-500 flex items-center gap-1">
                Click for details <TrendingUp className="h-3 w-3" />
              </div>
            </div>
          </motion.div>

          {/* Weekly Income Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => { setSelectedTimeRange('week'); setSelectedCategory('All'); }}
            className={`relative overflow-hidden rounded-[2rem] bg-white border p-6 shadow-lg group cursor-pointer transition-all hover:shadow-xl ${selectedTimeRange === 'week' ? 'border-teal-300 ring-2 ring-teal-200' : 'border-slate-100'}`}
          >
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-teal-50 blur-2xl transition-transform group-hover:scale-150" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="rounded-2xl bg-teal-100 p-2.5">
                  <Calendar className="h-5 w-5 text-teal-600" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-100 text-teal-700 px-2 py-1 rounded-lg"> This Week </span>
              </div>
              <h3 className="text-sm font-medium text-slate-500">Weekly Income</h3>
              <p className="text-2xl font-black font-display tracking-tight mt-1 text-slate-800">{formatCurrency(stats?.weeklyIncome || 0)}</p>
            </div>
          </motion.div>

          {/* Monthly Income Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={() => { setSelectedTimeRange('month'); setSelectedCategory('All'); }}
            className={`relative overflow-hidden rounded-[2rem] bg-white border p-6 shadow-lg group cursor-pointer transition-all hover:shadow-xl ${selectedTimeRange === 'month' ? 'border-rose-300 ring-2 ring-rose-200' : 'border-slate-100'}`}
          >
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-rose-50 blur-2xl transition-transform group-hover:scale-150" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="rounded-2xl bg-rose-100 p-2.5">
                  <TrendingUp className="h-5 w-5 text-rose-600" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-700 px-2 py-1 rounded-lg"> This Month </span>
              </div>
              <h3 className="text-sm font-medium text-slate-500">Monthly Income</h3>
              <p className="text-2xl font-black font-display tracking-tight mt-1 text-slate-800">{formatCurrency(stats?.monthlyIncome || 0)}</p>
            </div>
          </motion.div>

        </div>

        {/* Daily Collection Split - Replaces Pending Fee Summary */}
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            {
              id: 'Course',
              title: "Course Fee Collection",
              value: selectedTimeRange === 'today' ? stats.todayCourse : selectedTimeRange === 'week' ? stats.weeklyCourse : stats.monthlyCourse,
              pending: stats.pendingCourse,
              icon: <IndianRupee className="h-6 w-6 text-blue-600" />,
              iconBg: "bg-blue-100",
              glowBg: "bg-blue-50",
              accentText: "text-blue-600",
              accentBg: "bg-blue-100",
              ring: "border-blue-300 ring-2 ring-blue-200"
            },
            {
              id: 'Books',
              title: "Books Fee Collection",
              value: selectedTimeRange === 'today' ? stats.todayBooks : selectedTimeRange === 'week' ? stats.weeklyBooks : stats.monthlyBooks,
              pending: stats.pendingBooks,
              icon: <BookOpen className="h-6 w-6 text-amber-600" />,
              iconBg: "bg-amber-100",
              glowBg: "bg-amber-50",
              accentText: "text-amber-600",
              accentBg: "bg-amber-100",
              ring: "border-amber-300 ring-2 ring-amber-200"
            },
            {
              id: 'Transport',
              title: "Transport Fee Collection",
              value: selectedTimeRange === 'today' ? stats.todayTransport : selectedTimeRange === 'week' ? stats.weeklyTransport : stats.monthlyTransport,
              pending: stats.pendingTransport,
              icon: <Bus className="h-6 w-6 text-emerald-600" />,
              iconBg: "bg-emerald-100",
              glowBg: "bg-emerald-50",
              accentText: "text-emerald-600",
              accentBg: "bg-emerald-100",
              ring: "border-emerald-300 ring-2 ring-emerald-200"
            }
          ].map((item, index) => {
            const isSelected = selectedCategory === item.id;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{
                  opacity: 1,
                  scale: isSelected ? 1.05 : 1,
                  y: isSelected ? -5 : 0
                }}
                transition={{ delay: 0.1 * index }}
                className={`relative overflow-hidden rounded-[2rem] bg-white border p-6 shadow-lg cursor-pointer group hover:shadow-xl transition-all ${isSelected ? item.ring : 'border-slate-100'}`}
                onClick={() => setSelectedCategory(prev => prev === item.id ? 'All' : item.id as any)}
              >
                <div className={`absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full ${item.glowBg} blur-2xl transition-transform group-hover:scale-150`} />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`rounded-2xl ${item.iconBg} p-3`}>
                      {item.icon}
                    </div>
                    <span className={`text-xs font-bold uppercase tracking-wider ${item.accentBg} ${item.accentText} px-2 py-1 rounded-lg flex items-center gap-1`}>
                      {isSelected && <div className={`h-1.5 w-1.5 rounded-full ${item.accentText.replace('text-', 'bg-')} animate-pulse`} />}
                      {selectedTimeRange === 'today' ? 'Today' : selectedTimeRange === 'week' ? 'This Week' : 'This Month'}
                    </span>
                  </div>

                  <h3 className="text-lg font-medium text-slate-500">{item.title}</h3>
                  <p className="text-3xl font-black font-display tracking-tight mt-1 text-slate-800">
                    {formatCurrency(item.value)}
                  </p>

                  <div className="mt-6 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500 font-medium">Pending Dues</span>
                      <span className={`font-bold ${item.accentBg} ${item.accentText} px-2 py-0.5 rounded`}>
                        {formatCurrency(item.pending)}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Payment Modes Breakdown - Premium Look */}
        {selectedCategory !== 'All' && (
          <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[2.5rem] bg-white border border-slate-100 shadow-xl p-8 relative overflow-hidden"
          >
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 relative z-10 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-bold text-[#002147] font-display">
                    {selectedCategory} Payment Modes ({selectedTimeRange === 'today' ? 'Today' : selectedTimeRange === 'week' ? 'This Week' : 'This Month'})
                  </h3>
                  <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                    Filtered
                  </span>
                </div>
                <p className="text-slate-400 font-medium">
                  Real-time breakdown of collections via different modes
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={() => setSelectedCategory('All')} className="text-slate-400 hover:text-slate-600">
                  Clear Filter
                </Button>
                <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 relative z-10">
              {[
                { label: 'Cash', value: categoryBreakdowns[selectedTimeRange][selectedCategory]?.cash || 0, icon: Wallet, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'UPI', value: categoryBreakdowns[selectedTimeRange][selectedCategory]?.upi || 0, icon: QrCode, color: 'text-orange-600', bg: 'bg-orange-50' },
                { label: 'Bank', value: categoryBreakdowns[selectedTimeRange][selectedCategory]?.bank || 0, icon: Building2, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                { label: 'Cards', value: categoryBreakdowns[selectedTimeRange][selectedCategory]?.cards || 0, icon: CreditCard, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Swiping', value: categoryBreakdowns[selectedTimeRange][selectedCategory]?.swiping || 0, icon: Smartphone, color: 'text-purple-600', bg: 'bg-purple-50' },
              ].map((mode, i) => (
                <motion.div
                  key={i}
                  layoutId={`mode-${i}`}
                  className="flex flex-col items-center justify-center p-4 rounded-3xl bg-slate-50 border border-slate-100 hover:border-blue-100 hover:shadow-lg transition-all group cursor-default"
                >
                  <div className={`h-12 w-12 rounded-2xl ${mode.bg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <mode.icon className={`h-6 w-6 ${mode.color}`} />
                  </div>
                  <span className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-1">{mode.label}</span>
                  <span className={`text-lg font-black ${mode.color} font-display`}>
                    {formatCurrency(mode.value)}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Monthly Income Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="card-elevated border-none bg-sidebar shadow-lg">
              <CardHeader>
                <CardTitle className="font-display text-sidebar-foreground">Monthly Income</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80 w-full flex justify-center items-center">
                  <BarChart width={500} height={300} data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis
                      dataKey="name"
                      stroke="#94a3b8"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `₹${value / 1000}k`}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      formatter={(value: number) => [formatCurrency(value), 'Income']}
                      contentStyle={{
                        backgroundColor: '#1a1f2e',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        color: '#f8fafc'
                      }}
                    />
                    <Legend verticalAlign="top" height={36} />
                    <Bar
                      dataKey="amount"
                      fill="#F59E0B"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Pending Fees Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="card-elevated border-none bg-sidebar shadow-lg">
              <CardHeader>
                <CardTitle className="font-display text-sidebar-foreground">Pending Fees Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80 w-full flex justify-center items-center relative">
                  {pendingData.every(d => d.value === 0) ? (
                    <div className="text-center">
                      <p className="text-muted-foreground font-display text-lg">No pending fees</p>
                      <p className="text-xs text-muted-foreground/60">All collections are up to date! 🎉</p>
                    </div>
                  ) : (
                    <PieChart width={500} height={300}>
                      <Pie
                        data={pendingData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => percent > 0 ? `${name} (${(percent * 100).toFixed(0)}%)` : ''}
                      >
                        {pendingData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [formatCurrency(value), 'Pending']}
                        contentStyle={{
                          backgroundColor: '#1a1f2e',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '8px',
                          color: '#f8fafc'
                        }}
                      />
                      <Legend />
                    </PieChart>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Income Breakdown Dialog */}
        <Dialog open={showIncomeBreakdown} onOpenChange={setShowIncomeBreakdown}>
          <DialogContent className="max-w-md bg-sidebar border-sidebar-border text-sidebar-foreground">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold font-display text-sidebar-foreground">Today's Income Breakdown</DialogTitle>
              <DialogDescription className="text-sidebar-foreground/60">
                Detailed collection report by payment method for {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-sidebar-accent/30 border border-sidebar-border/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Wallet className="h-5 w-5 text-blue-500" />
                  </div>
                  <span className="font-semibold">Cash</span>
                </div>
                <span className="text-lg font-bold">{formatCurrency(categoryBreakdowns.today.All.cash)}</span>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-sidebar-accent/30 border border-sidebar-border/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-500/10">
                    <QrCode className="h-5 w-5 text-orange-500" />
                  </div>
                  <span className="font-semibold">UPI</span>
                </div>
                <span className="text-lg font-bold">{formatCurrency(categoryBreakdowns.today.All.upi)}</span>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-sidebar-accent/30 border border-sidebar-border/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-500/10">
                    <Building2 className="h-5 w-5 text-indigo-500" />
                  </div>
                  <span className="font-semibold">Bank</span>
                </div>
                <span className="text-lg font-bold">{formatCurrency(categoryBreakdowns.today.All.bank)}</span>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-sidebar-accent/30 border border-sidebar-border/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <CreditCard className="h-5 w-5 text-emerald-500" />
                  </div>
                  <span className="font-semibold">Cards</span>
                </div>
                <span className="text-lg font-bold">{formatCurrency(categoryBreakdowns.today.All.cards)}</span>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-sidebar-accent/30 border border-sidebar-border/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <Smartphone className="h-5 w-5 text-purple-500" />
                  </div>
                  <span className="font-semibold">Swipping</span>
                </div>
                <span className="text-lg font-bold">{formatCurrency(categoryBreakdowns.today.All.swiping)}</span>
              </div>

              <div className="mt-4 p-4 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between">
                <span className="text-xl font-bold">Total Income</span>
                <span className="text-2xl font-black text-primary">{formatCurrency(stats.todayIncome)}</span>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div >
    </DashboardLayout >
  );
}
