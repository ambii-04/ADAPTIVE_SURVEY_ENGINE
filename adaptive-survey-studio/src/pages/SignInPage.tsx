import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, ShieldCheck, Key } from 'lucide-react';

export function SignInPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('pratik.mandalkar22@vit.edu');
  const [role, setRole] = useState('Principal Researcher');

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    signIn(email);
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 selection:bg-teal-500 selection:text-white">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 p-8 shadow-2xl space-y-6">
        {/* Brand Lockup */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-white p-1 border border-slate-200 shadow-xs mx-auto flex items-center justify-center">
            <img
              src="/src/assets/images/logo.png"
              alt="Dentsu Organisation Logo"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Dentsu Research Studio
          </h1>
          <p className="text-xs text-slate-500">
            Private Research Owner Console · Dentsu Organisation
          </p>
        </div>

        {/* Demo Mode Notice */}
        <div className="p-3 bg-teal-50/70 border border-teal-200/80 rounded-lg flex items-start gap-2.5 text-xs text-teal-950">
          <ShieldCheck className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" />
          <p className="leading-relaxed text-[11px] text-slate-700">
            <strong>Authenticated Demo Environment:</strong> Route guards protect all administrative pipelines. Sign in below to manage studies and view response analytics.
          </p>
        </div>

        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Researcher Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 text-slate-900 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Assigned Role
            </label>
            <input
              type="text"
              readOnly
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-600 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs mt-2"
          >
            <Key className="w-3.5 h-3.5 text-teal-400" />
            <span>Enter Research Console</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="pt-2 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400">
            Respondents access surveys directly at <code className="font-mono text-slate-600">/s/:researchId</code> without sign-in.
          </p>
        </div>
      </div>
    </div>
  );
}
