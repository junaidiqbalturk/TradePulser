"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
    TrendingUp, 
    ArrowLeft,
    Users,
    Globe,
    Activity,
    DollarSign,
    Target,
    BarChart3
} from "lucide-react";
import { motion, Variants } from "framer-motion";
import axios from "@/lib/axios";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, PieChart, Pie, Cell, Legend
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

export default function RevenueAnalytics() {
    const [monthlyData, setMonthlyData] = useState([]);
    const [clientData, setClientData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [monthlyRes, clientRes] = await Promise.all([
                    axios.get("/analytics/revenue"),
                    axios.get("/analytics/revenue-by-client")
                ]);
                setMonthlyData((monthlyRes.data || []).reverse());
                setClientData((clientRes.data || []).slice(0, 5));
            } catch (error) {
                console.error("Error fetching revenue data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const COLORS = ['#3C50E0', '#10B981', '#F59E0B', '#3B82F6', '#6366F1'];

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

    const countryAgg = clientData.reduce((acc: any, curr: any) => {
        const country = curr.country || "Unknown";
        if (!acc[country]) acc[country] = 0;
        acc[country] += parseFloat(curr.total_revenue);
        return acc;
    }, {});

    const countryData = Object.keys(countryAgg).map(key => ({
        name: key,
        value: countryAgg[key]
    }));

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
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Revenue Analytics</h1>
                    <p className="text-sm font-medium text-muted-foreground">Deep dive into sales performance and regional distribution</p>
                </div>
            </motion.div>

            <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
                {/* Monthly Revenue Trend */}
                <motion.div variants={fadeUp} className="group">
                    <Card className="relative overflow-hidden border-border bg-card shadow-sm group-hover:bg-primary/5 transition-colors duration-300">
                        <motion.div
                            initial={{ opacity: 0.05, scale: 1 }}
                            whileHover={{ opacity: 0.1, scale: 1.2, rotate: -10 }}
                            className="absolute -right-10 -top-10 pointer-events-none z-0"
                        >
                            <TrendingUp className="h-80 w-80 text-primary" />
                        </motion.div>
                        <CardHeader className="relative z-10 flex flex-row items-center justify-between pb-2">
                            <div>
                                <CardTitle className="text-xl font-bold">Monthly Trend</CardTitle>
                                <CardDescription>Sales growth over time</CardDescription>
                            </div>
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary transition-transform group-hover:scale-110">
                                <TrendingUp className="h-6 w-6" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="h-[350px] w-full mt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={monthlyData.length ? monthlyData : [{month: 'N/A', total_revenue: 0}]}>
                                        <defs>
                                            <linearGradient id="colorRevPage" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3C50E0" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#3C50E0" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} />
                                        <YAxis axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} tickFormatter={(val) => `Rs.${val/1000}k`} />
                                        <Tooltip 
                                            contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                                            formatter={(val: any) => [formatCurrency(val), "Revenue"]}
                                        />
                                        <Area type="monotone" dataKey="total_revenue" stroke="#3C50E0" strokeWidth={3} fillOpacity={1} fill="url(#colorRevPage)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Top Clients Bar Chart */}
                <motion.div variants={fadeUp} className="group">
                    <Card className="relative overflow-hidden border-border bg-card shadow-sm group-hover:bg-emerald-500/5 transition-colors duration-300">
                        <motion.div
                            initial={{ opacity: 0.05, scale: 1 }}
                            whileHover={{ opacity: 0.1, scale: 1.2, rotate: 10 }}
                            className="absolute -right-10 -bottom-10 pointer-events-none z-0"
                        >
                            <Users className="h-80 w-80 text-emerald-500" />
                        </motion.div>
                        <CardHeader className="relative z-10 flex flex-row items-center justify-between pb-2">
                            <div>
                                <CardTitle className="text-xl font-bold">Top 5 Clients</CardTitle>
                                <CardDescription>Key revenue contributors</CardDescription>
                            </div>
                            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 transition-transform group-hover:scale-110">
                                <Users className="h-6 w-6" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="h-[350px] w-full mt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={clientData} layout="vertical" margin={{ left: -20, right: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="company_name" type="category" axisLine={false} tickLine={false} width={120} tick={{fill: 'hsl(var(--foreground))', fontSize: 12, fontWeight: 500}} />
                                        <Tooltip 
                                            cursor={{fill: 'hsl(var(--muted))', opacity: 0.4}}
                                            contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                                            formatter={(val: any) => [formatCurrency(val), "Revenue"]}
                                        />
                                        <Bar dataKey="total_revenue" fill="#10B981" radius={[0, 4, 4, 0]} barSize={25} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Country Distribution */}
                <motion.div variants={fadeUp} className="group">
                    <Card className="relative overflow-hidden border-border bg-card shadow-sm group-hover:bg-indigo-500/5 transition-colors duration-300">
                        <motion.div
                            initial={{ opacity: 0.05, scale: 1 }}
                            whileHover={{ opacity: 0.1, scale: 1.2, rotate: -5 }}
                            className="absolute -right-10 -bottom-10 pointer-events-none z-0"
                        >
                            <Globe className="h-80 w-80 text-indigo-500" />
                        </motion.div>
                        <CardHeader className="relative z-10 flex flex-row items-center justify-between pb-2">
                            <div>
                                <CardTitle className="text-xl font-bold">Regional Distribution</CardTitle>
                                <CardDescription>Revenue share by geography</CardDescription>
                            </div>
                            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 transition-transform group-hover:scale-110">
                                <Globe className="h-6 w-6" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10 flex flex-col items-center">
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={countryData.length ? countryData : [{name: 'N/A', value: 1}]}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={70}
                                            outerRadius={100}
                                            paddingAngle={8}
                                            dataKey="value"
                                        >
                                            {countryData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                                            formatter={(val: any) => [formatCurrency(val), "Revenue"]}
                                        />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Performance Highlights */}
                <motion.div variants={fadeUp} className="flex flex-col gap-6">
                    <Card className="relative overflow-hidden border-none bg-primary text-white p-8 shadow-lg shadow-primary/20 group">
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <Target className="h-6 w-6 text-primary-foreground" />
                                <h3 className="text-xl font-bold">Yearly Target</h3>
                            </div>
                            <p className="opacity-80 text-sm mb-6 max-w-[280px]">Progress towards your annual revenue milestone achievement.</p>
                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between text-sm font-bold">
                                    <span>Achievement</span>
                                    <span>78%</span>
                                </div>
                                <div className="h-3 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: "78%" }}
                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                        className="h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="absolute -right-8 -bottom-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                        <BarChart3 className="h-56 w-56 text-white" />
                        </div>
                    </Card>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <motion.div whileHover={{ y: -5 }} className="p-6 rounded-xl border border-border bg-emerald-500/5 group">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                                    <DollarSign className="h-4 w-4" />
                                </div>
                                <p className="text-muted-foreground text-xs font-black uppercase tracking-widest">Avg Order</p>
                            </div>
                            <h4 className="text-2xl font-black text-foreground">{formatCurrency(84200)}</h4>
                        </motion.div>

                        <motion.div whileHover={{ y: -5 }} className="p-6 rounded-xl border border-border bg-indigo-500/5 group">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
                                    <Activity className="h-4 w-4" />
                                </div>
                                <p className="text-muted-foreground text-xs font-black uppercase tracking-widest">Conversion</p>
                            </div>
                            <h4 className="text-2xl font-black text-foreground">12.4%</h4>
                        </motion.div>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
}
