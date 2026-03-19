"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
    TrendingUp, 
    DollarSign, 
    ArrowUpRight, 
    ArrowDownRight, 
    Package, 
    Users, 
    BarChart3,
    AlertCircle,
    Activity,
    ArrowRight,
    ChevronRight,
    CreditCard,
    History
} from "lucide-react";
import { motion, Variants } from "framer-motion";
import axios from "@/lib/axios";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
} from "recharts";

interface KPIs {
    total_revenue_year: number;
    outstanding_ar: number;
    outstanding_ap: number;
    inventory_value: number;
    gross_profit: number;
}

const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const fadeUp: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function AnalyticsDashboard() {
    const [kpis, setKpis] = useState<KPIs | null>(null);
    const [revenueData, setRevenueData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [kpiRes, revRes] = await Promise.all([
                    axios.get("/analytics/kpis"),
                    axios.get("/analytics/revenue")
                ]);
                setKpis(kpiRes.data);
                // Last 6 months for chart - ensure we have at least some dummy or empty state if revRes is empty
                const fetchedRev = (revRes.data || []).slice(0, 6).reverse();
                setRevenueData(fetchedRev);
            } catch (error) {
                console.error("Error fetching analytics:", error);
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

    const cards = [
        { 
            title: "Total Revenue (Year)", 
            value: formatCurrency(kpis?.total_revenue_year || 0), 
            icon: DollarSign, 
            trend: "Performance Year", 
            trendUp: true, 
            color: "text-primary", 
            bg: "bg-primary/10", 
            gradient: "group-hover:bg-primary/5" 
        },
        { 
            title: "Gross Profit", 
            value: formatCurrency(kpis?.gross_profit || 0), 
            icon: TrendingUp, 
            trend: "Margin Analysis", 
            trendUp: true, 
            color: "text-emerald-500", 
            bg: "bg-emerald-500/10", 
            gradient: "group-hover:bg-emerald-500/5" 
        },
        { 
            title: "Accounts Receivable", 
            value: formatCurrency(kpis?.outstanding_ar || 0), 
            icon: Users, 
            trend: "Outstanding Invoices", 
            trendUp: false, 
            color: "text-orange-500", 
            bg: "bg-orange-500/10", 
            gradient: "group-hover:bg-orange-500/5" 
        },
        { 
            title: "Inventory Value", 
            value: formatCurrency(kpis?.inventory_value || 0), 
            icon: Package, 
            trend: "Current Stock", 
            trendUp: true, 
            color: "text-indigo-500", 
            bg: "bg-indigo-500/10", 
            gradient: "group-hover:bg-indigo-500/5" 
        },
    ];

    return (
        <div className="p-4 md:p-6 2xl:p-10 max-w-screen-2xl mx-auto space-y-6 md:space-y-8">
            <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-1"
            >
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Analytics Overview</h1>
                <p className="text-sm font-medium text-muted-foreground">Real-time business performance and financial health insights.</p>
            </motion.div>

            {/* KPI Cards Grid */}
            <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6 2xl:gap-7.5"
            >
                {cards.map((stat, i) => (
                    <motion.div 
                        variants={fadeUp} 
                        key={i}
                        whileHover={{ y: -5, scale: 1.02 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                        className="group"
                    >
                        <div className={`relative overflow-hidden rounded-xl border border-border bg-card shadow-sm p-6 transition-all duration-300 ${stat.gradient}`}>
                            {/* Background Watermark Icon */}
                            <motion.div
                                initial={{ opacity: 0.1, scale: 1 }}
                                whileHover={{ opacity: 0.2, scale: 1.2, rotate: 12 }}
                                className="absolute -right-6 -bottom-6 pointer-events-none z-0"
                            >
                                <stat.icon className={`h-40 w-40 ${stat.color}`} />
                            </motion.div>

                            <div className="relative z-10">
                                <div className={`flex h-11 w-11 items-center justify-center rounded-full ${stat.bg} mb-4 transition-transform duration-300 group-hover:scale-110`}>
                                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <h4 className="text-xl sm:text-2xl font-bold text-foreground break-words leading-tight">
                                        {stat.value}
                                    </h4>
                                    <span className="text-xs font-medium text-muted-foreground truncate mb-3">{stat.title}</span>
                                    <div className="mt-auto">
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full whitespace-nowrap transition-all duration-300 group-hover:px-4 ${stat.trendUp ? 'bg-emerald-500/10 text-emerald-500' : 'bg-orange-500/10 text-orange-500'}`}>
                                            {stat.trend}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Trend Chart */}
                <motion.div 
                    variants={fadeUp}
                    initial="hidden"
                    animate="show"
                    className="lg:col-span-2 group"
                >
                    <div className="relative overflow-hidden rounded-xl border border-border bg-card shadow-sm p-6 transition-colors duration-300 group-hover:bg-primary/5">
                        {/* Background Watermark */}
                        <motion.div
                            initial={{ opacity: 0.05, scale: 1 }}
                            whileHover={{ opacity: 0.1, scale: 1.2, rotate: -12 }}
                            className="absolute -right-10 -top-10 pointer-events-none z-0"
                        >
                            <TrendingUp className="h-80 w-80 text-primary" />
                        </motion.div>

                        <div className="relative z-10">
                            <div className="mb-4">
                                <h3 className="text-xl font-bold text-foreground">Revenue Trend</h3>
                                <p className="text-sm font-medium text-muted-foreground">Performance over the last 6 months</p>
                            </div>
                            
                            <div className="h-[300px] w-full mt-6">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={revenueData.length ? revenueData : [{month: 'N/A', total_revenue: 0}]}>
                                        <defs>
                                            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3C50E0" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#3C50E0" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} tickFormatter={(val) => `Rs.${val/1000}k`} />
                                        <Tooltip 
                                            contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                                            formatter={(val: any) => [`Rs. ${Number(val).toLocaleString()}`, "Revenue"]}
                                        />
                                        <Area type="monotone" dataKey="total_revenue" stroke="#3C50E0" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Modules Navigation */}
                <motion.div 
                    variants={staggerContainer}
                    initial="hidden"
                    animate="show"
                    className="space-y-4"
                >
                    <h3 className="font-bold text-foreground px-2">Analytics Modules</h3>
                    {[
                        { href: "/analytics/revenue", label: "Revenue Analysis", desc: "Detailed sales performance", icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
                        { href: "/analytics/profitability", label: "Shipment Profit", desc: "Margin and cost analysis", icon: Activity, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                        { href: "/analytics/performance", label: "Product & Clients", desc: "Top performers insight", icon: Users, color: "text-indigo-500", bg: "bg-indigo-500/10" },
                        { href: "/analytics/inventory", label: "Inventory & Logistics", desc: "Stock health and tracking", icon: Package, color: "text-amber-500", bg: "bg-amber-500/10" },
                        { href: "/analytics/financial-kpis", label: "Financial Health", desc: "AR/AP and Aging report", icon: BarChart3, color: "text-violet-500", bg: "bg-violet-500/10" },
                    ].map((link, idx) => (
                        <motion.div 
                            key={idx} 
                            variants={fadeUp}
                            whileHover={{ x: 5, scale: 1.01 }}
                            className="group cursor-pointer"
                            onClick={() => window.location.href = link.href}
                        >
                            <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card shadow-sm hover:border-primary/30 transition-all duration-300">
                                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${link.bg} ${link.color} transition-all duration-300 group-hover:scale-110`}>
                                    <link.icon className="h-5 w-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-sm text-foreground">{link.label}</h4>
                                    <p className="text-xs text-muted-foreground truncate">{link.desc}</p>
                                </div>
                                <ArrowUpRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </div>
    );
}
