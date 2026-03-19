"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
    ArrowLeft,
    AlertCircle,
    ShieldCheck,
    Calendar,
    TrendingDown,
    TrendingUp,
    Clock,
    DollarSign,
    ShieldAlert,
    Wallet,
    PiggyBank,
    BarChart3,
    Activity
} from "lucide-react";
import { motion, Variants } from "framer-motion";
import axios from "@/lib/axios";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Cell
} from "recharts";
import Link from "next/link";

const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const fadeUp: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function FinancialAnalytics() {
    const [arData, setArData] = useState([]);
    const [apData, setApData] = useState([]);
    const [kpis, setKpis] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [arRes, apRes, kpiRes] = await Promise.all([
                    axios.get("/analytics/ar-aging"),
                    axios.get("/analytics/ap-aging"),
                    axios.get("/analytics/kpis")
                ]);
                setArData(arRes.data || []);
                setApData(apRes.data || []);
                setKpis(kpiRes.data);
            } catch (error) {
                console.error("Error fetching financial analytics:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(amount);
    };

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Activity className="animate-spin h-8 w-8 text-primary" />
            </div>
        );
    }

    // AR Buckets
    const arBuckets = [
        { name: '0-30 Days', value: arData.filter((i: any) => i.days_past <= 30).reduce((acc, curr: any) => acc + parseFloat(curr.outstanding_amount), 0) },
        { name: '31-60 Days', value: arData.filter((i: any) => i.days_past > 30 && i.days_past <= 60).reduce((acc, curr: any) => acc + parseFloat(curr.outstanding_amount), 0) },
        { name: '61+ Days', value: arData.filter((i: any) => i.days_past > 60).reduce((acc, curr: any) => acc + parseFloat(curr.outstanding_amount), 0) },
    ];

    const COLORS = ['#10B981', '#F59E0B', '#EF4444'];

    const financialMetrics = [
        { 
            label: "Receivables (AR)", 
            value: formatCurrency(kpis?.outstanding_ar || 0), 
            icon: TrendingUp, 
            color: "text-emerald-500", 
            bg: "bg-emerald-500/10",
            gradient: "group-hover:bg-emerald-500/5"
        },
        { 
            label: "Payables (AP)", 
            value: formatCurrency(kpis?.outstanding_ap || 0), 
            icon: TrendingDown, 
            color: "text-rose-500", 
            bg: "bg-rose-500/10",
            gradient: "group-hover:bg-rose-500/5"
        },
        { 
            label: "Cash Flow Gap", 
            value: formatCurrency((kpis?.outstanding_ar || 0) - (kpis?.outstanding_ap || 0)), 
            icon: Wallet, 
            color: "text-blue-500", 
            bg: "bg-blue-500/10",
            gradient: "group-hover:bg-blue-500/5"
        },
        { 
            label: "Inventory Value", 
            value: formatCurrency(kpis?.inventory_value || 0), 
            icon: PiggyBank, 
            color: "text-amber-500", 
            bg: "bg-amber-500/10",
            gradient: "group-hover:bg-amber-500/5"
        },
    ];

    return (
        <div className="p-4 md:p-6 2xl:p-10 max-w-screen-2xl mx-auto space-y-8">
            <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-4"
            >
                <Link href="/analytics" className="group h-10 w-10 rounded-xl bg-card border border-border shadow-sm flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-all">
                    <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Financial Health & Risk</h1>
                    <p className="text-sm font-medium text-muted-foreground">Monitor cash flow velocity and outstanding liabilities</p>
                </div>
            </motion.div>

            {/* Financial Status Cards */}
            <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
                {financialMetrics.map((stat, i) => (
                    <motion.div 
                        variants={fadeUp} 
                        key={i}
                        whileHover={{ y: -5 }}
                        className="group"
                    >
                        <div className={`relative overflow-hidden rounded-xl border border-border bg-card shadow-sm p-6 transition-all duration-300 ${stat.gradient}`}>
                            <motion.div
                                initial={{ opacity: 0.1, scale: 1 }}
                                whileHover={{ opacity: 0.2, scale: 1.2, rotate: 12 }}
                                className="absolute -right-6 -bottom-6 pointer-events-none z-0"
                            >
                                <stat.icon className={`h-40 w-40 ${stat.color}`} />
                            </motion.div>

                            <div className="relative z-10 flex flex-col items-center text-center">
                                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.bg} mb-4 transition-transform duration-300 group-hover:scale-110`}>
                                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">{stat.label}</p>
                                <h4 className="text-lg font-black text-foreground">{stat.value}</h4>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* AR Aging */}
                <motion.div variants={fadeUp} className="group">
                    <Card className="relative overflow-hidden border-border bg-card shadow-sm group-hover:bg-emerald-500/5 transition-colors duration-300 h-full">
                        <motion.div
                            initial={{ opacity: 0.05, scale: 1 }}
                            whileHover={{ opacity: 0.1, scale: 1.2, rotate: -10 }}
                            className="absolute -right-10 -top-10 pointer-events-none z-0"
                        >
                            <Clock className="h-80 w-80 text-emerald-500" />
                        </motion.div>
                        <CardHeader className="relative z-10 flex flex-row items-center justify-between pb-2">
                            <div>
                                <CardTitle className="text-xl font-bold">AR Aging Breakdown</CardTitle>
                                <CardDescription>Unpaid customer invoices by age bucket</CardDescription>
                            </div>
                            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 transition-transform group-hover:scale-110">
                                <BarChart3 className="h-6 w-6" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="h-[300px] w-full mt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={arBuckets}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} />
                                        <YAxis axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} tickFormatter={(val) => `Rs.${val/1000}k`} />
                                        <Tooltip 
                                            contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                                            formatter={(val: any) => [formatCurrency(val), "Amount"]}
                                        />
                                        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                            {arBuckets.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Risk Alerts */}
                <motion.div variants={fadeUp} className="group">
                    <Card className="relative overflow-hidden border-border bg-card shadow-sm h-full group-hover:bg-rose-500/5 transition-colors duration-300">
                        <CardHeader className="relative z-10 bg-rose-500/5 border-b border-border/50">
                            <CardTitle className="text-xs font-black text-rose-600 flex items-center gap-2 uppercase tracking-[0.2em]">
                                <ShieldAlert className="h-4 w-4" />
                                Critical Overdue Monitoring
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="relative z-10 p-0">
                            <div className="divide-y divide-border/50">
                                {arData.filter((i: any) => i.days_past > 60).slice(0, 5).map((item: any, idx: number) => (
                                    <motion.div 
                                        key={idx} 
                                        whileHover={{ x: 5 }}
                                        className="p-5 flex items-center justify-between group/row hover:bg-rose-500/5 transition-all duration-300"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center font-black text-xs shadow-inner">
                                                {item.days_past}d
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-foreground group-hover/row:text-rose-600 transition-colors">{item.client_name}</p>
                                                <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">{item.invoice_number}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-sm text-rose-600">{formatCurrency(parseFloat(item.outstanding_amount))}</p>
                                            <p className="text-[9px] text-rose-500/60 uppercase font-black tracking-widest">Immediate Action Required</p>
                                        </div>
                                    </motion.div>
                                ))}
                                {arData.filter((i: any) => i.days_past > 60).length === 0 && (
                                    <div className="p-20 text-center flex flex-col items-center">
                                        <div className="h-20 w-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
                                            <ShieldCheck className="h-10 w-10 text-emerald-500" />
                                        </div>
                                        <p className="text-sm font-black text-foreground uppercase tracking-widest">Financial Fortress Clear</p>
                                        <p className="text-xs mt-2 text-muted-foreground max-w-[240px] leading-relaxed">No accounts are currently in the critical overdue danger zone.</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* AP Aging List */}
                <motion.div variants={fadeUp} className="lg:col-span-2 group">
                    <Card className="relative overflow-hidden border-border bg-card shadow-sm group-hover:bg-blue-500/5 transition-colors duration-300">
                        <CardHeader className="pb-0">
                            <CardTitle className="text-xl font-bold">Upcoming Vendor Obligations</CardTitle>
                            <CardDescription>Scheduled cash outflows based on bill maturity</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0 mt-6">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-muted/50 border-y border-border">
                                            <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Vendor Name</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Bill Details</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Due Date</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] text-right">Amount Out</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] text-center">Risk Level</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {apData.slice(0, 5).length ? apData.slice(0, 5).map((bill: any, idx: number) => (
                                            <motion.tr 
                                                key={idx} 
                                                whileHover={{ backgroundColor: "rgba(var(--primary-rgb), 0.02)" }}
                                                className="group/row transition-all duration-300"
                                            >
                                                <td className="px-6 py-5 font-bold text-sm text-foreground group-hover/row:text-primary transition-colors">
                                                    {bill.vendor_name}
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">{bill.bill_number}</span>
                                                </td>
                                                <td className="px-6 py-5 text-sm font-medium text-foreground">
                                                    {bill.due_date}
                                                </td>
                                                <td className="px-6 py-5 text-right font-black text-sm text-foreground tabular-nums">
                                                    {formatCurrency(parseFloat(bill.total_amount))}
                                                </td>
                                                <td className="px-6 py-5 text-center text-[10px] font-black uppercase tracking-widest">
                                                    <span className={`px-3 py-1.5 rounded-lg border ${
                                                        bill.status === 'partial' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                                    }`}>
                                                        {bill.status} Exposure
                                                    </span>
                                                </td>
                                            </motion.tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-20 text-center text-muted-foreground italic">No upcoming payables registered</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}
