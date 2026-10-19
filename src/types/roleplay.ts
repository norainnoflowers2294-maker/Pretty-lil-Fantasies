export interface FeatureMark {
  id: string;
  location: string;
  description: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  relationship: 'Mother' | 'Father' | 'Sister' | 'Brother' | 'Daughter' | 'Son' | 'Cousin' | 'Aunt' | 'Uncle' | 'Grandparent' | 'Guardian' | 'Other' | string;
  age?: string;
  description?: string;
  status: 'Alive' | 'Deceased' | 'Unknown' | string;
  characterId?: string;
}

export interface CharacterSpouse {
  name: string;
  relationshipStatus?: string;
  characterId?: string;
}

export interface Character {
  id: string;
  userId?: string;
  name: string; // Full Name (required)
  nicknames?: string[];
  age?: string;
  ethnicity?: string;
  birthday?: string; // e.g. "10/24"
  birthYear?: string; // e.g. "1998"
  zodiacSign?: string; // Calculated Western Zodiac (e.g. "Scorpio ♏")
  avatar: string;

  // Physical Appearance
  height?: string; // e.g. "6'1\"" or "185 cm"
  bodyType?: string; // Petite, Athletic, Curvy, Muscular, Slim, Broad, Plus Size, Other
  scars?: FeatureMark[];
  birthmarks?: FeatureMark[];
  tattoos?: FeatureMark[];
  hairColor?: string;
  eyeColor?: string;
  description: string; // Physical Description

  // Speech & Voice
  voiceDescription?: string;
  voiceTags?: string[]; // Selected bubble chips

  // Personality & History
  personality: string; // Personality traits, temperament, habits, mannerisms, likes, dislikes (required)
  learnedPreferences?: { likes: string[]; dislikes: string[]; evidence: string[] };
  backstory?: string;

  // Relationships & Family
  spouse?: CharacterSpouse;
  familyMembers?: FamilyMember[];

  // Story & Scenario
  scenario: string; // Scenario text
  first_mes: string; // Initial Message / Greeting
  pov?: 'first_person' | 'third_person' | string; // First-Person or Third-Person POV

  // Standard character card / meta fields
  summary: string;
  mes_example: string;
  system_prompt?: string;
  post_history_instructions?: string;
  tags: string[];
  alternate_greetings?: string[];
  creator_notes?: string;
  createdAt: string;
  updatedAt: string;

  // Preserved raw / custom fields from JSON imports
  customFields?: Record<string, any>;
}

export interface LoreEntry {
  id: string;
  keys: string[];
  secondary_keys?: string[];
  comment?: string;
  content: string;
  constant: boolean;
  selective: boolean;
  insertion_order: number;
  position: 'before_char' | 'after_char';
  enabled: boolean;
}

export interface Lorebook {
  id: string;
  userId?: string;
  name: string;
  description: string;
  avatar?: string;
  scan_depth: number;
  token_budget: number;
  recursive_scanning: boolean;
  entries: LoreEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface Persona {
  id: string;
  userId?: string;
  name: string;
  display_name?: string;
  nicknames?: string;
  occupation?: string;
  avatar: string;
  description: string;
  appearance?: string;
  backstory?: string;
  speaking_style: string;
  traits: string[];
  is_default: boolean;
  favorite?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Plugin {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: 'mechanics' | 'immersion' | 'utility' | 'style' | 'analysis';
  enabled: boolean;
  config: Record<string, any>;
  customPrompt?: string;
  badge?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  avatar?: string;
  content: string;
  timestamp: number;
  swipes?: string[];
  currentSwipeIndex?: number;
  emotions?: string[];
  tokens?: number;
}

export interface LivingWorldEvent {
  id: string;
  title: string;
  summary: string;
  occurredAt: string;
  kind: 'daily' | 'history' | 'twist' | 'relationship' | 'discovery';
  people?: string[];
}

export interface LivingWorldRumor {
  id: string;
  text: string;
  truth: 'unknown' | 'true' | 'partial' | 'false';
  believers: string[];
  createdAt: string;
}

export interface LivingWorldLore {
  id: string;
  title: string;
  category: 'place' | 'faction' | 'person' | 'history' | 'magic' | 'technology' | 'politics' | 'legend' | 'other';
  entry: string;
  updatedAt: string;
}

export interface CharacterLie {
  characterId: string;
  characterName: string;
  claim: string;
  motive?: string;
  discovered: boolean;
  createdAt: string;
}

export interface LivingWorldState {
  enabled: boolean;
  worldYear?: number;
  lastDailyStoryAt?: string;
  events: LivingWorldEvent[];
  rumors: LivingWorldRumor[];
  lore: LivingWorldLore[];
  lies: CharacterLie[];
  relationshipNotes: Array<{ characterId: string; characterName: string; toward: string; affinity: number; jealousy: number; note?: string }>;
}

export interface Chat {
  id: string;
  userId?: string;
  title: string;
  characterIds: string[];
  personaId: string;
  lorebookIds: string[];
  pluginIds: string[];
  scenario: string;
  bgImage?: string;
  messages: ChatMessage[];
  contextResetAt?: number;
  openingPending?: boolean;
  pinned?: boolean;
  mockStyle?: 'chatgpt' | 'gemini' | 'deepseek' | 'grok';
  helperMode?: 'roleplay' | 'internet' | 'coder' | 'ideas' | 'story';
  relationshipScore?: number;
  inventory?: string[];
  weather?: string;
  timeOfDay?: string;
  timeCycleEnabled?: boolean;
  livingWorld?: LivingWorldState;
  promptInstructions?: string;
  oocMode?: boolean;
  socialMediaEnabled?: boolean;
  replyStyle?: 'immersive' | 'dialogue' | 'balanced' | 'screenplay';
  replyLength?: 'short' | 'medium' | 'long' | 'custom';
  customResponseWords?: number;
  dialogueBalance?: number;
  scenePacing?: 'slow_burn' | 'balanced' | 'fast';
  npcActivity?: 'low' | 'balanced' | 'high';
  knowledgeBoundaries?: boolean;
  relationshipContinuity?: boolean;
  naturalSpeech?: boolean;
  reduceRepetition?: boolean;
  realisticReactions?: boolean;
  replyPointOfView?: 'character' | 'first_person' | 'third_person';
  replyMood?: 'story' | 'playful' | 'romantic' | 'dramatic' | 'cozy' | 'suspenseful' | 'comedic';
  creativity?: number;
  whisperAudience?: string[];
  whisperMode?: boolean;
  unsentMessages?: Array<{ id: string; sender: string; content: string; createdAt: string }>;
  flashbacks?: Array<{ id: string; content: string; createdAt: string }>;
  continuityReports?: Array<{ id: string; content: string; createdAt: string }>;
  createdAt: string;
  updatedAt: string;
}

export interface ConnectionDiagnostic {
  status: 'connected' | 'error' | 'untested' | 'testing';
  lastChecked: number | null;
  statusCode?: number;
  errorMessage?: string;
  errorCategory?: 'missing_key' | 'auth_failed' | 'no_credits' | 'rate_limited' | 'model_unavailable' | 'network_error';
  suggestedFix?: string;
  latencyMs?: number;
  availableModels?: string[];
}

export interface OpenRouterConfig {
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  siteUrl: string;
  siteName: string;
  supportedParameters?: string[];
  webSearch?: boolean;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  connected: boolean;
  lastSync?: number;
}

export type StoryMemoryCategory = 'memory' | 'friendship' | 'family' | 'relationship' | 'milestone' | 'place';
export interface StoryMemoryPerson {
  id: string;
  name: string;
  relationship: 'friend' | 'family' | 'character';
  characterId?: string;
}

export interface StoryMemory {
  id: string;
  chatId?: string;
  title: string;
  type: 'note' | 'quote' | 'recap';
  content: string;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;
  pinned?: boolean;
  storyDate?: string;
  category?: StoryMemoryCategory;
  people?: StoryMemoryPerson[];
}
