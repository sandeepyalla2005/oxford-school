import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/auth";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import ClassStudents from "./pages/ClassStudents";
import CourseFees from "./pages/CourseFees";
import BooksFees from "./pages/BooksFees";
import TransportFees from "./pages/TransportFees";
import FeeHistory from "./pages/FeeHistory";
import PendingFees from "./pages/PendingFees";
import AccessoriesMaster from "./pages/AccessoriesMaster";
import AccessoriesHistory from "./pages/AccessoriesHistory";
import AccessoriesUniform from "./pages/AccessoriesUniform";
import UniformIssue from "./pages/UniformIssue";
import AccessoryIssue from "./pages/AccessoryIssue";
import AccessoryReceiptPage from "./pages/AccessoryReceiptPage";
import UserManagement from "./pages/UserManagement";
import FeeStructure from "./pages/FeeStructure";
import Settings from "./pages/Settings";
import TimeTable from "./pages/TimeTable";
import AcademicCalendar from "./pages/AcademicCalendar";
import StaffManagement from "./pages/StaffManagement";
import NotFound from "./pages/NotFound";
import Sms from "./pages/Sms";
import StaffProfile from "./pages/staff/StaffProfile";
import Attendance from "./pages/staff/Attendance";
import Homework from "./pages/staff/Homework";
import Notices from "./pages/staff/Notices";
import AcademicReports from "./pages/staff/AcademicReports";
import StaffSchedule from "./pages/staff/StaffSchedule";
import Receipt from "./pages/Receipt";
import DatabaseCheck from "./pages/DatabaseCheck";
import AdminAttendance from "./pages/admin/AdminAttendance";
import AdminHomework from "./pages/admin/AdminHomework";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

const AppRoutes = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/auth" replace />} />
      <Route path="/auth" element={user ? <Navigate to="/dashboard" replace /> : <Auth />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/students" element={<ProtectedRoute><Students /></ProtectedRoute>} />
      <Route path="/students/:className" element={<ProtectedRoute><ClassStudents /></ProtectedRoute>} />
      <Route path="/course-fees" element={<ProtectedRoute><CourseFees /></ProtectedRoute>} />
      <Route path="/books-fees" element={<ProtectedRoute><BooksFees /></ProtectedRoute>} />
      <Route path="/transport-fees" element={<ProtectedRoute><TransportFees /></ProtectedRoute>} />
      <Route path="/fee-history" element={<ProtectedRoute><FeeHistory /></ProtectedRoute>} />
      <Route path="/pending-fees" element={<ProtectedRoute><PendingFees /></ProtectedRoute>} />
      <Route path="/accessories" element={<ProtectedRoute><AccessoriesMaster /></ProtectedRoute>} />
      <Route path="/accessories/history" element={<ProtectedRoute><AccessoriesHistory /></ProtectedRoute>} />
      <Route path="/accessories/uniform" element={<ProtectedRoute><UniformIssue /></ProtectedRoute>} />
      <Route path="/accessories/uniform/inventory" element={<ProtectedRoute><AccessoriesUniform /></ProtectedRoute>} />

      {/* New Dynamic Routes for Accessories Issue & Receipt */}
      <Route path="/accessories/receipt/:id" element={<ProtectedRoute><AccessoryReceiptPage /></ProtectedRoute>} />
      {/* This generic route handles 'exam-booklet', 'belts', 'id-card', 'cultural-activity' */}
      <Route path="/accessories/:type" element={<ProtectedRoute><AccessoryIssue /></ProtectedRoute>} />
      <Route path="/sms" element={<ProtectedRoute><Sms /></ProtectedRoute>} />

      {/* Staff Routes */}
      <Route path="/staff/profile" element={<ProtectedRoute><StaffProfile /></ProtectedRoute>} />
      <Route path="/staff/attendance" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
      <Route path="/staff/homework" element={<ProtectedRoute><Homework /></ProtectedRoute>} />
      <Route path="/staff/notices" element={<ProtectedRoute><Notices /></ProtectedRoute>} />
      <Route path="/staff/reports" element={<ProtectedRoute><AcademicReports /></ProtectedRoute>} />
      <Route path="/staff/schedule" element={<ProtectedRoute><StaffSchedule /></ProtectedRoute>} />

      <Route path="/users" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
      <Route path="/fee-structure" element={<ProtectedRoute><FeeStructure /></ProtectedRoute>} />
      <Route path="/time-table" element={<ProtectedRoute><TimeTable /></ProtectedRoute>} />
      <Route path="/academic-calendar" element={<ProtectedRoute><AcademicCalendar /></ProtectedRoute>} />

      {/* Admin Dashboard Extensions */}
      <Route path="/admin/attendance" element={<ProtectedRoute><AdminAttendance /></ProtectedRoute>} />
      <Route path="/admin/homework" element={<ProtectedRoute><AdminHomework /></ProtectedRoute>} />

      <Route path="/staff-login" element={<ProtectedRoute><StaffManagement /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/receipt" element={<ProtectedRoute><Receipt /></ProtectedRoute>} />
      <Route path="/db-check" element={<ProtectedRoute><DatabaseCheck /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
