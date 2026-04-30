'use client';

import { useState } from 'react';

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('general');

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-slate-900">Site Settings</h3>
        <p className="text-slate-500">Configure global parameters and platform-wide features.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex min-h-[500px]">
        {/* Settings Nav */}
        <aside className="w-64 border-r border-slate-100 p-4 space-y-1">
          <SettingsTab active={activeTab === 'general'} onClick={() => setActiveTab('general')} icon="settings" label="General" />
          <SettingsTab active={activeTab === 'security'} onClick={() => setActiveTab('security')} icon="shield" label="Security" />
          <SettingsTab active={activeTab === 'content'} onClick={() => setActiveTab('content')} icon="article" label="Content Tags" />
          <SettingsTab active={activeTab === 'notifications'} onClick={() => setActiveTab('notifications')} icon="notifications" label="Notifications" />
        </aside>

        {/* Settings Content */}
        <div className="flex-1 p-8">
           {activeTab === 'general' && (
             <div className="max-w-xl space-y-6">
                <h4 className="font-bold text-slate-900">General Configuration</h4>
                <div className="space-y-4">
                  <InputGroup label="Site Name" value="WebTravel" />
                  <InputGroup label="Contact Email" value="support@webtravel.com" />
                  <div className="pt-4">
                    <button className="bg-rose-500 text-white px-8 py-2 rounded-xl font-bold shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all">Save Changes</button>
                  </div>
                </div>
             </div>
           )}
           {activeTab !== 'general' && (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <span className="material-symbols-outlined text-5xl mb-2">construction</span>
                <p className="font-medium">Under Construction</p>
              </div>
           )}
        </div>
      </div>
    </div>
  );
}

function SettingsTab({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: string, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium
        ${active ? 'bg-rose-50 text-rose-600' : 'text-slate-600 hover:bg-slate-50'}`}
    >
      <span className="material-symbols-outlined text-xl">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function InputGroup({ label, value }: { label: string, value: string }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</label>
      <input type="text" defaultValue={value} className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 transition-all text-sm" />
    </div>
  );
}
