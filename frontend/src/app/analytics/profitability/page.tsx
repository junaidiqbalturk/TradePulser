"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
    TrendingUp, 
    ArrowLeft,
    TrendingDown,
    Activity,
    DollarSign,
    Calculator,
    ArrowUpRight,
    PieChart as PieIcon,
    Lightbulb
} from "lucide-react";
import { motion, Variants } from "framer-motion";
import axios from "@/lib/axios";
import {
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Cell, PieChart, Pie, Legend
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

export default function ProfitabilityAnalytics() {
    const [profitData, setProfitData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axios.get("/analytics/shipment-profitability");
                setProfitData(res.data);
            } catch (error) {
                console.error("Error fetching profitability data:", error);
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

    const summaryData = [
        { name: 'Revenue', value: parseFloat(profitData?.total_revenue || 0), fill: '#3C50E0' },
        { name: 'Total Landed Cost', value: parseFloat(profitData?.total_cost || 0), fill: '#EF4444' },
    ];

    const profitMargin = profitData?.total_revenue > 0 
        ? ((profitData?.total_profit / profitData?.total_revenue) * 100).toFixed(1) 
        : "0.0";

    const metrics = [
        { 
            title: "Total Revenue", 
            value: formatCurrency(profitData?.total_revenue || 0), 
            icon: DollarSign, 
            color: "text-primary", 
            bg: "bg-primary/10",
            gradient: "group-hover:bg-primary/5"
        },
        { 
            title: "Total Landed Cost", 
            value: formatCurrency(profitData?.total_cost || 0), 
            icon: TrendingDown, 
            color: "text-rose-500", 
            bg: "bg-rose-500/10",
            gradient: "group-hover:bg-rose-500/5"
        },
        { 
            title: "Net Profit", 
            value: formatCurrency(profitData?.total_profit || 0), 
            icon: TrendingUp, 
            color: "text-emerald-500", 
            bg: "bg-emerald-500/10",
            gradient: "group-hover:bg-emerald-500/5"
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
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Shipment Profitability</h1>
                    <p className="text-sm font-medium text-muted-foreground">Analyze margins, landed costs, and operational efficiency</p>
                </div>
            </motion.div>

            {/* Top Metrics Grid */}
            <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
                {metrics.map((stat, i) => (
                    <motion.div 
                        variants={fadeUp} 
                        key={i}
                        whileHover={{ y: -5, scale: 1.02 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
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

                            <div className="relative z-10">
                                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.bg} mb-4 transition-transform duration-300 group-hover:scale-110`}>
                                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <h4 className="text-xl sm:text-2xl font-bold text-foreground break-words leading-tight">
                                        {stat.value}
                                    </h4>
                                    <span className="text-xs font-medium text-muted-foreground truncate">{stat.title}</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Cost vs Revenue Pie Chart */}
                <motion.div variants={fadeUp} className="group">
                    <Card className="relative overflow-hidden border-border bg-card shadow-sm group-hover:bg-primary/5 transition-colors duration-300">
                        <motion.div
                            initial={{ opacity: 0.05, scale: 1 }}
                            whileHover={{ opacity: 0.1, scale: 1.2, rotate: -15 }}
                            className="absolute -right-10 -top-10 pointer-events-none z-0"
                        >
                            <PieIcon className="h-80 w-80 text-primary" />
                        </motion.div>
                        <CardHeader className="relative z-10 flex flex-row items-center justify-between pb-2">
                            <div>
                                <CardTitle className="text-xl font-bold">Revenue vs Cost</CardTitle>
                                <CardDescription>Financial structure breakdown</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10 flex flex-col items-center">
                            <div className="h-[350px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={summaryData.some(d => d.value > 0) ? summaryData : [{name: 'Empty', value: 1, fill: '#E2E8F0'}]}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={80}
                                            outerRadius={120}
                                            paddingAngle={8}
                                            dataKey="value"
                                        >
                                            {summaryData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                                            formatter={(val: any) => [formatCurrency(val), "Amount"]}
                                        />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="mt-4 text-center bg-emerald-500/10 px-6 py-4 rounded-2xl border border-emerald-500/20"
                            >
                                <p className="text-4xl font-black text-emerald-600">{profitMargin}%</p>
                                <p className="text-xs font-black uppercase tracking-widest text-emerald-700/60 mt-1">Net Profit Margin</p>
                            </motion.div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Analysis & Insights */}
                <motion.div variants={fadeUp} className="group h-full">
                    <Card className="relative overflow-hidden border-border bg-card shadow-sm h-full group-hover:bg-orange-500/5 transition-colors duration-300">
                        <motion.div
                            initial={{ opacity: 0.05, scale: 1 }}
                            whileHover={{ opacity: 0.1, scale: 1.2, rotate: 10 }}
                            className="absolute -right-10 -bottom-10 pointer-events-none z-0"
                        >
                            <Lightbulb className="h-80 w-80 text-orange-500" />
                        </motion.div>
                        <CardHeader className="relative z-10 flex flex-row items-center justify-between pb-2">
                            <div>
                                <CardTitle className="text-xl font-bold flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-primary" />
                                    Insights & Analysis
                                </CardTitle>
                                <CardDescription>Smart recommendations based on data</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10 space-y-6 pt-4">
                            <motion.div whileHover={{ x: 5 }} className="flex items-start gap-4 p-5 rounded-2xl bg-blue-500/5 border border-blue-500/10 group/item">
                                <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 transition-transform group-hover/item:scale-110">
                                    <Calculator className="h-5 w-5" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-foreground text-sm">Landed Cost Efficiency</h4>
                                    <p className="text-muted-foreground text-xs mt-1 leading-relaxed">
                                        Landed costs account for {((parseFloat(profitData?.total_cost || 0) / parseFloat(profitData?.total_revenue || 1)) * 100).toFixed(1)}% 
                                        of total revenue. Recommended target is below 85% for sustainable growth.
                                    </p>
                                </div>
                            </motion.div>

                            <motion.div whileHover={{ x: 5 }} className="flex items-start gap-4 p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 group/item">
                                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 transition-transform group-hover/item:scale-110">
                                    <ArrowUpRight className="h-5 w-5" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-foreground text-sm">Profitability Outlook</h4>
                                    <p className="text-muted-foreground text-xs mt-1 leading-relaxed">
                                        Your net profit is healthy at {profitMargin}%. To optimize further, analyze shipments with the highest variance between estimated and actual landed costs.
                                    </p>
                                </div>
                            </motion.div>

                            <motion.div 
                                initial={{ opacity: 0.8 }}
                                whileHover={{ opacity: 1 }}
                                className="p-6 rounded-2xl border border-dashed border-border bg-zinc-50/50 dark:bg-zinc-900/50 relative group/quote"
                            >
                                <p className="italic text-sm text-foreground text-center line-clamp-3 leading-relaxed">
                                    &quot;Profitability is the soul of every business. By tracking landed costs accurately, 
                                    TradePulser helps you identify where hidden leakages might be occurring.&quot;
                                </p>
                                <div className="absolute -top-3 -left-3 bg-card border border-border p-1.5 rounded-lg shadow-sm">
                                    <Lightbulb className="h-4 w-4 text-orange-500" />
                                </div>
                            </motion.div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}
