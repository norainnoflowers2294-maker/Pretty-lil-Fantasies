import { resolveImageUrl } from '../utils/imageUrl';
import React from 'react';
import { Bell, Cloud, GitBranch, Heart, Music2, Search, Wifi, WifiOff } from 'lucide-react';
import { ConnectionDiagnostic } from '../types/roleplay';

interface ColorPopHeaderActionsProps {
  diagnostic: ConnectionDiagnostic;
  firebaseConnected: boolean;
  onOpenSettings: () => void;
  onOpenSearch: () => void;
  onOpenFavorites: () => void;
  onOpenGitPush: () => void;
  onOpenYouTubePlayer: () => void;
  userAvatar?: string;
  userName?: string;
}

export const ColorPopHeader: React.FC = () => (
  <header className="cp-brand-header relative z-30 w-full px-4 pb-2" style={{ paddingTop: "max(calc(env(safe-area-inset-top, 0px) + 8px), 16px)" }}>
    <div className="cp-brand-logo flex w-full items-center justify-center">
      <div className="relative flex min-w-0 items-center justify-center">
        <h1 className="whitespace-nowrap text-center font-black italic tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#8f204f] via-[#de4b87] to-[#8f204f]">
          Pretty Little Fantasies
        </h1>
        <span className="pointer-events-none absolute -right-4 top-0 text-[#d94e8d]" aria-hidden="true">✦</span>
      </div>
    </div>
  </header>
);

export const ColorPopHeaderActions: React.FC<ColorPopHeaderActionsProps> = ({
  diagnostic, firebaseConnected, onOpenSettings, onOpenSearch, onOpenFavorites,
  onOpenGitPush, onOpenYouTubePlayer, userAvatar = '/colorpop_hero.jpg', userName = 'The Muse',
}) => {
  const isConnected = diagnostic.status === 'connected';
  const label = isConnected ? 'OpenRouter Connected' : diagnostic.status === 'error' ? 'Connection Issue' : 'Setup OpenRouter';
  return (
    <div className="cp-top-actions flex shrink-0 items-center gap-1.5">
      <button type="button" onClick={onOpenFavorites} className="cp-top-action" title="Notifications & Activity" aria-label="Notifications & Activity"><Bell className="h-4 w-4" /><span className="cp-notification-dot" /></button>
      <button type="button" onClick={onOpenFavorites} className="cp-top-action" title="Favorites" aria-label="Favorites"><Heart className="h-4 w-4" /></button>
      <button type="button" onClick={onOpenGitPush} className="cp-top-action" title="Sync GitHub" aria-label="Sync GitHub"><GitBranch className="h-4 w-4" /></button>
      <button type="button" onClick={onOpenSettings} className="cp-top-action cp-status-action" title={label} aria-label={label}>{isConnected ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}</button>
      <button type="button" onClick={onOpenYouTubePlayer} className="cp-top-action" title="Open YouTube playlist" aria-label="Open YouTube playlist"><Music2 className="h-4 w-4" /></button>
      <button type="button" onClick={onOpenSearch} className="cp-top-action" title="Search characters, lore, and chats" aria-label="Search characters, lore, and chats"><Search className="h-4 w-4" /></button>
      <button type="button" onClick={onOpenSettings} className="cp-top-action cp-avatar-action" title={`${userName} settings`} aria-label={`${userName} settings`}>
        <img src={resolveImageUrl(userAvatar)} alt="" className="h-7 w-7 rounded-full object-cover" />
        {firebaseConnected && <Cloud className="cp-cloud-indicator h-3 w-3" aria-label="Firebase Cloud Synced" />}
      </button>
    </div>
  );
};
