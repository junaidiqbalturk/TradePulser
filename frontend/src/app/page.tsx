"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, FileText, ArrowDownRight, ArrowUpRight, Activity, DollarSign, Package, Ship, Anchor, PlaneTakeoff, TrendingUp, CreditCard, ArrowRight, ChevronRight, History, X, Calendar, Hash, ExternalLink, AlertCircle, ShoppingCart, Truck } from "lucide-react";
import { motion, Variants, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";

const LandingPage = dynamic(() => import("@/components/marketing/LandingPage"), {
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-[#141B41]">
      <Activity className="animate-spin h-8 w-8 text-[#306BAC]" />
    </div>
  ),
});
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
const ResponsiveContainer = dynamic(() => import("recharts").then(mod => mod.ResponsiveContainer), { ssr: false });
const AreaChart = dynamic(() => import("recharts").then(mod => mod.AreaChart), { ssr: false });
const Area = dynamic(() => import("recharts").then(mod => mod.Area), { ssr: false });
const BarChart = dynamic(() => import("recharts").then(mod => mod.BarChart), { ssr: false });
const Bar = dynamic(() => import("recharts").then(mod => mod.Bar), { ssr: false });
const XAxis = dynamic(() => import("recharts").then(mod => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then(mod => mod.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import("recharts").then(mod => mod.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then(mod => mod.Tooltip), { ssr: false });
const Legend = dynamic(() => import("recharts").then(mod => mod.Legend), { ssr: false });

interface DashboardData {
  total_clients: number;
  total_receivable: number;
  total_payments_received: number;
  total_imports: number;
  total_exports: number;
  recent_transactions: any[];
  recent_documents?: any[];
  recent_generated?: any[];
  revenue_data: { name: string, revenue: number }[];
  activity_data: { name: string, import: number, export: number }[];
  open_pos: number;
  pending_deliveries: number;
  total_po_value: number;
}

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null);
  const [exchangeRates, setExchangeRates] = useState<any>(null);
  const [loadingRates, setLoadingRates] = useState(true);
  const [shipmentsData, setShipmentsData] = useState<any>(null);
  const [vendorData, setVendorData] = useState<any>(null);

  useEffect(() => {
    // We no longer redirect to /login automatically. 
    // Instead, we show the LandingPage if !user.
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      api.get("/dashboard").then((res) => {
        setData(res.data);
        setLoadingData(false);
      }).catch(err => {
        console.error(err);
        setLoadingData(false);
      });

      api.get("/exchange-rates").then((res) => {
        setExchangeRates(res.data);
        setLoadingRates(false);
      }).catch(err => {
        console.error(err);
        setLoadingRates(false);
      });

      api.get("/shipments/dashboard-info").then((res) => {
        setShipmentsData(res.data);
      }).catch(err => {
        console.error(err);
      });

      api.get("/vendors/dashboard-info").then((res) => {
        setVendorData(res.data);
      }).catch(err => {
        console.error("Vendor Dashboard Info Failed:", err);
      });
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Activity className="animate-spin h-8 w-8 text-indigo-600" />
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
    }
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    return new Intl.NumberFormat('en-PK').format(num);
  };

  const formatCurrency = (amount: number) => {
    if (Math.abs(amount) >= 1000000) {
      return 'Rs ' + formatNumber(amount);
    }
    return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(amount);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border p-3 rounded-lg shadow-xl backdrop-blur-sm bg-opacity-95">
          <p className="text-sm font-bold text-foreground mb-2 border-b border-border pb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-3 py-0.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
              <span className="text-xs font-semibold text-muted-foreground min-w-[60px]">{entry.name}:</span>
              <span className="text-xs font-bold text-foreground">
                {entry.name === 'Revenue' ? formatCurrency(entry.value) : formatNumber(entry.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const formatYAxis = (value: number) => {
    if (value === 0) return '0';
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
    return value.toString();
  };

  const revenueData = data?.revenue_data || [];
  const activityData = data?.activity_data || [];

  const TransactionModal = ({ tx, onClose }: { tx: any, onClose: () => void }) => {
    if (!tx) return null;
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-border bg-card shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className={`p-8 pb-6 flex items-start justify-between ${
            tx.type === 'receipt' ? 'bg-emerald-500/5' : 'bg-primary/5'
          }`}>
            <div className="flex items-center gap-4">
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm ${
                tx.type === 'receipt' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-primary/10 text-primary'
              }`}>
                {tx.type === 'receipt' ? <CreditCard className="h-7 w-7" /> : <FileText className="h-7 w-7" />}
              </div>
              <div>
                <h3 className="text-2xl font-black text-foreground tracking-tight">{tx.voucher_number}</h3>
                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${
                  tx.type === 'receipt' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-primary/10 text-primary border-primary/20'
                }`}>
                  {tx.type === 'receipt' ? 'Receipt Payment' : 'Sales Invoice'}
                </span>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-muted-foreground hover:text-foreground"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="p-8 pt-6 space-y-6">
            {/* Amount Section */}
            <div className="flex flex-col items-center justify-center py-6 border-y border-border/50 bg-zinc-50/50 dark:bg-zinc-900/50 rounded-2xl">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1">Transaction Amount</span>
              <span className={`text-4xl font-black tracking-tighter ${
                tx.type === 'receipt' ? 'text-emerald-500' : 'text-foreground'
              }`}>
                {tx.type === 'receipt' ? '+' : ''}{formatCurrency(tx.amount)}
              </span>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl border border-border bg-card">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Calendar className="h-4 w-4" />
                  <span className="text-[10px] font-black uppercase tracking-wider">Date</span>
                </div>
                <p className="font-bold text-foreground">{tx.date}</p>
              </div>
              <div className="p-4 rounded-2xl border border-border bg-card">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Hash className="h-4 w-4" />
                  <span className="text-[10px] font-black uppercase tracking-wider">Reference</span>
                </div>
                <p className="font-bold text-foreground">#{tx.voucher_number.split('-')[1] || 'N/A'}</p>
              </div>
            </div>

            {/* Client Info */}
            <div className="p-4 rounded-2xl border border-border bg-card">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Users className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase tracking-wider">Client / Entity</span>
              </div>
              <div className="flex items-center justify-between">
                <p className="font-bold text-xl text-foreground">{tx.client?.company_name || 'System Entity'}</p>
                <button className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-primary hover:bg-primary hover:text-white transition-all">
                  <ExternalLink className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button 
                onClick={onClose}
                className="flex-1 py-4 rounded-2xl font-bold bg-zinc-100 dark:bg-zinc-800 text-foreground hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                Close Details
              </button>
              <button 
                onClick={() => {
                  router.push(`/ledger/${tx.client_id}`);
                  onClose();
                }}
                className="flex-[2] py-4 rounded-2xl font-bold bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
              >
                View Client Ledger
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6 2xl:p-10 max-w-screen-2xl mx-auto">

      {/* Title */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold text-foreground">
          Dashboard
        </h2>
        
        {/* Exchange Rates Ticker */}
        {!loadingRates && exchangeRates && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4 bg-primary/5 border border-primary/20 px-4 py-2 rounded-2xl overflow-hidden"
          >
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-primary mr-2 border-r border-primary/20 pr-4">
              <Activity className="h-3 w-3" />
              Live Rates
            </div>
            <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
              {Object.entries(exchangeRates).map(([currency, rate]: any) => (
                <div key={currency} className="flex items-center gap-2 whitespace-nowrap">
                  <span className="text-[10px] font-bold text-muted-foreground mr-1">{currency}/PKR</span>
                  <span className="text-sm font-black text-foreground">{Number(rate).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {loadingData ? (
        <div className="flex min-h-[400px] items-center justify-center"><Activity className="animate-spin h-8 w-8 text-primary" /></div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="space-y-6 md:space-y-8"
        >
          {/* Metric Cards Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-8 md:gap-4 2xl:gap-6">
            {[
              { title: "Total Revenue", value: formatCurrency(data?.total_payments_received || 0), icon: DollarSign, trend: "View Ledgers", trendUp: true, color: "text-[#306BAC]", bg: "bg-[#306BAC]/10", gradient: "group-hover:bg-[#306BAC]/5" },
              { title: "A/P (Payables)", value: formatCurrency(vendorData?.total_payables || 0), icon: CreditCard, trend: "Pending out", trendUp: false, color: "text-[#918EF4]", bg: "bg-[#918EF4]/10", gradient: "group-hover:bg-[#918EF4]/5" },
              { title: "Import Orders", value: formatNumber(data?.total_imports || 0), icon: Package, trend: "Total Imports", trendUp: true, color: "text-[#306BAC]", bg: "bg-[#306BAC]/10", gradient: "group-hover:bg-[#306BAC]/5" },
              { title: "Export Orders", value: formatNumber(data?.total_exports || 0), icon: PlaneTakeoff, trend: "Total Exports", trendUp: true, color: "text-[#6F9CEB]", bg: "bg-[#6F9CEB]/10", gradient: "group-hover:bg-[#6F9CEB]/5" },
              { title: "Outstanding (A/R)", value: formatCurrency(data?.total_receivable || 0), icon: ArrowUpRight, trend: "Requires attention", trendUp: false, color: "text-[#98B9F2]", bg: "bg-[#98B9F2]/10", gradient: "group-hover:bg-[#98B9F2]/5" },
              { title: "Open Purchase Orders", value: formatNumber(data?.open_pos || 0), icon: ShoppingCart, trend: "Procurement", trendUp: true, color: "text-[#306BAC]", bg: "bg-[#306BAC]/10", gradient: "group-hover:bg-[#306BAC]/5" },
              { title: "Pending Deliveries", value: formatNumber(data?.pending_deliveries || 0), icon: Truck, trend: "Inbound", trendUp: true, color: "text-[#6F9CEB]", bg: "bg-[#6F9CEB]/10", gradient: "group-hover:bg-[#6F9CEB]/5" },
              { title: "Total PO Value", value: formatCurrency(data?.total_po_value || 0), icon: FileText, trend: "Total Value", trendUp: true, color: "text-[#918EF4]", bg: "bg-[#918EF4]/10", gradient: "group-hover:bg-[#918EF4]/5" }
            ].map((stat, i) => (
              <motion.div 
                variants={fadeUp} 
                key={i}
                whileHover={{ y: -5, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                className="group"
              >
                <div className={`relative overflow-hidden rounded-xl border border-border bg-card shadow-sm p-4 2xl:p-6 transition-all duration-300 ${stat.gradient}`}>
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
                      <h4 className="text-xl sm:text-2xl 2xl:text-3xl font-bold text-foreground break-words leading-tight" title={stat.value.toString()}>
                        {stat.value}
                      </h4>
                      <span className="text-xs 2xl:text-sm font-medium text-muted-foreground truncate mb-3">{stat.title}</span>
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
          </div>

          {/* Logistics Min-Widgets */}
          {shipmentsData && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {[
                { title: "In Transit", value: shipmentsData.in_transit, icon: Ship, color: "text-[#306BAC]", bg: "bg-[#306BAC]/10", gradient: "group-hover:bg-[#306BAC]/5" },
                { title: "Arriving This Week", value: shipmentsData.arriving_this_week, icon: Anchor, color: "text-[#6F9CEB]", bg: "bg-[#6F9CEB]/10", gradient: "group-hover:bg-[#6F9CEB]/5" },
                { title: "Delayed Shipments", value: shipmentsData.delayed_shipments, icon: AlertCircle, color: "text-[#98B9F2]", bg: "bg-[#98B9F2]/10", gradient: "group-hover:bg-[#98B9F2]/5" }
              ].map((stat, i) => (
                <motion.div 
                  variants={fadeUp} 
                  key={i}
                  whileHover={{ y: -5, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  className="group"
                >
                  <div className={`relative overflow-hidden rounded-xl border border-border bg-card shadow-sm p-5 flex items-center gap-5 transition-all duration-300 ${stat.gradient}`}>
                    {/* Background Watermark Icon */}
                    <motion.div
                      initial={{ opacity: 0.05, scale: 1 }}
                      whileHover={{ opacity: 0.1, scale: 1.2, rotate: 8 }}
                      className="absolute -right-4 -bottom-4 pointer-events-none z-0"
                    >
                      <stat.icon className={`h-24 w-24 ${stat.color}`} />
                    </motion.div>

                    <div className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-xl ${stat.bg} flex-shrink-0 transition-transform duration-300 group-hover:scale-110`}>
                      <stat.icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                    <div className="relative z-10">
                      <h4 className="text-2xl font-bold text-foreground">{stat.value}</h4>
                      <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Charts Section */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 2xl:gap-7.5">
            <motion.div 
              variants={fadeUp}
              whileHover={{ y: -5, scale: 1.01 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              className="group"
            >
              <div className="relative overflow-hidden rounded-sm border border-border bg-card px-5 pt-7.5 pb-5 shadow-sm sm:px-7.5 p-6 transition-colors duration-300 group-hover:bg-primary/5">
                {/* Background Watermark Icon */}
                <motion.div
                  initial={{ opacity: 0.05, scale: 1 }}
                  whileHover={{ opacity: 0.1, scale: 1.2, rotate: -12 }}
                  className="absolute -right-10 -top-10 pointer-events-none z-0"
                >
                  <TrendingUp className="h-64 w-64 text-primary" />
                </motion.div>

                <div className="relative z-10">
                  <div className="mb-3 justify-between gap-4 sm:flex">
                    <div>
                      <h5 className="text-xl font-semibold text-foreground">Revenue Overview</h5>
                      <p className="text-sm font-medium text-muted-foreground mt-1">Monthly revenue performance</p>
                    </div>
                  </div>
                  <div className="h-[300px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickFormatter={formatYAxis} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area 
                          type="monotone" 
                          dataKey="revenue" 
                          name="Revenue"
                          stroke="hsl(var(--primary))" 
                          strokeWidth={3} 
                          fillOpacity={1}
                          fill="url(#colorRevenue)"
                          dot={{ r: 4, strokeWidth: 2, fill: "hsl(var(--card))", stroke: "hsl(var(--primary))" }} 
                          activeDot={{ r: 6, strokeWidth: 0 }} 
                          isAnimationActive={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              variants={fadeUp}
              whileHover={{ y: -5, scale: 1.01 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              className="group"
            >
              <div className="relative overflow-hidden rounded-sm border border-border bg-card px-5 pt-7.5 pb-5 shadow-sm sm:px-7.5 p-6 transition-colors duration-300 group-hover:bg-emerald-500/5">
                {/* Background Watermark Icon */}
                <motion.div
                  initial={{ opacity: 0.05, scale: 1 }}
                  whileHover={{ opacity: 0.1, scale: 1.2, rotate: 12 }}
                  className="absolute -right-10 -bottom-10 pointer-events-none z-0"
                >
                  <Activity className="h-64 w-64 text-emerald-500" />
                </motion.div>

                <div className="relative z-10">
                  <div className="mb-3 justify-between gap-4 sm:flex">
                    <div>
                      <h5 className="text-xl font-semibold text-foreground">Trade Activity</h5>
                      <p className="text-sm font-medium text-muted-foreground mt-1">Imports vs Exports this week</p>
                    </div>
                  </div>
                  <div className="h-[300px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }} />
                        <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px', fontSize: '12px' }} />
                        <Bar dataKey="import" name="Imports" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} barSize={20} isAnimationActive={false} />
                        <Bar dataKey="export" name="Exports" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} barSize={20} isAnimationActive={false} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6 2xl:gap-7.5">
            {/* Recent Transactions Section */}
            <motion.div variants={fadeUp} className="xl:col-span-2">
                <div className="relative overflow-hidden rounded-xl border border-border bg-card/50 backdrop-blur-md shadow-lg transition-all duration-300 hover:shadow-xl h-full group/card">
                  {/* Background Watermark */}
                  <div className="absolute -right-20 -bottom-20 pointer-events-none opacity-[0.03] group-hover/card:opacity-[0.05] transition-opacity duration-500">
                    <History className="h-80 w-80 text-foreground" />
                  </div>

                  <div className="relative z-10 p-6 border-b border-border/50 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="p-1.5 rounded-lg bg-primary/10 transition-transform duration-300 group-hover/card:scale-110">
                          <History className="h-5 w-5 text-primary" />
                        </div>
                        <h4 className="text-xl font-bold text-foreground">Recent Transactions</h4>
                      </div>
                      <p className="text-sm font-medium text-muted-foreground ml-9">Real-time overview of financial flow</p>
                    </div>
                  <button 
                    onClick={() => router.push('/ledger')}
                    className="group flex items-center gap-2 text-sm font-bold text-primary hover:text-primary/80 transition-colors"
                  >
                    View All
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>

                  <div className="relative flex-1 divide-y divide-border/30 z-10">
                  {data?.recent_transactions?.map((tx, idx) => (
                    <motion.div 
                      key={tx.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      whileHover={{ backgroundColor: "rgba(var(--primary-rgb), 0.02)" }}
                      className="group/row relative flex items-center justify-between p-4 px-6 transition-all duration-300 cursor-pointer"
                      onClick={() => setSelectedTransaction(tx)}
                    >
                      <div className="flex items-center gap-4">
                        {/* Icon with Dynamic Background */}
                        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm transition-all duration-300 group-hover/row:scale-110 group-hover/row:shadow-md ${
                          tx.type === 'receipt' 
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 group-hover/row:bg-emerald-500/20' 
                            : 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 group-hover/row:bg-indigo-500/20'
                        }`}>
                          {tx.type === 'receipt' ? <CreditCard className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
                        </div>

                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-foreground group-hover/row:text-primary transition-colors">
                              {tx.voucher_number}
                            </span>
                            <span className={`text-[10px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded border transition-all duration-300 ${
                              tx.type === 'receipt' 
                                ? 'bg-emerald-500/5 text-emerald-500 border-emerald-500/20 group-hover/row:bg-emerald-500/10' 
                                : 'bg-indigo-500/5 text-indigo-500 border-indigo-500/20 group-hover/row:bg-indigo-500/10'
                            }`}>
                              {tx.type === 'receipt' ? 'Receipt' : 'Invoice'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {tx.client?.company_name || 'System Entity'}
                            </span>
                            <span className="text-zinc-300 dark:text-zinc-800">•</span>
                            <span className="text-xs font-medium text-muted-foreground/70">{tx.date}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="flex flex-col items-end transition-transform duration-300 group-hover/row:-translate-x-2">
                          <span className={`text-lg font-black tracking-tight transition-all duration-300 ${
                            tx.type === 'receipt' ? 'text-emerald-500' : 'text-foreground'
                          }`}>
                            {tx.type === 'receipt' ? '+' : ''}{formatCurrency(tx.amount)}
                          </span>
                          <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground/60 uppercase">
                            {tx.type === 'receipt' ? 'Credit' : 'Debit'}
                          </div>
                        </div>
                        
                        <div className="h-8 w-8 flex items-center justify-center rounded-full opacity-0 -translate-x-2 group-hover/row:opacity-100 group-hover/row:translate-x-0 transition-all duration-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-primary hover:text-white border border-border">
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      </div>

                      {/* Left Border Accent on Hover */}
                      <div className={`absolute left-0 top-1/4 bottom-1/4 w-1 rounded-r-full scale-y-0 group-hover/row:scale-y-100 transition-transform duration-300 ${
                        tx.type === 'receipt' ? 'bg-emerald-500' : 'bg-primary'
                      }`} />
                    </motion.div>
                  ))}

                  {data?.recent_transactions?.length === 0 && (
                    <div className="py-20 flex flex-col items-center justify-center text-center">
                      <div className="h-16 w-16 rounded-full bg-zinc-50 dark:bg-zinc-900 border border-border flex items-center justify-center mb-4">
                        <FileText className="h-8 w-8 text-zinc-300" />
                      </div>
                      <p className="text-muted-foreground font-medium">No recent transactions found</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">Start by creating an invoice or recording a payment</p>
                    </div>
                  )}
                </div>
                
                {data?.recent_transactions && data.recent_transactions.length > 0 && (
                  <div className="p-4 bg-zinc-50/30 dark:bg-zinc-900/30 border-t border-border/50 text-center mt-auto">
                     <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">End of Recent Activity</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Recent Documents Section */}
            <motion.div variants={fadeUp} className="xl:col-span-1">
              <div className="relative overflow-hidden rounded-xl border border-border bg-card/50 backdrop-blur-md shadow-lg transition-all duration-300 hover:shadow-xl h-full flex flex-col group/card">
                {/* Background Watermark */}
                <div className="absolute -right-10 -bottom-10 pointer-events-none opacity-[0.03] group-hover/card:opacity-[0.05] transition-opacity duration-500">
                  <FileText className="h-60 w-60 text-foreground" />
                </div>

                <div className="relative z-10 p-6 border-b border-border/50 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="p-1.5 rounded-lg bg-orange-500/10 transition-transform duration-300 group-hover/card:scale-110">
                        <FileText className="h-5 w-5 text-orange-500" />
                      </div>
                      <h4 className="text-xl font-bold text-foreground">Recent Documents</h4>
                    </div>
                    <p className="text-sm font-medium text-muted-foreground ml-9">Latest uploaded files</p>
                  </div>
                </div>

                <div className="relative z-10 divide-y divide-border/30 flex-1">
                  {data?.recent_documents?.map((doc, idx) => (
                    <motion.div 
                      key={doc.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      whileHover={{ backgroundColor: "rgba(var(--orange-rgb), 0.02)" }}
                      className="group/row relative flex flex-col p-4 px-6 transition-all duration-300 cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex flex-col transition-transform duration-300 group-hover/row:translate-x-1">
                          <span className="font-bold text-sm text-foreground group-hover/row:text-orange-500 transition-colors line-clamp-1" title={doc.original_name}>
                            {doc.original_name}
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5 max-w-full">
                            {doc.type} • {(doc.size / 1024).toFixed(1)} KB
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1.5 mt-1 transition-transform duration-300 group-hover/row:translate-x-1">
                        <span className={`text-[10px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded border border-border bg-muted/40 text-muted-foreground`}>
                          Linked: {doc.documentable_type.split('\\').pop()} #{doc.documentable_id}
                        </span>
                      </div>

                      <div className={`absolute left-0 top-1/4 bottom-1/4 w-1 rounded-r-full scale-y-0 group-hover/row:scale-y-100 transition-transform duration-300 bg-orange-500`} />
                    </motion.div>
                  ))}

                  {data?.recent_documents?.length === 0 && (
                    <div className="py-20 flex flex-col items-center justify-center text-center">
                      <div className="h-16 w-16 rounded-full bg-zinc-50 dark:bg-zinc-900 border border-border flex items-center justify-center mb-4">
                        <FileText className="h-8 w-8 text-zinc-300" />
                      </div>
                      <p className="text-muted-foreground font-medium text-sm">No recent documents</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Recent Generated Documents Section */}
            <motion.div variants={fadeUp} className="xl:col-span-1">
              <div className="relative overflow-hidden rounded-xl border border-border bg-card/50 backdrop-blur-md shadow-lg transition-all duration-300 hover:shadow-xl h-full flex flex-col group/card">
                {/* Background Watermark */}
                <div className="absolute -right-10 -bottom-10 pointer-events-none opacity-[0.03] group-hover/card:opacity-[0.05] transition-opacity duration-500">
                  <FileText className="h-60 w-60 text-primary" />
                </div>

                <div className="relative z-10 p-6 border-b border-border/50 flex items-center justify-between bg-primary/5 dark:bg-primary/10">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="p-1.5 rounded-lg bg-primary/10 transition-transform duration-300 group-hover/card:scale-110">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <h4 className="text-xl font-bold text-foreground">Trade Documents</h4>
                    </div>
                    <p className="text-sm font-medium text-muted-foreground ml-9">Automated PDF activity</p>
                  </div>
                </div>

                <div className="relative z-10 divide-y divide-border/30 flex-1">
                  {data?.recent_generated?.map((doc, idx) => (
                    <motion.div 
                      key={doc.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      whileHover={{ backgroundColor: "rgba(var(--primary-rgb), 0.02)" }}
                      className="group/row relative flex flex-col p-4 px-6 transition-all duration-300 cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex flex-col">
                          <span className="font-mono font-black text-xs text-primary group-hover/row:text-primary transition-colors">
                            {doc.document_number}
                          </span>
                          <span className="text-sm font-bold text-foreground mt-0.5">
                            {(doc.document_type || '').replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        <div className="text-[10px] text-muted-foreground font-medium">
                          {new Date(doc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                         <span className="text-[10px] uppercase font-black text-muted-foreground/60">
                           By {doc.user?.name || 'System'}
                         </span>
                         <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 text-[8px] font-semibold text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                            LINKED
                         </div>
                      </div>

                      <div className={`absolute left-0 top-1/4 bottom-1/4 w-1 rounded-r-full scale-y-0 group-hover/row:scale-y-100 transition-transform duration-300 bg-primary`} />
                    </motion.div>
                  ))}

                  {data?.recent_generated?.length === 0 && (
                    <div className="py-20 flex flex-col items-center justify-center text-center">
                      <div className="h-16 w-16 rounded-full bg-zinc-50 dark:bg-zinc-900 border border-border flex items-center justify-center mb-4">
                        <FileText className="h-8 w-8 text-zinc-300" />
                      </div>
                      <p className="text-muted-foreground font-medium text-sm">No documents generated</p>
                    </div>
                  )}
                </div>
                
                <Link href="/admin/documents" className="p-4 bg-muted/20 border-t border-border/50 text-center hover:bg-muted/40 transition-colors">
                   <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                     Deep Archive
                     <ArrowRight className="h-3 w-3" />
                   </p>
                </Link>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* Detail Popup Modal */}
      <AnimatePresence>
        {selectedTransaction && (
          <TransactionModal 
            tx={selectedTransaction} 
            onClose={() => setSelectedTransaction(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

