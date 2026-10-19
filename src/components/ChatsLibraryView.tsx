import React, { useMemo, useRef, useState } from 'react';
import { Clock3, MessageCircle, Pin, PinOff, Search, Upload, Download } from 'lucide-react';
import type { Chat, Character } from '../types/roleplay';
import { resolveImageUrl } from '../utils/imageUrl';

interface ChatsLibraryViewProps {
  chats: Chat[];
  characters: Character[];
  onOpenChat: (chatId: string) => void;
  onTogglePin: (chat: Chat) => void;
  onExportBundle: (chat: Chat) => void;
  onImportBundle: (file: File) => void | Promise<void>;
}

function lastMessageTime(chat: Chat): number {
  const lastMessage = chat.messages[chat.messages.length - 1];
  const timestamp = lastMessage?.timestamp ?? new Date(chat.updatedAt).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function timeAgo(timestamp: number): string {
  if (!timestamp) return 'No messages yet';
  const elapsed = Math.max(0, Date.now() - timestamp);
  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return minutes === 1 ? '1 min ago' : minutes + ' mins ago';
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours === 1 ? '1 hour ago' : hours + ' hours ago';
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return days + ' days ago';
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(timestamp);
}

export const ChatsLibraryView: React.FC<ChatsLibraryViewProps> = ({ chats, characters, onOpenChat, onTogglePin, onExportBundle, onImportBundle }) => {
  const [query, setQuery] = useState('');
  const importInputRef = useRef<HTMLInputElement>(null);
  const sortedChats = useMemo(() => [...chats].sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) || lastMessageTime(b) - lastMessageTime(a)), [chats]);
  const filteredChats = sortedChats.filter((chat) => {
    const names = chat.characterIds.map((id) => characters.find((character) => character.id === id)?.name || '').join(' ');
    return (chat.title + ' ' + names).toLowerCase().includes(query.trim().toLowerCase());
  });

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.28em] text-[#ff66b2]">Your story library</p>
          <h1 className="text-3xl font-black text-white sm:text-4xl">All Chats</h1>
          <p className="mt-2 text-sm text-[#ffd6eb]/65">{chats.length} {chats.length === 1 ? 'conversation' : 'conversations'}, sorted by latest activity</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input ref={importInputRef} type="file" accept="application/json,.json" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void onImportBundle(file); event.currentTarget.value = ''; }} />
          <button type="button" onClick={() => importInputRef.current?.click()} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/80 bg-gradient-to-r from-[#fffafd] to-[#ffdce9] px-4 text-xs font-bold text-[#211019] shadow-[0_4px_12px_rgba(115,44,74,.12)]"><Upload className="h-4 w-4" />Import chat bundle</button>
        </div>
        <label className="flex w-full items-center gap-2 rounded-2xl border border-[#ff66b2]/30 bg-[#1a0715]/80 px-3 py-2.5 sm:max-w-xs">
          <Search className="h-4 w-4 text-[#ff99cc]" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search chats or characters" className="min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none" />
        </label>
      </div>

      {filteredChats.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredChats.map((chat) => {
            const timestamp = lastMessageTime(chat);
            const latest = chat.messages[chat.messages.length - 1];
            const participants = chat.characterIds.map((id) => characters.find((character) => character.id === id)).filter((character): character is Character => Boolean(character));
            const cover = chat.bgImage || participants[0]?.avatar || '/penthouse.jpg';
            return (
              <div key={chat.id} className="relative">
              <button type="button" onClick={() => onOpenChat(chat.id)} className="group block w-full overflow-hidden rounded-3xl border border-[#ff66b2]/25 bg-[#180713]/90 text-left shadow-[0_12px_32px_rgba(0,0,0,0.28)] transition duration-200 hover:-translate-y-1 hover:border-[#ff66b2]/70 hover:shadow-[0_0_25px_rgba(255,0,128,0.2)] focus:outline-none focus:ring-2 focus:ring-[#ff66b2]">
                <div className="relative h-36 overflow-hidden bg-gradient-to-br from-[#4a1038] to-[#170411]">
                  <img src={resolveImageUrl(cover)} alt="" className="h-full w-full object-cover opacity-70 transition duration-300 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#180713] via-transparent to-black/10" />
                  <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-3">
                    <div className="flex -space-x-2">
                      {participants.slice(0, 3).map((character) => <img key={character.id} src={resolveImageUrl(character.avatar || '/lucious.jpg')} alt={character.name} title={character.name} className="h-9 w-9 rounded-xl border-2 border-[#180713] object-cover" />)}
                    </div>
                    <span className="rounded-full border border-white/15 bg-black/50 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur">{chat.messages.length} messages</span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <h2 className="line-clamp-1 text-lg font-extrabold text-white">{chat.title || 'Untitled chat'}</h2>
                    <span className="flex shrink-0 items-center gap-1 text-[10px] font-semibold text-[#ff99cc]"><Clock3 className="h-3 w-3" />{timeAgo(timestamp)}</span>
                  </div>
                  <p className="mb-4 line-clamp-2 min-h-10 text-xs leading-relaxed text-[#ffd6eb]/60">{latest?.senderName ? latest.senderName + ': ' : ''}{latest?.content || 'Start the conversation'}</p>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#ff99cc]"><MessageCircle className="h-3.5 w-3.5" />Open conversation</div>
                </div>
              </button>
              <button type="button" onClick={() => onExportBundle(chat)} className="absolute left-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/90 px-3 py-2.5 text-[10px] font-bold text-[#211019] shadow-lg backdrop-blur-md transition hover:scale-105" aria-label={`Export ${chat.title || 'conversation'} with its character and persona cards`} title="Export chat with character and persona"><Download className="h-3.5 w-3.5" />Bundle</button>
              <button type="button" aria-label={chat.pinned ? `Unpin ${chat.title || 'conversation'}`} title={chat.pinned ? 'Unpin conversation' : 'Pin conversation'} onClick={() => onTogglePin(chat)} className={`absolute right-3 top-3 z-10 rounded-full border border-white/25 p-2.5 text-white shadow-lg backdrop-blur-md transition hover:scale-105 ${chat.pinned ? 'bg-[#ff007f]/90' : 'bg-black/50 hover:bg-[#ff007f]/75'}`}>
                {chat.pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
              </button>
            </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-[#ff66b2]/30 bg-[#180713]/60 px-5 py-14 text-center">
          <MessageCircle className="mx-auto mb-3 h-8 w-8 text-[#ff66b2]" />
          <h2 className="text-lg font-bold text-white">{chats.length ? 'No chats match that search' : 'No chats yet'}</h2>
          <p className="mt-1 text-sm text-[#ffd6eb]/55">{chats.length ? 'Try a different chat or character name.' : 'Start a conversation from a character profile and it will appear here.'}</p>
        </div>
      )}
    </section>
  );
};
