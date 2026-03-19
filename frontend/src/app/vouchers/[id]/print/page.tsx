"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/axios";
import { Loader2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/Logo";

interface Voucher {
    id: number;
    voucher_number: string;
    type: string;
    date: string;
    amount: number;
    payment_method: string;
    reference: string;
    description: string;
    client: { company_name: string } | null;
    bank: { bank_name: string, account_title: string } | null;
}

export default function VoucherPrintPage() {
    const params = useParams();
    const voucherId = params.id;
    const [voucher, setVoucher] = useState<Voucher | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchVoucher = async () => {
            try {
                const { data } = await api.get(`/vouchers/${voucherId}`);
                setVoucher(data);
                setTimeout(() => {
                    window.print();
                }, 500);
            } catch (error) {
                console.error("Failed to fetch voucher", error);
            } finally {
                setLoading(false);
            }
        };

        if (voucherId) {
            fetchVoucher();
        }
    }, [voucherId]);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="h-8 w-8 animate-spin text-zinc-400" /></div>;
    }

    if (!voucher) {
        return <div className="p-8 text-center text-red-500">Failed to load voucher.</div>;
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR' }).format(amount);
    };

    const isReceipt = voucher.type === 'receipt';

    return (
        <div className="bg-white text-black min-h-screen flex flex-col items-center">
            {/* Print Controls - Hidden during actual print */}
            <div className="print:hidden w-full bg-zinc-100 p-4 flex justify-between items-center border-b">
                <span className="text-zinc-600 text-sm">Print Preview View</span>
                <Button onClick={() => window.print()} variant="default" size="sm">
                    <Printer className="w-4 h-4 mr-2" /> Print PDF
                </Button>
            </div>

            {/* A4 Sized Print Container (Landscape half or portrait half for vouchers is common, but let's use standard width) */}
            <div className="w-full max-w-[210mm] mx-auto p-12 print:p-0 print:max-w-none bg-white font-sans text-sm mt-8 border print:border-none print:mt-0">

                {/* Header Container */}
                <div className="flex justify-between items-start mb-8 border-b-4 border-zinc-900 pb-6 print:border-zinc-900">
                    <div className="flex flex-col gap-2">
                        <Logo size="md" />
                        <div className="inline-block bg-primary text-white px-3 py-1 mt-2 rounded">
                            <p className="text-xs font-bold uppercase tracking-widest">Official {isReceipt ? 'Receipt' : 'Payment'} Voucher</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <h2 className={`text-4xl font-black uppercase tracking-widest mb-2 ${isReceipt ? 'text-emerald-600 print:text-emerald-600' : 'text-primary print:text-primary'}`}>
                            {isReceipt ? 'Receipt' : 'Payment'}
                        </h2>
                        <div className="bg-zinc-100 print:bg-zinc-100 px-4 py-2 rounded-lg border border-zinc-200 inline-block">
                            <p className="text-zinc-900 font-bold text-lg">No. {voucher.voucher_number}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-8 bg-zinc-50 print:bg-zinc-50 p-6 rounded-xl border border-zinc-200 print:border-zinc-200 shadow-sm print:shadow-none">
                    <div>
                        <p className="text-zinc-400 font-bold uppercase tracking-wider text-xs mb-1">Date</p>
                        <p className="font-black text-xl text-zinc-900">{voucher.date}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-zinc-400 font-bold uppercase tracking-wider text-xs mb-1">Amount</p>
                        <p className="font-black text-3xl text-zinc-900">{formatCurrency(voucher.amount)}</p>
                    </div>
                </div>

                {/* Details Section */}
                <div className="space-y-6 mb-16">
                    <div className="flex border-b border-zinc-100 pb-4">
                        <div className="w-1/3 text-zinc-500 font-medium">{isReceipt ? 'Received From' : 'Paid To'}:</div>
                        <div className="w-2/3 font-semibold text-zinc-900 text-lg">
                            {voucher.client?.company_name || 'System Entity'}
                        </div>
                    </div>

                    <div className="flex border-b border-zinc-100 pb-4">
                        <div className="w-1/3 text-zinc-500 font-medium">Payment Method:</div>
                        <div className="w-2/3 text-zinc-900 capitalize flex flex-col">
                            <span className="font-semibold">{voucher.payment_method}</span>
                            {voucher.bank && (
                                <span className="text-zinc-500 text-sm mt-1">Bank: {voucher.bank.bank_name} - {voucher.bank.account_title}</span>
                            )}
                            {voucher.reference && (
                                <span className="text-zinc-500 text-sm mt-1">Ref/Cheque No: {voucher.reference}</span>
                            )}
                        </div>
                    </div>

                    <div className="flex border-b border-zinc-100 pb-4">
                        <div className="w-1/3 text-zinc-500 font-medium">Description/Particulars:</div>
                        <div className="w-2/3 text-zinc-900">
                            {voucher.description || '-'}
                        </div>
                    </div>
                </div>

                {/* Signatures */}
                <div className="flex justify-between mt-32 px-8">
                    <div className="w-64 text-center">
                        <div className="border-t-2 border-zinc-300 mb-3 pt-2">
                            <p className="text-zinc-600 font-bold text-xs uppercase tracking-wider">Prepared By</p>
                        </div>
                    </div>
                    <div className="w-64 text-center">
                        <div className="border-t-2 border-zinc-300 mb-3 pt-2">
                            <p className="text-zinc-600 font-bold text-xs uppercase tracking-wider">Authorized Signatory</p>
                        </div>
                    </div>
                </div>

                <div className="text-center text-zinc-400 text-xs mt-16 pt-6 border-t border-zinc-100">
                    <p>Generated by Automated Accounting System.</p>
                </div>
            </div>

            {/* Global style for printing */}
            <style jsx global>{`
                @media print {
                    @page { size: auto; margin: 0mm; }
                    body { margin: 1cm; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
            `}</style>
        </div>
    );
}
