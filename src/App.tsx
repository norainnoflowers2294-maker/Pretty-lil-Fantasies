import { normalizePreferences, downloadJson, type AppPreferences } from './lib/preferences';
import './components/preferences.css';
import { testOpenRouterConnection } from './lib/openrouter';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { ColorPopHeader } from './components/ColorPopHeader';
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
import { JournalView } from './components/JournalView';
import { GitHubSyncModal } from './components/GitHubSyncModal';
import { DualTrackOverlay } from './components/DualTrackOverlay';
import { Columns, House, MessageCircle, Plus, UserRound } from 'lucide-react';
import { WalletModal } from './components/WalletModal';
import { CharacterPhoneModal } from './components/CharacterPhoneModal';
import { getWalletForScope, type StoryWallet } from './lib/wallet';
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
          (localAccountId && localAccountId !== user.uid) ||
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
    if (!existing) updateData({ ...current, characters: [botCharacter, ...current.characters] });
    createChatForCharacterIds([botCharacter.id], { scenario: botCharacter.scenario, title: name });
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

  // 1. Dedicated Full-Page Create Character View
  if (isCreateCharacterOpen) {
    return (
      <>
      <CreateCharacterView
        existingCharacter={characterToEdit}
        existingCharactersList={data.characters}
        onSaveCharacter={(savedChar) => {
          handleSaveCharacter(savedChar);
        }}
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
        onCreate={() => handleOpenCreateCharacterPage(null)}
        onHome={() => { setIsCreateCharacterOpen(false); setCharacterToEdit(null); setActiveTab('home'); }}
        onRecent={() => handleOpenMostRecentChat()}
        hasRecentChat={data.chats.length > 0}
      />
      </>
    );
  }

  if (!storageHydrated || !firebaseCloudHydrated) {
    return (
      <main className="min-h-screen grid place-items-center bg-[#0d020b] text-[#ffd6eb]" role="status">
        Loading your saved chats…
      </main>
    );
  }

  // 2. Full-scale Roleplay Chat View
  if (inChatMode && activeChat) {
    return (
      <>
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
        />}
      </>
    );
  }

  // Dashboard View (Faithfully matching the uploaded image + Dual Track System)
  return (
    <div className="cp-app-shell min-h-screen bg-[#0d020b] text-[#ffd6eb] flex flex-col font-sans selection:bg-[#ff007f]/40 relative overflow-x-hidden">
      {/* Background Neon Glow Orbs */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-[#ff007f]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-[#9b51e0]/10 rounded-full blur-[140px] pointer-events-none" />

      {/* 1. Pretty Little Fantasies header */}
      <ColorPopHeader
        diagnostic={diagnostic}
        firebaseConnected={Boolean(firebaseUser)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenSearch={() => setIsCharModalOpen(true)}
        onOpenFavorites={() => setIsSavedMessagesOpen(true)}
        onOpenGitPush={() => setIsGitSyncOpen(true)}
        onOpenYouTubePlayer={() => setIsYouTubePlayerOpen(true)}
        userAvatar={(activeChat && data.personas.find((persona) => persona.id === activeChat.personaId)?.avatar) || firebaseUser?.photoURL || '/colorpop_hero.jpg'}
        userName={firebaseUser?.displayName || 'The Muse'}
      />

      {/* 2. Top Navigation Pill with Dual Track Trigger */}
      <div className="w-full max-w-4xl mx-auto px-4 flex items-center justify-between gap-2">
        <div className="flex-1">
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
          />
        </div>

        <AppDrawers
          activeTab={activeTab}
          chats={data.chats}
          activeChat={activeChat}
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
          className="shrink-0 px-3.5 py-2 rounded-full bg-gradient-to-r from-[#ff007f]/30 to-[#9b51e0]/30 hover:from-[#ff007f]/50 hover:to-[#9b51e0]/50 border border-[#ff3399]/60 text-white font-bold text-xs shadow-[0_0_15px_rgba(255,0,128,0.4)] flex items-center space-x-1.5 transition-all hover:scale-105"
          title="Open Dual Track Screen (Slide-over panels on left and right)"
        >
          <Columns className="w-4 h-4 text-[#ff99cc]" />
          <span className="hidden sm:inline">Track Screen</span>
        </button>
      </div>

      {/* Main Dashboard Body */}
      <main key={activeTab} className="cp-page-transition flex-1 max-w-7xl w-full mx-auto pb-12 space-y-4">
        {activeTab === 'journal' ? (
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
          <ChatsLibraryView chats={data.chats} characters={data.characters} onOpenChat={handleSelectChat} />
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
              onStartBot={handleStartDedicatedBot}
              onOpenCreator={() => setIsCreatorBotOpen(true)}
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

      <QuickBottomToolbar
        active={activeTab === 'characters' ? 'characters' : activeTab === 'home' ? 'home' : undefined}
        onCharacters={() => { setIsCreateCharacterOpen(false); setCharacterToEdit(null); setInChatMode(false); setActiveTab('characters'); }}
        onCreate={() => handleOpenCreateCharacterPage(null)}
        onHome={() => { setIsCreateCharacterOpen(false); setCharacterToEdit(null); setInChatMode(false); setActiveTab('home'); }}
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


