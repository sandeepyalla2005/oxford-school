import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    UserPlus,
    Search,
    Edit2,
    Trash2,
    MoreVertical,
    Mail,
    Phone,
    GraduationCap,
    ShieldCheck,
    ShieldAlert,
    Save,
    X,
    RefreshCw,
    Eye,
    EyeOff,
    UserCheck,
    Upload,
    UserCog,
    MapPin
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const CLASSES = [
    'Nursery', 'LKG', 'UKG',
    'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
    'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
    'Not Assigned'
];

interface Staff {
    id: string;
    staffId: string;
    name: string;
    designation: string;
    phone: string;
    email: string;
    personalEmail?: string;
    address?: string;
    qualification?: string;
    photo?: string;
    classTeacher: string;
    status: 'active' | 'inactive';
    password?: string; // Form only
}

// Initial staff removed as data is fetched from Supabase

export default function StaffManagement() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [photoFile, setPhotoFile] = useState<File | null>(null);

    // Form State
    const [formData, setFormData] = useState<Partial<Staff>>({
        name: '',
        designation: '',
        phone: '',
        email: '',
        personalEmail: '',
        address: '',
        qualification: '',
        photo: '',
        classTeacher: 'Not Assigned',
        status: 'active',
        staffId: '',
        password: '' // Added for creation
    });

    // Fetch Staff
    const { data: staffList = [], isLoading } = useQuery({
        queryKey: ['staff-profiles'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Map profiles to Staff interface
            return (data as any[]).map((profile, index) => ({
                id: profile.user_id, // Use user_id as ID
                staffId: profile.staff_id || `AO-STAFF-${profile.user_id.substring(0, 5).toUpperCase()}`, // Use staff_id column or fallback
                name: profile.full_name,
                designation: profile.designation || 'Staff',
                phone: profile.phone || '',
                email: profile.email,
                personalEmail: profile.personal_email,
                address: profile.address,
                qualification: profile.qualification,
                photo: profile.avatar_url,
                classTeacher: profile.subject || 'Not Assigned', // Map subject to classTeacher for visual consistency
                status: (profile.is_active ? 'active' : 'inactive') as 'active' | 'inactive',
            }));
        }
    });

    const createStaffMutation = useMutation({
        mutationFn: async (data: any) => {
            // Create a temporary client that doesn't persist session to avoid signing out the admin
            const tempSupabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
                auth: {
                    persistSession: false,
                    autoRefreshToken: false,
                    detectSessionInUrl: false
                }
            });

            // 1. SignUp via temp client
            const { data: authData, error: authError } = await tempSupabase.auth.signUp({
                email: data.email,
                password: data.password || 'password123',
                options: {
                    data: { full_name: data.name }
                }
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error("User creation failed");

            // From here on, we use the session of the NEW user (available in authData.session if it's auto-confirmed)
            // But if confirmation is required, we don't have a session.
            // Our RLS policies allow the authenticated user (auth.uid()) to insert.
            // If confirmation is required, we might need a different approach, 
            // but for this app it seems we use an RPC to auto-confirm.

            let avatarUrl = null;
            // 2. Upload Photo (Use the main client if the bucket policy allows authenticated users or admins)
            // Actually, let's try to use the temp client which might have the session if it was auto-signed-in
            const clientForUpload = authData.session ? tempSupabase : supabase;

            if (photoFile) {
                const fileExt = photoFile.name.split('.').pop();
                const filePath = `staff-avatars/${authData.user.id}/${Math.random()}.${fileExt}`;
                const { error: uploadError } = await clientForUpload.storage.from('avatars').upload(filePath, photoFile);
                if (!uploadError) {
                    const { data: { publicUrl } } = clientForUpload.storage.from('avatars').getPublicUrl(filePath);
                    avatarUrl = publicUrl;
                }
            }

            // 3. Insert Profile & Role (Use the temp client if session is present, otherwise hope policies allow it)
            // Since we added policies for users to create their own profile/role, the temp client having the session is ideal.
            const targetClient = authData.session ? tempSupabase : supabase;

            const { error: profileError } = await targetClient.from('profiles').insert({
                user_id: authData.user.id,
                full_name: data.name,
                email: data.email,
                phone: data.phone,
                designation: data.designation,
                subject: data.classTeacher === 'Not Assigned' ? null : data.classTeacher,
                qualification: data.qualification,
                personal_email: data.personalEmail,
                address: data.address,
                avatar_url: avatarUrl,
                is_active: data.status === 'active',
                staff_id: data.staffId
            } as any);

            if (profileError) {
                console.error("Profile Error:", profileError);
                throw profileError;
            }

            // 4. Assign Role
            await targetClient.from('user_roles').insert({
                user_id: authData.user.id,
                role: 'staff'
            });

            // 5. Auto Confirm (MUST use main client because it needs Admin session)
            try {
                const { error: confirmErr } = await supabase.rpc('confirm_staff_user_email', {
                    p_user_id: authData.user.id
                });
                if (confirmErr) throw confirmErr;
            } catch (rpcErr) {
                console.warn("RPC confirm failed:", rpcErr);
            }

            return authData.user;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staff-profiles'] });
            toast.success('Staff member added successfully');
            setIsAddModalOpen(false);
            resetForm();
        },
        onError: (err: any) => {
            console.error("Staff Creation Error:", err);
            const msg = err.message || "";
            if (msg.includes('already registered') || msg.includes('already exists')) {
                toast.error('This email is already in use in the identity system.', {
                    description: 'If this staff member was deleted recently, their login account might still exist. Please contact support or use a different email.',
                    duration: 6000,
                });
            } else {
                toast.error(msg || "Failed to add staff member");
            }
        }
    });

    // Simple update mutation (without auth/password change for now)
    const updateStaffMutation = useMutation({
        mutationFn: async (data: any) => {
            // Update profile
            const updates: any = {
                full_name: data.name,
                phone: data.phone,
                designation: data.designation,
                subject: data.classTeacher === 'Not Assigned' ? null : data.classTeacher,
                qualification: data.qualification,
                personal_email: data.personalEmail,
                address: data.address,
                is_active: data.status === 'active',
                staff_id: data.staffId
            };

            if (photoFile) {
                const fileExt = photoFile.name.split('.').pop();
                const filePath = `staff-avatars/${data.id}/${Math.random()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, photoFile);
                if (!uploadError) {
                    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
                    updates.avatar_url = publicUrl;
                }
            }

            const { error } = await supabase.from('profiles').update(updates).eq('user_id', data.id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staff-profiles'] });
            toast.success('Staff profile updated');
            setIsAddModalOpen(false);
            resetForm();
        },
        onError: (err) => toast.error(err.message)
    });

    const resetForm = () => {
        setFormData({
            name: '', designation: '', phone: '', email: '',
            personalEmail: '', address: '', qualification: '', photo: '',
            classTeacher: 'Not Assigned', status: 'active', staffId: '', password: ''
        });
        setPhotoFile(null);
        setEditingStaff(null);
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPhotoFile(file); // Store file for upload
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, photo: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveStaff = () => {
        if (!formData.name || !formData.email || !formData.phone) {
            toast.error('Please fill in all required fields');
            return;
        }

        // Pre-validation for existing email
        if (!editingStaff) {
            const emailExists = staffList.some(s => s.email?.toLowerCase() === formData.email?.toLowerCase());
            if (emailExists) {
                toast.error('A staff member with this email already exists in the system.');
                return;
            }
        }

        if (editingStaff) {
            updateStaffMutation.mutate({ ...formData, id: editingStaff.id });
        } else {
            if (!formData.password) {
                toast.error('Password is required for new staff');
                return;
            }
            createStaffMutation.mutate(formData);
        }
    };

    // Clear All Staff Mutation
    const clearAllStaffMutation = useMutation({
        mutationFn: async () => {
            const { error } = await supabase.rpc('delete_all_staff_users');
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staff-profiles'] });
            toast.success('All staff instances have been removed from the directory.');
        },
        onError: (err: any) => {
            toast.error('Failed to clear staff: ' + err.message);
        }
    });

    const handleClearAllStaff = () => {
        if (confirm("Are you sure? This will remove ALL staff profiles and their access roles. This action cannot be undone.")) {
            clearAllStaffMutation.mutate();
        }
    };

    // Other handlers
    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure? This will permanently remove the user account and all associated profile data.")) return;

        try {
            const { error } = await supabase.rpc('delete_staff_user', { target_user_id: id });
            if (error) throw error;

            queryClient.invalidateQueries({ queryKey: ['staff-profiles'] });
            toast.success('Staff member and account removed successfully');
        } catch (e: any) {
            console.error("Delete Error:", e);
            toast.error('Failed to delete: ' + (e.message || 'Unknown error'));
        }
    };

    const toggleStatus = async (id: string) => {
        const staff = staffList.find(s => s.id === id);
        if (!staff) return;
        const newStatus = staff.status === 'active' ? false : true;

        try {
            await supabase.from('profiles').update({ is_active: newStatus }).eq('user_id', id);
            queryClient.invalidateQueries({ queryKey: ['staff-profiles'] });
            toast.success('Status updated');
        } catch (e) {
            toast.error('Failed to update status');
        }
    };

    const generateStaffId = () => {
        const id = `AO-STAFF-${Math.floor(1000 + Math.random() * 9000)}`;
        setFormData(prev => ({ ...prev, staffId: id }));
        toast.success('Staff ID Generated');
    };

    const handleEdit = (staff: Staff) => {
        setEditingStaff(staff);
        setFormData({ ...staff, password: '' });
        setIsAddModalOpen(true);
    };

    const filteredStaff = staffList.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.staffId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.designation.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <DashboardLayout>
            <div className="space-y-8 animate-in fade-in duration-500">
                {/* Header Section */}
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-[#002147] tracking-tight font-display">Staff Management</h1>
                        <p className="text-slate-500 font-medium">Manage teacher profiles and access credentials</p>
                    </div>

                    <div className="flex gap-4">
                        <Dialog open={isAddModalOpen} onOpenChange={(open) => {
                            setIsAddModalOpen(open);
                            if (!open) {
                                setEditingStaff(null);
                                setFormData({
                                    name: '', designation: '', phone: '', email: '',
                                    personalEmail: '', address: '', qualification: '', photo: '',
                                    classTeacher: 'Not Assigned', status: 'active'
                                });
                            }
                        }}>
                            <DialogTrigger asChild>
                                <Button className="bg-[#002147] hover:bg-[#1e3a8a] text-white rounded-2xl h-14 px-8 font-bold shadow-xl shadow-blue-900/10 transition-all active:scale-95 group">
                                    <UserPlus className="mr-3 h-5 w-5 group-hover:rotate-12 transition-transform" />
                                    Add New Staff
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[600px] rounded-[2.5rem] border-none shadow-2xl overflow-hidden p-0">
                                <div className="bg-[#002147] p-8 text-white relative">
                                    <DialogHeader className="space-y-2">
                                        <DialogTitle className="text-2xl font-bold">{editingStaff ? 'Edit Staff Profile' : 'Register New Staff'}</DialogTitle>
                                        <DialogDescription className="text-white/60">Fill in the professional details below to create an account.</DialogDescription>
                                    </DialogHeader>
                                    <div className="absolute right-0 top-0 h-full w-1/3 bg-white/5 skew-x-[-20deg] translate-x-12" />
                                </div>

                                <div className="p-10 space-y-6 bg-white overflow-y-auto max-h-[70vh]">
                                    <div className="space-y-8">
                                        {/* Photo Upload Section */}
                                        <div className="flex flex-col items-center justify-center gap-4">
                                            <div className="relative group">
                                                <div className="h-24 w-24 rounded-full border-4 border-slate-100 shadow-lg overflow-hidden flex items-center justify-center bg-slate-100">
                                                    {formData.photo ? (
                                                        <img src={formData.photo} alt="Preview" className="h-full w-full object-cover" />
                                                    ) : (
                                                        <div className="bg-slate-100 text-slate-400">
                                                            <UserCog className="h-10 w-10" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                                    <Upload className="h-6 w-6 text-white" />
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <input
                                                    type="file"
                                                    ref={fileInputRef}
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={handlePhotoChange}
                                                />
                                                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                                                    {formData.photo ? 'Change Photo' : 'Upload Photo'}
                                                </Button>
                                                {formData.photo && (
                                                    <Button type="button" variant="ghost" size="sm" className="text-red-500 hover:text-red-600 h-8 mt-1" onClick={() => setFormData(prev => ({ ...prev, photo: '' }))}>
                                                        Remove
                                                    </Button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-black uppercase tracking-widest text-[#002147]/40 ml-1">Staff Member Name</label>
                                                <Input
                                                    placeholder="e.g. Dr. Jane Cooper"
                                                    value={formData.name}
                                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                    className="rounded-2xl border-slate-200 h-14 focus:ring-2 focus:ring-[#002147]/5"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-black uppercase tracking-widest text-[#002147]/40 ml-1">Designation</label>
                                                <Input
                                                    placeholder="e.g. Mathematics Teacher"
                                                    value={formData.designation}
                                                    onChange={e => setFormData({ ...formData, designation: e.target.value })}
                                                    className="rounded-2xl border-slate-200 h-14 focus:ring-2 focus:ring-[#002147]/5"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-black uppercase tracking-widest text-[#002147]/40 ml-1">Phone Number</label>
                                                <div className="relative">
                                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                    <Input
                                                        placeholder="+91 XXXXX XXXXX"
                                                        value={formData.phone}
                                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                                        className="rounded-2xl border-slate-200 h-14 pl-12 focus:ring-2 focus:ring-[#002147]/5"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-black uppercase tracking-widest text-[#002147]/40 ml-1">Official Email</label>
                                                <div className="relative">
                                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                    <Input
                                                        placeholder="teacher@oxford.edu"
                                                        value={formData.email}
                                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                        className="rounded-2xl border-slate-200 h-14 pl-12 focus:ring-2 focus:ring-[#002147]/5"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-black uppercase tracking-widest text-[#002147]/40 ml-1">Personal Email</label>
                                                <div className="relative">
                                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                    <Input
                                                        placeholder="teacher.personal@gmail.com"
                                                        value={formData.personalEmail}
                                                        onChange={e => setFormData({ ...formData, personalEmail: e.target.value })}
                                                        className="rounded-2xl border-slate-200 h-14 pl-12 focus:ring-2 focus:ring-[#002147]/5"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-black uppercase tracking-widest text-[#002147]/40 ml-1">Qualification</label>
                                                <div className="relative">
                                                    <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                    <Input
                                                        placeholder="M.Sc Mathematics, B.Ed"
                                                        value={formData.qualification}
                                                        onChange={e => setFormData({ ...formData, qualification: e.target.value })}
                                                        className="rounded-2xl border-slate-200 h-14 pl-12 focus:ring-2 focus:ring-[#002147]/5"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[11px] font-black uppercase tracking-widest text-[#002147]/40 ml-1">Residential Address</label>
                                            <div className="relative">
                                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                <Input
                                                    placeholder="Full street address, City, Zip Code"
                                                    value={formData.address}
                                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                                    className="rounded-2xl border-slate-200 h-14 pl-12 focus:ring-2 focus:ring-[#002147]/5"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-black uppercase tracking-widest text-[#002147]/40 ml-1">Class Teacher Assignment</label>
                                                <Select value={formData.classTeacher} onValueChange={v => setFormData({ ...formData, classTeacher: v })}>
                                                    <SelectTrigger className="rounded-2xl border-slate-200 h-14 bg-slate-50/50 shadow-sm">
                                                        <SelectValue placeholder="Select assigned class" />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-2xl border-slate-100 shadow-2xl z-[100]">
                                                        {CLASSES.map(cls => (
                                                            <SelectItem key={cls} value={cls} className="rounded-xl my-1">{cls}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-4 border-t border-slate-100">
                                        <label className="text-[11px] font-black uppercase tracking-widest text-[#002147]">Access Credentials</label>

                                        <div className="grid grid-cols-1 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-black uppercase tracking-widest text-[#002147]/40 ml-1">Login ID (Email)</label>
                                                <Input
                                                    placeholder="Login Email ID"
                                                    value={formData.email}
                                                    readOnly
                                                    className="rounded-2xl border-slate-200 h-14 bg-slate-50/50 text-slate-500 cursor-not-allowed"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-black uppercase tracking-widest text-[#002147]/40 ml-1">Account Password</label>
                                                <div className="relative">
                                                    <Input
                                                        type={showPassword ? 'text' : 'password'}
                                                        placeholder={editingStaff ? "Leave blank to keep current" : "Create login password"}
                                                        value={formData.password}
                                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                                        className="rounded-2xl border-slate-200 h-14 pr-12 focus:ring-2 focus:ring-[#002147]/5"
                                                    />
                                                    <button
                                                        type="button"
                                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#002147]"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                    >
                                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-6 rounded-[2rem] bg-slate-50 border border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className={cn("p-2 rounded-lg transition-colors", formData.status === 'active' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400')}>
                                                <UserCheck className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-[#002147]">Account Activation Status</p>
                                                <p className="text-[11px] text-slate-500">Enable or disable staff login access</p>
                                            </div>
                                        </div>
                                        <Switch
                                            checked={formData.status === 'active'}
                                            onCheckedChange={checked => setFormData({ ...formData, status: checked ? 'active' : 'inactive' })}
                                        />
                                    </div>
                                </div>

                                <DialogFooter className="p-8 bg-slate-50 border-t border-slate-100">
                                    <Button variant="outline" onClick={() => setIsAddModalOpen(false)} className="rounded-2xl h-14 px-8 font-bold border-slate-200 shadow-sm transition-all hover:bg-white active:scale-95">Cancel</Button>
                                    <Button className="bg-[#002147] hover:bg-[#1e3a8a] text-white rounded-2xl h-14 px-10 font-bold shadow-xl shadow-blue-900/10 active:scale-95" onClick={handleSaveStaff}>
                                        <Save className="mr-3 h-5 w-5" />
                                        {editingStaff ? 'Update Profile' : 'Save Staff Account'}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                        <Button
                            variant="outline"
                            onClick={handleClearAllStaff}
                            className="h-14 px-8 rounded-2xl border-red-200 text-red-600 hover:bg-red-600 hover:text-white font-bold active:scale-95 transition-all shadow-lg shadow-red-500/5 group bg-white"
                            disabled={clearAllStaffMutation.isPending}
                        >
                            <Trash2 className="mr-3 h-5 w-5 group-hover:animate-bounce transition-transform" />
                            Remove All Staff members
                        </Button>
                    </div>
                </div>

                {/* Filters and Stats Section */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <Card className="lg:col-span-3 border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-8 py-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                    <Input
                                        placeholder="Search teachers by name, ID or specialization..."
                                        className="pl-12 rounded-2xl border-none shadow-inner bg-slate-100/50 h-14 w-full focus:ring-2 focus:ring-[#002147]/10"
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Badge variant="outline" className="h-10 px-4 rounded-xl bg-white border-slate-200 text-[#002147] font-bold">Total: {staffList.length}</Badge>
                                    <Badge variant="outline" className="h-10 px-4 rounded-xl bg-emerald-50 border-emerald-100 text-emerald-600 font-bold">Active: {staffList.filter(s => s.status === 'active').length}</Badge>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-slate-50/30">
                                        <TableRow className="border-none">
                                            <TableHead className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Staff Info</TableHead>
                                            <TableHead className="py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Role & Class</TableHead>
                                            <TableHead className="py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Contact</TableHead>
                                            <TableHead className="py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Status</TableHead>
                                            <TableHead className="px-8 py-4 text-right"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <AnimatePresence>
                                            {filteredStaff.length > 0 ? filteredStaff.map((staff, idx) => (
                                                <motion.tr
                                                    key={staff.id}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    className="group border-b border-slate-50 hover:bg-[#002147]/[0.02] transition-colors"
                                                >
                                                    <TableCell className="px-8 py-5">
                                                        <div className="flex items-center gap-4">
                                                            <div className="h-12 w-12 rounded-2xl bg-[#002147]/5 flex items-center justify-center text-[#002147] group-hover:bg-[#002147] group-hover:text-white transition-all duration-300 overflow-hidden">
                                                                {staff.photo ? (
                                                                    <img src={staff.photo} alt={staff.name} className="h-full w-full object-cover" />
                                                                ) : (
                                                                    <Users className="h-6 w-6" />
                                                                )}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-[#002147] text-base leading-tight">{staff.name}</p>
                                                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{staff.staffId}</p>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-5">
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-900 leading-tight">{staff.designation}</p>
                                                            <div className="flex items-center gap-1.5 mt-1 border border-slate-100 bg-white rounded-md w-fit px-2 py-0.5">
                                                                <GraduationCap className="h-3 w-3 text-[#002147]/40" />
                                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{staff.classTeacher}</span>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-5">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                                                                <Phone className="h-3 w-3 text-slate-400" />
                                                                {staff.phone}
                                                            </div>
                                                            {staff.email && (
                                                                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                                                                    <Mail className="h-3 w-3" />
                                                                    {staff.email}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-5 text-center">
                                                        <Badge className={cn(
                                                            "rounded-md border-none px-2.5 py-1 text-[10px] uppercase font-black tracking-widest",
                                                            staff.status === 'active' ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                                                        )}>
                                                            {staff.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="px-8 py-5 text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 text-slate-400 hover:text-[#002147] hover:bg-slate-50">
                                                                    <MoreVertical className="h-5 w-5" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="rounded-2xl border-slate-100 shadow-2xl p-2 w-48">
                                                                <DropdownMenuItem onClick={() => handleEdit(staff)} className="rounded-xl h-11 font-bold text-slate-600 focus:bg-[#002147]/5 focus:text-[#002147] cursor-pointer">
                                                                    <Edit2 className="mr-3 h-4 w-4" /> Edit Profile
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => toggleStatus(staff.id)} className="rounded-xl h-11 font-bold text-slate-600 focus:bg-[#002147]/5 focus:text-[#002147] cursor-pointer">
                                                                    {staff.status === 'active' ? <ShieldAlert className="mr-3 h-4 w-4" /> : <ShieldCheck className="mr-3 h-4 w-4" />}
                                                                    {staff.status === 'active' ? 'Deactivate' : 'Activate'}
                                                                </DropdownMenuItem>
                                                                <div className="h-px bg-slate-50 my-2" />
                                                                <DropdownMenuItem onClick={() => handleDelete(staff.id)} className="rounded-xl h-11 font-bold text-red-500 focus:bg-red-50 focus:text-red-600 cursor-pointer">
                                                                    <Trash2 className="mr-3 h-4 w-4" /> Remove Staff
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </motion.tr>
                                            )) : (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="py-24 text-center">
                                                        <div className="max-w-xs mx-auto space-y-4 opacity-30">
                                                            <Users className="h-16 w-16 mx-auto text-slate-400" />
                                                            <div>
                                                                <p className="font-bold text-slate-900 uppercase tracking-widest">No Teachers Found</p>
                                                                <p className="text-sm">Try adjusting your search filters</p>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </AnimatePresence>
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-6">
                        <Card className="border-none shadow-xl rounded-[2.5rem] bg-[#002147] text-white overflow-hidden p-8 relative">
                            <div className="absolute top-0 right-0 h-32 w-32 bg-white/5 rounded-bl-full -mr-8 -mt-8" />
                            <div className="relative z-10 space-y-4">
                                <div className="h-14 w-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
                                    <ShieldCheck className="h-7 w-7" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold font-display">Access Summary</h3>
                                    <p className="text-white/60 text-sm">System-wide staff authority overview</p>
                                </div>
                                <div className="space-y-3 pt-4">
                                    <div className="flex justify-between items-center text-sm border-b border-white/10 pb-2">
                                        <span className="text-white/50">Admin Access</span>
                                        <span className="font-bold">2 Members</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm border-b border-white/10 pb-2">
                                        <span className="text-white/50">Staff Access</span>
                                        <span className="font-bold">{staffList.filter(s => s.status === 'active').length} Members</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm border-b border-white/10 pb-2">
                                        <span className="text-white/50">Restricted</span>
                                        <span className="font-bold">{staffList.filter(s => s.status === 'inactive').length} Members</span>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <Card className="border-none shadow-xl rounded-[2.5rem] bg-emerald-600 text-white p-8 group overflow-hidden relative">
                            <div className="absolute inset-0 bg-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="relative z-10 space-y-4">
                                <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                                    <GraduationCap className="h-7 w-7" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold font-display leading-tight">Class Teacher Assignment</h3>
                                    <p className="text-white/70 text-sm mt-1">Teachers assigned as primary mentors for class sections.</p>
                                </div>
                                <Button variant="outline" className="w-full h-12 rounded-2xl border-white/30 bg-white/10 text-white hover:bg-white hover:text-emerald-700 font-bold border-none transition-all">
                                    Review All Mentors
                                </Button>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
