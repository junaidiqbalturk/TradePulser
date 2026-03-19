"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
    ArrowLeft,
    Users,
    Package,
    BarChart3,
    ArrowUpRight,
    Star,
    Activity,
    TrendingUp,
    ChevronRight,
    Trophy,
    Globe
} from "lucide-react";
import { motion, Variants } from "framer-motion";
import axios from "@/lib/axios";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
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

export default function PerformanceAnalytics() {
    const [performanceData, setPerformanceData] = useState<any>(null);
    const [clientData, setClientData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [perfRes, clientRes] = await Promise.all([
                    axios.get("/analytics/product-performance"),
                    axios.get("/analytics/revenue-by-client")
                ]);
                setPerformanceData(perfRes.data || []);
                setClientData((clientRes.data || []).slice(0, 5));
            } catch (error) {
                console.error("Error fetching performance data:", error);
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
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Product & Client Performance</h1>
                    <p className="text-sm font-medium text-muted-foreground">Identify your best performing assets and VIP stakeholders</p>
                </div>
            </motion.div>

            <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
                {/* Product Performance Chart */}
                <motion.div variants={fadeUp} className="group">
                    <Card className="relative overflow-hidden border-border bg-card shadow-sm group-hover:bg-primary/5 transition-colors duration-300">
                        <motion.div
                            initial={{ opacity: 0.05, scale: 1 }}
                            whileHover={{ opacity: 0.1, scale: 1.2, rotate: -10 }}
                            className="absolute -right-10 -top-10 pointer-events-none z-0"
                        >
                            <Package className="h-80 w-80 text-primary" />
                        </motion.div>
                        <CardHeader className="relative z-10 flex flex-row items-center justify-between pb-2">
                            <div>
                                <CardTitle className="text-xl font-bold">Best Selling Products</CardTitle>
                                <CardDescription>Ranked by revenue contribution</CardDescription>
                            </div>
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary transition-transform group-hover:scale-110">
                                <TrendingUp className="h-6 w-6" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="h-[400px] w-full mt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={performanceData?.slice(0, 10).length ? performanceData?.slice(0, 10) : [{product_name: 'N/A', total_revenue: 0}]}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                        <XAxis dataKey="product_name" axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 10}} />
                                        <YAxis axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 10}} tickFormatter={(val) => `Rs.${val/1000}k`} />
                                        <Tooltip 
                                            contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                                            formatter={(val: any) => [formatCurrency(val), "Revenue"]}
                                        />
                                        <Bar dataKey="total_revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* VIP Client Insights */}
                <motion.div variants={fadeUp} className="group">
                    <Card className="relative overflow-hidden border-border bg-card shadow-sm h-full group-hover:bg-indigo-500/5 transition-colors duration-300">
                        <motion.div
                            initial={{ opacity: 0.05, scale: 1 }}
                            whileHover={{ opacity: 0.1, scale: 1.2, rotate: 10 }}
                            className="absolute -right-10 -bottom-10 pointer-events-none z-0"
                        >
                            <Users className="h-80 w-80 text-indigo-500" />
                        </motion.div>
                        <CardHeader className="relative z-10 flex flex-row items-center justify-between pb-2">
                            <div>
                                <CardTitle className="text-xl font-bold">VIP Client Insights</CardTitle>
                                <CardDescription>Top contributors to annual revenue</CardDescription>
                            </div>
                            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 transition-transform group-hover:scale-110">
                                <Trophy className="h-6 w-6" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10 space-y-4">
                            {clientData.length ? clientData.map((client: any, index: number) => (
                                <motion.div 
                                    key={index} 
                                    whileHover={{ x: 5 }}
                                    className="flex items-center justify-between p-4 rounded-xl bg-muted/40 border border-border group/row hover:border-primary/30 transition-all duration-300"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shadow-sm">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-foreground text-sm group-hover/row:text-primary transition-colors">{client.company_name}</h4>
                                            <p className="text-xs text-muted-foreground">{client.country}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-foreground text-sm">{formatCurrency(parseFloat(client.total_revenue))}</p>
                                        <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest flex items-center justify-end gap-1">
                                            <Star className="h-3 w-3 fill-current" /> High Loyalty
                                        </p>
                                    </div>
                                </motion.div>
                            )) : (
                                <div className="py-10 text-center text-muted-foreground italic">No client data available</div>
                            )}

                            {clientData.length > 0 && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-6 p-6 rounded-2xl bg-primary text-white flex items-center justify-between shadow-xl shadow-primary/20"
                                >
                                    <div>
                                        <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Top Client Region</p>
                                        <h4 className="text-2xl font-black">{clientData[0]?.country || 'N/A'}</h4>
                                    </div>
                                    <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
                                        <Globe className="h-7 w-7 text-white" />
                                    </div>
                                </motion.div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Performance Rankings Table */}
                <motion.div variants={fadeUp} className="lg:col-span-2 group">
                    <Card className="relative overflow-hidden border-border bg-card shadow-sm group-hover:bg-zinc-500/5 transition-colors duration-300">
                        <CardHeader className="pb-0">
                            <CardTitle className="text-xl font-bold">Comprehensive Rankings</CardTitle>
                            <CardDescription>Detailed look at product sales velocity</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0 mt-6">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-muted/50 border-y border-border">
                                            <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] text-center w-24">Rank</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Product Name</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] text-right">Quantity Sold</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] text-right">Total Revenue</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] text-right">Performance</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {performanceData?.slice(0, 5).length ? performanceData?.slice(0, 5).map((prod: any, idx: number) => (
                                            <motion.tr 
                                                key={idx} 
                                                whileHover={{ backgroundColor: "rgba(var(--primary-rgb), 0.02)" }}
                                                className="group/row transition-all duration-300 cursor-default"
                                            >
                                                <td className="px-6 py-5 text-center">
                                                    <span className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-muted text-foreground text-xs font-black border border-border group-hover/row:bg-primary group-hover/row:text-white transition-all duration-300">
                                                        #{idx + 1}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="font-bold text-foreground text-sm group-hover/row:text-primary transition-colors">{prod.product_name}</div>
                                                    <div className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest mt-0.5">Stock: Active</div>
                                                </td>
                                                <td className="px-6 py-5 text-right font-medium text-foreground tabular-nums">
                                                    {parseFloat(prod.quantity_sold).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <span className="font-black text-sm text-foreground tabular-nums">{formatCurrency(parseFloat(prod.total_revenue))}</span>
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <div className="flex items-center justify-end gap-3 font-mono">
                                                        <div className="w-20 h-2 bg-muted rounded-full overflow-hidden shadow-inner">
                                                            <motion.div 
                                                                initial={{ width: 0 }}
                                                                animate={{ width: "92%" }}
                                                                transition={{ delay: idx * 0.1, duration: 1 }}
                                                                className="h-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                                                            ></motion.div>
                                                        </div>
                                                        <span className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">Trending</span>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-20 text-center text-muted-foreground italic">No performance benchmarks available yet</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="p-4 bg-muted/20 border-t border-border flex justify-center">
                                <button className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2 hover:gap-3 transition-all">
                                    Full Performance Report
                                    <ChevronRight className="h-3 w-3" />
                                </button>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </motion.div>
        </div>
    );
}
