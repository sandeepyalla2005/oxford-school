import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { cn } from '@/lib/utils';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type RoleType = 'admin' | 'staff' | 'feeInCharge';

export default function Auth() {
  const navigate = useNavigate();
  const { signIn, signUp, signInWithGoogle, setMockUser, user, isLoading } = useAuth();
  const { toast } = useToast();

  const [isLogin, setIsLogin] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState<RoleType>('staff');

  useEffect(() => {
    if (user && !isLoading) {
      navigate('/dashboard');
    }
  }, [user, isLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isLogin) {
        loginSchema.parse({ email, password });
      } else {
        if (password.length < 6) {
          toast({ variant: 'destructive', title: 'Invalid Password', description: 'Password must be at least 6 characters' });
          return;
        }
        if (!fullName) {
          toast({ variant: 'destructive', title: 'Name Required', description: 'Please enter your full name' });
          return;
        }
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          variant: 'destructive',
          title: 'Validation Error',
          description: error.errors[0].message,
        });
        return;
      }
    }

    setIsSubmitting(true);

    if (isLogin) {
      const { error } = await signIn(email, password, selectedRole === 'feeInCharge' ? 'staff' : selectedRole);
      if (error) {
        toast({
          variant: 'destructive',
          title: 'Login Failed',
          description: error.message || 'Invalid email or password',
        });
      } else {
        toast({
          title: 'Welcome back!',
          description: 'Successfully logged in.',
        });
        navigate('/dashboard');
      }
    } else {
      const { error } = await signUp(email, password, fullName);
      if (error) {
        toast({
          variant: 'destructive',
          title: 'Sign Up Failed',
          description: error.message,
        });
      } else {
        toast({
          title: 'Account Created',
          description: 'Please check your email for verification link.',
        });
        setIsLogin(true);
      }
    }

    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f9fa]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1e293b] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f1f3f5] flex items-center justify-center p-4">
      <div className="w-full max-w-[1200px] bg-white rounded-[32px] shadow-2xl overflow-hidden min-h-[700px] flex relative">
        {/* Left Side: Login Form */}
        <div className="w-full lg:w-[45%] p-8 md:p-12 lg:p-16 flex flex-col z-10">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 bg-white flex items-center justify-center rounded-lg shadow-sm">
              <img src="/school-logo.png" alt="Oxford Logo" className="w-10 h-10 object-contain" />
            </div>
            <div>
              <h1 className="text-[#1e293b] text-2xl font-bold tracking-tight leading-none">OXFORD</h1>
              <p className="text-[#64748b] text-[10px] uppercase tracking-wider mt-1 font-semibold">School Management System</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-[#1e293b] text-2xl font-bold mb-2">Login to your account</h2>
            <div className="flex items-center gap-4 mt-4 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
              {(['staff', 'feeInCharge', 'admin'] as RoleType[]).map((role) => (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={cn(
                    "whitespace-nowrap px-4 py-2 rounded-full text-xs font-semibold transition-all",
                    selectedRole === role
                      ? "bg-[#1e293b] text-white shadow-md shadow-slate-200"
                      : "bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]"
                  )}
                >
                  {role === 'feeInCharge' ? 'Fee In-charge' : role.charAt(0).toUpperCase() + role.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-1.5">
                <Label htmlFor="fullname" className="text-[#64748b] text-xs font-semibold ml-1">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#94a3b8]" />
                  <Input
                    id="fullname"
                    placeholder="Enter your name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-14 pl-12 bg-[#f1f5f9] border-none rounded-2xl text-[#1e293b] placeholder:text-[#94a3b8] focus-visible:ring-[#1e293b]"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[#64748b] text-xs font-semibold ml-1">Username or Email</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#94a3b8]" />
                <Input
                  id="email"
                  type="email"
                  placeholder={
                    isLogin
                      ? (selectedRole === 'admin'
                        ? 'admin@oxford.com'
                        : selectedRole === 'feeInCharge'
                          ? 'feeincharge@oxford.com'
                          : 'staff@oxford.com')
                      : 'name@oxford.com'
                  }
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-14 pl-12 bg-[#f1f5f9] border-none rounded-2xl text-[#1e293b] placeholder:text-[#94a3b8] focus-visible:ring-[#1e293b]"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[#64748b] text-xs font-semibold ml-1">Password</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#94a3b8]" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-14 pl-12 pr-12 bg-[#f1f5f9] border-none rounded-2xl text-[#1e293b] placeholder:text-[#94a3b8] focus-visible:ring-[#1e293b]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#1e293b]"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center px-1">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-xs font-semibold text-[#1e293b] hover:underline"
              >
                {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
              </button>
              {isLogin && (
                <button
                  type="button"
                  onClick={() => toast({ title: "Please contact Admin to reset password" })}
                  className="text-xs font-semibold text-[#64748b] hover:text-[#1e293b]"
                >
                  Forget password?
                </button>
              )}
            </div>

            <Button type="submit" className="w-full h-14 bg-[#1e293b] hover:bg-[#0f172a] text-white rounded-2xl text-base font-semibold transition-all duration-300 shadow-lg shadow-slate-200" disabled={isSubmitting}>
              {isSubmitting ? (isLogin ? 'Logging in...' : 'Creating...') : (isLogin ? 'Login' : 'Sign Up')}
            </Button>
          </form>

          <div className="mt-auto pt-10">
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-[#f1f5f9]" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-4 text-[#94a3b8] font-medium tracking-widest">Demo Access</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <button
                className="py-3 px-1 rounded-xl bg-[#f8fafc] border border-[#f1f5f9] text-[10px] font-bold text-[#475569] hover:bg-[#f1f5f9] hover:text-[#1e293b] transition-all"
                onClick={() => setMockUser('admin')}
              >
                DEMO ADMIN
              </button>
              <button
                className="py-3 px-1 rounded-xl bg-[#f8fafc] border border-[#f1f5f9] text-[10px] font-bold text-[#475569] hover:bg-[#f1f5f9] hover:text-[#1e293b] transition-all"
                onClick={() => setMockUser('staff')}
              >
                DEMO STAFF
              </button>
              <button
                className="py-3 px-1 rounded-xl bg-[#f8fafc] border border-[#f1f5f9] text-[10px] font-bold text-[#475569] hover:bg-[#f1f5f9] hover:text-[#1e293b] transition-all"
                onClick={() => setMockUser('feeInCharge')}
              >
                DEMO FEE
              </button>
            </div>
            <p className="text-center text-[10px] text-[#94a3b8] mt-6 italic">
              * Recommended: Use Google Chrome for the best experience.
            </p>
          </div>
        </div>

        {/* Right Side: Illustration & Decorative Background */}
        <div className="hidden lg:flex w-[55%] bg-[#f8fafc] relative overflow-hidden items-center justify-center p-12">
          {/* Large curved background shape */}
          <div className="absolute top-[10%] right-[-10%] w-[120%] h-[120%] bg-[#e0f2fe]/40 rounded-full blur-3xl opacity-60" />
          <div className="absolute bottom-[-20%] left-[-20%] w-[100%] h-[100%] bg-[#ecfdf5]/40 rounded-full blur-3xl opacity-60" />

          <div className="relative z-10 w-full max-w-[500px]">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative"
            >
              {/* This is a placeholder for the illustration. Since I cannot generate a file, I will use a high quality illustration from a CDN */}
              <img
                src="https://illustrations.popsy.co/blue/studying.svg"
                alt="Educational Illustration"
                className="w-full h-auto drop-shadow-[0_20px_50px_rgba(0,0,0,0.05)]"
              />

              {/* Floating decorative elements to match the screenshot style */}
              <div className="absolute -top-10 -right-4 w-6 h-6 bg-yellow-400/20 rounded-full animate-pulse" />
              <div className="absolute top-20 -left-10 w-4 h-4 bg-teal-400/30 rotate-45 animate-bounce" />
              <div className="absolute bottom-10 -right-10 w-8 h-8 bg-rose-400/20 rounded-lg rotate-12" />
            </motion.div>

            <div className="mt-12 text-center">
              <h3 className="text-xl font-bold text-[#1e293b]">Welcome back to Oxford!</h3>
              <p className="text-[#64748b] mt-2 max-w-[320px] mx-auto text-sm">
                Efficiency, Transparency, and Excellence in School Management.
              </p>
            </div>
          </div>

          {/* Curved separator like in the screenshot */}
          <div className="absolute top-0 left-0 w-32 h-full bg-white transition-all transform -translate-x-16 skew-x-[-15deg] z-0" />
        </div>
      </div>
    </div>
  );
}
