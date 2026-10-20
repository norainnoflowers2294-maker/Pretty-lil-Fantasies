import { CloudLoginScreen } from './components/CloudLoginScreen';
import { normalizePreferences, downloadJson, type AppPreferences } from './lib/preferences';
import './components/preferences.css';
import { testOpenRouterConnection } from './lib/openrouter';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { ColorPopHeader, ColorPopHeaderActions } from './components/ColorPopHeader';
import { TopNavPill, NavTab } from './components/TopNavPill';
import { AppDrawers } from './components/AppDrawers';
import { DailyPromptHub } from './components/DailyPromptHub';
import { BotStudioModal } from './components/BotStudioModal';
import { ActionCards } from './components/ActionCards';
import { CategoryPills, CategoryFilter } from './components/CategoryPills';
import { RecentChatsSection } from './components/RecentChatsSection';
import { ChatsLibraryView } from './components/ChatsLibraryView';
import { CharacterMarketplaceView } from './components/CharacterMarketplaceView';
import { StoryMemoryMapView } from './components/StoryMemoryMapView';
import { SocialMediaView } from './components/SocialMediaView';
import { ChatView } from './components/ChatView';
import { YouTubePlaylistPlayer } from './components/YouTubePlaylistPlayer';
import { CharacterModal } from './components/CharacterModal';
import { CreateCharacterView } from './components/CreateCharacterView';
import { LorebookModal } from './components/LorebookModal';
import { PersonaModal } from './components/PersonaModal';
import { PersonaCreatorView } from './components/PersonaCreatorView';
import { PersonaLibraryView } from './components/PersonaLibraryView';
import { PerchanceView } from './components/PerchanceView';
import { PluginModal } from './components/PluginModal';
import { OpenRouterSettingsModal } from './components/OpenRouterSettingsModal';
import { StoryNotesModal } from './components/StoryNotesModal';
import { SavedMessagesModal } from './components/SavedMessagesModal';
import { SceneGeneratorModal } from './components/SceneGeneratorModal';
import { FileKeeperView } from './components/FileKeeperView';
import CreativeStudioView, { type CreativeSection } from './components/CreativeStudioView';
import { JournalView } from './components/JournalView';
import { GitHubSyncModal } from './components/GitHubSyncModal';
import { DualTrackOverlay } from './components/DualTrackOverlay';
import { Columns, House, MessageCircle, Plus, UserRound } from 'lucide-react';
import { WalletModal } from './components/WalletModal';
import { CharacterPhoneModal } from './components/CharacterPhoneModal';
import { formatWalletMoney, getWalletForScope, recordIncomingTransfer, type StoryWallet, type StoryWalletTransaction } from './lib/wallet';
import { DEFAULT_SOCIAL_WORLD, formatSocialWorldContext } from './lib/socialMedia';
import { formatPhoneStoryContext, mergePhoneSystemData } from './lib/phoneSystem';
import { mergeStoryMemories } from './lib/storyMemory';
import { mergeDefaultPlugins } from './lib/defaultData';

import {
  Character,
  Lorebook,
  Persona,
  Plugin,
  Chat,
  ChatMessage,
  OpenRouterConfig,
  ConnectionDiagnostic,
  StoryMemory,
} from './types/roleplay';
import type { JournalPage } from './types/journal';
import {
  loadLocalData,
  loadLocalDataAsync,
  getLocalDataSavedAt,
  shouldPreferFirebaseSnapshot,
  saveLocalData,
  syncToFirebase,
  loadFromFirebase,
  mergeDefaultCharacters,
  StorageData,
} from './lib/storage';
import { auth } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';



const FloatingBubbles: React.FC = () => {
  const particles = [
    { kind: 'bubble', path: 'a', size: 82, left: '8%', top: '18%', delay: '-3s', duration: '19s' },
    { kind: 'pearl', path: 'b', size: 46, left: '21%', top: '76%', delay: '-11s', duration: '23s' },
    { kind: 'bubble', path: 'c', size: 68, left: '89%', top: '27%', delay: '-12s', duration: '21s' },
    { kind: 'pearl', path: 'd', size: 54, left: '78%', top: '62%', delay: '-6s', duration: '25s' },
    { kind: 'bubble', path: 'b', size: 76, left: '14%', top: '57%', delay: '-8s', duration: '20s' },
    { kind: 'pearl', path: 'a', size: 42, left: '93%', top: '83%', delay: '-15s', duration: '22s' },
    { kind: 'bubble', path: 'd', size: 64, left: '72%', top: '88%', delay: '-5s', duration: '18s' },
    { kind: 'pearl', path: 'c', size: 50, left: '4%', top: '38%', delay: '-17s', duration: '24s' },
    { kind: 'bubble', path: 'c', size: 88, left: '48%', top: '12%', delay: '-9s', duration: '22s' },
    { kind: 'pearl', path: 'a', size: 48, left: '56%', top: '35%', delay: '-13s', duration: '26s' },
    { kind: 'bubble', path: 'a', size: 72, left: '34%', top: '68%', delay: '-7s', duration: '18s' },
    { kind: 'pearl', path: 'd', size: 56, left: '63%', top: '84%', delay: '-2s', duration: '23s' },
    { kind: 'bubble', path: 'b', size: 60, left: '95%', top: '48%', delay: '-16s', duration: '21s' },
    { kind: 'pearl', path: 'c', size: 40, left: '2%', top: '91%', delay: '-5s', duration: '25s' },
    { kind: 'bubble', path: 'd', size: 78, left: '27%', top: '30%', delay: '-10s', duration: '19s' },
    { kind: 'pearl', path: 'b', size: 44, left: '84%', top: '8%', delay: '-19s', duration: '24s' },
  ];

  return (
    <div className="plf-bubbles-layer" aria-hidden="true">
      {particles.map((particle, index) => (
        <span
          key={index}
          className={`plf-floating-${particle.kind} plf-drift-${particle.path}`}
          style={{
            left: particle.left,
            top: particle.top,
            width: particle.size,
            height: particle.size,
            animationDelay: particle.delay,
            animationDuration: particle.duration,
          }}
        />
      ))}
    </div>
  );
};

const QuickBottomToolbar: React.FC<{
  active?: 'characters' | 'create' | 'home' | 'recent';
  onCharacters: () => void;
  onCreate: () => void;
  onHome: () => void;
  onRecent: () => void;
  hasRecentChat: boolean;
}> = ({ active, onCharacters, onCreate, onHome, onRecent, hasRecentChat }) => (
  <nav className="cp-bottom-toolbar" aria-label="Quick navigation">
    <button type="button" onClick={onCharacters} aria-current={active === 'characters' ? 'page' : undefined}>
      <UserRound aria-hidden="true" /><span>My Character</span>
    </button>
    <button type="button" onClick={onCreate} aria-current={active === 'create' ? 'page' : undefined}>
      <Plus aria-hidden="true" /><span>Create</span>
    </button>
    <button type="button" onClick={onHome} aria-current={active === 'home' ? 'page' : undefined}>
      <House aria-hidden="true" /><span>Home</span>
    </button>
    <button type="button" onClick={onRecent} disabled={!hasRecentChat} aria-current={active === 'recent' ? 'page' : undefined}>
      <MessageCircle aria-hidden="true" /><span>Most Recent Chat</span>
    </button>
  </nav>
);

export default function App() {
  const [data, setData] = useState<StorageData>(loadLocalData);
  const dataRef = useRef(data);
  const characterCreateActionRef = useRef<(() => void) | null>(null);
  const [storageHydrated, setStorageHydrated] = useState(false);
  const [firebaseCloudHydrated, setFirebaseCloudHydrated] = useState(false);
  const firebaseCloudReadyRef = useRef(false);
  const firebaseAuthRevisionRef = useRef(0);
  const localSaveRevisionRef = useRef(0);
  const firebaseSyncRevisionRef = useRef(0);
  const firebaseSavedRevisionRef = useRef(0);
  const firebaseSyncQueueRef = useRef<Promise<void>>(Promise.resolve());
  const [firebaseSyncMessage, setFirebaseSyncMessage] = useState('');
  const [firebaseLastSync, setFirebaseLastSync] = useState('');
  const preferences = normalizePreferences(data.appPreferences);
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.cpTheme = preferences.theme;
    root.dataset.cpMotion = preferences.reducedMotion ? 'reduce' : 'normal';
    root.style.setProperty('--cp-accent', preferences.accent);
    root.style.setProperty('--cp-chat-size', `${preferences.fontSize}px`);
    root.style.setProperty('--cp-heading-font', preferences.headerFont === 'cooper' ? "'Cooper Black', 'Cooper Std Black', 'Arial Rounded MT Bold', Georgia, serif" : preferences.headerFont === 'serif' ? 'Georgia, serif' : preferences.headerFont === 'mono' ? 'ui-monospace, monospace' : 'system-ui, sans-serif');
  }, [preferences.theme, preferences.accent, preferences.fontSize, preferences.headerFont, preferences.reducedMotion]);
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [creativeSection, setCreativeSection] = useState<CreativeSection>('browse');
  const [homeImage, setHomeImage] = useState<string>(() => {
    if (data.appPreferences.homeImage) return data.appPreferences.homeImage;
    try { return localStorage.getItem('colorpop_home_picture_v1') || '/colorpop_hero.jpg'; } catch { return '/colorpop_hero.jpg'; }
  });
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [inChatMode, setInChatMode] = useState(false);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);

  // Dedicated Create Character Page State
  const [isCreateCharacterOpen, setIsCreateCharacterOpen] = useState(false);
  const [characterToEdit, setCharacterToEdit] = useState<Character | null>(null);

  // Modals
  const [isCharModalOpen, setIsCharModalOpen] = useState(false);
  const [isLoreModalOpen, setIsLoreModalOpen] = useState(false);
  const [isPersonaModalOpen, setIsPersonaModalOpen] = useState(false);
  const [isPluginModalOpen, setIsPluginModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isStoryNotesOpen, setIsStoryNotesOpen] = useState(false);
  const [isSavedMessagesOpen, setIsSavedMessagesOpen] = useState(false);
  const [isSceneGeneratorOpen, setIsSceneGeneratorOpen] = useState(false);
  const [isGitSyncOpen, setIsGitSyncOpen] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isPhoneOpen, setIsPhoneOpen] = useState(false);
  const [isYouTubePlayerOpen, setIsYouTubePlayerOpen] = useState(false);
  const [isCreatorBotOpen, setIsCreatorBotOpen] = useState(false);
  const [walletView, setWalletView] = useState<'dashboard' | 'activity'>('dashboard');
  const [moneyAlert, setMoneyAlert] = useState<StoryWalletTransaction | null>(null);
  const [moneyCycle, setMoneyCycle] = useState(0);

  // Persona Page & Creator Mode
  const [isPersonaCreatorOpen, setIsPersonaCreatorOpen] = useState(false);
  const [personaToEdit, setPersonaToEdit] = useState<Persona | null>(null);

  // Dual Track Screen State (Left and Right Slide-over Panels)
  const [isDualTrackOpen, setIsDualTrackOpen] = useState(false);

  // Firebase user
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  useEffect(() => {
    if (!firebaseUser) { setFirebaseLastSync(''); return; }
    try { setFirebaseLastSync(localStorage.getItem(`plf_last_firebase_sync:${firebaseUser.uid}`) || ''); } catch { setFirebaseLastSync(''); }
  }, [firebaseUser?.uid]);


  // OpenRouter Connection Diagnostics
  const [diagnostic, setDiagnostic] = useState<ConnectionDiagnostic>({
    status: 'untested',
    lastChecked: null,
  });

  const enqueueFirebaseSync = (snapshot: StorageData): Promise<void> => {
    const revision = ++firebaseSyncRevisionRef.current;
    const operation = firebaseSyncQueueRef.current.catch(() => undefined).then(async () => {
      if (revision !== firebaseSyncRevisionRef.current) return;
      await syncToFirebase(snapshot);
      if (revision === firebaseSyncRevisionRef.current) {
        const syncedAt = new Date().toISOString();
        const userId = auth.currentUser?.uid;
        if (userId) {
          setFirebaseLastSync(syncedAt);
          try { localStorage.setItem(`plf_last_firebase_sync:${userId}`, syncedAt); } catch {}
        }
        setFirebaseSyncMessage('Firebase sync complete · ' + new Date(syncedAt).toLocaleString());
      }
    });
    firebaseSyncQueueRef.current = operation;
    return operation;
  };

  // Save immediately on-device, then serialize Firebase writes so older snapshots
  // cannot finish after and replace a newer conversation.
  const updateData = async (newData: StorageData) => {
    dataRef.current = newData;
    setData(newData);
    const saveRevision = ++localSaveRevisionRef.current;

    try {
      await saveLocalData(newData);
    } catch (error) {
      const message = `Could not save on this device: ${error instanceof Error ? error.message : String(error)}`;
      if (saveRevision === localSaveRevisionRef.current) setFirebaseSyncMessage(message);
      if (auth.currentUser && newData.appPreferences?.cloudSync !== false) {
        try {
          await enqueueFirebaseSync(newData);
          return { localSaved: false, firebaseSaved: true, message: 'Firebase backup saved, but this device could not keep a local copy.' };
        } catch (syncError) {
          const failure = `Device and Firebase saves failed: ${syncError instanceof Error ? syncError.message : String(syncError)}`;
          if (saveRevision === localSaveRevisionRef.current) setFirebaseSyncMessage(failure);
          return { localSaved: false, firebaseSaved: false, message: failure };
        }
      }
      return { localSaved: false, firebaseSaved: false, message };
    }

    if (saveRevision !== localSaveRevisionRef.current) {
      return { localSaved: true, firebaseSaved: false, message: 'Saved on this device. A newer update is being saved.' };
    }
    if (newData.appPreferences?.cloudSync === false) {
      firebaseSyncRevisionRef.current += 1;
      const message = 'Saved on this device. Firebase sync is turned off in App Settings.';
      setFirebaseSyncMessage(message);
      return { localSaved: true, firebaseSaved: false, message };
    }
    if (!auth.currentUser) {
      const message = 'Saved on this device only. Sign in under Settings → Firebase Cloud to back it up.';
      setFirebaseSyncMessage(message);
      return { localSaved: true, firebaseSaved: false, message };
    }

    if (!firebaseCloudReadyRef.current) {
      const message = 'Saved on this device. Firebase is still restoring your cloud backup, so this change is being kept local until it is safe to sync.';
      if (saveRevision === localSaveRevisionRef.current) setFirebaseSyncMessage(message);
      return { localSaved: true, firebaseSaved: false, message };
    }
    setFirebaseSyncMessage('Saving chats and app data to Firebase…');
    try {
      await enqueueFirebaseSync(newData);
      if (saveRevision === localSaveRevisionRef.current) firebaseSavedRevisionRef.current = saveRevision;
      return { localSaved: true, firebaseSaved: true, message: 'Saved on this device and backed up to Firebase.' };
    } catch (error) {
      const message = `Saved on this device, but Firebase could not save the latest changes: ${error instanceof Error ? error.message : String(error)}`;
      if (saveRevision === localSaveRevisionRef.current) setFirebaseSyncMessage(message);
      return { localSaved: true, firebaseSaved: false, message };
    }
  };

  // Retry any pending cloud backup every 30 seconds and when the app is backgrounded.
  // Local changes are already written immediately; this protects against interrupted network writes.
  useEffect(() => {
    if (!storageHydrated) return;

    const flushPendingCloudBackup = () => {
      const user = auth.currentUser;
      const snapshot = dataRef.current;
      const revision = localSaveRevisionRef.current;
      if (!user || !firebaseCloudReadyRef.current || snapshot.appPreferences?.cloudSync === false) return;
      if (revision <= firebaseSavedRevisionRef.current) return;

      void enqueueFirebaseSync(snapshot).then(() => {
        if (revision === localSaveRevisionRef.current) firebaseSavedRevisionRef.current = revision;
      }).catch((error) => {
        if (revision === localSaveRevisionRef.current) {
          setFirebaseSyncMessage(`Auto-save is waiting to retry: ${error instanceof Error ? error.message : String(error)}`);
        }
      });
    };

    const intervalId = window.setInterval(flushPendingCloudBackup, 30_000);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flushPendingCloudBackup();
    };
    window.addEventListener('pagehide', flushPendingCloudBackup);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('pagehide', flushPendingCloudBackup);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [storageHydrated, firebaseUser?.uid]);

  const handleSetHomeImage = (image: string) => {
    setHomeImage(image);
    const current = dataRef.current;
    updateData({
      ...current,
      appPreferences: normalizePreferences({ ...current.appPreferences, homeImage: image }),
    });
    try { localStorage.setItem('colorpop_home_picture_v1', image); } catch { /* IndexedDB and Firebase now persist the selected image. */ }
  };

  // Test OpenRouter Connection
  const testOpenRouter = async (customKey?: string) => {
    const key = customKey ?? data.openRouterConfig.apiKey;
    setDiagnostic((prev) => ({ ...prev, status: 'testing' }));

    setDiagnostic(await testOpenRouterConnection(key));
  };

  // Hydrate the newest local snapshot before allowing edits. IndexedDB keeps
  // chat histories available even when imported images fill localStorage.
  useEffect(() => {
    let mounted = true;
    const hydration = loadLocalDataAsync().then((saved) => {
      if (mounted) {
        dataRef.current = saved;
        setData(saved);
        const selected = saved.chats.find((item) => item.id === saved.activeChatId) || saved.chats[0] || null;
        setActiveChat(selected);
        setStorageHydrated(true);
      }
      return saved;
    }).catch((error) => {
      console.warn('Could not hydrate saved app data:', error);
      if (mounted) {
        setFirebaseSyncMessage('Could not read the full local backup. The app is opening the available saved data.');
        setStorageHydrated(true);
      }
      return dataRef.current;
    });

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const authRevision = ++firebaseAuthRevisionRef.current;
      firebaseCloudReadyRef.current = false;
      setFirebaseCloudHydrated(false);
      setFirebaseUser(user);
      await hydration;
      if (!mounted || authRevision !== firebaseAuthRevisionRef.current) return;
      if (!user) {
        setFirebaseSyncMessage('Saved chats appear in this browser when you are signed out. Sign in with the same Google account in each app context to load the Firebase copy.');
        setFirebaseCloudHydrated(true);
        return;
      }
      if (dataRef.current.appPreferences?.cloudSync === false) {
        setFirebaseSyncMessage('Firebase sync is turned off in App Settings.');
        setFirebaseCloudHydrated(true);
        return;
      }
      try {
        const remote = await loadFromFirebase();
        if (!mounted || authRevision !== firebaseAuthRevisionRef.current) return;
        const current = dataRef.current;
        const remoteUpdatedAt = (remote as (Partial<StorageData> & { updatedAt?: unknown }) | null)?.updatedAt;
        // A different device (or Google account) must not overwrite this account's
        // cloud backup merely because unrelated local data has a newer timestamp.
        const lastAccountKey = 'plf_local_snapshot_account';
        let localAccountId = '';
        try { localAccountId = localStorage.getItem(lastAccountKey) || ''; } catch { /* storage may be restricted */ }
        const useCloudSnapshot = Boolean(remote && (
          !localAccountId ||
          localAccountId !== user.uid ||
          shouldPreferFirebaseSnapshot(remoteUpdatedAt, getLocalDataSavedAt())
        ));
        const merged: StorageData = remote && useCloudSnapshot ? {
          ...current,
          ...remote,
          appPreferences: normalizePreferences({ ...current.appPreferences, ...(remote.appPreferences || {}) }),
          deletedCharacterIds: remote.deletedCharacterIds || [],
          characters: Array.isArray(remote.characters) ? mergeDefaultCharacters(remote.characters, remote.deletedCharacterIds || []) : current.characters,
          chats: Array.isArray(remote.chats) ? remote.chats : current.chats,
          lorebooks: Array.isArray(remote.lorebooks) ? remote.lorebooks : current.lorebooks,
          personas: Array.isArray(remote.personas) ? remote.personas : current.personas,
          plugins: Array.isArray(remote.plugins) ? mergeDefaultPlugins(remote.plugins) : current.plugins,
          storyMemories: Array.isArray(remote.storyMemories) ? remote.storyMemories : current.storyMemories,
          savedMessages: Array.isArray(remote.savedMessages) ? remote.savedMessages : current.savedMessages,
          wallets: Array.isArray(remote.wallets) ? remote.wallets : current.wallets,
          socialWorld: remote.socialWorld || current.socialWorld,
          phoneSystem: remote.phoneSystem || current.phoneSystem,
          journalPages: Array.isArray(remote.journalPages) ? remote.journalPages : current.journalPages,
          activeChatId: remote.activeChatId || current.activeChatId,
          openRouterConfig: { ...(current.openRouterConfig || {}), ...(remote.openRouterConfig || {}), apiKey: remote.openRouterConfig?.apiKey || current.openRouterConfig.apiKey || '' },
          supabaseConfig: current.supabaseConfig,
        } : current;
        const activeChatId = merged.chats.some((chat) => chat.id === merged.activeChatId)
          ? merged.activeChatId
          : merged.chats.some((chat) => chat.id === current.activeChatId) ? current.activeChatId : merged.chats[0]?.id;
        const readyData = { ...merged, activeChatId };
        dataRef.current = readyData;
        setData(readyData);
        if (readyData.appPreferences.homeImage) setHomeImage(readyData.appPreferences.homeImage);
        setActiveChat(readyData.chats.find((chat) => chat.id === activeChatId) || null);
        if (!useCloudSnapshot && localAccountId && localAccountId !== user.uid && !remote) {
          // Never upload another account's local data into a new Firebase account.
          throw new Error('This device contains data from another Google account. Sign back into that account to recover its backup.');
        }
        await saveLocalData(readyData);
        if (!useCloudSnapshot) await enqueueFirebaseSync(readyData);
        try { localStorage.setItem(lastAccountKey, user.uid); } catch { /* IndexedDB remains available */ }
        firebaseCloudReadyRef.current = true;
        if (useCloudSnapshot) setFirebaseSyncMessage('Your latest chats and app data were restored from Firebase.');
      } catch (error) {
        firebaseCloudReadyRef.current = false;
        setFirebaseSyncMessage(`Firebase could not load your saved copy. Your local data is safe; cloud saving is paused to protect the existing backup. ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        if (mounted && authRevision === firebaseAuthRevisionRef.current) setFirebaseCloudHydrated(true);
      }
    });

    void hydration.then((saved) => {
      if (!mounted) return;
      if (saved.openRouterConfig.apiKey) {
        void testOpenRouter(saved.openRouterConfig.apiKey);
      } else {
        setDiagnostic({
          status: 'error',
          lastChecked: Date.now(),
          errorCategory: 'missing_key',
          errorMessage: 'OpenRouter API Key is not set.',
          suggestedFix: 'Click "Setup OpenRouter" or open Settings to enter your API key from openrouter.ai/keys.',
        });
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  // Never leave the app behind the loading screen if IndexedDB or Firebase
  // restore stalls. The synchronous local snapshot remains usable while cloud
  // restore retries in the background.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!storageHydrated) {
        setStorageHydrated(true);
        setFirebaseSyncMessage('Opening your available on-device data. A full local restore is taking longer than expected.');
      }
      if (!firebaseCloudHydrated) {
        firebaseCloudReadyRef.current = false;
        setFirebaseCloudHydrated(true);
        setFirebaseSyncMessage('Firebase is taking longer than expected. Your local data is available; cloud restore will finish if the connection returns.');
      }
    }, 15000);
    return () => window.clearTimeout(timer);
  }, [storageHydrated, firebaseCloudHydrated]);

  // Handlers for updates
  const handleUpdateChat = (updatedChat: Chat) => {
    // Always merge against the latest persisted state. A reply may finish after
    // the user has switched conversations; it must update its own chat without
    // stealing the active screen or replacing another chat's messages.
    const currentData = dataRef.current;
    const exists = currentData.chats.some((chat) => chat.id === updatedChat.id);
    const updatedChats = exists
      ? currentData.chats.map((chat) => (chat.id === updatedChat.id ? updatedChat : chat))
      : [updatedChat, ...currentData.chats];
    const selectedChatId = currentData.activeChatId || activeChat?.id || updatedChat.id;
    if (selectedChatId === updatedChat.id) setActiveChat(updatedChat);
    updateData({ ...currentData, chats: updatedChats, activeChatId: selectedChatId });
  };

  const handleChangeJournalPages = (journalPages: JournalPage[]) => {
    const current = dataRef.current;
    void updateData({ ...current, journalPages });
  };

  const handleSelectChat = (chatId: string) => {
    const currentData = dataRef.current;
    const chat = currentData.chats.find((item) => item.id === chatId);
    if (chat) {
      setActiveChat(chat);
      setInChatMode(true);
      updateData({ ...currentData, activeChatId: chat.id });
    }
  };

  const createChatForCharacterIds = (characterIds: string[], options?: { personaId?: string; scenario?: string; title?: string }) => {
    const currentData = dataRef.current;
    const selectedCharacters = characterIds
      .map((id) => currentData.characters.find((character) => character.id === id))
      .filter((character): character is Character => Boolean(character));
    if (!selectedCharacters.length) return;

    const activePersona = currentData.personas.find((persona) => persona.id === options?.personaId) || currentData.personas.find((persona) => persona.is_default) || currentData.personas[0];
    const matchingChats = currentData.chats.filter((existing) =>
      existing.characterIds.length === selectedCharacters.length &&
      selectedCharacters.every((character) => existing.characterIds.includes(character.id))
    );
    const characterNames = selectedCharacters.map((character) => character.name);
    const baseTitle = characterNames.join(' & ');
    const title = options?.title || (matchingChats.length ? `${baseTitle} · Chat ${matchingChats.length + 1}` : baseTitle);
    const now = new Date().toISOString();
    const chat: Chat = {
      id: `chat_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      title,
      characterIds: selectedCharacters.map((character) => character.id),
      personaId: activePersona?.id || 'persona_siren',
      lorebookIds: currentData.lorebooks.slice(0, 3).map((lorebook) => lorebook.id),
      pluginIds: currentData.plugins.slice(0, 5).map((plugin) => plugin.id),
      scenario: options?.scenario || selectedCharacters[0].scenario || 'A new story in the Pretty Little Fantasies universe.',
      bgImage: selectedCharacters[0].avatar || '/penthouse.jpg',
      relationshipScore: 88,
      replyLength: currentData.appPreferences.responseLengthTarget === 'custom' ? 'custom' : currentData.appPreferences.responseLengthTarget,
      customResponseWords: currentData.appPreferences.customResponseWords,
      replyPointOfView: currentData.appPreferences.defaultPointOfView,
      creativity: currentData.openRouterConfig.temperature,
      dialogueBalance: currentData.appPreferences.dialogueBalance,
      scenePacing: currentData.appPreferences.scenePacing,
      npcActivity: currentData.appPreferences.npcActivity,
      knowledgeBoundaries: currentData.appPreferences.knowledgeBoundaries,
      relationshipContinuity: currentData.appPreferences.relationshipContinuity,
      naturalSpeech: currentData.appPreferences.naturalSpeech,
      reduceRepetition: currentData.appPreferences.reduceRepetition,
      realisticReactions: currentData.appPreferences.realisticReactions,
      // Show the character card's authored first message immediately.
      // Only ask the AI to generate an opening when no greeting was provided.
      messages: selectedCharacters[0].first_mes?.trim() ? [{
        id: `msg_opening_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        senderId: selectedCharacters[0].id,
        senderName: selectedCharacters[0].name,
        avatar: selectedCharacters[0].avatar,
        content: selectedCharacters[0].first_mes.trim(),
        timestamp: Date.now(),
        swipes: [selectedCharacters[0].first_mes.trim()],
        currentSwipeIndex: 0,
      }] : [],
      openingPending: !selectedCharacters[0].first_mes?.trim(),
      createdAt: now,
      updatedAt: now,
    };
    updateData({ ...currentData, chats: [chat, ...currentData.chats], activeChatId: chat.id });
    setActiveChat(chat);
    setInChatMode(true);
  };

  const handleStartDailyPrompt = (characterIds: string[], personaId: string, scenario: string, title: string) => {
    createChatForCharacterIds(characterIds, { personaId, scenario, title });
  };

  const handleExportChatBundle = (chat: Chat) => {
    const current = dataRef.current;
    const bundle = {
      format: 'pretty-little-fantasies-chat-bundle',
      version: 1,
      exportedAt: new Date().toISOString(),
      chat,
      characters: chat.characterIds
        .map((id) => current.characters.find((character) => character.id === id))
        .filter((character): character is Character => Boolean(character)),
      persona: current.personas.find((item) => item.id === chat.personaId) || null,
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = (chat.title || 'story_chat').trim().replace(/[^a-z0-9_-]+/gi, '_').slice(0, 80) + '_bundle.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportChatBundle = async (file: File) => {
    try {
      if (file.size > 25 * 1024 * 1024) throw new Error('The bundle is larger than 25 MB.');
      const parsed = JSON.parse(await file.text()) as {
        format?: unknown;
        version?: unknown;
        chat?: Chat;
        characters?: Character[];
        persona?: Persona | null;
      };
      if (parsed.format !== 'pretty-little-fantasies-chat-bundle' || parsed.version !== 1 || !parsed.chat || !Array.isArray(parsed.chat.messages) || !Array.isArray(parsed.chat.characterIds) || !Array.isArray(parsed.characters)) {
        throw new Error('This file is not a supported Pretty Little Fantasies chat bundle.');
      }
      const current = dataRef.current;
      const importedCharacters = parsed.characters.filter((character) => character && typeof character.id === 'string' && typeof character.name === 'string');
      const characterIdMap = new Map<string, string>();
      importedCharacters.forEach((character, index) => characterIdMap.set(character.id, `char_import_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 7)}`));
      parsed.chat.characterIds.forEach((id) => {
        if (!characterIdMap.has(id) && current.characters.some((character) => character.id === id)) characterIdMap.set(id, id);
      });
      if (parsed.chat.characterIds.some((id) => !characterIdMap.has(id))) {
        throw new Error('This bundle is missing a linked character card. Export the chat bundle again from the original app.');
      }
      const remapCharacterReferences = (value: unknown): unknown => {
        if (Array.isArray(value)) return value.map(remapCharacterReferences);
        if (value && typeof value === 'object') {
          return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, child]) => [
            key,
            key === 'characterId' && typeof child === 'string' ? (characterIdMap.get(child) || child) : remapCharacterReferences(child),
          ]));
        }
        return value;
      };
      const now = new Date().toISOString();
      const characters = importedCharacters.map((character) => ({
        ...(remapCharacterReferences(character) as Character),
        id: characterIdMap.get(character.id)!,
        createdAt: character.createdAt || now,
        updatedAt: now,
      }));
      const importedPersona = parsed.persona && typeof parsed.persona.id === 'string' && typeof parsed.persona.name === 'string'
        ? { ...parsed.persona, id: `persona_import_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, is_default: false, createdAt: parsed.persona.createdAt || now, updatedAt: now }
        : null;
      const personaId = importedPersona?.id || current.personas.find((persona) => persona.is_default)?.id || current.personas[0]?.id;
      if (!personaId) throw new Error('The bundle has no persona and this account has no persona to use.');
      const importedChat = {
        ...(parsed.chat as Chat),
        id: `chat_import_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        userId: auth.currentUser?.uid,
        title: parsed.chat.title || 'Imported story',
        characterIds: parsed.chat.characterIds.map((id) => characterIdMap.get(id) || id),
        personaId,
        messages: parsed.chat.messages.map((message, index) => ({
          ...message,
          id: `msg_import_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 6)}`,
          senderId: characterIdMap.get(message.senderId) || message.senderId,
        })),
        createdAt: parsed.chat.createdAt || now,
        updatedAt: now,
      };
      const result = await updateData({
        ...current,
        characters: [...characters, ...current.characters],
        deletedCharacterIds: (current.deletedCharacterIds || []).filter((id) => !characterIdMap.has(id)),
        personas: importedPersona ? [importedPersona, ...current.personas] : current.personas,
        chats: [importedChat, ...current.chats],
        activeChatId: importedChat.id,
      });
      setActiveChat(importedChat);
      setActiveTab('chats');
      setInChatMode(true);
      const cloudStatus = result?.firebaseSaved
        ? ' It was backed up to Firebase.'
        : ` It is on this device for now: ${result?.message || 'Firebase sync is not available.'}`;
      window.alert(`Imported “${importedChat.title}” with ${characters.length} character card(s) and ${importedPersona ? 'its matching persona' : 'the default persona'}.${cloudStatus}`);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Could not import this chat bundle.');
    }
  };

  const handleStartDedicatedBot = (kind: 'horoscope' | 'chatgpt') => {
    const current = dataRef.current;
    const id = kind === 'chatgpt' ? 'dedicated_chatgpt' : 'dedicated_horoscope';
    const name = kind === 'chatgpt' ? 'ChatGPT' : 'Horoscope Guide';
    const existing = current.characters.find((character) => character.id === id);
    const now = new Date().toISOString();
    const botCharacter: Character = existing || {
      id, name, age: 'Timeless', avatar: '/colorpop_hero.jpg', description: 'A dedicated in-app assistant bot.',
      personality: kind === 'chatgpt' ? 'Helpful, clear, curious, and practical.' : 'Warm, reflective, playful, and astrology-inspired.',
      backstory: 'A dedicated helper available from the home dashboard.', scenario: kind === 'chatgpt' ? 'A friendly assistant chat for questions, planning, and brainstorming.' : 'A daily horoscope companion for zodiac reflections and story inspiration.',
      first_mes: kind === 'chatgpt' ? 'Hi! I’m ChatGPT. What would you like help with?' : 'Welcome, stargazer. What sign or question should we explore today?',
      summary: kind === 'chatgpt' ? 'General purpose AI assistant.' : 'Daily horoscope and astrology companion.', mes_example: '', tags: ['Dedicated Bot'],
      system_prompt: kind === 'chatgpt' ? 'You are ChatGPT, a helpful general-purpose assistant. Answer the user directly and clearly; you are not a roleplay character.' : 'You are a friendly horoscope guide. Offer astrology as reflective entertainment, not certainty. Ask for a zodiac sign when needed.',
      createdAt: now, updatedAt: now,
    };
    // Dedicated bots must have a valid card in the current storage snapshot
    // before the chat is created, including when a legacy card already exists.
    const freshBot = { ...botCharacter,
      name,
      personality: kind === 'chatgpt' ? 'Helpful, clear, curious, and practical.' : 'Warm, reflective, playful, and astrology-inspired.',
      scenario: kind === 'chatgpt' ? 'A friendly assistant chat for questions, planning, and brainstorming.' : 'A daily horoscope companion for zodiac reflections and story inspiration.',
      first_mes: kind === 'chatgpt' ? 'Hi! What would you like help with?' : 'Welcome, stargazer. What sign or question should we explore today?',
      system_prompt: kind === 'chatgpt' ? 'You are an in-app general-purpose AI assistant, not a roleplay character. Answer questions directly and clearly. Do not narrate actions or speak for the user.' : 'You are a friendly horoscope guide. Offer astrology as reflective entertainment, not certainty. Ask for a zodiac sign when needed.',
      updatedAt: now,
    };
    const characters = existing ? current.characters.map((character) => character.id === id ? freshBot : character) : [freshBot, ...current.characters];
    void updateData({ ...current, characters });
    createChatForCharacterIds([id], { scenario: freshBot.scenario, title: name });
  };

  const handleStartChatWithCharacter = (char: Character) => {
    // Starting from Home always creates a fresh thread. Existing conversations
    // remain available from the Chats tab and the recent-chat cards.
    createChatForCharacterIds([char.id]);
  };

  const handleStartNewChat = () => {
    if (activeChat) createChatForCharacterIds(activeChat.characterIds);
  };

  const handleSaveCharacter = (char: Character) => {
    const currentData = dataRef.current;
    const exists = currentData.characters.find((c) => c.id === char.id);
    const updated = exists
      ? currentData.characters.map((c) => (c.id === char.id ? char : c))
      : [char, ...currentData.characters];
    return updateData({
      ...currentData,
      characters: updated,
      // Explicitly importing or saving a profile restores it after a prior deletion.
      deletedCharacterIds: (currentData.deletedCharacterIds || []).filter((id) => id !== char.id),
    });
  };

  const handleDeleteCharacter = (characterId: string) => {
    const character = data.characters.find((item) => item.id === characterId);
    if (!character || !window.confirm(`Delete ${character.name} from your character library? Existing chat messages will stay saved.`)) return;
    const deletedCharacterIds = [...new Set([...(data.deletedCharacterIds || []), characterId])];
    updateData({
      ...data,
      characters: data.characters.filter((item) => item.id !== characterId),
      deletedCharacterIds,
    });
  };

  const handleSaveLorebook = (lore: Lorebook) => {
    const exists = data.lorebooks.find((l) => l.id === lore.id);
    const updated = exists
      ? data.lorebooks.map((l) => (l.id === lore.id ? lore : l))
      : [lore, ...data.lorebooks];
    updateData({ ...data, lorebooks: updated });
  };

  const handleSavePersona = (persona: Persona) => {
    const exists = data.personas.find((p) => p.id === persona.id);
    let updated: Persona[];
    if (exists) {
      updated = data.personas.map((p) => (p.id === persona.id ? persona : p));
    } else {
      updated = [persona, ...data.personas];
    }
    // If this persona is marked default, set all others to false
    if (persona.is_default) {
      updated = updated.map((p) => ({ ...p, is_default: p.id === persona.id }));
    }
    updateData({ ...data, personas: updated });
  };

  const handleDeletePersona = (personaId: string) => {
    const updated = data.personas.filter((p) => p.id !== personaId);
    const hasDefault = updated.some((p) => p.is_default);
    const ensured = updated.map((p, idx) => ({
      ...p,
      is_default: hasDefault ? p.is_default : idx === 0,
    }));
    updateData({ ...data, personas: ensured });
  };

  const handleSelectDefaultPersona = (pId: string) => {
    const updated = data.personas.map((p) => ({ ...p, is_default: p.id === pId }));
    updateData({ ...data, personas: updated });
    try {
      localStorage.setItem('colorpop_default_persona', pId);
    } catch (e) {}
  };

  const handleStartChatWithPersona = (persona: Persona) => {
    const currentData = dataRef.current;
    const updatedPersonas = currentData.personas.map((item) => ({ ...item, is_default: item.id === persona.id }));
    const chatToOpen = currentData.chats.find((chat) => chat.id === (currentData.activeChatId || activeChat?.id)) || currentData.chats[0];
    try { localStorage.setItem('colorpop_default_persona', persona.id); } catch { /* Storage may be unavailable in private browsing. */ }
    if (!chatToOpen) {
      updateData({ ...currentData, personas: updatedPersonas });
      return;
    }
    const updatedChat = { ...chatToOpen, personaId: persona.id, updatedAt: new Date().toISOString() };
    updateData({
      ...currentData,
      personas: updatedPersonas,
      chats: currentData.chats.map((chat) => chat.id === updatedChat.id ? updatedChat : chat),
      activeChatId: updatedChat.id,
    });
    setActiveChat(updatedChat);
    setInChatMode(true);
  };

  const MAX_PLUGIN_PROMPT_CHARS = 14000;
  const handleTogglePlugin = (pluginId: string) => {
    const currentData = dataRef.current;
    const target = currentData.plugins.find((plugin) => plugin.id === pluginId);
    if (!target) return;
    const nextEnabled = !target.enabled;
    const promptSize = currentData.plugins.reduce((total, plugin) => total + (plugin.id === pluginId ? (nextEnabled ? (plugin.customPrompt || '').length : 0) : plugin.enabled ? (plugin.customPrompt || '').length : 0), 0);
    if (nextEnabled && promptSize > MAX_PLUGIN_PROMPT_CHARS) {
      window.alert('The combined enabled plugin prompts would be too long. Turn off another plugin or shorten its prompt first.');
      return;
    }
    const updated = currentData.plugins.map((plugin) => plugin.id === pluginId ? { ...plugin, enabled: nextEnabled } : plugin);
    updateData({ ...currentData, plugins: updated });
  };

  const handleSavePlugin = (plugin: Plugin) => {
    const currentData = dataRef.current;
    const promptSize = currentData.plugins.reduce((total, existing) => total + (existing.id === plugin.id ? (plugin.enabled ? plugin.customPrompt?.length || 0 : 0) : existing.enabled ? (existing.customPrompt || '').length : 0), 0);
    if (promptSize > MAX_PLUGIN_PROMPT_CHARS) {
      window.alert('The combined enabled plugin prompts would be too long. Shorten this prompt or disable another plugin.');
      return;
    }
    const exists = currentData.plugins.some((item) => item.id === plugin.id);
    const plugins = exists
      ? currentData.plugins.map((item) => item.id === plugin.id ? plugin : item)
      : [...currentData.plugins, plugin];
    updateData({ ...currentData, plugins });
  };

  const handleSaveOpenRouterConfig = (cfg: OpenRouterConfig) => {
    updateData({ ...data, openRouterConfig: cfg });
    testOpenRouter(cfg.apiKey);
  };

  const handleSavePreferences = (value: AppPreferences) => {
    updateData({ ...data, appPreferences: normalizePreferences(value) });
  };
  const handleOpenWallet = (view: 'dashboard' | 'activity') => {
    if (!activeChat) return;
    const persona = data.personas.find((item) => item.id === activeChat.personaId) || data.personas[0];
    const wallet = getWalletForScope(data.wallets, activeChat.id, persona?.id || 'persona_default');
    if (!data.wallets.some((item) => item.id === wallet.id)) updateData({ ...data, wallets: [...data.wallets, wallet] });
    setWalletView(view);
    setIsWalletOpen(true);
  };
  const handleSaveWallet = (wallet: StoryWallet) => {
    const wallets = data.wallets.some((item) => item.id === wallet.id)
      ? data.wallets.map((item) => item.id === wallet.id ? wallet : item)
      : [...data.wallets, wallet];
    updateData({ ...data, wallets });
  };
  const createBackupPayload = () => {
    const { openRouterConfig, supabaseConfig, ...backup } = data;
    return { version: 1, exportedAt: new Date().toISOString(), ...backup };
  };
  const handleExportData = () => {
    downloadJson('Pretty_Little_Fantasies_Backup.json', createBackupPayload());
  };
  const handleImportBackup = (backupValue: unknown) => {
    if (!backupValue || typeof backupValue !== 'object' || Array.isArray(backupValue)) return;
    const source = backupValue as Record<string, any>;
    const current = dataRef.current;
    const restored = {
      ...current,
      ...source,
      appPreferences: normalizePreferences(source.appPreferences ?? current.appPreferences),
      openRouterConfig: current.openRouterConfig,
      supabaseConfig: current.supabaseConfig,
      deletedCharacterIds: Array.isArray(source.deletedCharacterIds) ? source.deletedCharacterIds : (current.deletedCharacterIds || []),
      characters: Array.isArray(source.characters)
        ? mergeDefaultCharacters(source.characters, Array.isArray(source.deletedCharacterIds) ? source.deletedCharacterIds : (current.deletedCharacterIds || []))
        : current.characters,
      chats: Array.isArray(source.chats) ? source.chats : current.chats,
      personas: Array.isArray(source.personas) ? source.personas : current.personas,
      lorebooks: Array.isArray(source.lorebooks) ? source.lorebooks : current.lorebooks,
      plugins: mergeDefaultPlugins(Array.isArray(source.plugins) ? source.plugins : current.plugins),
      storyMemories: Array.isArray(source.storyMemories) ? source.storyMemories : current.storyMemories,
      wallets: Array.isArray(source.wallets) ? source.wallets : current.wallets,
      savedMessages: Array.isArray(source.savedMessages) ? source.savedMessages : current.savedMessages,
      phoneSystem: source.phoneSystem ? mergePhoneSystemData(current.phoneSystem, source.phoneSystem) : current.phoneSystem,
      activeChatId: typeof source.activeChatId === 'string' ? source.activeChatId : current.activeChatId,
    };
    updateData(restored);
    const restoredActiveChat = restored.chats.find((chat: Chat) => chat.id === restored.activeChatId) || restored.chats[0] || null;
    setActiveChat(restoredActiveChat);
    setFirebaseSyncMessage('Backup restored locally. Firebase sync will save it if signed in and enabled.');
  };


  // Story Memory Handlers
  const handleSaveMemory = (memory: StoryMemory) => {
    const savedMemory: StoryMemory = { ...memory, updatedAt: new Date().toISOString(), deletedAt: undefined };
    const currentData = dataRef.current;
    const existing = currentData.storyMemories || [];
    const updated = existing.some((item) => item.id === savedMemory.id)
      ? existing.map((item) => item.id === savedMemory.id ? savedMemory : item)
      : [savedMemory, ...existing];
    updateData({ ...currentData, storyMemories: updated });
  };

  const handleDeleteMemory = (id: string) => {
    const deletedAt = new Date().toISOString();
    const updated = (data.storyMemories || []).map((memory) => memory.id === id
      ? { ...memory, deletedAt, updatedAt: deletedAt }
      : memory);
    updateData({ ...data, storyMemories: updated });
  };

  // Saved Messages Bookmarks Handlers
  const handleBookmarkMessage = (msg: ChatMessage) => {
    const newSaved = {
      id: `saved_${Date.now()}`,
      chatId: activeChat?.id || 'chat_general',
      senderName: msg.senderName,
      avatar: msg.avatar,
      content: msg.content,
      timestamp: msg.timestamp || Date.now(),
    };
    const updated = [newSaved, ...(data.savedMessages || [])];
    updateData({ ...data, savedMessages: updated });
  };

  const handleRemoveSavedMessage = (id: string) => {
    const updated = (data.savedMessages || []).filter((s) => s.id !== id);
    updateData({ ...data, savedMessages: updated });
  };

  // Scene Background Handlers
  const handleApplySceneBackground = (chatId: string, bgUrl: string) => {
    const updatedChats = data.chats.map((c) => (c.id === chatId ? { ...c, bgImage: bgUrl } : c));
    if (activeChat && activeChat.id === chatId) {
      setActiveChat({ ...activeChat, bgImage: bgUrl });
    }
    updateData({ ...data, chats: updatedChats });
  };

  const handleFirebaseSyncNow = async () => {
    if (!auth.currentUser) throw new Error('Sign in to Firebase first.');
    if (dataRef.current.appPreferences?.cloudSync === false) throw new Error('Turn on Firebase sync in App Settings first.');
    if (!firebaseCloudReadyRef.current) throw new Error('Firebase has not finished loading your saved copy. Reload the app to retry before syncing.');
    setFirebaseSyncMessage('Saving chats and app data to Firebase…');
    try {
      await enqueueFirebaseSync(dataRef.current);
    } catch (error) {
      const message = `Firebase could not save the latest changes: ${error instanceof Error ? error.message : String(error)}`;
      setFirebaseSyncMessage(message);
      throw new Error(message);
    }
  };

  const handleOpenCreateCharacterPage = (charToEdit?: Character | null) => {
    setCharacterToEdit(charToEdit || null);
    setIsCreateCharacterOpen(true);
  };

  const handleOpenMostRecentChat = () => {
    const latestChat = [...dataRef.current.chats].sort((a, b) =>
      new Date(b.updatedAt || '').getTime() - new Date(a.updatedAt || '').getTime()
    )[0];
    if (latestChat) handleSelectChat(latestChat.id);
  };

  const activeWalletPersona = activeChat ? (data.personas.find((item) => item.id === activeChat.personaId) || data.personas[0]) : undefined;
  const activeWallet = activeChat && activeWalletPersona ? getWalletForScope(data.wallets, activeChat.id, activeWalletPersona.id) : null;
  const walletSenderName = activeChat ? (data.characters.find((item) => activeChat.characterIds.includes(item.id))?.name || 'Story character') : 'Story character';
  const luciousCharacter = data.characters.find((character) => /lucious/i.test(character.name));
  const luciousChat = luciousCharacter ? data.chats.find((chat) => chat.characterIds.includes(luciousCharacter.id)) : undefined;

  const showIncomingMoneyAlert = (transaction: StoryWalletTransaction) => {
    if (!/lucious/i.test(transaction.sender)) return;
    setMoneyAlert(transaction);
  };

  useEffect(() => {
    if (!moneyAlert) return;
    const timeout = window.setTimeout(() => setMoneyAlert((current) => current?.eventId === moneyAlert.eventId ? null : current), 7000);
    return () => window.clearTimeout(timeout);
  }, [moneyAlert?.eventId]);

  // Fictional surprise payments from Lucious arrive while the app is open. The alert is in-app only and silent.
  useEffect(() => {
    if (!storageHydrated || !luciousChat || !luciousCharacter) return;
    const delay = 4 * 60_000 + Math.random() * 8 * 60_000;
    const timer = window.setTimeout(() => {
      const currentData = dataRef.current;
      const targetChat = currentData.chats.find((chat) => chat.id === luciousChat.id);
      const sender = currentData.characters.find((character) => character.id === luciousCharacter.id);
      if (!targetChat || !sender) return;
      const recipient = currentData.personas.find((persona) => persona.id === targetChat.personaId) || currentData.personas.find((persona) => persona.is_default) || currentData.personas[0];
      const wallet = getWalletForScope(currentData.wallets, targetChat.id, recipient?.id || 'persona_default');
      const amountCents = [2500, 5000, 10000, 25000, 50000][Math.floor(Math.random() * 5)];
      const notes = ['Something pretty for you, sweetheart.', 'Get yourself a little treat.', 'Because you deserve it, darling.', 'A little surprise from me.'];
      const next = recordIncomingTransfer(wallet, {
        eventId: 'lucious-gift-' + targetChat.id + '-' + Date.now(),
        sender: sender.name,
        recipient: recipient?.name || 'The Muse',
        amountCents,
        memo: notes[Math.floor(Math.random() * notes.length)],
        timestamp: Date.now(),
      });
      const wallets = currentData.wallets.some((item) => item.id === next.id)
        ? currentData.wallets.map((item) => item.id === next.id ? next : item)
        : [...currentData.wallets, next];
      void updateData({ ...currentData, wallets });
      showIncomingMoneyAlert(next.transactions[0]);
      setMoneyCycle((cycle) => cycle + 1);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [storageHydrated, luciousChat?.id, luciousCharacter?.id, moneyCycle]);

  // Show cloud sign-in on a fresh visit without locking away local stories.
  // Once Google auth restores, the existing Firebase hydration flow takes over.
  if (storageHydrated && firebaseCloudHydrated && !firebaseUser &&
      typeof sessionStorage !== 'undefined' && sessionStorage.getItem('plf_continue_local') !== 'yes') {
    return <CloudLoginScreen onContinueLocal={() => {
      try { sessionStorage.setItem('plf_continue_local', 'yes'); } catch {}
      setFirebaseCloudHydrated(false);
      window.setTimeout(() => setFirebaseCloudHydrated(true), 0);
    }} />;
  }

  // 1. Dedicated Full-Page Create Character View
  if (isCreateCharacterOpen) {
    return (
      <>
      <CreateCharacterView
        existingCharacter={characterToEdit}
        existingCharactersList={data.characters}
        onSaveCharacter={(savedChar) => handleSaveCharacter(savedChar)}
        onRegisterCreateAction={(action) => { characterCreateActionRef.current = action; }}
        onBack={() => {
          setIsCreateCharacterOpen(false);
          setCharacterToEdit(null);
        }}
        onStartChat={(char) => {
          setIsCreateCharacterOpen(false);
          setCharacterToEdit(null);
          handleStartChatWithCharacter(char);
        }}
        onOpenLibrary={() => {
          setIsCreateCharacterOpen(false);
          setCharacterToEdit(null);
          setActiveTab('characters');
        }}
        onOpenPersonaLibrary={() => {
          setIsCreateCharacterOpen(false);
          setCharacterToEdit(null);
          setActiveTab('personas');
          setIsPersonaCreatorOpen(false);
        }}
        onOpenLorebookLibrary={() => {
          setIsCreateCharacterOpen(false);
          setCharacterToEdit(null);
          setIsLoreModalOpen(true);
        }}
        onOpenGallery={() => {
          setIsCreateCharacterOpen(false);
          setCharacterToEdit(null);
          setActiveTab('gallery');
        }}
        onOpenHome={() => {
          setIsCreateCharacterOpen(false);
          setCharacterToEdit(null);
          setActiveTab('home');
        }}
      />
      <QuickBottomToolbar
        active="create"
        onCharacters={() => { setIsCreateCharacterOpen(false); setCharacterToEdit(null); setActiveTab('characters'); }}
        onCreate={() => characterCreateActionRef.current ? characterCreateActionRef.current() : handleOpenCreateCharacterPage(null)}
        onHome={() => { setIsCreateCharacterOpen(false); setCharacterToEdit(null); setInChatMode(false); setActiveTab('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        onRecent={() => handleOpenMostRecentChat()}
        hasRecentChat={data.chats.length > 0}
      />
      </>
    );
  }

  if (!storageHydrated || !firebaseCloudHydrated) {
    return (
      <main className="cp-loading-screen min-h-screen grid place-items-center bg-[#0d020b] text-[#ffd6eb]" role="status">
        Loading your saved chats…
      </main>
    );
  }

  // 2. Full-scale Roleplay Chat View
  if (inChatMode && activeChat) {
    return (
      <>
        {moneyAlert && <div className="cp-money-alert fixed left-1/2 top-4 z-[120] flex w-[min(92vw,28rem)] -translate-x-1/2 items-center gap-3 rounded-2xl border px-4 py-3 shadow-xl" role="status" aria-live="polite">
          <span aria-hidden="true">💸</span><span className="min-w-0 flex-1"><strong className="block">{moneyAlert.sender} sent you {formatWalletMoney(moneyAlert.amountCents, moneyAlert.currency)}</strong><small className="block truncate">{moneyAlert.memo}</small></span>
          <button type="button" aria-label="Dismiss money alert" onClick={() => setMoneyAlert(null)}>×</button>
        </div>}
        <ChatView
          chat={activeChat}
          allChats={data.chats}
          characters={data.characters}
          personas={data.personas}
          lorebooks={data.lorebooks}
          plugins={data.plugins}
          openRouterConfig={data.openRouterConfig}
          diagnostic={diagnostic}
          preferences={preferences}
          storyMemories={data.storyMemories}
          socialMediaContext={formatSocialWorldContext(data.socialWorld || DEFAULT_SOCIAL_WORLD)}
          phoneContext={formatPhoneStoryContext(data.phoneSystem, activeChat.id, activeChat.characterIds)}
          phoneSystem={data.phoneSystem}
          socialMediaPhone={
            <SocialMediaView
              phoneMode
              world={data.socialWorld || DEFAULT_SOCIAL_WORLD}
              characters={data.characters}
              personas={data.personas}
              activeChat={activeChat}
              onUpdateWorld={(socialWorld) => updateData({ ...dataRef.current, socialWorld })}
              onToggleChat={(enabled) => handleUpdateChat({ ...activeChat, socialMediaEnabled: enabled, updatedAt: new Date().toISOString() })}
            />
          }
          onUpdatePhoneSystem={(phoneSystem) => updateData({ ...dataRef.current, phoneSystem })}
          onOpenPhone={() => setIsPhoneOpen(true)}
          onOpenYouTubePlayer={() => setIsYouTubePlayerOpen(true)}
          onUpdateChat={handleUpdateChat}
          onSaveMemory={handleSaveMemory}
          onUpdateCharacter={handleSaveCharacter}
          onSelectChat={handleSelectChat}
          onStartNewChat={handleStartNewChat}
          onBackToDashboard={() => { setInChatMode(false); setActiveTab('home'); }}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenPlugins={() => setIsPluginModalOpen(true)}
          onOpenCharacterModal={() => setIsCharModalOpen(true)}
          onEditCharacter={handleOpenCreateCharacterPage}
          onOpenLorebookModal={() => setIsLoreModalOpen(true)}
          onOpenPersonaModal={() => setIsPersonaModalOpen(true)}
          onOpenStoryNotesModal={() => setIsStoryNotesOpen(true)}
          onOpenSavedMessagesModal={() => setIsSavedMessagesOpen(true)}
          onOpenSceneGeneratorModal={() => setIsSceneGeneratorOpen(true)}
          onOpenGitHubSyncModal={() => setIsGitSyncOpen(true)}
          onOpenSocialMedia={() => { setInChatMode(false); setActiveTab('social'); }}
          onOpenWallet={handleOpenWallet}
          onUpdatePreferences={handleSavePreferences}
          onTogglePlugin={handleTogglePlugin}
          onBookmarkMessage={handleBookmarkMessage}
        />

        <CharacterPhoneModal
          isOpen={isPhoneOpen}
          onClose={() => setIsPhoneOpen(false)}
          chat={activeChat}
          characters={data.characters}
          activeCharacters={data.characters.filter((character) => activeChat.characterIds.includes(character.id))}
          personaName={activeWalletPersona?.name || 'Emmy'}
          phoneSystem={data.phoneSystem}
          onChange={(phoneSystem) => updateData({ ...dataRef.current, phoneSystem })}
          wallet={activeWallet || undefined}
          onSaveWallet={handleSaveWallet}
          socialWorld={data.socialWorld || DEFAULT_SOCIAL_WORLD}
          onUpdateSocialWorld={(socialWorld) => updateData({ ...dataRef.current, socialWorld })}
          openRouterConfig={data.openRouterConfig}
          preferences={preferences}
          persona={activeWalletPersona || null}
          lorebooks={data.lorebooks.filter((book) => activeChat.lorebookIds.includes(book.id))}
          plugins={data.plugins}
          storyMemories={data.storyMemories.filter((memory) => memory.chatId === activeChat.id || memory.chatId === 'global')}
          socialMediaContext={formatSocialWorldContext(data.socialWorld || DEFAULT_SOCIAL_WORLD)}
        />

        {/* Global Modals (Accessible from Chat View) */}
        <CharacterModal
          isOpen={isCharModalOpen}
          onClose={() => setIsCharModalOpen(false)}
          characters={data.characters}
          onSaveCharacter={handleSaveCharacter}
          onStartChatWithCharacter={handleStartChatWithCharacter}
          onOpenCreateCharacter={handleOpenCreateCharacterPage}
        />
        <LorebookModal
          isOpen={isLoreModalOpen}
          onClose={() => setIsLoreModalOpen(false)}
          lorebooks={data.lorebooks}
          onSaveLorebook={handleSaveLorebook}
        />
        <PersonaModal
          isOpen={isPersonaModalOpen}
          onClose={() => setIsPersonaModalOpen(false)}
          personas={data.personas}
          onSavePersona={handleSavePersona}
          onSelectDefaultPersona={(pId) => {
            const updated = data.personas.map((p) => ({ ...p, is_default: p.id === pId }));
            updateData({ ...data, personas: updated });
          }}
        />
        <PluginModal
          isOpen={isPluginModalOpen}
          onClose={() => setIsPluginModalOpen(false)}
          plugins={data.plugins}
          onTogglePlugin={handleTogglePlugin}
          onSavePlugin={handleSavePlugin}
        />
        <OpenRouterSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          config={data.openRouterConfig}
        preferences={preferences}
        onSavePreferences={handleSavePreferences}
        onExportData={handleExportData}
        onImportBackup={handleImportBackup}
        backupData={createBackupPayload()}
          onSaveConfig={handleSaveOpenRouterConfig}
          diagnostic={diagnostic}
          activeChat={activeChat || undefined}
          onUpdateChat={handleUpdateChat}
          onTestConnection={testOpenRouter}
          firebaseUser={firebaseUser}
          firebaseSyncMessage={firebaseSyncMessage}
          firebaseLastSync={firebaseLastSync}
          onSyncFirebase={handleFirebaseSyncNow}
        />
        <StoryNotesModal
          isOpen={isStoryNotesOpen}
          onClose={() => setIsStoryNotesOpen(false)}
          memories={data.storyMemories || []}
          chats={data.chats}
          activeChatId={activeChat?.id}
          onSaveMemory={handleSaveMemory}
          onDeleteMemory={handleDeleteMemory}
          onOpenChat={handleSelectChat}
        />
        <SavedMessagesModal
          isOpen={isSavedMessagesOpen}
          onClose={() => setIsSavedMessagesOpen(false)}
          savedMessages={data.savedMessages || []}
          chats={data.chats}
          onRemoveSavedMessage={handleRemoveSavedMessage}
          onOpenChat={handleSelectChat}
        />
        <SceneGeneratorModal
          isOpen={isSceneGeneratorOpen}
          onClose={() => setIsSceneGeneratorOpen(false)}
          chats={data.chats}
          activeChatId={activeChat?.id}
          onApplySceneBackground={handleApplySceneBackground}
        />
        <GitHubSyncModal isOpen={isGitSyncOpen} onClose={() => setIsGitSyncOpen(false)} />
        <YouTubePlaylistPlayer isOpen={isYouTubePlayerOpen} onClose={() => setIsYouTubePlayerOpen(false)} />
        {activeWallet && activeWalletPersona && <WalletModal
          isOpen={isWalletOpen}
          onClose={() => setIsWalletOpen(false)}
          view={walletView}
          onChangeView={setWalletView}
          wallet={activeWallet}
          personaName={activeWalletPersona.name}
          characterName={walletSenderName}
          onSaveWallet={handleSaveWallet}
          onIncomingPayment={showIncomingMoneyAlert}
        />}
      </>
    );
  }

  // Dashboard View (Faithfully matching the uploaded image + Dual Track System)
  return (
    <div data-screen={activeTab} className="cp-app-shell min-h-screen bg-[#f8dbe7] text-[#211019] flex flex-col font-sans selection:bg-[#ff007f]/40 relative overflow-x-hidden" style={{
      '--plf-screen-background': `url("${import.meta.env.BASE_URL}backgrounds/${({ home: 'line-art-flowers.webp', chats: 'line-art-flowers.webp', characters: 'line-art-flowers.webp', lorebooks: 'line-art-flowers.webp', personas: 'line-art-flowers.webp', gallery: 'line-art-flowers.webp', files: 'line-art-flowers.webp', perchance: 'line-art-flowers.webp', social: 'line-art-flowers.webp', journal: 'line-art-flowers.webp', marketplace: 'line-art-flowers.webp', 'memory-map': 'line-art-flowers.webp', more: 'line-art-flowers.webp' } as Record<NavTab, string>)[activeTab]}")`,
      ...(preferences.dashboardBackground ? { backgroundImage: `url("${preferences.dashboardBackground.replace(/"/g, '%22')}")`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' } : {}),
    } as React.CSSProperties}>
      <FloatingBubbles />
      {/* Background Neon Glow Orbs */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-[#ff007f]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-[#ff1493]/10 rounded-full blur-[140px] pointer-events-none" />

      {/* 1. Pretty Little Fantasies header */}
      <ColorPopHeader />

      {/* 2. Top Navigation Pill with Dual Track Trigger */}
      <div className="plf-top-row w-full max-w-full overflow-x-auto overflow-y-hidden overscroll-x-contain px-0 pb-2 touch-pan-x">
        <div className="flex w-max min-w-full items-center gap-2 px-3">
          <TopNavPill
            activeTab={activeTab}
            onChangeTab={(t) => {
              setActiveTab(t);
              if (t === 'chats') {
                setInChatMode(false);
              } else if (t === 'characters' || t === 'gallery' || t === 'files') {
                setIsCreateCharacterOpen(false);
              } else if (t === 'lorebooks') {
                setIsLoreModalOpen(true);
              } else if (t === 'personas') {
                setIsPersonaCreatorOpen(false);
                setPersonaToEdit(null);
              }
            }}
            onOpenMoreMenu={() => setIsSettingsOpen(true)}
            utilityActions={<ColorPopHeaderActions
              diagnostic={diagnostic}
              firebaseConnected={Boolean(firebaseUser)}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onOpenSearch={() => setIsCharModalOpen(true)}
              onOpenFavorites={() => setIsSavedMessagesOpen(true)}
              onOpenGitPush={() => setIsGitSyncOpen(true)}
              onOpenYouTubePlayer={() => setIsYouTubePlayerOpen(true)}
              userAvatar={(activeChat && data.personas.find((persona) => persona.id === activeChat.personaId)?.avatar) || firebaseUser?.photoURL || '/colorpop_hero.jpg'}
              userName={firebaseUser?.displayName || 'The Muse'}
            />}
          />

        <AppDrawers
          activeTab={activeTab}
          chats={data.chats}
          activeChat={activeChat}
          walletBalance={activeWallet ? formatWalletMoney(activeWallet.accounts.filter((account) => account.type !== 'credit').reduce((total, account) => total + account.balanceCents, 0), activeWallet.currency) : '—'}
          onNavigate={(tab) => {
            setActiveTab(tab);
            if (tab === 'chats') setInChatMode(false);
            else if (tab === 'characters' || tab === 'gallery' || tab === 'files') setIsCreateCharacterOpen(false);
            else if (tab === 'lorebooks') setIsLoreModalOpen(true);
            else if (tab === 'personas') { setIsPersonaCreatorOpen(false); setPersonaToEdit(null); }
          }}
          onSelectChat={handleSelectChat}
          onOpenWallet={handleOpenWallet}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenPlugins={() => setIsPluginModalOpen(true)}
          onOpenStoryNotes={() => setIsStoryNotesOpen(true)}
          onOpenSavedMessages={() => setIsSavedMessagesOpen(true)}
          onOpenScenes={() => setIsSceneGeneratorOpen(true)}
          onOpenGitHubSync={() => setIsGitSyncOpen(true)}
          onOpenSocialMedia={() => { setInChatMode(false); setActiveTab('social'); }}
        />

        {/* Prominent Track Screen Button on Dashboard */}
        <button
          onClick={() => setIsDualTrackOpen(true)}
          className="shrink-0 px-3.5 py-2 rounded-full bg-gradient-to-r from-[#fffafd] via-[#ffddeb] to-[#fff1f7] hover:from-[#ffe7f0] hover:to-[#f4aec9] border border-white/90 text-[#211019] font-bold text-xs shadow-[0_5px_14px_rgba(115,44,74,.13)] flex items-center space-x-1.5 transition-all hover:scale-105"
          title="Open Dual Track Screen (Slide-over panels on left and right)"
        >
          <Columns className="w-4 h-4 text-[#211019]" />
          <span className="hidden sm:inline">Track Screen</span>
        </button>
        </div>
      </div>

      {/* Main Dashboard Body */}
      <main key={activeTab} className="cp-page-transition flex-1 max-w-7xl w-full mx-auto pb-12 space-y-4">
        {activeTab === 'creative' ? (
          <CreativeStudioView initialSection={creativeSection} />
        ) : activeTab === 'journal' ? (
          <JournalView pages={data.journalPages || []} onChangePages={handleChangeJournalPages} />
        ) : activeTab === 'social' ? (
          <SocialMediaView
            world={data.socialWorld || DEFAULT_SOCIAL_WORLD}
            characters={data.characters}
            personas={data.personas}
            activeChat={activeChat}
            onUpdateWorld={(socialWorld) => updateData({ ...data, socialWorld })}
            onToggleChat={(enabled) => {
              if (activeChat) handleUpdateChat({ ...activeChat, socialMediaEnabled: enabled, updatedAt: new Date().toISOString() });
            }}
          />
        ) : activeTab === 'marketplace' ? (
          <CharacterMarketplaceView
            characters={data.characters}
            onInstall={handleSaveCharacter}
            onBack={() => setActiveTab('characters')}
          />
        ) : activeTab === 'memory-map' ? (
          <StoryMemoryMapView
            memories={(data.storyMemories || []).filter((memory) => !memory.deletedAt)}
            characters={data.characters}
            chats={data.chats}
            onSaveMemory={handleSaveMemory}
            onDeleteMemory={handleDeleteMemory}
            onOpenChat={handleSelectChat}
            onBack={() => setActiveTab('home')}
          />
        ) : activeTab === 'chats' ? (
          <ChatsLibraryView chats={data.chats} characters={data.characters} onOpenChat={handleSelectChat} onTogglePin={(chat) => handleUpdateChat({ ...chat, pinned: !chat.pinned, updatedAt: new Date().toISOString() })} onExportBundle={handleExportChatBundle} onImportBundle={handleImportChatBundle} />
        ) : activeTab === 'characters' ? (
          <CharacterModal
            isOpen={true}
            fullPage
            onClose={() => setActiveTab('home')}
            characters={data.characters}
            onSaveCharacter={handleSaveCharacter}
            onDeleteCharacter={handleDeleteCharacter}
            onStartChatWithCharacter={handleStartChatWithCharacter}
            onOpenCreateCharacter={(character) => handleOpenCreateCharacterPage(character)}
          />
        ) : activeTab === 'gallery' ? (
          <SceneGeneratorModal
            isOpen={true}
            fullPage
            homeImage={homeImage}
            onSetHomeImage={(image) => { handleSetHomeImage(image); setActiveTab('home'); }}
            onClose={() => setActiveTab('home')}
            chats={data.chats}
            activeChatId={activeChat?.id}
            onApplySceneBackground={handleApplySceneBackground}
          />
        ) : activeTab === 'files' ? (
          <FileKeeperView onBack={() => setActiveTab('home')} />
        ) : activeTab === 'perchance' ? (
          <PerchanceView />
        ) : activeTab === 'personas' ? (
          isPersonaCreatorOpen ? (
            <PersonaCreatorView
              initialPersona={personaToEdit}
              onSavePersona={(persona) => {
                handleSavePersona(persona);
                setIsPersonaCreatorOpen(false);
                setPersonaToEdit(null);
              }}
              onCancel={() => {
                setIsPersonaCreatorOpen(false);
                setPersonaToEdit(null);
              }}
              onSelectDefaultPersona={handleSelectDefaultPersona}
            />
          ) : (
            <PersonaLibraryView
              personas={data.personas}
              onOpenCreator={(p) => {
                setPersonaToEdit(p || null);
                setIsPersonaCreatorOpen(true);
              }}
              onSavePersona={handleSavePersona}
              onDeletePersona={handleDeletePersona}
              onSelectDefaultPersona={handleSelectDefaultPersona}
              onStartChatWithPersona={handleStartChatWithPersona}
            />
          )
        ) : (
          <>
            {/* 3. Luxury Hero Banner + Quick Links 12-Jewel Grid */}
            <DailyPromptHub
              characters={data.characters}
              personas={data.personas}
              onPlay={handleStartDailyPrompt}
              recentChatTitle={[...data.chats].sort((a, b) => new Date(b.updatedAt || '').getTime() - new Date(a.updatedAt || '').getTime())[0]?.title}
              onOpenRecentChat={handleOpenMostRecentChat}
              onOpenRandomCharacter={handleStartChatWithCharacter}
              onStartBot={handleStartDedicatedBot}
              onOpenCreator={() => setIsCreatorBotOpen(true)}
              onCreateCharacter={() => handleOpenCreateCharacterPage(null)}
              onCreatePersona={() => {
                setActiveTab('personas');
                setIsPersonaCreatorOpen(true);
                setPersonaToEdit(null);
              }}
              onCreateLorebook={() => setIsLoreModalOpen(true)}
            />

            {/* 4. Glowing 4 Action Cards */}
            <ActionCards
              onCreateCharacter={() => handleOpenCreateCharacterPage(null)}
              onCreateLorebook={() => setIsLoreModalOpen(true)}
              onCreatePersona={() => {
                setActiveTab('personas');
                setIsPersonaCreatorOpen(true);
                setPersonaToEdit(null);
              }}
              onOpenMyChats={() => {
                setActiveTab('chats');
                setInChatMode(false);
              }}
              onOpenPaletteCreator={() => { setCreativeSection('palette'); setActiveTab('creative'); }}
              onOpenAssetGallery={() => { setCreativeSection('assets'); setActiveTab('creative'); }}
            />

            {/* 5. 10 Circular Category Pills */}
            <CategoryPills
              activeCategory={activeCategory}
              onSelectCategory={(cat) => {
                setActiveCategory(cat);
                if (cat === 'characters') setActiveTab('characters');
                if (cat === 'personas') {
                  setActiveTab('personas');
                  setIsPersonaCreatorOpen(false);
                  setPersonaToEdit(null);
                }
                if (cat === 'lorebooks' || cat === 'locations') setIsLoreModalOpen(true);
                if (cat === 'plugins') setIsPluginModalOpen(true);
                if (cat === 'images') setActiveTab('gallery');
                if (cat === 'favorites') setIsSavedMessagesOpen(true);
                if (cat === 'recent') {
                  if (activeChat) setInChatMode(true);
                }
                if (cat === 'wardrobe') setIsStoryNotesOpen(true);
              }}
            />

            {/* 6. Recent Chats Carousel & Continue Sidebar */}
            <RecentChatsSection
              chats={data.chats}
              onSelectChat={handleSelectChat}
              onContinueLastChat={() => {
                const latestChat = [...data.chats].sort((a, b) =>
                  new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
                )[0];
                if (latestChat) handleSelectChat(latestChat.id);
              }}
              onGenerateSceneImage={() => setIsSceneGeneratorOpen(true)}
              onOpenStoryNotes={() => setIsStoryNotesOpen(true)}
              onOpenSavedMessages={() => setIsSavedMessagesOpen(true)}
              onViewAllChats={() => {
                setActiveTab('chats');
                setInChatMode(false);
              }}
            />
          </>
        )}
      </main>

      {moneyAlert && <div className="cp-money-alert fixed left-1/2 top-4 z-[120] flex w-[min(92vw,28rem)] -translate-x-1/2 items-center gap-3 rounded-2xl border px-4 py-3 shadow-xl" role="status" aria-live="polite">
        <span aria-hidden="true">💸</span><span className="min-w-0 flex-1"><strong className="block">{moneyAlert.sender} sent you {formatWalletMoney(moneyAlert.amountCents, moneyAlert.currency)}</strong><small className="block truncate">{moneyAlert.memo}</small></span>
        <button type="button" aria-label="Dismiss money alert" onClick={() => setMoneyAlert(null)}>×</button>
      </div>}
      <QuickBottomToolbar
        active={activeTab === 'characters' ? 'characters' : activeTab === 'home' ? 'home' : undefined}
        onCharacters={() => { setIsCreateCharacterOpen(false); setCharacterToEdit(null); setInChatMode(false); setActiveTab('characters'); }}
        onCreate={() => handleOpenCreateCharacterPage(null)}
        onHome={() => { setIsCreateCharacterOpen(false); setCharacterToEdit(null); setInChatMode(false); setIsSettingsOpen(false); setIsCharModalOpen(false); setIsLoreModalOpen(false); setIsPersonaModalOpen(false); setIsPluginModalOpen(false); setIsSceneGeneratorOpen(false); setIsCreatorBotOpen(false); setActiveTab('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        onRecent={handleOpenMostRecentChat}
        hasRecentChat={data.chats.length > 0}
      />

      <BotStudioModal
        isOpen={isCreatorBotOpen}
        config={data.openRouterConfig}
        onClose={() => setIsCreatorBotOpen(false)}
        onSaved={(target) => {
          if (target === 'character') setActiveTab('characters');
          else if (target === 'persona') { setActiveTab('personas'); setIsPersonaCreatorOpen(false); setPersonaToEdit(null); }
          else { setIsLoreModalOpen(true); }
        }}
        onSaveCharacter={handleSaveCharacter}
        onSaveLorebook={handleSaveLorebook}
        onSavePersona={handleSavePersona}
      />

      {/* DUAL TRACK SCREEN OVERLAY (Pops up and slides over from both sides) */}
      <DualTrackOverlay
        isOpen={isDualTrackOpen}
        onClose={() => setIsDualTrackOpen(false)} // Hitting X backs out of both sides
        activeChat={activeChat}
        chats={data.chats}
        characters={data.characters}
        personas={data.personas}
        lorebooks={data.lorebooks}
        plugins={data.plugins}
        diagnostic={diagnostic}
        openRouterConfig={data.openRouterConfig}
        onSelectChat={handleSelectChat}
        onOpenChatScreen={() => {
          setIsDualTrackOpen(false);
          if (activeChat) setInChatMode(true);
        }}
        onOpenHome={() => setIsDualTrackOpen(false)}
        onOpenCharacterModal={() => {
          setIsDualTrackOpen(false);
          handleOpenCreateCharacterPage(null);
        }}
        onOpenLorebookModal={() => setIsLoreModalOpen(true)}
        onOpenPersonaModal={() => {
          setIsDualTrackOpen(false);
          setActiveTab('personas');
          setIsPersonaCreatorOpen(false);
          setPersonaToEdit(null);
        }}
        onOpenPluginModal={() => setIsPluginModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsOpen(true)}
        onOpenStoryNotesModal={() => setIsStoryNotesOpen(true)}
        onOpenSavedMessagesModal={() => setIsSavedMessagesOpen(true)}
        onOpenSceneGeneratorModal={() => setIsSceneGeneratorOpen(true)}
        onOpenGitHubSyncModal={() => setIsGitSyncOpen(true)}
        onOpenWallet={handleOpenWallet}
        onTogglePlugin={handleTogglePlugin}
        onBoostAffinity={() => {
          if (activeChat) {
            const updatedScore = Math.min(100, (activeChat.relationshipScore || 85) + 1);
            handleUpdateChat({ ...activeChat, relationshipScore: updatedScore });
          }
        }}
      />

      {/* All Modal Screens Fully Connected */}
      <CharacterModal
        isOpen={isCharModalOpen}
        onClose={() => setIsCharModalOpen(false)}
        characters={data.characters}
        onSaveCharacter={handleSaveCharacter}
        onStartChatWithCharacter={handleStartChatWithCharacter}
        onOpenCreateCharacter={handleOpenCreateCharacterPage}
      />

      <LorebookModal
        isOpen={isLoreModalOpen}
        onClose={() => setIsLoreModalOpen(false)}
        lorebooks={data.lorebooks}
        onSaveLorebook={handleSaveLorebook}
      />

      <PersonaModal
        isOpen={isPersonaModalOpen}
        onClose={() => setIsPersonaModalOpen(false)}
        personas={data.personas}
        onSavePersona={handleSavePersona}
        onSelectDefaultPersona={(pId) => {
          const updated = data.personas.map((p) => ({ ...p, is_default: p.id === pId }));
          updateData({ ...data, personas: updated });
        }}
      />

      <PluginModal
        isOpen={isPluginModalOpen}
        onClose={() => setIsPluginModalOpen(false)}
        plugins={data.plugins}
        onTogglePlugin={handleTogglePlugin}
        onSavePlugin={handleSavePlugin}
      />

      <OpenRouterSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={data.openRouterConfig}
        preferences={preferences}
        onSavePreferences={handleSavePreferences}
        onExportData={handleExportData}
        backupData={createBackupPayload()}
        onSaveConfig={handleSaveOpenRouterConfig}
        diagnostic={diagnostic}
        activeChat={activeChat || undefined}
        onUpdateChat={handleUpdateChat}
        onTestConnection={testOpenRouter}
        firebaseUser={firebaseUser}
        firebaseSyncMessage={firebaseSyncMessage}
        onSyncFirebase={handleFirebaseSyncNow}
      />

      <StoryNotesModal
        isOpen={isStoryNotesOpen}
        onClose={() => setIsStoryNotesOpen(false)}
        memories={data.storyMemories || []}
        chats={data.chats}
        activeChatId={activeChat?.id}
        onSaveMemory={handleSaveMemory}
        onDeleteMemory={handleDeleteMemory}
        onOpenChat={handleSelectChat}
      />

      <SavedMessagesModal
        isOpen={isSavedMessagesOpen}
        onClose={() => setIsSavedMessagesOpen(false)}
        savedMessages={data.savedMessages || []}
        chats={data.chats}
        onRemoveSavedMessage={handleRemoveSavedMessage}
        onOpenChat={handleSelectChat}
      />

      <SceneGeneratorModal
        isOpen={isSceneGeneratorOpen}
        onClose={() => setIsSceneGeneratorOpen(false)}
        chats={data.chats}
        activeChatId={activeChat?.id}
        onApplySceneBackground={handleApplySceneBackground}
      />

      <GitHubSyncModal isOpen={isGitSyncOpen} onClose={() => setIsGitSyncOpen(false)} />
      <YouTubePlaylistPlayer isOpen={isYouTubePlayerOpen} onClose={() => setIsYouTubePlayerOpen(false)} />
    </div>
  );
}


