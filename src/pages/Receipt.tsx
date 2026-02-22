import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Printer, ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ReceiptData {
    receiptNo: string;
    date: string;
    studentName: string;
    admissionNo: string;
    class: string;
    academicYear: string;
    particulars: { name: string; amount: number }[];
    totalAmount: number;
    paymentMode: string;
    narration?: string;
}

export default function Receipt() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [data, setData] = useState<ReceiptData | null>(null);
    const [loading, setLoading] = useState(true);

    const receiptNo = searchParams.get('receiptNo');
    const type = searchParams.get('type'); // 'course', 'books', 'transport'

    useEffect(() => {
        if (receiptNo && type) {
            fetchReceiptData();
        } else {
            setLoading(false);
            toast.error("Invalid Receipt Details");
        }
    }, [receiptNo, type]);

    const fetchReceiptData = async () => {
        try {
            let receiptData: ReceiptData | null = null;
            let tableName = '';

            // We need to fetch student details as well, so we'll likely need a join or two queries
            // Assuming 'course_payments', 'books_payments' etc tables exist

            if (type === 'course') tableName = 'course_payments';
            else if (type === 'books') tableName = 'books_payments';
            else if (type === 'transport') tableName = 'transport_payments';
            else if (type === 'accessory') tableName = 'accessory_sales';

            if (!tableName) throw new Error("Unknown fee type");

            // Remove .single() to allow multiple rows (e.g. multiple accessories)
            const { data: paymentData, error } = await supabase
                .from(tableName)
                .select('*, students(full_name, admission_number, classes(name))' + (type === 'accessory' ? ', accessories(item_name)' : ''))
                .eq('receipt_number', receiptNo);

            if (error) throw error;
            if (!paymentData || paymentData.length === 0) throw new Error("Receipt not found");

            // Use the first record for common details (student, class, date, payment mode)
            const record = paymentData[0] as any;

            // Format date
            const dateObj = new Date(record.created_at || new Date());
            const dateStr = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

            // Calculate total and build particulars
            let totalAmount = 0;
            const particulars = paymentData.map((item: any) => {
                const amount = Number(item.amount_paid || item.total_amount || 0);
                totalAmount += amount;
                return {
                    name: getParticularsName(type, item),
                    amount: amount
                };
            });

            // Construct receipt data
            receiptData = {
                receiptNo: record.receipt_number,
                date: dateStr,
                studentName: record.students?.full_name || 'N/A',
                admissionNo: record.students?.admission_number || 'N/A',
                class: record.students?.classes?.name || 'N/A',
                academicYear: record.academic_year || '2024-25',
                particulars: particulars,
                totalAmount: totalAmount,
                paymentMode: record.payment_method || 'Cash',
                narration: `Fees for ${type === 'course' ? `Term ${record.term}` : type}`
            };

            setData(receiptData);
        } catch (error: any) {
            console.error(error);
            toast.error("Failed to load receipt");
        } finally {
            setLoading(false);
        }
    };

    const getParticularsName = (type: string | null, data: any) => {
        if (type === 'course') return `COURSE FEE (Term ${data.term})`;
        if (type === 'books') return `BOOKS & ACCESSORIES`;
        if (type === 'transport') return `TRANSPORT FEE (${data.month ? new Date(0, data.month - 1).toLocaleString('default', { month: 'long' }) : 'Monthly'})`;
        if (type === 'accessory') return `ACCESSORY: ${data.accessories?.item_name || 'Item'} (${data.quantity} qty)`;
        return 'FEE PAYMENT';
    };

    const numberToWords = (num: number): string => {
        const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
        const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

        const regex = /^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/;
        const getLT20 = (n: number) => a[Number(n)];
        const get20Plus = (n: number) => b[Number(n.toString()[0])] + ' ' + a[Number(n.toString()[1])];

        if (num === 0) return 'Zero';

        // Simple implementation for demo, robust checking needed for production
        // Using a simpler approach for now for common amounts
        // ... Actually let's use a quick recursive function

        // Handling up to 99,999 for fees is usually enough
        if (num < 20) return a[num];
        if (num < 100) return b[Math.floor(num / 10)] + ' ' + a[num % 10];
        if (num < 1000) return numberToWords(Math.floor(num / 100)) + 'Hundred ' + numberToWords(num % 100);
        if (num < 100000) return numberToWords(Math.floor(num / 1000)) + 'Thousand ' + numberToWords(num % 1000);
        if (num < 10000000) return numberToWords(Math.floor(num / 100000)) + 'Lakh ' + numberToWords(num % 100000);
        return num.toString();
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="flex flex-col min-h-screen items-center justify-center bg-slate-50 gap-4">
                <p className="text-slate-500">Receipt not found.</p>
                <Button onClick={() => navigate(-1)} variant="outline">Go Back</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 p-8 print:p-0 print:bg-white flex flex-col items-center">
            <div className="w-full max-w-4xl mb-6 flex justify-between items-center print:hidden">
                <Button onClick={() => navigate(-1)} variant="outline" className="gap-2">
                    <ArrowLeft className="h-4 w-4" /> Back
                </Button>
                <Button onClick={handlePrint} className="gap-2 bg-[#002147] text-white hover:bg-[#002147]/90">
                    <Printer className="h-4 w-4" /> Print Receipt
                </Button>
            </div>

            <Card className="w-full max-w-[800px] bg-white p-8 border print:border-0 print:shadow-none print:w-full print:max-w-none text-slate-900 shadow-xl">
                {/* Header */}
                <div className="flex flex-col items-center border-b-2 border-slate-900 pb-4 mb-6 relative">
                    <div className="flex items-center gap-6 w-full justify-center">
                        <img src="/lovable-uploads/logo.png" alt="Logo" className="h-24 w-24 object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
                        <div className="text-center">
                            <h1 className="text-3xl font-black text-[#002147] tracking-tight uppercase font-serif">Adarsh Oxford School</h1>
                            <p className="text-sm font-semibold mt-1">Ph: 8985810221, 8096827424, E-mail: adarshschool.2004@gmail.com</p>
                        </div>
                    </div>
                    <div className="mt-4">
                        <span className="border-b-2 border-slate-900 text-xl font-bold uppercase tracking-widest px-2">Receipt</span>
                    </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-x-12 gap-y-2 mb-6 text-sm font-bold border-b border-dashed border-slate-400 pb-6">
                    <div className="grid grid-cols-[100px_auto] gap-2">
                        <span className="text-slate-600">Receipt No</span>
                        <span>: {data.receiptNo}</span>
                    </div>
                    <div className="grid grid-cols-[120px_auto] gap-2">
                        <span className="text-slate-600">Date</span>
                        <span>: {data.date}</span>
                    </div>

                    <div className="grid grid-cols-[100px_auto] gap-2">
                        <span className="text-slate-600">Name</span>
                        <span>: {data.studentName}</span>
                    </div>
                    <div className="grid grid-cols-[120px_auto] gap-2">
                        <span className="text-slate-600">Academic Year</span>
                        <span>: {data.academicYear}</span>
                    </div>

                    <div className="grid grid-cols-[100px_auto] gap-2">
                        <span className="text-slate-600">Course</span>
                        <span>: {data.class}</span>
                    </div>
                    <div className="grid grid-cols-[120px_auto] gap-2">
                        <span className="text-slate-600">Admission No</span>
                        <span>: {data.admissionNo}</span>
                    </div>
                </div>

                {/* Table */}
                <div className="mb-6">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b-2 border-slate-200">
                                <th className="text-left font-bold py-2 w-16">SL</th>
                                <th className="text-left font-bold py-2">Particulars</th>
                                <th className="text-right font-bold py-2 w-32">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.particulars.map((item, index) => (
                                <tr key={index} className="border-b border-slate-100">
                                    <td className="py-3 font-medium">{index + 1}</td>
                                    <td className="py-3 font-bold uppercase">{item.name}</td>
                                    <td className="py-3 text-right font-bold">{item.amount.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Totals */}
                <div className="border-t-2 border-slate-900 pt-4 mb-6">
                    <div className="flex justify-between items-center mb-2 font-bold">
                        <div className="flex gap-4">
                            <span>Mode Of Payment : <span className="uppercase">{data.paymentMode}</span></span>
                            <span>Amount Received : {data.totalAmount.toFixed(2)}</span>
                        </div>
                        <div className="text-lg">
                            Grand Total : {data.totalAmount.toFixed(2)}
                        </div>
                    </div>
                    <div className="font-bold border-t border-dashed border-slate-400 pt-2 mt-2">
                        Amount In Words : <span className="italic">{numberToWords(Math.floor(data.totalAmount))} Rupees Only</span>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-sm border-t border-dashed border-slate-900 pt-4 mt-8">
                    <div className="grid grid-cols-1 gap-1 mb-6">
                        <p><span className="font-bold">Narration :</span> {data.narration}</p>
                        <p className="text-xs text-slate-500 mt-2">NB:- This is a computer generated receipt and does not require physical signature.</p>
                        <p className="text-xs text-slate-500">If Cheque/DD the receipt only valid after realization.</p>
                    </div>

                    <div className="flex justify-between items-end mt-8">
                        <div className="text-xs text-slate-400">
                            {new Date().toLocaleString()}
                        </div>
                        <div className="text-right font-bold text-[#002147]">
                            Created By: ADARSH OXFORD SCHOOL
                        </div>
                    </div>
                </div>
            </Card>

            {/* Print Styles */}
            <style>{`
        @media print {
          @page { margin: 0.5cm; }
          body { 
            background: white; 
            -webkit-print-color-adjust: exact !important; 
          }
          .no-print { display: none !important; }
        }
      `}</style>
        </div>
    );
}
