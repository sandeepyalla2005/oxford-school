import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ShoppingBag,
  Shirt,
  BookOpen,
  Circle,
  IdCard,
  Drama,
  TrendingUp,
  Package,
  Users,
  Calendar,
  IndianRupee,
  Search,
  Plus
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Accessory {
  id: string;
  category: string;
  item_name: string;
  description: string | null;
  unit_price: number;
  quantity: number;
  stock_status: string;
  is_active: boolean;
  created_at: string;
}

interface SalesSummary {
  total_sales: number;
  total_revenue: number;
  pending_payments: number;
  low_stock_items: number;
}

export default function AccessoriesMaster() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [salesSummary, setSalesSummary] = useState<SalesSummary>({
    total_sales: 0,
    total_revenue: 0,
    pending_payments: 0,
    low_stock_items: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const menuItems = [
    {
      name: 'School Uniform',
      path: '/accessories/uniform',
      icon: Shirt,
      description: 'Shirts, trousers, skirts, blazers, ties',
      category: 'uniform'
    },
    {
      name: 'Exam Booklet',
      path: '/accessories/exam-booklet',
      icon: BookOpen,
      description: 'Exam name, class, subject',
      category: 'exam_booklet'
    },
    {
      name: 'Belts',
      path: '/accessories/belts',
      icon: Circle,
      description: 'Regular / elastic',
      category: 'belts'
    },
    {
      name: 'ID Card',
      path: '/accessories/id-card',
      icon: IdCard,
      description: 'New / duplicate with reason',
      category: 'id_card'
    },
    {
      name: 'Cultural Activity',
      path: '/accessories/cultural-activity',
      icon: Drama,
      description: 'Costumes, props, traditional wear',
      category: 'cultural'
    }
  ];

  useEffect(() => {
    fetchAccessoriesData();
  }, []);

  const fetchAccessoriesData = async () => {
    setIsLoading(true);
    try {
      const { data: accessoriesData, error: accessoriesError } = await supabase
        .from('accessories')
        .select('*')
        .order('created_at', { ascending: false }) as { data: Accessory[] | null; error: any };

      if (accessoriesError) throw accessoriesError;

      const { data: salesData, error: salesError } = await supabase
        .from('accessory_sales')
        .select('total_amount, payment_status') as { data: { total_amount: number; payment_status: string }[] | null; error: any };

      const missingSalesTable =
        salesError?.code === 'PGRST205' &&
        salesError.message?.includes("public.accessory_sales");

      if (salesError && !missingSalesTable) throw salesError;

      if (missingSalesTable) {
        console.warn('accessory_sales table is missing. Showing zeroed sales summary.');
      }

      const safeSalesData = salesData || [];
      const totalSales = safeSalesData.length;
      const totalRevenue = safeSalesData
        .filter(s => s.payment_status === 'paid')
        .reduce((sum, s) => sum + Number(s.total_amount || 0), 0);
      const pendingPayments = safeSalesData.filter(s => s.payment_status === 'pending').length;
      const lowStockItems = (accessoriesData || []).filter(a =>
        a.stock_status === 'low_stock' || Number(a.quantity) <= 5
      ).length;

      setAccessories(accessoriesData || []);
      setSalesSummary({
        total_sales: totalSales,
        total_revenue: totalRevenue,
        pending_payments: pendingPayments,
        low_stock_items: lowStockItems
      });
    } catch (error: any) {
      console.error('Error fetching accessories data:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to load accessories',
        description: error.message || 'Please try again later.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getStockStatusBadge = (status: string) => {
    switch (status) {
      case 'in_stock':
        return <Badge variant="default">In Stock</Badge>;
      case 'low_stock':
        return <Badge variant="destructive">Low Stock</Badge>;
      case 'out_of_stock':
        return <Badge variant="secondary">Out of Stock</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredAccessories = accessories.filter(item =>
    item.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCategoryItemCount = (category: string) => {
    return accessories.filter(item => item.category === category).length;
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="page-header"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="page-title flex items-center gap-3">
                <ShoppingBag className="h-8 w-8 text-primary" />
                Accessories Management
              </h1>
              <p className="page-description">Manage school accessories, uniforms, and student items</p>
            </div>
            <Button onClick={() => navigate('/accessories/history')} variant="outline">
              <Package className="mr-2 h-4 w-4" />
              Transaction History
            </Button>
          </div>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search accessories by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </motion.div>

        {/* Category Menu */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {menuItems.map((item, index) => {
              const IconComponent = item.icon;
              const itemCount = getCategoryItemCount(item.category);

              return (
                <Card
                  key={item.name}
                  className="hover:shadow-lg transition-all duration-200 cursor-pointer group"
                  onClick={() => navigate(item.path)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                          <IconComponent className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{item.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">{itemCount} items</p>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </motion.div>


      </div>
    </DashboardLayout>
  );
}
