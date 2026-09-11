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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted, #94a3b8)', gap: '10px' }}>
        <div className="animate-spin" style={{ width: '24px', height: '24px', borderRadius: '50%', border: '2px solid var(--border-subtle)', borderTopColor: 'var(--accent-primary, #3b82f6)' }} />
        <span>Loading team profiles...</span>
      </div>
    );
  }

  if (!team) return null;

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '32px 24px', background: 'var(--bg-primary, #0b0f19)', color: 'var(--text-main, #f8fafc)' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* Header Banner */}
        <div style={{
          position: 'relative',
          borderRadius: '16px',
          background: 'var(--bg-card, #131b2e)',
          border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.12))',
          padding: '28px',
          boxShadow: 'var(--shadow-sm, 0 4px 16px rgba(0,0,0,0.25))',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <img 
                src={team.logoUrl} 
                alt="Group Logo" 
                style={{ width: '68px', height: '68px', borderRadius: '14px', objectFit: 'cover', border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.12))' }}
              />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {isEditing ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input 
                        type="text"
                        value={editedGroupName}
                        onChange={(e) => setEditedGroupName(e.target.value)}
                        style={{ background: 'var(--bg-input, rgba(0,0,0,0.3))', border: '1px solid var(--accent-primary, #3b82f6)', fontSize: '1.25rem', fontWeight: 700, padding: '4px 10px', borderRadius: '8px', color: 'var(--text-main, #f8fafc)', outline: 'none' }}
                      />
                      <button 
                        onClick={handleSaveTeamName}
                        className="btn-primary"
                        style={{ padding: '6px 12px' }}
                      >
                        <Check size={16} />
                      </button>
                    </div>
                  ) : (
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.3px', margin: 0, color: 'var(--text-main, #f8fafc)' }}>
                      {team.groupName}
                    </h1>
                  )}
                  {!isEditing && (
                    <button 
                      onClick={() => setIsEditing(true)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted, #94a3b8)', cursor: 'pointer', padding: '4px' }}
                      title="Edit Group Name"
                    >
                      <Edit2 size={15} />
                    </button>
                  )}
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #94a3b8)', margin: '6px 0 0 0', maxWidth: '600px', lineHeight: 1.5 }}>
                  {team.description}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-secondary, #0e1526)', border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))', padding: '12px 18px', borderRadius: '12px' }}>
              <Sparkles size={18} color="var(--accent-warning, #f59e0b)" />
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #94a3b8)' }}>Total Members</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main, #f8fafc)' }}>
                  {team.members.length} {team.members.length === 1 ? 'Core Engineer' : 'Core Engineers'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Member Cards Grid */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', margin: 0, color: 'var(--text-main, #f8fafc)' }}>
              <Users size={18} color="var(--accent-primary, #3b82f6)" />
              {team.members.length === 1 ? 'Founder & Lead Creator' : 'Our Engineering Team'}
            </h2>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: team.members.length === 1 ? 'minmax(320px, 460px)' : 'repeat(auto-fit, minmax(280px, 1fr))', 
            justifyContent: team.members.length === 1 ? 'center' : 'stretch',
            gap: '20px' 
          }}>
            {team.members.map((member) => (
              <div 
                key={member.id}
                style={{
                  background: 'var(--bg-card, #131b2e)',
                  border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
                  borderRadius: '16px',
                  padding: '28px 24px',
                  boxShadow: 'var(--shadow-md, 0 4px 20px rgba(0,0,0,0.3))',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  transition: 'transform 0.15s ease, border-color 0.15s ease'
                }}
              >
                <div style={{ position: 'relative', marginBottom: '16px' }}>
                  <img 
                    src={member.avatar} 
                    alt={member.name}
                    style={{ 
                      width: '108px', 
                      height: '108px', 
                      borderRadius: '50%', 
                      objectFit: 'cover', 
                      border: '2px solid rgba(56, 189, 248, 0.35)', 
                      boxShadow: '0 4px 18px rgba(0, 0, 0, 0.45)' 
                    }}
                  />
                  <span style={{
                    position: 'absolute',
                    bottom: '4px',
                    right: '4px',
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    background: 'var(--accent-emerald, #10b981)',
                    border: '2px solid var(--bg-card, #131b2e)'
                  }} title="Active & Online" />
                </div>

                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-main, #f8fafc)', letterSpacing: '-0.2px' }}>
                  {member.name}
                </h3>
                <div style={{ 
                  fontSize: '0.78rem', 
                  fontWeight: 600, 
                  color: '#38bdf8', 
                  background: 'rgba(56, 189, 248, 0.12)', 
                  border: '1px solid rgba(56, 189, 248, 0.28)', 
                  padding: '4px 12px', 
                  borderRadius: '20px', 
                  marginTop: '8px', 
                  marginBottom: '16px' 
                }}>
                  {member.role}
                </div>

                {/* Skills Pills */}
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '6px', marginBottom: '20px' }}>
                  {member.skills.map((skill, idx) => (
                    <span 
                      key={idx}
                      style={{ 
                        fontSize: '0.74rem', 
                        background: 'var(--bg-secondary, rgba(255,255,255,0.04))', 
                        color: 'var(--text-secondary, #cbd5e1)', 
                        padding: '3px 9px', 
                        borderRadius: '6px', 
                        border: '1px solid var(--border-subtle, rgba(255,255,255,0.06))' 
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                {/* Social Links */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '16px', 
                  paddingTop: '16px', 
                  borderTop: '1px solid var(--border-subtle, rgba(255,255,255,0.06))', 
                  width: '100%', 
                  justifyContent: 'center' 
                }}>
                  {member.github && (
                    <a 
                      href={member.github} 
                      target="_blank" 
                      rel="noreferrer"
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        fontSize: '0.78rem',
                        color: 'var(--text-muted, #94a3b8)', 
                        textDecoration: 'none',
                        transition: 'color 0.15s ease',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-subtle, rgba(255,255,255,0.06))'
                      }}
                      title="GitHub Profile"
                    >
                      <Github size={15} /> GitHub
                    </a>
                  )}
                  {member.linkedin && (
                    <a 
                      href={member.linkedin} 
                      target="_blank" 
                      rel="noreferrer"
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        fontSize: '0.78rem',
                        color: '#38bdf8', 
                        textDecoration: 'none',
                        transition: 'color 0.15s ease',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        background: 'rgba(56, 189, 248, 0.08)',
                        border: '1px solid rgba(56, 189, 248, 0.2)'
                      }}
                      title="LinkedIn Profile"
                    >
                      <Linkedin size={15} /> LinkedIn
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
