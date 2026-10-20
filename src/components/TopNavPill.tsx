import React from 'react';
import {
  Home,
  MessageSquare,
  Users,
  BookOpen,
  UserCheck,
  MoreHorizontal,
  Image,
  Sparkles,
  FolderOpen,
  NotebookPen,
  ShoppingBag,
  Clock3,
  WandSparkles,
} from 'lucide-react';

export type NavTab = 'home' | 'chats' | 'characters' | 'lorebooks' | 'personas' | 'gallery' | 'files' | 'perchance' | 'social' | 'journal' | 'marketplace' | 'memory-map' | 'creative' | 'more';

interface TopNavPillProps {
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
  onOpenMoreMenu: () => void;
  utilityActions?: React.ReactNode;
}

export const TopNavPill: React.FC<TopNavPillProps> = ({
  activeTab,
  onChangeTab,
  onOpenMoreMenu,
  utilityActions,
}) => {
  const tabs: Array<{ id: NavTab; label: string; icon: React.ReactNode }> = [
    { id: 'home', label: 'Home', icon: <Home className="w-4 h-4" /> },
    { id: 'chats', label: 'Chats', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'characters', label: 'Characters', icon: <Users className="w-4 h-4" /> },
    { id: 'lorebooks', label: 'Lorebooks', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'personas', label: 'Personas', icon: <UserCheck className="w-4 h-4" /> },
    { id: 'gallery', label: 'Gallery', icon: <Image className="w-4 h-4" /> },
    { id: 'creative', label: 'Creative Studio', icon: <WandSparkles className="w-4 h-4" /> },
    { id: 'files', label: 'Files', icon: <FolderOpen className="w-4 h-4" /> },
    { id: 'journal', label: 'Journal', icon: <NotebookPen className="w-4 h-4" /> },
    { id: 'marketplace', label: 'Marketplace', icon: <ShoppingBag className="w-4 h-4" /> },
    { id: 'memory-map', label: 'Memory Map', icon: <Clock3 className="w-4 h-4" /> },
    { id: 'perchance', label: 'Perchance AI', icon: <Sparkles className="w-4 h-4" /> },
  ];

  return (
    <nav className="plf-top-navigation shrink-0 w-max max-w-none overflow-visible px-0 py-0">
      <div className="plf-top-navigation-track flex w-max items-center gap-1.5 rounded-full border border-[#ef9dbd]/55 bg-white/70 p-1.5 shadow-[0_8px_22px_rgba(130,45,78,.14)] backdrop-blur-xl">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-[#ff007f] to-[#ff3399] text-white shadow-[0_0_20px_rgba(255,0,128,0.7)] scale-[1.02]'
                  : 'text-[#ffb3d9]/80 hover:text-white hover:bg-[#2a0820]/60'
              }`}
            >
              {tab.icon}
              <span className="hidden xs:inline sm:inline">{tab.label}</span>
            </button>
          );
        })}

        <button
          onClick={onOpenMoreMenu}
          className={`flex items-center space-x-1 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'more'
              ? 'bg-gradient-to-r from-[#ff007f] to-[#ff3399] text-white shadow-[0_0_20px_rgba(255,0,128,0.7)]'
              : 'text-[#ffb3d9]/80 hover:text-white hover:bg-[#2a0820]/60'
          }`}
          title="More options (Plugins, Settings, GitHub)"
        >
          <MoreHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">More</span>
        </button>
        {utilityActions && <div className="plf-top-utility-actions ml-1 flex shrink-0 items-center border-l border-[#cf7d9d]/35 pl-1.5">{utilityActions}</div>}
      </div>
    </nav>
  );
};
