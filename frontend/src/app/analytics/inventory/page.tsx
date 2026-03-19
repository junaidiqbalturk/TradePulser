"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
    ArrowLeft,
    Box,
    AlertTriangle,
    CheckCircle2,
    Truck,
    Clock,
    BarChart3,
    Activity,
    ChevronRight,
    MapPin,
    AlertCircle,
    PackageCheck
} from "lucide-react";
import { motion, Variants } from "framer-motion";
import axios from "@/lib/axios";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
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

export default function InventoryAnalytics() {
    const [inventoryData, setInventoryData] = useState([]);
    const [shipmentData, setShipmentData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [invRes, shipRes] = await Promise.all([
                    axios.get("/analytics/inventory-insights"),
                    axios.get("/shipments/dashboard-info")
                ]);
                setInventoryData(invRes.data || []);
                setShipmentData(shipRes.data);
            } catch (error) {
                console.error("Error fetching inventory analytics:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Activity className="animate-spin h-8 w-8 text-primary" />
            </div>
        );
    }

    const statusCounts = inventoryData.reduce((acc: any, curr: any) => {
        const status = curr.status || "Unknown";
        if (!acc[status]) acc[status] = 0;
        acc[status]++;
        return acc;
    }, {});

    const pieData = Object.keys(statusCounts).map(key => ({
        name: key,
        value: statusCounts[key]
    }));

    const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#3C50E0'];

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
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Inventory & Logistics</h1>
                    <p className="text-sm font-medium text-muted-foreground">Optimize stock rotation and monitor global shipment velocity</p>
                </div>
            </motion.div>

            <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
                {/* Stock Health */}
                <motion.div variants={fadeUp} className="group">
                    <Card className="relative overflow-hidden border-border bg-card shadow-sm h-full group-hover:bg-indigo-500/5 transition-colors duration-300">
                        <motion.div
                            initial={{ opacity: 0.05, scale: 1 }}
                            whileHover={{ opacity: 0.1, scale: 1.2, rotate: -10 }}
                            className="absolute -right-10 -top-10 pointer-events-none z-0"
                        >
                            <Box className="h-80 w-80 text-indigo-500" />
                        </motion.div>
                        <CardHeader className="relative z-10 flex flex-row items-center justify-between pb-2">
                            <div>
                                <CardTitle className="text-xl font-bold">Stock Distribution</CardTitle>
                                <CardDescription>Inventory health across product lines</CardDescription>
                            </div>
                            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 transition-transform group-hover:scale-110">
                                <PackageCheck className="h-6 w-6" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10 flex flex-col items-center">
                            <div className="h-[300px] w-full mt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData.length ? pieData : [{name: 'No Data', value: 1}]}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={70}
                                            outerRadius={100}
                                            paddingAngle={8}
                                            dataKey="value"
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="stroke-background stroke-2" />
                                            ))}
                                            {!pieData.length && <Cell fill="hsl(var(--muted))" />}
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                                        />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Low Stock Alerts */}
                <motion.div variants={fadeUp} className="group">
                    <Card className="relative overflow-hidden border-border bg-card shadow-sm h-full group-hover:bg-rose-500/5 transition-colors duration-300">
                        <CardHeader className="relative z-10 bg-rose-500/5 border-b border-border/50">
                            <CardTitle className="text-xs font-black text-rose-600 flex items-center gap-2 uppercase tracking-[0.2em]">
                                <AlertTriangle className="h-4 w-4" />
                                Inventory Replenishment Alerts
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="relative z-10 p-0">
                            <div className="divide-y divide-border/50">
                                {inventoryData.filter((i: any) => i.status === 'Low Stock').slice(0, 6).map((item: any, idx: number) => (
                                    <motion.div 
                                        key={idx} 
                                        whileHover={{ x: 5 }}
                                        className="p-5 flex items-center justify-between group/row hover:bg-rose-500/5 transition-all duration-300"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shadow-inner">
                                                <Box className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-foreground group-hover/row:text-primary transition-colors">{item.product_name}</p>
                                                <p className="text-xs font-black text-rose-600 uppercase tracking-widest mt-1">Stock Level: {item.current_stock}</p>
                                            </div>
                                        </div>
                                        <motion.button 
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            className="text-[10px] font-black text-white uppercase bg-primary px-3 py-2 rounded-lg shadow-lg shadow-primary/20 hover:brightness-110 transition-all"
                                        >
                                            Restock Now
                                        </motion.button>
                                    </motion.div>
                                ))}
                                {inventoryData.filter((i: any) => i.status === 'Low Stock').length === 0 && (
                                    <div className="p-20 text-center flex flex-col items-center">
                                        <div className="h-20 w-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
                                            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                                        </div>
                                        <p className="text-sm font-black text-foreground uppercase tracking-widest">Stock Health Optimal</p>
                                        <p className="text-xs mt-2 text-muted-foreground">All inventory levels are within safe operating margins.</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Logistics Performance */}
                <motion.div variants={fadeUp} className="lg:col-span-2 group">
                    <Card className="relative overflow-hidden border-border bg-card shadow-sm group-hover:bg-blue-500/5 transition-colors duration-300">
                        <motion.div
                            initial={{ opacity: 0.05, scale: 1 }}
                            whileHover={{ opacity: 0.1, scale: 1.2, rotate: 10 }}
                            className="absolute -right-20 -bottom-20 pointer-events-none z-0"
                        >
                            <Truck className="h-80 w-80 text-blue-500 opacity-20" />
                        </motion.div>
                        <CardHeader className="relative z-10 flex flex-row items-center justify-between pb-2">
                            <div>
                                <CardTitle className="text-xl font-bold">Logistics Command Center</CardTitle>
                                <CardDescription>Real-time delivery efficiency and disruption tracking</CardDescription>
                            </div>
                            <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                                <MapPin className="h-6 w-6" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 py-6">
                                {[
                                    { label: "In Transit", value: shipmentData?.stats?.in_transit || 0, color: "text-blue-500", bg: "bg-blue-500/10" },
                                    { label: "On Time Rate", value: "94.2%", color: "text-emerald-500", bg: "bg-emerald-500/10" },
                                    { label: "Delayed Items", value: "4", color: "text-rose-500", bg: "bg-rose-500/10" },
                                    { label: "Avg Lead Time", value: "12 Days", color: "text-indigo-500", bg: "bg-indigo-500/10" }
                                ].map((stat, i) => (
                                    <div key={i} className="p-6 rounded-2xl bg-muted/40 border border-border text-center hover:border-primary/20 transition-colors">
                                        <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${stat.color}`}>{stat.label}</p>
                                        <h3 className="text-3xl font-black text-foreground">{stat.value}</h3>
                                    </div>
                                ))}
                            </div>

                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="mt-4 overflow-hidden rounded-2xl bg-primary shadow-2xl shadow-primary/30 flex flex-col md:flex-row items-stretch"
                            >
                                <div className="p-8 flex items-center justify-center bg-white/10 backdrop-blur-sm border-r border-white/10">
                                    <div className="h-16 w-16 rounded-full bg-white flex items-center justify-center shadow-2xl">
                                        <Activity className="h-8 w-8 text-primary animate-pulse" />
                                    </div>
                                </div>
                                <div className="p-8 flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                        <h4 className="text-white font-black uppercase tracking-widest text-xs">A.I. Logistics Insight</h4>
                                    </div>
                                    <p className="text-white/90 text-sm leading-relaxed max-w-2xl">
                                        Weather patterns and port congestion in South-East Asia may impact 12% of upcoming ocean freight. 
                                        Predictive modeling suggests rerouting 3 shipments to avoid a 4-day average delay.
                                    </p>
                                </div>
                                <div className="p-8 flex items-center justify-center bg-black/10">
                                    <motion.button 
                                        whileHover={{ x: 5 }}
                                        className="bg-white text-primary font-black text-[10px] uppercase tracking-widest py-4 px-8 rounded-xl shadow-xl hover:bg-white/90 transition-all flex items-center gap-3 whitespace-nowrap"
                                    >
                                        Action AI Proposal
                                        <ChevronRight className="h-4 w-4" />
                                    </motion.button>
                                </div>
                            </motion.div>
                        </CardContent>
                    </Card>
                </motion.div>
            </motion.div>
        </div>
    );
}
