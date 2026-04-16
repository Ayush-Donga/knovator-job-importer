'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { io } from 'socket.io-client';
import { 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ExternalLink,
  Plus,
  ArrowUpRight,
  XCircle,
  Activity,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react';

interface ImportLog {
  _id: string;
  fileName: string;
  timestamp: string;
  totalFetched: number;
  totalImported: number;
  newJobs: number;
  updatedJobs: number;
  failedJobs: number;
  status: 'pending' | 'completed' | 'failed';
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export default function Dashboard() {
  const [logs, setLogs] = useState<ImportLog[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const [stats, setStats] = useState({ totalSyncs: 0, totalFetched: 0, totalNew: 0, totalUpdated: 0 });

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchLogs = async (page = 1, status = '') => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/logs`, {
        params: { page, limit: 10, status }
      });
      setLogs(response.data.logs);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const triggerSync = async () => {
    setSyncing(true);
    try {
      await axios.post(`${API_URL}/api/sync`);
      // Logs will be updated via socket.io, but we can also fetch them immediately
      fetchLogs(1, statusFilter);
    } catch (error) {
      console.error('Error triggering sync:', error);
    } finally {
      setTimeout(() => setSyncing(false), 2000); // Keep spinning for a bit for better UI
    }
  };

  useEffect(() => {
    fetchLogs(currentPage, statusFilter);
    fetchStats();
    
    // Setup Socket
    const socket = io(API_URL);
    
    socket.on('log_update', (updatedLog: ImportLog) => {
      fetchStats();
      setLogs(prevLogs => {
        const index = prevLogs.findIndex(l => l._id === updatedLog._id);
        if (index !== -1) {
          const newLogs = [...prevLogs];
          newLogs[index] = updatedLog;
          return newLogs;
        } else if (currentPage === 1) {
          fetchLogs(1, statusFilter);
          return prevLogs;
        }
        return prevLogs;
      });
    });

    socket.on('import_start', () => {
      if (currentPage === 1) fetchLogs(1, statusFilter);
    });

    return () => {
      socket.disconnect();
    };
  }, [currentPage, statusFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <CheckCircle2 size={12} />
            Completed
          </span>
        );
      case 'pending':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Clock size={12} className="animate-spin-slow" />
            Processing
          </span>
        );
      case 'failed':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-500 border border-rose-500/20">
            <XCircle size={12} />
            Failed
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-200 p-6 md:p-10 font-sans">
      {/* Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent mb-2">
            Import History Tracking
          </h1>
          <p className="text-slate-500">Monitor and manage your external job feed synchronizations.</p>
        </div>
        
        <button 
          onClick={triggerSync}
          disabled={syncing}
          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg transition-all shadow-lg shadow-indigo-600/20 font-medium"
        >
          {syncing ? <RefreshCw size={18} className="animate-spin" /> : <Activity size={18} />}
          {syncing ? 'Syncing...' : 'Sync Now'}
        </button>
      </div>

      {/* Grid Stats */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          {[
            { label: 'Total Syncs', value: stats.totalSyncs, icon: Activity, color: 'text-indigo-400' },
            { label: 'Total Fetched', value: stats.totalFetched, icon: RefreshCw, color: 'text-blue-400' },
            { label: 'New Jobs', value: stats.totalNew, icon: Plus, color: 'text-emerald-400' },
            { label: 'Updated', value: stats.totalUpdated, icon: ArrowUpRight, color: 'text-amber-400' },
          ].map((stat, i) => (
            <div key={i} className="bg-[#111] border border-white/5 p-5 rounded-2xl hover:border-white/10 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                <stat.icon size={18} className={stat.color} />
              </div>
              <p className="text-2xl font-bold text-white">{stat.value.toLocaleString()}</p>
            </div>
          ))}
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#111] border border-white/5 rounded-lg text-xs text-slate-400">
           <Filter size={14} />
           <span>Filter Status:</span>
        </div>
        {['', 'completed', 'pending', 'failed'].map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setCurrentPage(1); }}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
              statusFilter === s 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                : 'bg-[#111] border border-white/5 text-slate-500 hover:text-slate-300'
            }`}
          >
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="max-w-7xl mx-auto bg-[#111] border border-white/5 rounded-2xl overflow-hidden shadow-2xl mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Feed / URL</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Timestamp</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 text-center">Total</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 text-center">New</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 text-center">Updated</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 text-center">Failed</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                   <td colSpan={7} className="px-6 py-20 text-center text-slate-500">
                      <div className="flex flex-col items-center gap-3">
                         <RefreshCw className="animate-spin text-indigo-500" size={32} />
                         <p className="animate-pulse">Loading history logs...</p>
                      </div>
                   </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                   <td colSpan={7} className="px-6 py-20 text-center text-slate-500">
                      <div className="flex flex-col items-center gap-3 opacity-50">
                         <AlertCircle size={40} />
                         <p>No import history found. Click 'Sync Now' to start.</p>
                      </div>
                   </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-white/[0.01] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-300 truncate max-w-[200px] md:max-w-xs block" title={log.fileName}>
                          {log.fileName}
                        </span>
                        <a href={log.fileName} target="_blank" rel="noreferrer" className="text-[10px] text-slate-600 hover:text-indigo-400 flex items-center gap-1 mt-1 transition-colors">
                          View Feed <ExternalLink size={8} />
                        </a>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400 whitespace-nowrap">
                      {format(new Date(log.timestamp), 'MMM dd, HH:mm:ss')}
                    </td>
                    <td className="px-6 py-4 text-sm text-white font-semibold text-center underline decoration-indigo-500/30 decoration-2 underline-offset-4">
                      {log.totalFetched}
                    </td>
                    <td className="px-6 py-4 text-sm text-emerald-400/80 font-medium text-center">
                      {log.newJobs}
                    </td>
                    <td className="px-6 py-4 text-sm text-amber-400/80 font-medium text-center">
                      {log.updatedJobs}
                    </td>
                    <td className="px-6 py-4 text-sm text-rose-500/80 font-medium text-center">
                      {log.failedJobs}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(log.status)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 bg-white/[0.01] border-t border-white/5 flex items-center justify-between">
           <p className="text-[10px] text-slate-600 uppercase tracking-widest font-bold">Autosync: Active (1h)</p>
           {pagination && (
             <div className="flex items-center gap-4">
               <span className="text-xs text-slate-500">Page {pagination.page} of {pagination.pages}</span>
               <div className="flex gap-2">
                 <button 
                   disabled={currentPage === 1}
                   onClick={() => setCurrentPage(prev => prev - 1)}
                   className="p-1 rounded bg-[#1a1a1a] border border-white/5 disabled:opacity-30 hover:bg-white/5 transition-colors"
                 >
                   <ChevronLeft size={16} />
                 </button>
                 <button 
                   disabled={currentPage === pagination.pages}
                   onClick={() => setCurrentPage(prev => prev + 1)}
                   className="p-1 rounded bg-[#1a1a1a] border border-white/5 disabled:opacity-30 hover:bg-white/5 transition-colors"
                 >
                   <ChevronRight size={16} />
                 </button>
               </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
