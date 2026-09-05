import React, { useState, useEffect } from 'react';
import { Users, Github, Linkedin, Code, ShieldCheck, Sparkles, Plus, Edit2, Check } from 'lucide-react';

export default function TeamSection() {
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedGroupName, setEditedGroupName] = useState('');

  const AUTH_TOKEN = "wednesday-secret-local-handshake-token-2026";
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/team`, {
        headers: { 'x-wednesday-handshake': AUTH_TOKEN }
      });
      const data = await res.json();
      if (data.success && data.team) {
        setTeam(data.team);
        setEditedGroupName(data.team.groupName || '');
      }
    } catch (e) {
      console.error("Failed to fetch team details:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTeamName = async () => {
    if (!team) return;
    const updatedTeam = { ...team, groupName: editedGroupName };
    try {
      const res = await fetch(`${API_BASE}/team`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-wednesday-handshake': AUTH_TOKEN
        },
        body: JSON.stringify(updatedTeam)
      });
      const data = await res.json();
      if (data.success) {
        setTeam(data.team);
        setIsEditing(false);
      }
    } catch (e) {
      console.error("Failed to update team:", e);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mr-3"></div>
        Loading team profiles...
      </div>
    );
  }

  if (!team) return null;

  return (
    <div className="h-full overflow-y-auto p-6 bg-slate-950 text-slate-100 custom-scrollbar">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header Banner */}
        <div className="relative rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border border-cyan-500/20 p-8 shadow-2xl overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <img 
                src={team.logoUrl} 
                alt="Group Logo" 
                className="w-20 h-20 rounded-2xl object-cover border-2 border-cyan-400/40 shadow-lg shadow-cyan-500/10"
              />
              <div>
                <div className="flex items-center gap-3">
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <input 
                        type="text"
                        value={editedGroupName}
                        onChange={(e) => setEditedGroupName(e.target.value)}
                        className="bg-slate-900 border border-cyan-500/50 text-xl font-bold px-3 py-1 rounded text-cyan-300 focus:outline-none"
                      />
                      <button 
                        onClick={handleSaveTeamName}
                        className="p-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition"
                      >
                        <Check size={16} />
                      </button>
                    </div>
                  ) : (
                    <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-300">
                      {team.groupName}
                    </h1>
                  )}
                  {!isEditing && (
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="p-1.5 text-slate-400 hover:text-cyan-400 transition"
                      title="Edit Group Name"
                    >
                      <Edit2 size={16} />
                    </button>
                  )}
                </div>
                <p className="text-sm text-slate-300 mt-2 max-w-xl">
                  {team.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur border border-slate-800 px-4 py-3 rounded-xl">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <div>
                <div className="text-xs text-slate-400">Total Members</div>
                <div className="text-lg font-bold text-slate-100">{team.members.length} Core Engineers</div>
              </div>
            </div>
          </div>
        </div>

        {/* Member Cards Grid */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-200">
              <Users className="w-5 h-5 text-cyan-400" />
              Our Engineering Team
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {team.members.map((member) => (
              <div 
                key={member.id}
                className="group relative bg-slate-900/60 border border-slate-800/80 hover:border-cyan-500/40 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/5 hover:-translate-y-1"
              >
                <div className="flex flex-col items-center text-center">
                  <img 
                    src={member.avatar} 
                    alt={member.name}
                    className="w-24 h-24 rounded-full object-cover border-2 border-cyan-500/30 group-hover:border-cyan-400 shadow-md mb-4 transition"
                  />
                  <h3 className="text-lg font-bold text-slate-100 group-hover:text-cyan-300 transition">
                    {member.name}
                  </h3>
                  <div className="text-xs font-medium text-cyan-400 bg-cyan-950/60 border border-cyan-800/40 px-3 py-1 rounded-full mt-1 mb-4">
                    {member.role}
                  </div>

                  {/* Skills Pills */}
                  <div className="flex flex-wrap justify-center gap-1.5 mb-6">
                    {member.skills.map((skill, idx) => (
                      <span 
                        key={idx}
                        className="text-[11px] bg-slate-800/80 text-slate-300 px-2.5 py-0.5 rounded-md border border-slate-700/50"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  {/* Social Links */}
                  <div className="flex items-center gap-3 pt-4 border-t border-slate-800/60 w-full justify-center text-slate-400">
                    <a 
                      href={member.github} 
                      target="_blank" 
                      rel="noreferrer"
                      className="hover:text-cyan-400 transition"
                    >
                      <Github size={18} />
                    </a>
                    <a 
                      href={member.linkedin} 
                      target="_blank" 
                      rel="noreferrer"
                      className="hover:text-cyan-400 transition"
                    >
                      <Linkedin size={18} />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
