import React from 'react';
import {
  UserPlus,
  BookOpen,
  Contact,
  MessageSquare,
  ArrowRight,
  Sparkles,
  Palette,
  Images,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useRef, useState } from 'react';

interface ActionCardsProps {
  onCreateCharacter: () => void;
  onCreateLorebook: () => void;
  onCreatePersona: () => void;
  onOpenMyChats: () => void;
  onOpenPaletteCreator: () => void;
  onOpenAssetGallery: () => void;
}

export const ActionCards: React.FC<ActionCardsProps> = ({
  onCreateCharacter,
  onCreateLorebook,
  onCreatePersona,
  onOpenMyChats,
  onOpenPaletteCreator,
  onOpenAssetGallery,
}) => {
  const railRef = useRef<HTMLDivElement>(null);
  const [activeCard, setActiveCard] = useState(0);
  const cards = [
    {
      id: 'char',
      title: 'Create Character',
      subtitle: 'BRING THEM TO LIFE',
      gradient: 'from-[#ff007f] via-[#ff3399] to-[#d6006c]',
      glow: 'shadow-[0_0_30px_rgba(255,0,128,0.5)] hover:shadow-[0_0_40px_rgba(255,0,128,0.8)]',
      border: 'border-[#ff66b2]',
      icon: <UserPlus className="w-8 h-8 text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.9)]" />,
      onClick: onCreateCharacter,
    },
    {
      id: 'lore',
      title: 'Create Lorebook',
      subtitle: 'BUILD DEEPER WORLDS',
      gradient: 'from-[#ff6f61] via-[#ff8577] to-[#e05244]',
      glow: 'shadow-[0_0_30px_rgba(255,111,97,0.5)] hover:shadow-[0_0_40px_rgba(255,111,97,0.8)]',
      border: 'border-[#ffa094]',
      icon: <BookOpen className="w-8 h-8 text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.9)]" />,
      onClick: onCreateLorebook,
    },
    {
      id: 'persona',
      title: 'Create Persona',
      subtitle: 'YOURSELF IN STORIES',
      gradient: 'from-[#9b51e0] via-[#b26ee8] to-[#8035cb]',
      glow: 'shadow-[0_0_30px_rgba(155,81,224,0.5)] hover:shadow-[0_0_40px_rgba(155,81,224,0.8)]',
      border: 'border-[#ca95f5]',
      icon: <Contact className="w-8 h-8 text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.9)]" />,
      onClick: onCreatePersona,
    },
    {
      id: 'chats',
      title: 'My Chats',
      subtitle: 'CONTINUE YOUR STORIES',
      gradient: 'from-[#00c4cc] via-[#26d6dd] to-[#009da3]',
      glow: 'shadow-[0_0_30px_rgba(0,196,204,0.5)] hover:shadow-[0_0_40px_rgba(0,196,204,0.8)]',
      border: 'border-[#5ce5eb]',
      icon: <MessageSquare className="w-8 h-8 text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.9)]" />,
      onClick: onOpenMyChats,
    },
    {
      id: 'palette',
      title: 'Palette Creator',
      subtitle: 'BUILD A COLOR STORY',
      gradient: 'from-[#f384ae] via-[#bd8ce8] to-[#82d7d8]',
      glow: 'shadow-[0_0_30px_rgba(185,121,200,0.38)] hover:shadow-[0_0_40px_rgba(185,121,200,0.6)]',
      border: 'border-[#efc4e8]',
      icon: <Palette className="w-8 h-8 text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.9)]" />,
      onClick: onOpenPaletteCreator,
    },
    {
      id: 'assets',
      title: 'Digital Asset Gallery',
      subtitle: 'KEEP YOUR CREATIVE FILES',
      gradient: 'from-[#8a9ce8] via-[#b99ae8] to-[#ed9fc6]',
      glow: 'shadow-[0_0_30px_rgba(152,142,225,0.38)] hover:shadow-[0_0_40px_rgba(152,142,225,0.6)]',
      border: 'border-[#d9c6f4]',
      icon: <Images className="w-8 h-8 text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.9)]" />,
      onClick: onOpenAssetGallery,
    },
  ];

  const scrollByCard = (direction: -1 | 1) => {
    const rail = railRef.current;
    if (!rail) return;
    const card = rail.querySelector<HTMLElement>('[data-action-card]');
    rail.scrollBy({ left: direction * ((card?.getBoundingClientRect().width || rail.clientWidth) + 16), behavior: 'smooth' });
  };

  return (
    <div className="w-full px-4 sm:px-6 py-2">
      <div className="mb-3 flex items-center justify-between gap-3 px-1">
        <div>
          <h2 className="text-lg font-bold text-[#32182a]">Create & collect</h2>
          <p className="text-xs text-[#76576a]">Swipe to explore your creative tools</p>
        </div>
        <div className="flex gap-2">
          <button type="button" aria-label="Previous cards" onClick={() => scrollByCard(-1)} className="grid h-9 w-9 place-items-center rounded-full border border-white/90 bg-white/70 text-[#48263a] shadow-sm"><ChevronLeft className="h-4 w-4" /></button>
          <button type="button" aria-label="Next cards" onClick={() => scrollByCard(1)} className="grid h-9 w-9 place-items-center rounded-full border border-white/90 bg-white/70 text-[#48263a] shadow-sm"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>
      <div
        ref={railRef}
        role="region"
        aria-label="Swipeable creative tools"
        aria-roledescription="carousel"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'ArrowRight') { event.preventDefault(); scrollByCard(1); }
          if (event.key === 'ArrowLeft') { event.preventDefault(); scrollByCard(-1); }
        }}
        onScroll={(event) => {
          const rail = event.currentTarget;
          const card = rail.querySelector<HTMLElement>('[data-action-card]');
          if (card) setActiveCard(Math.max(0, Math.min(cards.length - 1, Math.round(rail.scrollLeft / (card.offsetWidth + 16)))));
        }}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {cards.map((card, index) => (
          <button
            key={card.id}
            data-action-card
            aria-roledescription="slide"
            aria-label={`${card.title}, ${index + 1} of ${cards.length}`}
            onClick={card.onClick}
            className={`cp-action-card group relative min-h-[220px] w-[83vw] shrink-0 snap-center overflow-hidden rounded-3xl border-2 p-6 text-center transition-all duration-300 hover:scale-[1.015] active:scale-[0.985] cursor-pointer flex flex-col items-center justify-between bg-gradient-to-br ${card.gradient} ${card.border} ${card.glow} sm:w-[calc((100%-1rem)/2)] lg:w-[calc((100%-2rem)/3)]`}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-black/20 pointer-events-none" />

            <div className="absolute top-3 right-3 text-white/70 group-hover:text-white transition-colors">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>

            <div className="cp-action-icon mt-2 w-16 h-16 rounded-full bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform">
              {card.icon}
            </div>

            <div className="my-2 space-y-1">
              <h3 className="text-xl font-black text-white tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                {card.title}
              </h3>
              <p className="text-xs tracking-wider font-extrabold uppercase text-white/80">
                {card.subtitle}
              </p>
            </div>

            <div className="cp-action-arrow w-9 h-9 rounded-full bg-white text-black flex items-center justify-center shadow-md group-hover:scale-110 group-hover:bg-[#ffebf5] transition-all">
              <ArrowRight className="w-4 h-4 text-pink-600 font-bold" />
            </div>
          </button>
        ))}
      </div>
      <div className="mt-1 flex justify-center gap-1.5" role="status" aria-live="polite" aria-label={`Card ${activeCard + 1} of ${cards.length}`}>
        {cards.map((card, index) => <span key={card.id} aria-hidden="true" className={`h-1.5 rounded-full transition-all ${index === activeCard ? 'w-5 bg-[#b55a85]' : 'w-1.5 bg-[#b55a85]/30'}`} />)}
      </div>
    </div>
  );
};
