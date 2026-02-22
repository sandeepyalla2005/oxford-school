import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Drama,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  ArrowLeft,
  Package,
  IndianRupee,
  Users,
  Calendar
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

interface CulturalItem {
  id: string;
  item_name: string;
  description: string;
  unit_price: number;
  quantity: number;
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock';
  activity_type: 'costume' | 'props' | 'traditional_wear';
  size?: string;
  is_active: boolean;
  created_at: string;
}

export default function AccessoriesCulturalActivity() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [culturalItems, setCulturalItems] = useState<CulturalItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CulturalItem | null>(null);

  const activityTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'costume', label: 'Costume' },
    { value: 'props', label: 'Props' },
    { value: 'traditional_wear', label: 'Traditional Wear' }
  ];

  useEffect(() => {
    fetchCulturalItems();
  }, []);

  const fetchCulturalItems = () => {
    const mockItems: CulturalItem[] = [
      {
        id: '1',
        item_name: 'Dance Costume',
        description: 'Traditional dance costume for cultural events',
        unit_price: 600.00,
        quantity: 25,
        stock_status: 'in_stock',
        activity_type: 'costume',
        size: 'S, M, L, XL',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z'
      },
      {
        id: '2',
        item_name: 'Drama Props',
        description: 'Theater performance props and accessories',
        unit_price: 300.00,
        quantity: 40,
        stock_status: 'in_stock',
        activity_type: 'props',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z'
      },
      {
        id: '3',
        item_name: 'Traditional Wear',
        description: 'Cultural festival attire and accessories',
        unit_price: 750.00,
        quantity: 20,
        stock_status: 'in_stock',
        activity_type: 'traditional_wear',
        size: 'Various sizes',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z'
      },
      {
        id: '4',
        item_name: 'Music Instruments',
        description: 'Traditional musical instruments for performances',
        unit_price: 1200.00,
        quantity: 15,
        stock_status: 'in_stock',
        activity_type: 'props',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z'
      }
    ];

    setCulturalItems(mockItems);
    setIsLoading(false);
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

  const getActivityTypeBadge = (type: string) => {
    const typeMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      costume: { label: 'Costume', variant: 'default' },
      props: { label: 'Props', variant: 'secondary' },
      traditional_wear: { label: 'Traditional Wear', variant: 'outline' }
    };

    const config = typeMap[type] || { label: type, variant: 'outline' };
    return <Badge variant={config.variant} className="capitalize">{config.label}</Badge>;
  };

  const filteredItems = culturalItems.filter(item => {
    const matchesSearch =
      item.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType === 'all' || item.activity_type === filterType;

    return matchesSearch && matchesType;
  });

  const totalItems = filteredItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleAddNewItem = () => {
    setEditingItem(null);
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: editingItem ? 'Item Updated' : 'Item Added',
      description: editingItem
        ? 'Cultural activity item has been updated successfully.'
        : 'New cultural activity item has been added successfully.',
    });
    setIsDialogOpen(false);
    setEditingItem(null);
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
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/accessories')}
                className="h-8 w-8 p-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="page-title flex items-center gap-3">
                  <Drama className="h-8 w-8 text-primary" />
                  Cultural Activity Management
                </h1>
                <p className="page-description">Manage cultural activity items and costumes</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => navigate('/accessories/history')} variant="outline">
                <Package className="mr-2 h-4 w-4" />
                Transaction History
              </Button>
              <Button onClick={handleAddNewItem}>
                <Plus className="mr-2 h-4 w-4" />
                Add New Item
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalItems}</div>
                <p className="text-xs text-muted-foreground">Units in stock</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Activity Types</CardTitle>
                <Drama className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Set(filteredItems.map(item => item.activity_type)).size}
                </div>
                <p className="text-xs text-muted-foreground">Different categories</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Items</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {filteredItems.filter(item => item.is_active).length}
                </div>
                <p className="text-xs text-muted-foreground">Currently available</p>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-primary" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by item name or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Activity Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {activityTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button variant="outline" onClick={() => {
                  setSearchQuery('');
                  setFilterType('all');
                }}>
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Cultural Items Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Drama className="h-5 w-5 text-primary" />
                Cultural Activity Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="table-header">
                      <TableHead>Item Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <div className="h-6 w-6 mx-auto animate-spin rounded-full border-4 border-primary border-t-transparent" />
                        </TableCell>
                      </TableRow>
                    ) : filteredItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No cultural activity items found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredItems.map((item) => (
                        <TableRow key={item.id} className="hover:bg-muted/50">
                          <TableCell className="font-medium">{item.item_name}</TableCell>
                          <TableCell className="text-muted-foreground">{item.description}</TableCell>
                          <TableCell>{getActivityTypeBadge(item.activity_type)}</TableCell>
                          <TableCell className="text-sm">{item.size || 'N/A'}</TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(item.unit_price)}
                          </TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell>{getStockStatusBadge(item.stock_status)}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center gap-2">
                              <Button size="sm" variant="outline">
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">
                {editingItem ? 'Edit Cultural Item' : 'Add New Cultural Item'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="item_name">Item Name</Label>
                  <Input
                    id="item_name"
                    defaultValue={editingItem?.item_name || ''}
                    placeholder="Enter item name"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    defaultValue={editingItem?.description || ''}
                    placeholder="Enter description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="activity_type">Activity Type</Label>
                    <Select defaultValue={editingItem?.activity_type || ''}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="costume">Costume</SelectItem>
                        <SelectItem value="props">Props</SelectItem>
                        <SelectItem value="traditional_wear">Traditional Wear</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="size">Size (if applicable)</Label>
                    <Input
                      id="size"
                      defaultValue={editingItem?.size || ''}
                      placeholder="Enter size"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="unit_price">Unit Price (₹)</Label>
                    <Input
                      id="unit_price"
                      type="number"
                      step="0.01"
                      defaultValue={editingItem?.unit_price || ''}
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      defaultValue={editingItem?.quantity || ''}
                      placeholder="0"
                      required
                    />
                  </div>
                </div>
              </div>

              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="btn-oxford">
                  {editingItem ? 'Update Item' : 'Add Item'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}