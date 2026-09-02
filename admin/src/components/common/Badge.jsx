import React from 'react';
import { ShieldCheck, Store, Building2, User, Clock, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

/**
 * Role Badge (Solid style with distinct enterprise colors)
 */
export const RoleBadge = ({ role }) => {
  const r = (role || 'owner').toLowerCase();

  switch (r) {
    case 'admin':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide bg-purple-50 text-purple-700 border border-purple-200/80 shadow-xs">
          <ShieldCheck className="w-3 h-3 text-purple-600 fill-purple-200" />
          Admin
        </span>
      );
    case 'distributor':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide bg-amber-50 text-amber-800 border border-amber-200/80 shadow-xs">
          <Building2 className="w-3 h-3 text-amber-600 fill-amber-200" />
          Distributor
        </span>
      );
    case 'reseller':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-xs">
          <Store className="w-3 h-3 text-emerald-600 fill-emerald-200" />
          Reseller
        </span>
      );
    case 'owner':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide bg-sky-50 text-sky-800 border border-sky-200/80 shadow-xs">
          <User className="w-3 h-3 text-sky-600 fill-sky-200" />
          Owner
        </span>
      );
  }
};

/**
 * Enquiry Status Badge
 */
export const StatusBadge = ({ status }) => {
  const s = (status || 'pending').toLowerCase();

  switch (s) {
    case 'resolved':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
          <CheckCircle2 className="w-3 h-3 text-emerald-600 fill-emerald-100" />
          Resolved
        </span>
      );
    case 'in progress':
    case 'inprogress':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide bg-blue-50 text-blue-700 border border-blue-200 shadow-xs">
          <Clock className="w-3 h-3 text-blue-600 animate-spin" />
          In Progress
        </span>
      );
    case 'closed':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide bg-slate-100 text-slate-700 border border-slate-200 shadow-xs">
          <XCircle className="w-3 h-3 text-slate-500 fill-slate-200" />
          Closed
        </span>
      );
    case 'pending':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide bg-rose-50 text-rose-700 border border-rose-200 shadow-xs">
          <AlertCircle className="w-3 h-3 text-rose-600 fill-rose-100" />
          Pending
        </span>
      );
  }
};

export default { RoleBadge, StatusBadge };
