import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LifeBuoy,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  User,
  Shield,
  X,
  MessageSquare,
  Building2,
} from 'lucide-react';
import { platformAdminService } from '../../services/platformAdminService';

export const PlatformTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Ticket Detail Drawer
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [drawerError, setDrawerError] = useState('');

  const fetchTickets = async () => {
    try {
      setIsLoading(true);
      const res = await platformAdminService.getTickets({
        search: search || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
      });
      setTickets(res.data || []);
      setTotal(res.pagination?.total || 0);
    } catch (err) {
      console.error('Failed to load support tickets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [search, statusFilter, priorityFilter]);

  const handleOpenTicket = async (ticket) => {
    try {
      const res = await platformAdminService.getTicketById(ticket.id || ticket._id);
      setSelectedTicket(res.data);
      setReplyText('');
      setDrawerError('');
    } catch (err) {
      console.error('Failed to get ticket details:', err);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;
    setIsSending(true);
    setDrawerError('');

    try {
      const res = await platformAdminService.replyTicket(
        selectedTicket.id || selectedTicket._id,
        replyText
      );
      setSelectedTicket(res.data);
      setReplyText('');
      fetchTickets();
    } catch (err) {
      setDrawerError(err.response?.data?.message || 'Failed to send reply');
    } finally {
      setIsSending(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!selectedTicket) return;
    try {
      const res = await platformAdminService.updateTicket(
        selectedTicket.id || selectedTicket._id,
        { status: newStatus }
      );
      setSelectedTicket(res.data);
      fetchTickets();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="text-2xl">🎫</span>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Customer Support Helpdesk
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Resolve customer technical inquiries, review workspace incidents, and reply directly to customer ticket threads.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            Total Tickets: <strong className="text-slate-900 dark:text-white font-mono">{total}</strong>
          </span>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center space-x-2.5 w-full sm:w-80 px-3.5 py-2 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search tickets by code, subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs placeholder-slate-400 border-none bg-transparent focus:outline-hidden text-slate-900 dark:text-white font-medium"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-semibold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-3 py-2 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs font-semibold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-3 py-2 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Priorities</option>
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Clock className="w-8 h-8 animate-spin mx-auto text-indigo-500 opacity-60" />
            <p className="text-xs">Loading support tickets...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <LifeBuoy className="w-8 h-8 mx-auto text-slate-400 opacity-50" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No support tickets found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/50 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-5">Ticket</th>
                  <th className="py-3.5 px-4">Subject</th>
                  <th className="py-3.5 px-4">Organization</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Submitted</th>
                  <th className="py-3.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {tickets.map((t) => (
                  <tr
                    key={t.id || t._id}
                    onClick={() => handleOpenTicket(t)}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition cursor-pointer"
                  >
                    <td className="py-4 px-5 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {t.ticketCode}
                    </td>

                    <td className="py-4 px-4 font-bold text-slate-900 dark:text-white max-w-xs truncate">
                      {t.subject}
                    </td>

                    <td className="py-4 px-4 text-slate-600 dark:text-slate-300">
                      {t.organizationId?.name || 'Acme Workspace'}
                    </td>

                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          t.priority === 'urgent' || t.priority === 'high'
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {t.priority}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          t.status === 'resolved' || t.status === 'closed'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : t.status === 'in_progress'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                            : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-slate-400">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </td>

                    <td className="py-4 px-5 text-right">
                      <button className="px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition">
                        View Thread
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ticket Conversation Drawer */}
      {selectedTicket && (
        <AnimatePresence>
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/50 backdrop-blur-xs">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="w-full max-w-xl h-full bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between overflow-hidden"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40 shrink-0">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      {selectedTicket.ticketCode}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                      {selectedTicket.status}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                    {selectedTicket.subject}
                  </h3>
                </div>

                <button
                  onClick={() => setSelectedTicket(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Action Buttons */}
              <div className="px-6 py-3 bg-slate-100/60 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-500">Quick Status:</span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleUpdateStatus('in_progress')}
                    className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-300 font-bold"
                  >
                    In Progress
                  </button>
                  <button
                    onClick={() => handleUpdateStatus('resolved')}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 font-bold"
                  >
                    Mark Resolved
                  </button>
                  <button
                    onClick={() => handleUpdateStatus('closed')}
                    className="px-2.5 py-1 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300 font-bold"
                  >
                    Close
                  </button>
                </div>
              </div>

              {/* Message Thread */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {selectedTicket.messages?.map((msg, idx) => {
                  const isAdmin = msg.senderType === 'admin';
                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-2xl border text-xs space-y-1.5 ${
                        isAdmin
                          ? 'bg-indigo-50/60 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-900/50 ml-6'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 mr-6'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          {isAdmin ? <Shield className="w-3.5 h-3.5 text-indigo-500" /> : <User className="w-3.5 h-3.5 text-slate-400" />}
                          {msg.senderName}
                          {isAdmin && <span className="text-[9px] uppercase font-bold text-indigo-600 bg-indigo-100 dark:bg-indigo-900 px-1.5 rounded">Staff</span>}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {msg.text}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Reply Input Box */}
              <form onSubmit={handleSendReply} className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-3 shrink-0">
                {drawerError && (
                  <div className="text-rose-500 text-xs font-semibold">{drawerError}</div>
                )}
                <textarea
                  rows={3}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type an official admin response to the customer..."
                  className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSending || !replyText.trim()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSending ? 'Sending...' : 'Post Reply'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </AnimatePresence>
      )}
    </div>
  );
};

export default PlatformTickets;
