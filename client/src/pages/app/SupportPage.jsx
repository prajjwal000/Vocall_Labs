import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LifeBuoy,
  Plus,
  Send,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  Shield,
  X,
} from 'lucide-react';
import { customerSupportService } from '../../services/platformAdminService';

export const SupportPage = () => {
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [priority, setPriority] = useState('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Ticket Thread Drawer
  const [activeTicket, setActiveTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  const fetchTickets = async () => {
    try {
      setIsLoading(true);
      const res = await customerSupportService.getTickets();
      setTickets(res.data || []);
    } catch (err) {
      console.error('Failed to load tickets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;
    setIsSubmitting(true);
    setFormError('');

    try {
      await customerSupportService.createTicket({
        subject,
        description,
        category,
        priority,
      });
      setSuccessMessage('Support ticket opened! Our operations team has been notified.');
      setIsModalOpen(false);
      setSubject('');
      setDescription('');
      fetchTickets();
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to submit ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !activeTicket) return;
    setIsSendingReply(true);

    try {
      const res = await customerSupportService.replyTicket(
        activeTicket.id || activeTicket._id,
        replyText
      );
      setActiveTicket(res.data);
      setReplyText('');
      fetchTickets();
    } catch (err) {
      console.error('Failed to send reply:', err);
    } finally {
      setIsSendingReply(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 py-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="text-2xl">🛟</span>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Customer Helpdesk & Support
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Need help with workflows, integrations, or SAML SSO? Submit an inquiry to the platform engineering team.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 transition flex items-center space-x-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Open New Ticket</span>
        </button>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Tickets List */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Clock className="w-8 h-8 animate-spin mx-auto text-indigo-500 opacity-60" />
            <p className="text-xs">Loading support requests...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-16 text-center text-slate-400 space-y-3">
            <div className="text-4xl">🎫</div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No Support Tickets</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Everything is running smoothly! If you encounter any issues, open a ticket above.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {tickets.map((t) => (
              <div
                key={t.id || t._id}
                onClick={() => setActiveTicket(t)}
                className="p-5 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition cursor-pointer flex items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      {t.ticketCode}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        t.status === 'resolved'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300'
                      }`}
                    >
                      {t.status}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      {t.category}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {t.subject}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                    {t.description}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[11px] text-slate-400 block font-mono">
                    {new Date(t.createdAt).toLocaleDateString()}
                  </span>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline mt-1 inline-block">
                    View Thread ({t.messages?.length || 1}) →
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Ticket Modal */}
      {isModalOpen && (
        <AnimatePresence>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            >
              <form onSubmit={handleCreateTicket}>
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                      <LifeBuoy className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Open Support Ticket
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 space-y-4 text-xs">
                  {formError && (
                    <div className="p-3 rounded-xl bg-rose-50 text-rose-700 font-semibold">
                      {formError}
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">
                      Subject <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Issue configuring AWS S3 bucket"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 dark:text-slate-300">
                        Category
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-medium"
                      >
                        <option value="technical">Technical Support</option>
                        <option value="billing">Billing & Plans</option>
                        <option value="feature_request">Feature Request</option>
                        <option value="general">General Inquiry</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 dark:text-slate-300">
                        Priority
                      </label>
                      <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-medium"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">
                      Description <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={4}
                      required
                      placeholder="Please provide details, steps to reproduce, or requirements..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-medium"
                    />
                  </div>
                </div>

                <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Support Request'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </AnimatePresence>
      )}

      {/* Ticket Conversation Drawer */}
      {activeTicket && (
        <AnimatePresence>
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/50 backdrop-blur-xs">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="w-full max-w-xl h-full bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between overflow-hidden"
            >
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40 shrink-0">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      {activeTicket.ticketCode}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                      {activeTicket.status}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                    {activeTicket.subject}
                  </h3>
                </div>

                <button
                  onClick={() => setActiveTicket(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Message Thread */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {activeTicket.messages?.map((msg, idx) => {
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
                          {isAdmin && <span className="text-[9px] uppercase font-bold text-indigo-600 bg-indigo-100 dark:bg-indigo-900 px-1.5 rounded">Platform Support</span>}
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

              {/* Reply Box */}
              <form onSubmit={handleSendReply} className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-3 shrink-0">
                <textarea
                  rows={3}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Reply to platform support..."
                  className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSendingReply || !replyText.trim()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSendingReply ? 'Sending...' : 'Send Message'}</span>
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

export default SupportPage;
