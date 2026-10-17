import React, { useState } from 'react';
import {
  X,
  Puzzle,
  Heart,
  Briefcase,
  CloudMoon,
  Dices,
  Sparkles,
  Check,
  Plus,
  Sliders,
} from 'lucide-react';
import { Plugin } from '../types/roleplay';

interface PluginModalProps {
  isOpen: boolean;
  onClose: () => void;
  plugins: Plugin[];
  onTogglePlugin: (pluginId: string) => void;
  onSavePlugin: (plugin: Plugin) => void;
}

export const PluginModal: React.FC<PluginModalProps> = ({
  isOpen,
  onClose,
  plugins,
  onTogglePlugin,
  onSavePlugin,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingPluginId, setEditingPluginId] = useState<string | null>(null);
  const [promptDraft, setPromptDraft] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [category, setCategory] = useState<'mechanics' | 'immersion' | 'utility' | 'style' | 'analysis'>('immersion');

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newPlugin: Plugin = {
      id: `plugin_${Date.now()}`,
      name: name.trim(),
      icon: 'Puzzle',
      description: description.trim(),
      category,
      enabled: false,
      config: {},
      customPrompt: customPrompt.trim(),
    };

    onSavePlugin(newPlugin);
    setIsCreating(false);
    setName('');
    setDescription('');
    setCustomPrompt('');
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Heart':
        return <Heart className="w-5 h-5 text-rose-400 fill-rose-500/30" />;
      case 'Briefcase':
        return <Briefcase className="w-5 h-5 text-amber-400" />;
      case 'CloudMoon':
        return <CloudMoon className="w-5 h-5 text-sky-400" />;
      case 'Dices':
        return <Dices className="w-5 h-5 text-emerald-400" />;
      case 'Sparkles':
        return <Sparkles className="w-5 h-5 text-fuchsia-400" />;
      default:
        return <Puzzle className="w-5 h-5 text-indigo-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-[#140410] border-2 border-[#ff3399]/60 rounded-3xl shadow-[0_0_50px_rgba(255,0,128,0.5)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#ff3399]/30 bg-[#0d020b]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#00b4db] to-[#0083b0] flex items-center justify-center text-white shadow-[0_0_15px_rgba(0,180,219,0.5)]">
              <Puzzle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">Plugin Studio &amp; Library</h2>
              <p className="text-xs text-[#ffd6eb]/70">
                Independent, editable prompt rules; enable only the ones you want
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsCreating(!isCreating)}
              className="px-3.5 py-1.5 bg-gradient-to-r from-[#ff007f] to-[#ff3399] text-white text-xs font-bold rounded-xl shadow-md flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isCreating ? 'View Plugins' : 'New Plugin'}</span>
            </button>
            <button onClick={onClose} className="p-1.5 text-[#ffd6eb]/70 hover:text-white rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs text-[#ffd6eb]">
          {isCreating ? (
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1">
                <label className="font-bold text-white">Plugin Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Relationship Affinity Meter, Soundscape Generator..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-[#1e0818] border border-[#ff3399]/40 rounded-xl px-3.5 py-2 text-xs text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-white">Description</label>
                <input
                  type="text"
                  maxLength={240}
                  placeholder="What does this plugin do in chat?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#1e0818] border border-[#ff3399]/40 rounded-xl px-3.5 py-2 text-xs text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-white" htmlFor="new-plugin-category">Category</label>
                <select id="new-plugin-category" value={category} onChange={(event) => setCategory(event.target.value as typeof category)} className="w-full rounded-xl border border-[#ff3399]/40 bg-[#1e0818] px-3.5 py-2 text-xs text-white">
                  <option value="immersion">Personality &amp; immersion</option><option value="analysis">Continuity &amp; story logic</option><option value="style">Writing style</option><option value="mechanics">Mechanics</option><option value="utility">Utility</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="font-bold text-white">Custom prompt</label>
                <textarea
                  rows={4}
                  maxLength={1200}
                  placeholder="Short rules to combine with other enabled plugins..."
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  className="w-full bg-[#1e0818] border border-[#ff3399]/40 rounded-xl p-3 text-xs text-white resize-none font-mono"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-[#ff3399]/20">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 bg-white/10 rounded-xl text-white font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-[#ff007f] to-[#ff3399] rounded-xl text-white font-bold shadow-md"
                >
                  Save Plugin
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-[#ffd6eb]/70 pb-1">
                <span>Enabled plugins: {plugins.filter((p) => p.enabled).length} · prompts are combined compactly</span>
                <input aria-label="Search plugins" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search plugin names or descriptions" className="w-full sm:w-64 rounded-xl border border-[#ff3399]/30 bg-[#1e0818] px-3 py-2 text-xs text-white placeholder:text-white/40" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {plugins.filter((plugin) => `${plugin.name} ${plugin.description} ${plugin.category}`.toLowerCase().includes(searchTerm.toLowerCase())).map((plugin) => (
                  <div
                    key={plugin.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                      plugin.enabled
                        ? 'bg-[#ff007f]/15 border-[#ff007f] shadow-[0_0_15px_rgba(255,0,128,0.3)]'
                        : 'bg-[#1a0515] border-[#ff3399]/20 opacity-70'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-9 h-9 rounded-xl bg-black/40 border border-white/20 flex items-center justify-center">
                            {getIcon(plugin.icon)}
                          </div>
                          <div>
                            <h4 className="font-bold text-white text-sm">{plugin.name}</h4>
                            <span className="text-[10px] font-mono uppercase text-[#ff99cc]">
                              {plugin.category}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          aria-pressed={plugin.enabled}
                          aria-label={`${plugin.enabled ? 'Disable' : 'Enable'} ${plugin.name}`}
                          onClick={() => onTogglePlugin(plugin.id)}
                          className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                            plugin.enabled
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-white/10 text-white/60 hover:text-white'
                          }`}
                        >
                          {plugin.enabled ? 'Active' : 'Disabled'}
                        </button>
                      </div>

                      <p className="text-xs text-[#ffd6eb]/80 leading-relaxed">{plugin.description}</p>
                      {editingPluginId === plugin.id ? (
                        <div className="space-y-2 pt-2">
                          <label className="block font-bold text-white" htmlFor={`plugin-prompt-${plugin.id}`}>Editable prompt</label>
                          <textarea id={`plugin-prompt-${plugin.id}`} maxLength={1200} rows={4} value={promptDraft} onChange={(event) => setPromptDraft(event.target.value)} className="w-full rounded-xl border border-[#ff3399]/40 bg-black/40 p-3 text-xs leading-relaxed text-white" />
                          <p className="text-[10px] text-white/50">{promptDraft.length}/1200 characters · saved with app settings</p>
                          <div className="flex gap-2">
                            <button type="button" onClick={() => { onSavePlugin({ ...plugin, customPrompt: promptDraft.trim() }); setEditingPluginId(null); }} className="rounded-lg bg-emerald-600/80 px-3 py-2 font-bold text-white">Save prompt</button>
                            <button type="button" onClick={() => setEditingPluginId(null)} className="rounded-lg bg-white/10 px-3 py-2 font-bold text-white">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <button type="button" onClick={() => { setEditingPluginId(plugin.id); setPromptDraft(plugin.customPrompt || ''); }} className="mt-2 text-left text-[11px] font-bold text-[#8AABF4] underline underline-offset-2">Edit prompt</button>
                      )}
                    </div>

                    {plugin.badge && (
                      <div className="pt-2 mt-2 border-t border-white/10 flex items-center justify-between text-[10px]">
                        <span className="text-[#ffd6eb]/60">Live Output:</span>
                        <span className="font-mono text-[#ff80bf] font-bold">{plugin.badge}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
