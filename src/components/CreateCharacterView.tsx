import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Save,
  Upload,
  Download,
  Trash2,
  Plus,
  Sparkles,
  X,
  User,
  Heart,
  Users,
  BookOpen,
  MessageSquare,
  Home,
  Layers,
  Image as ImageIcon,
  Puzzle,
  Settings,
  Check,
  AlertCircle,
  HelpCircle,
  Link as LinkIcon,
  ChevronDown,
  Eye,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { Character, FeatureMark, FamilyMember, CharacterSpouse, OpenRouterConfig } from '../types/roleplay';
import { parseBirthdayToZodiac, calculateAgeFromBirthYear } from '../utils/zodiac';
import { sendOpenRouterChat } from '../lib/openrouter';
import { parseCharacterFile, exportCharacterJson } from '../utils/pngParser';
import { resolveImageUrl } from '../utils/imageUrl';

// ---------------------------------------------------------------------------
// 18-COLOR PALETTE CONSTANTS (Explicitly used throughout interface)
// ---------------------------------------------------------------------------
const PALETTE = {
  // Blues
  navy: '#020E8B',
  electricBlue: '#018DF2',
  periwinkle: '#8DB2F6',
  // Pinks & Reds
  orangeRed: '#F93F02',
  hotPink: '#FF007E',
  bubblegumPink: '#FF7EB0',
  peach: '#FFCDA8',
  coralPink: '#FF9786',
  raspberry: '#DC0E69',
  deepRaspberry: '#AA015B',
  // Purples
  orchid: '#B333A8',
  lavender: '#B37ABE',
  // Warm Accents
  tangerine: '#EB970C',
  brightCoral: '#FC5E42',
  softRed: '#F3524E',
  // Mint & Dark
  mint: '#39B99F',
  teal: '#048074',
  midnight: '#010925',
};

// Preset Speech & Voice options
const VOICE_BUBBLE_OPTIONS = [
  'Urban',
  'Deep',
  'Country',
  'Southern',
  'Soft-Spoken',
  'Raspy',
  'Smooth',
  'Gravelly',
  'Formal',
  'Playful',
  'Sarcastic',
  'Flirty',
  'Fast-Talking',
  'Slow & Deliberate',
  'Other',
];

// Preset Body Type suggestions
const BODY_TYPE_SUGGESTIONS = [
  'Petite',
  'Athletic',
  'Curvy',
  'Muscular',
  'Slim',
  'Broad',
  'Plus Size',
  'Other',
];

// Relationship type options for family members
const RELATIONSHIP_OPTIONS = [
  'Mother',
  'Father',
  'Sister',
  'Brother',
  'Daughter',
  'Son',
  'Cousin',
  'Aunt',
  'Uncle',
  'Grandparent',
  'Guardian',
  'Other',
];

interface CreateCharacterViewProps {
  existingCharacter?: Character | null;
  existingCharactersList: Character[];
  openRouterConfig: OpenRouterConfig;
  onSaveCharacter: (character: Character) => Promise<boolean> | boolean;
  onBack: () => void;
  onStartChat?: (character: Character) => void;
  onOpenLibrary?: () => void;
  onOpenPersonaLibrary?: () => void;
  onOpenLorebookLibrary?: () => void;
  onOpenGallery?: () => void;
  onOpenHome?: () => void;
}

const DRAFT_KEY = 'colorpop_create_character_draft_v1';

export const CreateCharacterView: React.FC<CreateCharacterViewProps> = ({
  existingCharacter,
  existingCharactersList,
  openRouterConfig,
  onSaveCharacter,
  onBack,
  onStartChat,
  onOpenLibrary,
  onOpenPersonaLibrary,
  onOpenLorebookLibrary,
  onOpenGallery,
  onOpenHome,
}) => {
  // ---------------------------------------------------------------------------
  // STATE MANAGEMENT
  // ---------------------------------------------------------------------------

  // Drawers
  const [leftDrawerOpen, setLeftDrawerOpen] = useState(false);
  const [rightDrawerOpen, setRightDrawerOpen] = useState(false);

  // Accordion Section Toggles
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    basic: true,
    physical: true,
    speech: false,
    personality: true,
    family: false,
    story: true,
    metadata: false,
  });

  // Basic Information
  const [name, setName] = useState('');
  const [nicknames, setNicknames] = useState<string[]>([]);
  const [nicknameInput, setNicknameInput] = useState('');
  const [age, setAge] = useState('');
  const [manualAgeOverride, setManualAgeOverride] = useState(false);
  const [ethnicity, setEthnicity] = useState('');
  const [birthday, setBirthday] = useState(''); // e.g. "10/24"
  const [birthYear, setBirthYear] = useState(''); // e.g. "1998"
  const [zodiacSign, setZodiacSign] = useState<string>('');

  // Avatar
  const [avatar, setAvatar] = useState('/lucious.jpg');
  const [showAvatarUrlModal, setShowAvatarUrlModal] = useState(false);
  const [avatarUrlInput, setAvatarUrlInput] = useState('');

  // Physical Appearance
  const [height, setHeight] = useState('');
  const [bodyType, setBodyType] = useState('');
  const [scars, setScars] = useState<FeatureMark[]>([]);
  const [birthmarks, setBirthmarks] = useState<FeatureMark[]>([]);
  const [tattoos, setTattoos] = useState<FeatureMark[]>([]);
  const [hairColor, setHairColor] = useState('');
  const [eyeColor, setEyeColor] = useState('');
  const [physicalDescription, setPhysicalDescription] = useState('');

  // Speech and Voice
  const [voiceDescription, setVoiceDescription] = useState('');
  const [selectedVoiceTags, setSelectedVoiceTags] = useState<string[]>([]);
  const [customVoiceInput, setCustomVoiceInput] = useState('');

  // Personality and History
  const [personality, setPersonality] = useState('');
  const [learnedPreferencesText, setLearnedPreferencesText] = useState('');
  const [backstory, setBackstory] = useState('');

  // Spouse & Family System
  const [spouseName, setSpouseName] = useState('');
  const [spouseStatus, setSpouseStatus] = useState('Married');
  const [spouseCharacterId, setSpouseCharacterId] = useState('');
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);

  // Story and Scenario
  const [scenario, setScenario] = useState('');
  const [firstMes, setFirstMes] = useState('');
  const [pov, setPov] = useState<'first_person' | 'third_person'>('third_person');

  // Metadata / Custom JSON Fields
  const [tags, setTags] = useState<string[]>(['Roleplay', 'Original']);
  const [tagInput, setTagInput] = useState('');
  const [summary, setSummary] = useState('');
  const [customFields, setCustomFields] = useState<Record<string, any>>({});
  const [mesExample, setMesExample] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [postHistoryInstructions, setPostHistoryInstructions] = useState('');
  const [alternateGreetings, setAlternateGreetings] = useState<string[]>([]);
  const [creatorNotes, setCreatorNotes] = useState('');

  // Draft & UI status
  const [draftStatus, setDraftStatus] = useState<'saved' | 'unsaved' | 'restored'>('saved');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [createdSuccessChar, setCreatedSuccessChar] = useState<Character | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showAiCreator, setShowAiCreator] = useState(false);
  const [aiDescription, setAiDescription] = useState('');
  const [isGeneratingCharacter, setIsGeneratingCharacter] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  // Toggle Accordion Section
  const toggleSection = (sectionKey: string) => {
    setOpenSections((prev) => ({ ...prev, [sectionKey]: !prev[sectionKey] }));
  };

  // Toast Notification Trigger
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // ---------------------------------------------------------------------------
  // INITIALIZATION & DRAFT LOADING
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (existingCharacter) {
      populateFromCharacter(existingCharacter);
      if (existingCharacter.customFields?.importWarning) showToast(existingCharacter.customFields.importWarning);
      setDraftStatus('saved');
    } else {
      // Check if draft exists in localStorage
      try {
        const rawDraft = localStorage.getItem(DRAFT_KEY);
        if (rawDraft) {
          const draftObj = JSON.parse(rawDraft);
          populateFromCharacter(draftObj);
          setDraftStatus('restored');
          showToast('Restored unfinished character draft!');
        }
      } catch (err) {
        console.warn('Could not read character draft:', err);
      }
    }
  }, [existingCharacter]);

  const populateFromCharacter = (char: Partial<Character>) => {
    setName(char.name || '');
    setNicknames(char.nicknames || []);
    setAge(char.age || '');
    setEthnicity(char.ethnicity || '');
    setBirthday(char.birthday || '');
    setBirthYear(char.birthYear || '');
    setZodiacSign(char.zodiacSign || '');
    setAvatar(char.avatar || '/lucious.jpg');
    setHeight(char.height || '');
    setBodyType(char.bodyType || '');
    setScars(char.scars || []);
    setBirthmarks(char.birthmarks || []);
    setTattoos(char.tattoos || []);
    setHairColor(char.hairColor || '');
    setEyeColor(char.eyeColor || '');
    setPhysicalDescription(char.description || '');
    setVoiceDescription(char.voiceDescription || '');
    setSelectedVoiceTags(char.voiceTags || []);
    setPersonality(char.personality || '');
    setLearnedPreferencesText([...(char.learnedPreferences?.likes || []).map((value) => `Likes: ${value}`), ...(char.learnedPreferences?.dislikes || []).map((value) => `Dislikes: ${value}`)].join('\n'));
    setBackstory(char.backstory || '');
    setSpouseName(char.spouse?.name || '');
    setSpouseStatus(char.spouse?.relationshipStatus || 'Married');
    setSpouseCharacterId(char.spouse?.characterId || '');
    setFamilyMembers(char.familyMembers || []);
    setScenario(char.scenario || '');
    setFirstMes(char.first_mes || '');
    setPov(char.pov === 'first_person' ? 'first_person' : 'third_person');
    setTags(char.tags || []);
    setSummary(char.summary || '');
    setCustomFields(char.customFields || {});
    setMesExample(char.mes_example || '');
    setSystemPrompt(char.system_prompt || '');
    setPostHistoryInstructions(char.post_history_instructions || '');
    setAlternateGreetings(char.alternate_greetings || []);
    setCreatorNotes(char.creator_notes || '');
  };

  // ---------------------------------------------------------------------------
  // AUTOMATIC CALCULATIONS: ZODIAC & AGE
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (birthday) {
      const z = parseBirthdayToZodiac(birthday);
      if (z) {
        setZodiacSign(`${z.name} ${z.symbol}`);
      }
    }
  }, [birthday]);

  useEffect(() => {
    if (birthYear && !manualAgeOverride) {
      const computedAge = calculateAgeFromBirthYear(birthYear, birthday);
      if (computedAge) {
        setAge(computedAge);
      }
    }
  }, [birthYear, birthday, manualAgeOverride]);

  // Mark changes as unsaved
  const markUnsaved = () => {
    if (draftStatus !== 'unsaved') {
      setDraftStatus('unsaved');
    }
  };

  // ---------------------------------------------------------------------------
  // HANDLERS: BASIC & NICKNAMES
  // ---------------------------------------------------------------------------
  const handleAddNickname = () => {
    if (nicknameInput.trim() && !nicknames.includes(nicknameInput.trim())) {
      setNicknames([...nicknames, nicknameInput.trim()]);
      setNicknameInput('');
      markUnsaved();
    }
  };

  const handleRemoveNickname = (nk: string) => {
    setNicknames(nicknames.filter((n) => n !== nk));
    markUnsaved();
  };

  // ---------------------------------------------------------------------------
  // HANDLERS: FEATURE MARKS (SCARS, BIRTHMARKS, TATTOOS)
  // ---------------------------------------------------------------------------
  const addFeatureMark = (type: 'scar' | 'birthmark' | 'tattoo') => {
    const newMark: FeatureMark = {
      id: `mark_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      location: '',
      description: '',
    };
    if (type === 'scar') setScars([...scars, newMark]);
    if (type === 'birthmark') setBirthmarks([...birthmarks, newMark]);
    if (type === 'tattoo') setTattoos([...tattoos, newMark]);
    markUnsaved();
  };

  const updateFeatureMark = (
    type: 'scar' | 'birthmark' | 'tattoo',
    id: string,
    field: 'location' | 'description',
    val: string
  ) => {
    const updater = (list: FeatureMark[]) =>
      list.map((item) => (item.id === id ? { ...item, [field]: val } : item));
    if (type === 'scar') setScars(updater(scars));
    if (type === 'birthmark') setBirthmarks(updater(birthmarks));
    if (type === 'tattoo') setTattoos(updater(tattoos));
    markUnsaved();
  };

  const removeFeatureMark = (type: 'scar' | 'birthmark' | 'tattoo', id: string) => {
    if (type === 'scar') setScars(scars.filter((s) => s.id !== id));
    if (type === 'birthmark') setBirthmarks(birthmarks.filter((b) => b.id !== id));
    if (type === 'tattoo') setTattoos(tattoos.filter((t) => t.id !== id));
    markUnsaved();
  };

  // ---------------------------------------------------------------------------
  // HANDLERS: SPEECH & VOICE BUBBLE CHIPS
  // ---------------------------------------------------------------------------
  const toggleVoiceTag = (tag: string) => {
    if (selectedVoiceTags.includes(tag)) {
      setSelectedVoiceTags(selectedVoiceTags.filter((t) => t !== tag));
    } else {
      setSelectedVoiceTags([...selectedVoiceTags, tag]);
    }
    markUnsaved();
  };

  const addCustomVoiceTag = () => {
    if (customVoiceInput.trim() && !selectedVoiceTags.includes(customVoiceInput.trim())) {
      setSelectedVoiceTags([...selectedVoiceTags, customVoiceInput.trim()]);
      setCustomVoiceInput('');
      markUnsaved();
    }
  };

  // ---------------------------------------------------------------------------
  // HANDLERS: SPOUSE & FAMILY MEMBERS
  // ---------------------------------------------------------------------------
  const addFamilyMember = () => {
    const newMember: FamilyMember = {
      id: `fam_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: '',
      relationship: 'Sister',
      status: 'Alive',
      description: '',
      age: '',
    };
    setFamilyMembers([...familyMembers, newMember]);
    markUnsaved();
  };

  const updateFamilyMember = (id: string, key: keyof FamilyMember, val: any) => {
    setFamilyMembers(
      familyMembers.map((m) => (m.id === id ? { ...m, [key]: val } : m))
    );
    markUnsaved();
  };

  const removeFamilyMember = (id: string) => {
    setFamilyMembers(familyMembers.filter((m) => m.id !== id));
    markUnsaved();
  };

  // ---------------------------------------------------------------------------
  // DRAFT & SAVE LOGIC
  // ---------------------------------------------------------------------------
  const constructCharacterObject = (): Character => {
    const spouseObj: CharacterSpouse | undefined =
      spouseName.trim() || spouseCharacterId
        ? {
            name: spouseName.trim(),
            relationshipStatus: spouseStatus,
            characterId: spouseCharacterId || undefined,
          }
        : undefined;

    return {
      id: existingCharacter?.id || `char_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
      name: name.trim() || 'Draft Character',
      nicknames,
      age: age.trim(),
      ethnicity: ethnicity.trim(),
      birthday: birthday.trim(),
      birthYear: birthYear.trim(),
      zodiacSign,
      avatar: avatar || '/lucious.jpg',

      height: height.trim(),
      bodyType: bodyType.trim(),
      scars,
      birthmarks,
      tattoos,
      hairColor: hairColor.trim(),
      eyeColor: eyeColor.trim(),
      description: physicalDescription.trim(),

      voiceDescription: voiceDescription.trim(),
      voiceTags: selectedVoiceTags,

      personality: personality.trim(),
      learnedPreferences: {
        likes: learnedPreferencesText.split('\n').map((line) => line.trim()).filter((line) => /^likes?:/i.test(line)).map((line) => line.replace(/^likes?:\s*/i, '').trim()).filter(Boolean),
        dislikes: learnedPreferencesText.split('\n').map((line) => line.trim()).filter((line) => /^dislikes?:/i.test(line)).map((line) => line.replace(/^dislikes?:\s*/i, '').trim()).filter(Boolean),
        evidence: existingCharacter?.learnedPreferences?.evidence || [],
      },
      backstory: backstory.trim(),

      spouse: spouseObj,
      familyMembers,

      scenario: scenario.trim(),
      first_mes: firstMes.trim(),
      pov,

      summary: summary.trim() || physicalDescription.slice(0, 150) || 'Character in ColorPop Universe',
      mes_example: mesExample,
      system_prompt: systemPrompt,
      post_history_instructions: postHistoryInstructions,
      alternate_greetings: alternateGreetings,
      creator_notes: creatorNotes,
      tags: tags.length ? tags : ['Original'],
      customFields,
      createdAt: existingCharacter?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  const handleSaveDraft = () => {
    const charObj = constructCharacterObject();
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(charObj));
      setDraftStatus('saved');
      showToast('✧ Character draft saved locally!');
    } catch (err) {
      console.error('Failed to save draft:', err);
      showToast('⚠ Error saving draft');
    }
  };

  const handleGenerateCharacter = async () => {
    const seed = aiDescription.trim();
    if (!seed) {
      setValidationError('Add a short character description first.');
      return;
    }
    if (!openRouterConfig.apiKey.trim()) {
      setValidationError('Add your OpenRouter API key in Settings before using Create with AI.');
      return;
    }

    setIsGeneratingCharacter(true);
    setValidationError(null);
    try {
      const result = await sendOpenRouterChat(
        { ...openRouterConfig, maxTokens: Math.max(openRouterConfig.maxTokens || 1024, 2400), temperature: 0.7 },
        [
          {
            role: 'system',
            content: `You create complete, original roleplay character cards. Return only one valid JSON object, with no Markdown fences or commentary. Fill every requested field with useful, internally consistent details. Never write dialogue, thoughts, feelings, decisions, or actions for {{user}}. Use this schema: name (string), nicknames (string[]), age (string), ethnicity (string), birthday (string), birthYear (string), height (string), bodyType (string), scars/birthmarks/tattoos (arrays of {location,description}), hairColor (string), eyeColor (string), description (physical description), voiceDescription (string), voiceTags (string[]), personality (detailed traits, habits, flaws, motives), learnedPreferences ({likes:string[],dislikes:string[]}), backstory (detailed history), spouse ({name,relationshipStatus} or null), familyMembers (array of {name,relationship,age,description,status}), scenario (immersive starting situation), first_mes (opening message in character voice), pov (first_person or third_person), summary (short card summary), mes_example (short voice example), system_prompt (character-specific rules), post_history_instructions (continuity guidance), alternate_greetings (string[]), creator_notes (string), tags (string[]), customFields (object). Use empty strings or empty arrays only when a field truly does not apply. Make the card feel specific to the user's description instead of generic.`
          },
          { role: 'user', content: `Create a complete character card from this short description. Fill in the rest with creative but plausible details. Keep the character's core identity faithful to the description.\n\nDescription: ${seed}` },
        ],
      );
      const jsonText = result.replace(/^\s*```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
      const parsed = JSON.parse(jsonText) as Partial<Character>;
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('The model did not return a character card. Please try again.');
      }
      const id = () => `mark_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const toStrings = (value: unknown): string[] => Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean) : [];
      const toMarks = (value: unknown): FeatureMark[] => Array.isArray(value) ? value.filter((item) => item && typeof item === 'object').map((item: any) => ({ id: typeof item.id === 'string' ? item.id : id(), location: String(item.location || ''), description: String(item.description || '') })) : [];
      const generated: Partial<Character> = {
        ...parsed,
        id: existingCharacter?.id,
        name: String(parsed.name || ''),
        nicknames: toStrings(parsed.nicknames),
        age: String(parsed.age || ''),
        ethnicity: String(parsed.ethnicity || ''),
        birthday: String(parsed.birthday || ''),
        birthYear: String(parsed.birthYear || ''),
        avatar: existingCharacter?.avatar || '/lucious.jpg',
        height: String(parsed.height || ''),
        bodyType: String(parsed.bodyType || ''),
        scars: toMarks(parsed.scars),
        birthmarks: toMarks(parsed.birthmarks),
        tattoos: toMarks(parsed.tattoos),
        hairColor: String(parsed.hairColor || ''),
        eyeColor: String(parsed.eyeColor || ''),
        description: String(parsed.description || ''),
        voiceDescription: String(parsed.voiceDescription || ''),
        voiceTags: toStrings(parsed.voiceTags),
        personality: String(parsed.personality || ''),
        learnedPreferences: {
          likes: toStrings(parsed.learnedPreferences?.likes),
          dislikes: toStrings(parsed.learnedPreferences?.dislikes),
          evidence: [],
        },
        backstory: String(parsed.backstory || ''),
        spouse: parsed.spouse && typeof parsed.spouse === 'object' ? {
          name: String(parsed.spouse.name || ''),
          relationshipStatus: String(parsed.spouse.relationshipStatus || 'Married'),
          characterId: parsed.spouse.characterId,
        } : undefined,
        familyMembers: Array.isArray(parsed.familyMembers) ? parsed.familyMembers.map((member: any) => ({
          id: typeof member?.id === 'string' ? member.id : id(),
          name: String(member?.name || ''),
          relationship: String(member?.relationship || 'Other'),
          age: String(member?.age || ''),
          description: String(member?.description || ''),
          status: String(member?.status || 'Alive'),
          characterId: member?.characterId,
        })) : [],
        scenario: String(parsed.scenario || ''),
        first_mes: String(parsed.first_mes || ''),
        pov: parsed.pov === 'first_person' ? 'first_person' : 'third_person',
        summary: String(parsed.summary || parsed.description || ''),
        mes_example: String(parsed.mes_example || ''),
        system_prompt: String(parsed.system_prompt || ''),
        post_history_instructions: String(parsed.post_history_instructions || ''),
        alternate_greetings: toStrings(parsed.alternate_greetings),
        creator_notes: String(parsed.creator_notes || ''),
        tags: toStrings(parsed.tags),
        customFields: parsed.customFields && typeof parsed.customFields === 'object' ? parsed.customFields : {},
      };
      if (!generated.name?.trim() || !generated.personality?.trim()) {
        throw new Error('The model left out the character name or personality. Try again with more detail.');
      }
      populateFromCharacter(generated);
      setOpenSections({ basic: true, physical: true, speech: true, personality: true, family: true, story: true, metadata: false });
      setDraftStatus('unsaved');
      setShowAiCreator(false);
      showToast('Character card filled in. Review it, then tap Create Character to save.');
    } catch (error) {
      console.error('AI character generation failed:', error);
      setValidationError(`Could not create the character with AI: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsGeneratingCharacter(false);
    }
  };

  const handleCreateCharacter = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSaving) return;
    setValidationError(null);

    if (!name.trim()) {
      setValidationError('Full Name is required.');
      setOpenSections((prev) => ({ ...prev, basic: true }));
      return;
    }

    if (!personality.trim()) {
      setValidationError('Personality description is required.');
      setOpenSections((prev) => ({ ...prev, personality: true }));
      return;
    }

    setIsSaving(true);
    const completedChar = constructCharacterObject();
    try {
      const saved = await onSaveCharacter(completedChar);
      if (saved === false) {
        setValidationError('Could not verify the character was saved. Your draft is still here—try Save again.');
        return;
      }

      // Keep the recovery draft until the durable device write is verified.
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {}
      setDraftStatus('saved');
      setCreatedSuccessChar(completedChar);
      showToast('Character saved to your library on this device.');
    } catch (err) {
      console.error('Character save failed:', err);
      setValidationError(`Could not save this character: ${err instanceof Error ? err.message : String(err)}. Your draft is still here—try again.`);
    } finally {
      setIsSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // IMPORT / EXPORT HANDLERS
  // ---------------------------------------------------------------------------
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsed = await parseCharacterFile(file);
      populateFromCharacter(parsed);
      markUnsaved();
      const importWarning = parsed.customFields?.importWarning;
      showToast(importWarning || `Successfully imported card: ${parsed.name || 'Character'}`);
    } catch (err: any) {
      console.error('Import error:', err);
      showToast(`⚠ Failed to import character: ${err.message || 'Invalid format'}`);
    } finally {
      // Allow importing the same card again after changing or correcting it.
      e.target.value = '';
    }
  };

  const handleExportJson = () => {
    const charObj = constructCharacterObject();
    exportCharacterJson(charObj);
    showToast('Exported character JSON card!');
  };

  // Avatar Upload / Remove
  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setAvatar(reader.result as string);
      markUnsaved();
    };
    reader.readAsDataURL(file);
  };

  // ---------------------------------------------------------------------------
  // RENDER UI
  // ---------------------------------------------------------------------------
  return (
    <div className="cp-page-transition min-h-screen bg-[#010925] text-white flex flex-col font-sans selection:bg-[#FF007E]/40 relative overflow-x-hidden">
      {/* Background Decorative Gloss Orbs with Palette Colors */}
      <div
        className="fixed top-0 left-1/4 w-[450px] h-[450px] rounded-full blur-[140px] pointer-events-none opacity-20"
        style={{ backgroundColor: PALETTE.hotPink }}
      />
      <div
        className="fixed top-1/3 right-1/4 w-[450px] h-[450px] rounded-full blur-[140px] pointer-events-none opacity-20"
        style={{ backgroundColor: PALETTE.electricBlue }}
      />
      <div
        className="fixed bottom-10 left-1/3 w-[450px] h-[450px] rounded-full blur-[140px] pointer-events-none opacity-15"
        style={{ backgroundColor: PALETTE.orchid }}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl bg-[#020E8B]/90 border-2 border-[#8DB2F6] text-white text-xs font-bold shadow-[0_0_25px_rgba(1,141,242,0.6)] backdrop-blur-md flex items-center space-x-2 animate-in fade-in slide-in-from-top-4 duration-200">
          <Sparkles className="w-4 h-4 text-[#FF7EB0]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Validation Error Banner */}
      {validationError && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl bg-[#F3524E]/90 border-2 border-[#FC5E42] text-white text-xs font-bold shadow-[0_0_25px_rgba(243,82,78,0.6)] backdrop-blur-md flex items-center space-x-2 animate-bounce">
          <AlertCircle className="w-4 h-4 text-white" />
          <span>{validationError}</span>
          <button onClick={() => setValidationError(null)} className="ml-2">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ----------------------------------------------------------------------- */}
      {/* 2. PAGE HEADER WITH MOBILE DRAWER ARROWS */}
      {/* ----------------------------------------------------------------------- */}
      <header
        className="sticky top-0 z-30 px-4 py-3 border-b-2 backdrop-blur-xl flex items-center justify-between"
        style={{
          backgroundColor: '#010925e6',
          borderColor: PALETTE.hotPink,
          boxShadow: '0 4px 20px rgba(255, 0, 126, 0.25)',
        }}
      >
        {/* Left Section: Drawer Arrow & Back Button */}
        <div className="flex items-center space-x-2">
          {/* Left Drawer Arrow Button (Always visible on mobile!) */}
          <button
            onClick={() => setLeftDrawerOpen(true)}
            className="p-2 rounded-xl transition-all flex items-center justify-center border shadow-md active:scale-95"
            style={{
              backgroundColor: `${PALETTE.navy}bb`,
              borderColor: PALETTE.electricBlue,
              color: PALETTE.periwinkle,
            }}
            title="Open Left Navigation Drawer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Back Button */}
          <button
            onClick={onBack}
            className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 border active:scale-95"
            style={{
              backgroundColor: `${PALETTE.midnight}cc`,
              borderColor: PALETTE.periwinkle,
              color: '#ffffff',
            }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Back</span>
          </button>
        </div>

        {/* Center Section: Page Title & Draft Status Badge */}
        <div className="text-center flex flex-col items-center">
          <h1
            className="text-base sm:text-lg font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r"
            style={{
              backgroundImage: `linear-gradient(to right, ${PALETTE.bubblegumPink}, ${PALETTE.periwinkle}, ${PALETTE.mint})`,
            }}
          >
            {existingCharacter ? 'Edit Character' : 'Create Character'}
          </h1>

          {/* Character Draft Status Badge */}
          <div className="flex items-center space-x-1 mt-0.5">
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{
                backgroundColor:
                  draftStatus === 'saved'
                    ? PALETTE.mint
                    : draftStatus === 'restored'
                    ? PALETTE.peach
                    : PALETTE.brightCoral,
              }}
            />
            <span
              className="text-[10px] font-mono font-semibold"
              style={{
                color:
                  draftStatus === 'saved'
                    ? PALETTE.mint
                    : draftStatus === 'restored'
                    ? PALETTE.peach
                    : PALETTE.coralPink,
              }}
            >
              {draftStatus === 'saved'
                ? 'Draft Saved'
                : draftStatus === 'restored'
                ? 'Draft Restored'
                : 'Unsaved Changes'}
            </span>
          </div>
        </div>

        {/* Right Section: Import, Quick Save & Right Drawer Arrow */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => importInputRef.current?.click()}
            className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-white transition-all flex items-center space-x-1 border shadow-md active:scale-95"
            style={{
              backgroundColor: `${PALETTE.orchid}55`,
              borderColor: PALETTE.orchid,
            }}
            title="Import a character card from PNG or JSON"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import</span>
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept=".json,.png,application/json,image/png"
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Quick Save Header Button */}
          <button
            onClick={handleSaveDraft}
            className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-white transition-all flex items-center space-x-1 border shadow-md active:scale-95"
            style={{
              backgroundColor: `${PALETTE.raspberry}cc`,
              borderColor: PALETTE.hotPink,
            }}
            title="Quick Save Draft"
          >
            <Save className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Save Draft</span>
          </button>

          {/* Right Drawer Arrow Button (Always visible on mobile!) */}
          <button
            onClick={() => setRightDrawerOpen(true)}
            className="p-2 rounded-xl transition-all flex items-center justify-center border shadow-md active:scale-95"
            style={{
              backgroundColor: `${PALETTE.deepRaspberry}bb`,
              borderColor: PALETTE.orchid,
              color: PALETTE.lavender,
            }}
            title="Open Right Navigation Drawer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </header>

      <section className="mx-auto w-full max-w-4xl px-4 py-3">
        <div className="rounded-2xl border border-[#FF007E]/60 bg-[#070f36]/90 p-3 shadow-[0_0_18px_rgba(255,0,126,.18)]">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#FF7EB0]">Choose how to start</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <button type="button" onClick={() => { setShowAiCreator((open) => !open); setValidationError(null); }} className="rounded-xl border border-[#FF7EB0]/70 bg-[#FF007E]/20 px-3 py-2.5 text-xs font-bold text-white hover:bg-[#FF007E]/35">
              ✨ Create with AI
            </button>
            <button type="button" onClick={() => importInputRef.current?.click()} className="rounded-xl border border-[#8DB2F6]/70 bg-[#020E8B]/30 px-3 py-2.5 text-xs font-bold text-white hover:bg-[#020E8B]/50">
              Import JSON/PNG
            </button>
            <button type="button" onClick={() => document.getElementById('character-basic-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} className="col-span-2 rounded-xl border border-white/20 bg-white/5 px-3 py-2.5 text-xs font-bold text-white hover:bg-white/10 sm:col-span-1">
              Create Manually
            </button>
          </div>
          {showAiCreator && (
            <div className="mt-3 rounded-xl border border-[#FF7EB0]/40 bg-black/20 p-3">
              <label htmlFor="ai-character-description" className="mb-1 block text-xs font-bold text-white">Describe your character</label>
              <textarea id="ai-character-description" rows={3} maxLength={1200} value={aiDescription} onChange={(event) => setAiDescription(event.target.value)} placeholder="Example: A guarded 27-year-old paramedic from New Orleans, funny under pressure, fiercely loyal, with a complicated family history." className="w-full resize-y rounded-xl border border-[#FF7EB0]/40 bg-[#010925] p-3 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#FF007E]" />
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="text-[11px] text-white/60">AI fills the whole card. Review and edit it before saving.</p>
                <button type="button" onClick={() => void handleGenerateCharacter()} disabled={isGeneratingCharacter} className="shrink-0 rounded-xl bg-[#FF007E] px-4 py-2.5 text-xs font-bold text-white disabled:cursor-wait disabled:opacity-60">
                  {isGeneratingCharacter ? 'Creating…' : 'Create with AI'}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ----------------------------------------------------------------------- */}
      {/* 9. LEFT SLIDING APP DRAWER (Navy, Electric Blue, Periwinkle) */}
      {/* ----------------------------------------------------------------------- */}
      <div
        className={`fixed inset-0 z-50 transition-all duration-300 ${
          leftDrawerOpen ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
      >
        {/* Backdrop: Tap outside to close */}
        <div
          onClick={() => setLeftDrawerOpen(false)}
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
            leftDrawerOpen ? 'opacity-100' : 'opacity-0'
          }`}
        />

        <aside
          className={`absolute top-0 bottom-0 left-0 w-80 sm:w-88 border-r-2 backdrop-blur-xl shadow-[10px_0_40px_rgba(1,141,242,0.4)] flex flex-col transform transition-transform duration-300 ease-out ${
            leftDrawerOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          style={{
            backgroundColor: `${PALETTE.midnight}fa`,
            borderColor: PALETTE.electricBlue,
          }}
        >
          {/* Drawer Header with Close Button */}
          <div
            className="p-4 border-b flex items-center justify-between"
            style={{
              backgroundColor: `${PALETTE.navy}ee`,
              borderColor: `${PALETTE.electricBlue}66`,
            }}
          >
            <div className="flex items-center space-x-2.5">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-md"
                style={{
                  background: `linear-gradient(135deg, ${PALETTE.navy}, ${PALETTE.electricBlue})`,
                }}
              >
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide">Left Navigation</h3>
                <p className="text-[10px]" style={{ color: PALETTE.periwinkle }}>
                  ColorPop Main Navigation
                </p>
              </div>
            </div>

            <button
              onClick={() => setLeftDrawerOpen(false)}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Drawer Links */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2 text-xs">
            <button
              onClick={() => {
                setLeftDrawerOpen(false);
                if (onOpenHome) onOpenHome();
                else onBack();
              }}
              className="w-full flex items-center space-x-3 p-3 rounded-2xl transition-all hover:bg-white/10 text-white font-semibold text-left border border-transparent hover:border-[#018DF2]"
            >
              <Home className="w-4 h-4" style={{ color: PALETTE.electricBlue }} />
              <span>Home</span>
            </button>

            <button
              onClick={() => {
                setLeftDrawerOpen(false);
                onBack();
              }}
              className="w-full flex items-center space-x-3 p-3 rounded-2xl transition-all hover:bg-white/10 text-white font-semibold text-left border border-transparent hover:border-[#018DF2]"
            >
              <MessageSquare className="w-4 h-4" style={{ color: PALETTE.periwinkle }} />
              <span>Chats</span>
            </button>

            <button
              onClick={() => {
                setLeftDrawerOpen(false);
                if (onOpenLibrary) onOpenLibrary();
                else onBack();
              }}
              className="w-full flex items-center space-x-3 p-3 rounded-2xl transition-all hover:bg-white/10 text-white font-semibold text-left border border-transparent hover:border-[#018DF2]"
            >
              <Users className="w-4 h-4" style={{ color: PALETTE.mint }} />
              <span>Character Library</span>
            </button>

            <button
              onClick={() => {
                setLeftDrawerOpen(false);
                if (onOpenPersonaLibrary) onOpenPersonaLibrary();
              }}
              className="w-full flex items-center space-x-3 p-3 rounded-2xl transition-all hover:bg-white/10 text-white font-semibold text-left border border-transparent hover:border-[#018DF2]"
            >
              <User className="w-4 h-4" style={{ color: PALETTE.bubblegumPink }} />
              <span>Persona Library</span>
            </button>

            <button
              onClick={() => {
                setLeftDrawerOpen(false);
                if (onOpenLorebookLibrary) onOpenLorebookLibrary();
              }}
              className="w-full flex items-center space-x-3 p-3 rounded-2xl transition-all hover:bg-white/10 text-white font-semibold text-left border border-transparent hover:border-[#018DF2]"
            >
              <BookOpen className="w-4 h-4" style={{ color: PALETTE.tangerine }} />
              <span>Lorebook Library</span>
            </button>

            <button
              onClick={() => {
                setLeftDrawerOpen(false);
                if (onOpenGallery) onOpenGallery();
              }}
              className="w-full flex items-center space-x-3 p-3 rounded-2xl transition-all hover:bg-white/10 text-white font-semibold text-left border border-transparent hover:border-[#018DF2]"
            >
              <ImageIcon className="w-4 h-4" style={{ color: PALETTE.orchid }} />
              <span>Gallery</span>
            </button>
          </div>

          <div
            className="p-3 border-t text-[11px] font-mono text-center"
            style={{
              backgroundColor: PALETTE.midnight,
              borderColor: `${PALETTE.electricBlue}44`,
              color: PALETTE.periwinkle,
            }}
          >
            ColorPop Luxury Y2K Suite
          </div>
        </aside>
      </div>

      {/* ----------------------------------------------------------------------- */}
      {/* 10. RIGHT SLIDING APP DRAWER (Deep Raspberry, Orchid, Lavender, Pink) */}
      {/* ----------------------------------------------------------------------- */}
      <div
        className={`fixed inset-0 z-50 transition-all duration-300 ${
          rightDrawerOpen ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
      >
        {/* Backdrop: Tap outside to close */}
        <div
          onClick={() => setRightDrawerOpen(false)}
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
            rightDrawerOpen ? 'opacity-100' : 'opacity-0'
          }`}
        />

        <aside
          className={`absolute top-0 bottom-0 right-0 w-80 sm:w-88 border-l-2 backdrop-blur-xl shadow-[-10px_0_40px_rgba(255,0,126,0.4)] flex flex-col transform transition-transform duration-300 ease-out ${
            rightDrawerOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          style={{
            backgroundColor: `${PALETTE.midnight}fa`,
            borderColor: PALETTE.hotPink,
          }}
        >
          {/* Drawer Header with Close Button */}
          <div
            className="p-4 border-b flex items-center justify-between"
            style={{
              backgroundColor: `${PALETTE.deepRaspberry}ee`,
              borderColor: `${PALETTE.hotPink}66`,
            }}
          >
            <div className="flex items-center space-x-2.5">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-md"
                style={{
                  background: `linear-gradient(135deg, ${PALETTE.deepRaspberry}, ${PALETTE.orchid})`,
                }}
              >
                <Sparkles className="w-4 h-4 text-[#FF7EB0]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide">Right Drawer Tools</h3>
                <p className="text-[10px]" style={{ color: PALETTE.lavender }}>
                  Character Utilities &amp; Settings
                </p>
              </div>
            </div>

            <button
              onClick={() => setRightDrawerOpen(false)}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Drawer Tools */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
            {/* Quick Character Overview */}
            <div
              className="p-3 rounded-2xl border space-y-1"
              style={{
                backgroundColor: `${PALETTE.raspberry}22`,
                borderColor: PALETTE.hotPink,
              }}
            >
              <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" style={{ color: PALETTE.bubblegumPink }} />
                Current Character
              </h4>
              <p className="text-[11px] text-white/80">
                {name ? name : 'Unnamed Character Draft'}
              </p>
            </div>

            {/* Relationship Links */}
            <div
              className="p-3 rounded-2xl border space-y-1.5"
              style={{
                backgroundColor: 'rgba(255,255,255,0.03)',
                borderColor: `${PALETTE.lavender}44`,
              }}
            >
              <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5" style={{ color: PALETTE.brightCoral }} />
                Relationship Links
              </h4>
              <p className="text-[10px] text-white/70">
                Spouse: {spouseName || 'None set'} | Family Members: {familyMembers.length}
              </p>
            </div>

            {/* Import / Export Controls */}
            <div
              className="p-3 rounded-2xl border space-y-2"
              style={{
                backgroundColor: 'rgba(255,255,255,0.03)',
                borderColor: `${PALETTE.orchid}55`,
              }}
            >
              <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5" style={{ color: PALETTE.peach }} />
                Import / Export Card
              </h4>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <label
                  className="px-3 py-2 rounded-xl text-[11px] font-bold text-white cursor-pointer transition-all border flex items-center justify-center space-x-1"
                  style={{
                    backgroundColor: `${PALETTE.orchid}33`,
                    borderColor: PALETTE.orchid,
                  }}
                >
                  <Upload className="w-3 h-3" />
                  <span>Import</span>
                  <input
                    type="file"
                    accept=".json,.png"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                <button
                  onClick={handleExportJson}
                  className="px-3 py-2 rounded-xl text-[11px] font-bold text-white transition-all border flex items-center justify-center space-x-1"
                  style={{
                    backgroundColor: `${PALETTE.deepRaspberry}44`,
                    borderColor: PALETTE.hotPink,
                  }}
                >
                  <Download className="w-3 h-3" />
                  <span>Export JSON</span>
                </button>
              </div>
            </div>
          </div>

          <div
            className="p-3 border-t text-[11px] font-mono text-center"
            style={{
              backgroundColor: PALETTE.midnight,
              borderColor: `${PALETTE.hotPink}44`,
              color: PALETTE.lavender,
            }}
          >
            Drawer actions preserve unsaved data
          </div>
        </aside>
      </div>

      {/* ----------------------------------------------------------------------- */}
      {/* MAIN CONTAINER */}
      {/* ----------------------------------------------------------------------- */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-3 sm:px-6 py-6 space-y-6 pb-32">
        {/* --------------------------------------------------------------------- */}
        {/* AVATAR SECTION BELOW HEADER */}
        {/* --------------------------------------------------------------------- */}
        <div className="flex flex-col items-center justify-center space-y-3 pt-2">
          <div className="relative group">
            {/* Glossy Pearl Rings */}
            <div
              className="w-28 h-28 sm:w-32 sm:h-32 rounded-full p-1 shadow-2xl transition-transform group-hover:scale-105"
              style={{
                background: `linear-gradient(135deg, ${PALETTE.bubblegumPink}, ${PALETTE.periwinkle}, ${PALETTE.mint})`,
                boxShadow: `0 0 35px ${PALETTE.hotPink}66`,
              }}
            >
              <img
                src={resolveImageUrl(avatar)}
                alt="Character Avatar"
                className="w-full h-full rounded-full object-cover border-2 border-white/80 bg-[#140410]"
              />
            </div>

            <label
              className="absolute bottom-0 right-0 p-2.5 rounded-full text-white cursor-pointer shadow-lg transition-transform hover:scale-110 border-2 border-white"
              style={{
                background: `linear-gradient(135deg, ${PALETTE.hotPink}, ${PALETTE.deepRaspberry})`,
              }}
              title="Upload Avatar Image"
            >
              <Upload className="w-4 h-4" />
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarFileUpload}
                className="hidden"
                ref={fileInputRef}
              />
            </label>
          </div>

          {/* Avatar Action Controls */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all border shadow-sm flex items-center space-x-1"
              style={{
                backgroundColor: `${PALETTE.navy}88`,
                borderColor: PALETTE.electricBlue,
              }}
            >
              <Upload className="w-3.5 h-3.5" style={{ color: PALETTE.periwinkle }} />
              <span>Upload Picture</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAvatarUrlInput(avatar.startsWith('data:') ? '' : avatar);
                setShowAvatarUrlModal(true);
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all border shadow-sm flex items-center space-x-1"
              style={{
                backgroundColor: `${PALETTE.deepRaspberry}66`,
                borderColor: PALETTE.orchid,
              }}
            >
              <LinkIcon className="w-3.5 h-3.5" style={{ color: PALETTE.peach }} />
              <span>Image URL</span>
            </button>

            <button
              type="button"
              onClick={() => setAvatar('/lucious.jpg')}
              className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-sm flex items-center space-x-1"
              style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderColor: `${PALETTE.coralPink}66`,
                color: PALETTE.coralPink,
              }}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (onOpenGallery) onOpenGallery();
                else showToast('✧ Image Generator Modal Ready');
              }}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white transition-all border shadow-md flex items-center space-x-1.5"
              style={{
                background: `linear-gradient(135deg, ${PALETTE.orchid}, ${PALETTE.raspberry})`,
                borderColor: PALETTE.bubblegumPink,
              }}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#FF7EB0]" />
              <span>Generate Picture</span>
            </button>
          </div>
        </div>

        {/* Modal for Avatar URL Input */}
        {showAvatarUrlModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div
              className="w-full max-w-md p-5 rounded-3xl border-2 space-y-4 shadow-2xl"
              style={{
                backgroundColor: PALETTE.midnight,
                borderColor: PALETTE.hotPink,
              }}
            >
              <div className="flex items-center justify-between border-b pb-3 border-white/10">
                <h3 className="font-bold text-white text-sm">Enter Avatar Image URL</h3>
                <button
                  onClick={() => setShowAvatarUrlModal(false)}
                  className="text-white/60 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <input
                type="text"
                placeholder="https://example.com/character-avatar.png"
                value={avatarUrlInput}
                onChange={(e) => setAvatarUrlInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs text-white bg-black/50 border focus:outline-none"
                style={{ borderColor: PALETTE.electricBlue }}
              />

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAvatarUrlModal(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (avatarUrlInput.trim()) {
                      setAvatar(avatarUrlInput.trim());
                      markUnsaved();
                    }
                    setShowAvatarUrlModal(false);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white"
                  style={{ backgroundColor: PALETTE.hotPink }}
                >
                  Apply Image URL
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --------------------------------------------------------------------- */}
        {/* 13. ACCORDION SECTIONS (1 to 6) */}
        {/* Pearl-white surfaces, rounded panels, Y2K chrome styling */}
        {/* --------------------------------------------------------------------- */}

        {/* ==================================================================== */}
        {/* SECTION 1: BASIC INFORMATION */}
        {/* ==================================================================== */}
        <section
          id="character-basic-section"
          className="rounded-3xl border-2 overflow-hidden transition-all shadow-xl scroll-mt-24"
          style={{
            backgroundColor: '#070f36',
            borderColor: PALETTE.electricBlue,
          }}
        >
          {/* Accordion Header */}
          <button
            type="button"
            onClick={() => toggleSection('basic')}
            className="w-full px-5 py-4 flex items-center justify-between text-left transition-colors"
            style={{
              background: `linear-gradient(90deg, ${PALETTE.navy}ee, ${PALETTE.midnight})`,
            }}
          >
            <div className="flex items-center space-x-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold shadow-md"
                style={{ backgroundColor: PALETTE.electricBlue }}
              >
                1
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">
                  Basic Information
                </h2>
                <p className="text-[11px]" style={{ color: PALETTE.periwinkle }}>
                  Full Name, Nicknames, Age, Ethnicity, Birthday &amp; Zodiac
                </p>
              </div>
            </div>

            <ChevronDown
              className={`w-5 h-5 text-white transition-transform duration-200 ${
                openSections.basic ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Accordion Body */}
          {openSections.basic && (
            <div className="p-5 space-y-4 text-xs text-white">
              {/* Full Name (Required) */}
              <div className="space-y-1.5">
                <label className="font-bold block text-white flex items-center gap-1">
                  Full Name <span style={{ color: PALETTE.orangeRed }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Lucious Vance"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    markUnsaved();
                  }}
                  required
                  className="w-full px-4 py-2.5 rounded-2xl bg-black/40 border text-white placeholder-white/30 focus:outline-none focus:ring-2"
                  style={{
                    borderColor: `${PALETTE.electricBlue}88`,
                  }}
                />
              </div>

              {/* Nicknames (Multiple with add/remove) */}
              <div className="space-y-1.5">
                <label className="font-bold block text-white">Nicknames / Aliases</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add nickname and press Add..."
                    value={nicknameInput}
                    onChange={(e) => setNicknameInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddNickname();
                      }
                    }}
                    className="flex-1 px-3.5 py-2 rounded-2xl bg-black/40 border text-white placeholder-white/30 focus:outline-none"
                    style={{ borderColor: `${PALETTE.periwinkle}66` }}
                  />
                  <button
                    type="button"
                    onClick={handleAddNickname}
                    className="px-4 py-2 rounded-2xl font-bold text-white transition-all shadow-md"
                    style={{ backgroundColor: PALETTE.electricBlue }}
                  >
                    Add
                  </button>
                </div>

                {/* Nickname Chips */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {nicknames.map((nk) => (
                    <span
                      key={nk}
                      className="px-3 py-1 rounded-full text-xs font-semibold text-white flex items-center gap-1.5 border shadow-sm"
                      style={{
                        backgroundColor: `${PALETTE.navy}aa`,
                        borderColor: PALETTE.periwinkle,
                      }}
                    >
                      <span>{nk}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveNickname(nk)}
                        className="hover:text-red-300"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Grid: Birthday, Birth Year, Zodiac, Age, Ethnicity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                {/* Birthday */}
                <div className="space-y-1">
                  <label className="font-bold text-white block">Birthday (MM/DD)</label>
                  <input
                    type="text"
                    placeholder="e.g. 10/24 or Oct 24"
                    value={birthday}
                    onChange={(e) => {
                      setBirthday(e.target.value);
                      markUnsaved();
                    }}
                    className="w-full px-3.5 py-2 rounded-xl bg-black/40 border text-white focus:outline-none"
                    style={{ borderColor: `${PALETTE.periwinkle}66` }}
                  />
                </div>

                {/* Birth Year */}
                <div className="space-y-1">
                  <label className="font-bold text-white block">Birth Year (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. 1998"
                    value={birthYear}
                    onChange={(e) => {
                      setBirthYear(e.target.value);
                      markUnsaved();
                    }}
                    className="w-full px-3.5 py-2 rounded-xl bg-black/40 border text-white focus:outline-none"
                    style={{ borderColor: `${PALETTE.periwinkle}66` }}
                  />
                </div>

                {/* Zodiac Sign (Calculated automatically) */}
                <div className="space-y-1">
                  <label className="font-bold block text-[#8DB2F6]">Calculated Zodiac</label>
                  <div
                    className="w-full px-3.5 py-2 rounded-xl border font-bold flex items-center justify-between"
                    style={{
                      backgroundColor: `${PALETTE.navy}66`,
                      borderColor: PALETTE.electricBlue,
                      color: PALETTE.periwinkle,
                    }}
                  >
                    <span>{zodiacSign || 'Select Birthday'}</span>
                    <Sparkles className="w-3.5 h-3.5" style={{ color: PALETTE.bubblegumPink }} />
                  </div>
                </div>

                {/* Age */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-white block">Age</label>
                    <button
                      type="button"
                      onClick={() => setManualAgeOverride(!manualAgeOverride)}
                      className="text-[10px] underline"
                      style={{ color: PALETTE.periwinkle }}
                    >
                      {manualAgeOverride ? 'Auto Calculate' : 'Manual Override'}
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. 28"
                    value={age}
                    onChange={(e) => {
                      setAge(e.target.value);
                      setManualAgeOverride(true);
                      markUnsaved();
                    }}
                    className="w-full px-3.5 py-2 rounded-xl bg-black/40 border text-white focus:outline-none"
                    style={{ borderColor: `${PALETTE.periwinkle}66` }}
                  />
                </div>

                {/* Ethnicity */}
                <div className="space-y-1 md:col-span-2">
                  <label className="font-bold text-white block">Ethnicity / Ancestry</label>
                  <input
                    type="text"
                    placeholder="e.g. Mixed Italian & Asian"
                    value={ethnicity}
                    onChange={(e) => {
                      setEthnicity(e.target.value);
                      markUnsaved();
                    }}
                    className="w-full px-3.5 py-2 rounded-xl bg-black/40 border text-white focus:outline-none"
                    style={{ borderColor: `${PALETTE.periwinkle}66` }}
                  />
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ==================================================================== */}
        {/* SECTION 2: PHYSICAL APPEARANCE */}
        {/* ==================================================================== */}
        <section
          className="rounded-3xl border-2 overflow-hidden transition-all shadow-xl"
          style={{
            backgroundColor: '#070f36',
            borderColor: PALETTE.orchid,
          }}
        >
          <button
            type="button"
            onClick={() => toggleSection('physical')}
            className="w-full px-5 py-4 flex items-center justify-between text-left transition-colors"
            style={{
              background: `linear-gradient(90deg, ${PALETTE.deepRaspberry}dd, ${PALETTE.midnight})`,
            }}
          >
            <div className="flex items-center space-x-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold shadow-md"
                style={{ backgroundColor: PALETTE.orchid }}
              >
                2
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">
                  Physical Appearance
                </h2>
                <p className="text-[11px]" style={{ color: PALETTE.lavender }}>
                  Height, Body Type, Scars, Birthmarks, Tattoos &amp; Features
                </p>
              </div>
            </div>

            <ChevronDown
              className={`w-5 h-5 text-white transition-transform duration-200 ${
                openSections.physical ? 'rotate-180' : ''
              }`}
            />
          </button>

          {openSections.physical && (
            <div className="p-5 space-y-4 text-xs text-white">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Height */}
                <div className="space-y-1">
                  <label className="font-bold text-white block">Height</label>
                  <input
                    type="text"
                    placeholder="e.g. 6'2&quot; or 188 cm"
                    value={height}
                    onChange={(e) => {
                      setHeight(e.target.value);
                      markUnsaved();
                    }}
                    className="w-full px-3.5 py-2 rounded-xl bg-black/40 border text-white focus:outline-none"
                    style={{ borderColor: `${PALETTE.lavender}66` }}
                  />
                </div>

                {/* Hair Color */}
                <div className="space-y-1">
                  <label className="font-bold text-white block">Hair Color</label>
                  <input
                    type="text"
                    placeholder="e.g. Raven Black"
                    value={hairColor}
                    onChange={(e) => {
                      setHairColor(e.target.value);
                      markUnsaved();
                    }}
                    className="w-full px-3.5 py-2 rounded-xl bg-black/40 border text-white focus:outline-none"
                    style={{ borderColor: `${PALETTE.lavender}66` }}
                  />
                </div>

                {/* Eye Color */}
                <div className="space-y-1">
                  <label className="font-bold text-white block">Eye Color</label>
                  <input
                    type="text"
                    placeholder="e.g. Deep Emerald"
                    value={eyeColor}
                    onChange={(e) => {
                      setEyeColor(e.target.value);
                      markUnsaved();
                    }}
                    className="w-full px-3.5 py-2 rounded-xl bg-black/40 border text-white focus:outline-none"
                    style={{ borderColor: `${PALETTE.lavender}66` }}
                  />
                </div>
              </div>

              {/* Body Type Suggestion Chips */}
              <div className="space-y-1.5">
                <label className="font-bold text-white block">Body Type</label>
                <div className="flex flex-wrap gap-2">
                  {BODY_TYPE_SUGGESTIONS.map((bt) => {
                    const isSelected = bodyType === bt;
                    return (
                      <button
                        type="button"
                        key={bt}
                        onClick={() => {
                          setBodyType(bt);
                          markUnsaved();
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                          isSelected ? 'shadow-md scale-105' : 'opacity-80 hover:opacity-100'
                        }`}
                        style={{
                          backgroundColor: isSelected
                            ? PALETTE.orchid
                            : `${PALETTE.midnight}aa`,
                          borderColor: isSelected ? PALETTE.bubblegumPink : PALETTE.lavender,
                          color: '#ffffff',
                        }}
                      >
                        {bt}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Repeatable Features: Scars, Birthmarks, Tattoos */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {/* Scars */}
                <div className="space-y-2 p-3 rounded-2xl bg-black/30 border border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs" style={{ color: PALETTE.brightCoral }}>
                      Scars
                    </span>
                    <button
                      type="button"
                      onClick={() => addFeatureMark('scar')}
                      className="p-1 rounded-lg text-white hover:bg-white/10"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {scars.map((scar) => (
                    <div key={scar.id} className="space-y-1 p-2 rounded-xl bg-black/40 border border-white/10">
                      <input
                        type="text"
                        placeholder="Location (e.g. Left Jaw)"
                        value={scar.location}
                        onChange={(e) => updateFeatureMark('scar', scar.id, 'location', e.target.value)}
                        className="w-full p-1.5 rounded-lg bg-black/50 text-[11px] text-white focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Description"
                        value={scar.description}
                        onChange={(e) => updateFeatureMark('scar', scar.id, 'description', e.target.value)}
                        className="w-full p-1.5 rounded-lg bg-black/50 text-[11px] text-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => removeFeatureMark('scar', scar.id)}
                        className="text-[10px] text-red-300 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                {/* Birthmarks */}
                <div className="space-y-2 p-3 rounded-2xl bg-black/30 border border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs" style={{ color: PALETTE.peach }}>
                      Birthmarks
                    </span>
                    <button
                      type="button"
                      onClick={() => addFeatureMark('birthmark')}
                      className="p-1 rounded-lg text-white hover:bg-white/10"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {birthmarks.map((bm) => (
                    <div key={bm.id} className="space-y-1 p-2 rounded-xl bg-black/40 border border-white/10">
                      <input
                        type="text"
                        placeholder="Location (e.g. Collarbone)"
                        value={bm.location}
                        onChange={(e) => updateFeatureMark('birthmark', bm.id, 'location', e.target.value)}
                        className="w-full p-1.5 rounded-lg bg-black/50 text-[11px] text-white focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Description"
                        value={bm.description}
                        onChange={(e) => updateFeatureMark('birthmark', bm.id, 'description', e.target.value)}
                        className="w-full p-1.5 rounded-lg bg-black/50 text-[11px] text-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => removeFeatureMark('birthmark', bm.id)}
                        className="text-[10px] text-red-300 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                {/* Tattoos */}
                <div className="space-y-2 p-3 rounded-2xl bg-black/30 border border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs" style={{ color: PALETTE.mint }}>
                      Tattoos
                    </span>
                    <button
                      type="button"
                      onClick={() => addFeatureMark('tattoo')}
                      className="p-1 rounded-lg text-white hover:bg-white/10"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {tattoos.map((tat) => (
                    <div key={tat.id} className="space-y-1 p-2 rounded-xl bg-black/40 border border-white/10">
                      <input
                        type="text"
                        placeholder="Location (e.g. Full Back Sleeve)"
                        value={tat.location}
                        onChange={(e) => updateFeatureMark('tattoo', tat.id, 'location', e.target.value)}
                        className="w-full p-1.5 rounded-lg bg-black/50 text-[11px] text-white focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Description"
                        value={tat.description}
                        onChange={(e) => updateFeatureMark('tattoo', tat.id, 'description', e.target.value)}
                        className="w-full p-1.5 rounded-lg bg-black/50 text-[11px] text-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => removeFeatureMark('tattoo', tat.id)}
                        className="text-[10px] text-red-300 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Physical Description Area */}
              <div className="space-y-1.5 pt-2">
                <label className="font-bold text-white block">Physical Description</label>
                <textarea
                  rows={4}
                  placeholder="Describe overall presence, posture, style, attire, scents, distinct physical traits..."
                  value={physicalDescription}
                  onChange={(e) => {
                    setPhysicalDescription(e.target.value);
                    markUnsaved();
                  }}
                  className="w-full p-3.5 rounded-2xl bg-black/40 border text-white placeholder-white/30 focus:outline-none resize-y"
                  style={{ borderColor: `${PALETTE.lavender}66` }}
                />
              </div>
            </div>
          )}
        </section>

        {/* ==================================================================== */}
        {/* SECTION 3: SPEECH AND VOICE */}
        {/* ==================================================================== */}
        <section
          className="rounded-3xl border-2 overflow-hidden transition-all shadow-xl"
          style={{
            backgroundColor: '#070f36',
            borderColor: PALETTE.teal,
          }}
        >
          <button
            type="button"
            onClick={() => toggleSection('speech')}
            className="w-full px-5 py-4 flex items-center justify-between text-left transition-colors"
            style={{
              background: `linear-gradient(90deg, ${PALETTE.teal}dd, ${PALETTE.midnight})`,
            }}
          >
            <div className="flex items-center space-x-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold shadow-md"
                style={{ backgroundColor: PALETTE.mint }}
              >
                3
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">
                  Speech &amp; Voice
                </h2>
                <p className="text-[11px]" style={{ color: PALETTE.mint }}>
                  Voice Description &amp; Selectable Tone / Speech Chips
                </p>
              </div>
            </div>

            <ChevronDown
              className={`w-5 h-5 text-white transition-transform duration-200 ${
                openSections.speech ? 'rotate-180' : ''
              }`}
            />
          </button>

          {openSections.speech && (
            <div className="p-5 space-y-4 text-xs text-white">
              {/* Voice Description Text Area */}
              <div className="space-y-1.5">
                <label className="font-bold text-white block">Speech / Voice Description</label>
                <textarea
                  rows={3}
                  placeholder="Describe voice pitch, accent, speech speed, favored phrases, emotional inflection..."
                  value={voiceDescription}
                  onChange={(e) => {
                    setVoiceDescription(e.target.value);
                    markUnsaved();
                  }}
                  className="w-full p-3.5 rounded-2xl bg-black/40 border text-white placeholder-white/30 focus:outline-none resize-y"
                  style={{ borderColor: `${PALETTE.teal}88` }}
                />
              </div>

              {/* Selectable Rounded Bubble Chips */}
              <div className="space-y-2">
                <label className="font-bold text-white block">Voice Style &amp; Tags</label>
                <div className="flex flex-wrap gap-2">
                  {VOICE_BUBBLE_OPTIONS.map((opt) => {
                    const isSelected = selectedVoiceTags.includes(opt);
                    return (
                      <button
                        type="button"
                        key={opt}
                        onClick={() => toggleVoiceTag(opt)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                          isSelected
                            ? 'shadow-[0_0_15px_rgba(57,185,159,0.5)] scale-105'
                            : 'opacity-70 hover:opacity-100'
                        }`}
                        style={{
                          backgroundColor: isSelected ? PALETTE.mint : 'rgba(0,0,0,0.4)',
                          borderColor: isSelected ? PALETTE.mint : `${PALETTE.teal}66`,
                          color: isSelected ? '#010925' : '#ffffff',
                        }}
                      >
                        {isSelected ? `✓ ${opt}` : opt}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Voice Tag Input */}
                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="Add custom voice tag..."
                    value={customVoiceInput}
                    onChange={(e) => setCustomVoiceInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomVoiceTag();
                      }
                    }}
                    className="flex-1 px-3.5 py-1.5 rounded-xl bg-black/40 border text-white text-xs placeholder-white/30 focus:outline-none"
                    style={{ borderColor: `${PALETTE.teal}66` }}
                  />
                  <button
                    type="button"
                    onClick={addCustomVoiceTag}
                    className="px-3.5 py-1.5 rounded-xl font-bold text-xs text-white"
                    style={{ backgroundColor: PALETTE.teal }}
                  >
                    Add Tag
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ==================================================================== */}
        {/* SECTION 4: PERSONALITY AND HISTORY */}
        {/* ==================================================================== */}
        <section
          className="rounded-3xl border-2 overflow-hidden transition-all shadow-xl"
          style={{
            backgroundColor: '#070f36',
            borderColor: PALETTE.hotPink,
          }}
        >
          <button
            type="button"
            onClick={() => toggleSection('personality')}
            className="w-full px-5 py-4 flex items-center justify-between text-left transition-colors"
            style={{
              background: `linear-gradient(90deg, ${PALETTE.raspberry}dd, ${PALETTE.midnight})`,
            }}
          >
            <div className="flex items-center space-x-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold shadow-md"
                style={{ backgroundColor: PALETTE.hotPink }}
              >
                4
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">
                  Personality &amp; History
                </h2>
                <p className="text-[11px]" style={{ color: PALETTE.bubblegumPink }}>
                  Traits, Mannerisms, Likes, Dislikes &amp; Backstory
                </p>
              </div>
            </div>

            <ChevronDown
              className={`w-5 h-5 text-white transition-transform duration-200 ${
                openSections.personality ? 'rotate-180' : ''
              }`}
            />
          </button>

          {openSections.personality && (
            <div className="p-5 space-y-4 text-xs text-white">
              {/* Personality (Required) */}
              <div className="space-y-1.5">
                <label className="font-bold block text-white flex items-center gap-1">
                  Personality Traits &amp; Emotional Behavior{' '}
                  <span style={{ color: PALETTE.orangeRed }}>*</span>
                </label>
                <textarea
                  rows={5}
                  placeholder="Describe personality traits, temperament, habits, mannerisms, likes, dislikes, emotional reactivity, and how they interact with others..."
                  value={personality}
                  onChange={(e) => {
                    setPersonality(e.target.value);
                    markUnsaved();
                  }}
                  required
                  className="w-full p-3.5 rounded-2xl bg-black/40 border text-white placeholder-white/30 focus:outline-none resize-y"
                  style={{ borderColor: `${PALETTE.hotPink}88` }}
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-white block">Confirmed Likes &amp; Dislikes</label>
                <p className="text-white/60">One per line, using “Likes: …” or “Dislikes: …”. This is editable character canon.</p>
                <textarea rows={3} value={learnedPreferencesText} onChange={(e) => { setLearnedPreferencesText(e.target.value); markUnsaved(); }} placeholder={'Likes: jazz\nDislikes: crowded rooms'} className="w-full p-3 rounded-2xl bg-black/40 border text-white placeholder-white/30 focus:outline-none resize-y" style={{ borderColor: `${PALETTE.hotPink}88` }} />
              </div>

              {/* Backstory (Optional) */}
              <div className="space-y-1.5">
                <label className="font-bold text-white block">Backstory &amp; History (Optional)</label>
                <textarea
                  rows={5}
                  placeholder="Include upbringing, pivotal life events, trauma, past achievements, secrets, and key relationships..."
                  value={backstory}
                  onChange={(e) => {
                    setBackstory(e.target.value);
                    markUnsaved();
                  }}
                  className="w-full p-3.5 rounded-2xl bg-black/40 border text-white placeholder-white/30 focus:outline-none resize-y"
                  style={{ borderColor: `${PALETTE.bubblegumPink}66` }}
                />
              </div>
            </div>
          )}
        </section>

        {/* ==================================================================== */}
        {/* SECTION 5: SPOUSE AND FAMILY SYSTEM */}
        {/* ==================================================================== */}
        <section
          className="rounded-3xl border-2 overflow-hidden transition-all shadow-xl"
          style={{
            backgroundColor: '#070f36',
            borderColor: PALETTE.tangerine,
          }}
        >
          <button
            type="button"
            onClick={() => toggleSection('family')}
            className="w-full px-5 py-4 flex items-center justify-between text-left transition-colors"
            style={{
              background: `linear-gradient(90deg, ${PALETTE.tangerine}aa, ${PALETTE.midnight})`,
            }}
          >
            <div className="flex items-center space-x-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold shadow-md"
                style={{ backgroundColor: PALETTE.tangerine }}
              >
                5
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">
                  Relationships &amp; Family
                </h2>
                <p className="text-[11px]" style={{ color: PALETTE.peach }}>
                  Spouse, Parents, Siblings, Children &amp; Family Links
                </p>
              </div>
            </div>

            <ChevronDown
              className={`w-5 h-5 text-white transition-transform duration-200 ${
                openSections.family ? 'rotate-180' : ''
              }`}
            />
          </button>

          {openSections.family && (
            <div className="p-5 space-y-5 text-xs text-white">
              {/* Current Spouse Section */}
              <div
                className="p-4 rounded-2xl border space-y-3"
                style={{
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  borderColor: `${PALETTE.tangerine}88`,
                }}
              >
                <h3 className="font-bold text-white text-xs flex items-center gap-1.5">
                  <Heart className="w-4 h-4" style={{ color: PALETTE.brightCoral }} />
                  Current Spouse / Partner
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1 sm:col-span-1">
                    <label className="font-bold text-white block">Spouse Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Vivienne Vance"
                      value={spouseName}
                      onChange={(e) => {
                        setSpouseName(e.target.value);
                        markUnsaved();
                      }}
                      className="w-full p-2 rounded-xl bg-black/50 border text-white focus:outline-none"
                      style={{ borderColor: `${PALETTE.peach}66` }}
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-1">
                    <label className="font-bold text-white block">Relationship Status</label>
                    <select
                      value={spouseStatus}
                      onChange={(e) => {
                        setSpouseStatus(e.target.value);
                        markUnsaved();
                      }}
                      className="w-full p-2 rounded-xl bg-[#010925] border text-white focus:outline-none"
                      style={{ borderColor: `${PALETTE.peach}66` }}
                    >
                      <option value="Married">Married</option>
                      <option value="Engaged">Engaged</option>
                      <option value="Partner">Partner</option>
                      <option value="Separated">Separated</option>
                      <option value="Divorced">Divorced</option>
                      <option value="Widowed">Widowed</option>
                    </select>
                  </div>

                  <div className="space-y-1 sm:col-span-1">
                    <label className="font-bold text-white block">Link Library Character</label>
                    <select
                      value={spouseCharacterId}
                      onChange={(e) => {
                        setSpouseCharacterId(e.target.value);
                        const found = existingCharactersList.find((c) => c.id === e.target.value);
                        if (found) setSpouseName(found.name);
                        markUnsaved();
                      }}
                      className="w-full p-2 rounded-xl bg-[#010925] border text-white focus:outline-none"
                      style={{ borderColor: `${PALETTE.peach}66` }}
                    >
                      <option value="">-- Unlinked / Custom Name --</option>
                      {existingCharactersList.map((char) => (
                        <option key={char.id} value={char.id}>
                          {char.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Repeatable Family Members */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-xs flex items-center gap-1.5">
                    <Users className="w-4 h-4" style={{ color: PALETTE.brightCoral }} />
                    Family Members ({familyMembers.length})
                  </h3>
                  <button
                    type="button"
                    onClick={addFamilyMember}
                    className="px-3.5 py-1.5 rounded-xl font-bold text-xs text-white transition-all flex items-center space-x-1 border"
                    style={{
                      backgroundColor: PALETTE.tangerine,
                      borderColor: PALETTE.peach,
                    }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Family Member</span>
                  </button>
                </div>

                {familyMembers.map((member) => (
                  <div
                    key={member.id}
                    className="p-3.5 rounded-2xl bg-black/40 border space-y-3"
                    style={{ borderColor: `${PALETTE.peach}44` }}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                      {/* Name */}
                      <div className="space-y-1">
                        <label className="font-bold text-white/80 block">Name</label>
                        <input
                          type="text"
                          placeholder="Full Name"
                          value={member.name}
                          onChange={(e) => updateFamilyMember(member.id, 'name', e.target.value)}
                          className="w-full p-2 rounded-xl bg-black/50 border text-white focus:outline-none"
                          style={{ borderColor: `${PALETTE.peach}44` }}
                        />
                      </div>

                      {/* Relationship */}
                      <div className="space-y-1">
                        <label className="font-bold text-white/80 block">Relationship</label>
                        <select
                          value={member.relationship}
                          onChange={(e) => updateFamilyMember(member.id, 'relationship', e.target.value)}
                          className="w-full p-2 rounded-xl bg-[#010925] border text-white focus:outline-none"
                          style={{ borderColor: `${PALETTE.peach}44` }}
                        >
                          {RELATIONSHIP_OPTIONS.map((rel) => (
                            <option key={rel} value={rel}>
                              {rel}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Status */}
                      <div className="space-y-1">
                        <label className="font-bold text-white/80 block">Status</label>
                        <select
                          value={member.status}
                          onChange={(e) => updateFamilyMember(member.id, 'status', e.target.value)}
                          className="w-full p-2 rounded-xl bg-[#010925] border text-white focus:outline-none"
                          style={{ borderColor: `${PALETTE.peach}44` }}
                        >
                          <option value="Alive">Alive</option>
                          <option value="Deceased">Deceased</option>
                          <option value="Unknown">Unknown</option>
                        </select>
                      </div>

                      {/* Age */}
                      <div className="space-y-1">
                        <label className="font-bold text-white/80 block">Age (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. 52"
                          value={member.age || ''}
                          onChange={(e) => updateFamilyMember(member.id, 'age', e.target.value)}
                          className="w-full p-2 rounded-xl bg-black/50 border text-white focus:outline-none"
                          style={{ borderColor: `${PALETTE.peach}44` }}
                        />
                      </div>
                    </div>

                    {/* Description & Link */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div className="sm:col-span-2 space-y-1">
                        <input
                          type="text"
                          placeholder="Description / Relationship details..."
                          value={member.description || ''}
                          onChange={(e) => updateFamilyMember(member.id, 'description', e.target.value)}
                          className="w-full p-2 rounded-xl bg-black/50 border text-white focus:outline-none"
                          style={{ borderColor: `${PALETTE.peach}44` }}
                        />
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <select
                          value={member.characterId || ''}
                          onChange={(e) => updateFamilyMember(member.id, 'characterId', e.target.value)}
                          className="flex-1 p-2 rounded-xl bg-[#010925] border text-white focus:outline-none text-[11px]"
                          style={{ borderColor: `${PALETTE.peach}44` }}
                        >
                          <option value="">-- Link Library Char --</option>
                          {existingCharactersList.map((char) => (
                            <option key={char.id} value={char.id}>
                              {char.name}
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={() => removeFamilyMember(member.id)}
                          className="p-2 rounded-xl text-red-300 hover:bg-red-900/30 border border-red-500/30"
                          title="Remove Family Member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ==================================================================== */}
        {/* SECTION 6: STORY AND SCENARIO */}
        {/* ==================================================================== */}
        <section
          className="rounded-3xl border-2 overflow-hidden transition-all shadow-xl"
          style={{
            backgroundColor: '#070f36',
            borderColor: PALETTE.brightCoral,
          }}
        >
          <button
            type="button"
            onClick={() => toggleSection('story')}
            className="w-full px-5 py-4 flex items-center justify-between text-left transition-colors"
            style={{
              background: `linear-gradient(90deg, ${PALETTE.brightCoral}bb, ${PALETTE.midnight})`,
            }}
          >
            <div className="flex items-center space-x-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold shadow-md"
                style={{ backgroundColor: PALETTE.brightCoral }}
              >
                6
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">
                  Story Setup &amp; Scenario
                </h2>
                <p className="text-[11px]" style={{ color: PALETTE.peach }}>
                  Current Situation, Initial Greeting Message &amp; POV Selector
                </p>
              </div>
            </div>

            <ChevronDown
              className={`w-5 h-5 text-white transition-transform duration-200 ${
                openSections.story ? 'rotate-180' : ''
              }`}
            />
          </button>

          {openSections.story && (
            <div className="p-5 space-y-4 text-xs text-white">
              {/* Scenario */}
              <div className="space-y-1.5">
                <label className="font-bold text-white block">Scenario / Story Context</label>
                <textarea
                  rows={4}
                  placeholder="Describe the starting situation, current location, active conflict, or premise for roleplay encounters..."
                  value={scenario}
                  onChange={(e) => {
                    setScenario(e.target.value);
                    markUnsaved();
                  }}
                  className="w-full p-3.5 rounded-2xl bg-black/40 border text-white placeholder-white/30 focus:outline-none resize-y"
                  style={{ borderColor: `${PALETTE.brightCoral}66` }}
                />
              </div>

              {/* Initial Message / First Greeting */}
              <div className="space-y-1.5">
                <label className="font-bold text-white block">
                  Initial Message (Greeting / First Message)
                </label>
                <textarea
                  rows={5}
                  placeholder="*He steps out onto the rain-slick balcony, adjusting his cuff links...* 'Took you long enough...'"
                  value={firstMes}
                  onChange={(e) => {
                    setFirstMes(e.target.value);
                    markUnsaved();
                  }}
                  className="w-full p-3.5 rounded-2xl bg-black/40 border text-white placeholder-white/30 focus:outline-none resize-y"
                  style={{ borderColor: `${PALETTE.brightCoral}66` }}
                />
              </div>

              {/* POV Selector */}
              <div className="space-y-1.5">
                <label className="font-bold text-white block">Perspective POV</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setPov('third_person');
                      markUnsaved();
                    }}
                    className={`p-3 rounded-2xl font-bold border transition-all text-center ${
                      pov === 'third_person' ? 'shadow-lg scale-[1.02]' : 'opacity-70'
                    }`}
                    style={{
                      backgroundColor: pov === 'third_person' ? PALETTE.brightCoral : 'black',
                      borderColor: PALETTE.peach,
                    }}
                  >
                    Third-Person POV (*He/She/They*)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPov('first_person');
                      markUnsaved();
                    }}
                    className={`p-3 rounded-2xl font-bold border transition-all text-center ${
                      pov === 'first_person' ? 'shadow-lg scale-[1.02]' : 'opacity-70'
                    }`}
                    style={{
                      backgroundColor: pov === 'first_person' ? PALETTE.brightCoral : 'black',
                      borderColor: PALETTE.peach,
                    }}
                  >
                    First-Person POV (*I/My*)
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Extended character card fields */}
        <section
          className="mb-6 rounded-3xl border-2 overflow-hidden transition-all shadow-xl"
          style={{ backgroundColor: '#070f36', borderColor: PALETTE.electricBlue }}
        >
          <button
            type="button"
            onClick={() => toggleSection('metadata')}
            className="w-full px-5 py-4 flex items-center justify-between text-left"
            style={{ background: `linear-gradient(90deg, ${PALETTE.navy}bb, ${PALETTE.midnight})` }}
          >
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">Card Metadata &amp; Extended Prompts</h2>
              <p className="text-[11px] text-[#8DB2F6]">Summary, tags, example dialogue, and card instructions</p>
            </div>
            <ChevronDown className={`w-5 h-5 text-white transition-transform ${openSections.metadata ? 'rotate-180' : ''}`} />
          </button>

          {openSections.metadata && (
            <div className="p-5 space-y-4 text-xs text-white">
              <div className="space-y-1.5">
                <label className="font-bold block">Short Summary</label>
                <textarea rows={3} value={summary} onChange={(e) => { setSummary(e.target.value); markUnsaved(); }}
                  className="w-full p-3 rounded-2xl bg-black/40 border text-white focus:outline-none resize-y"
                  style={{ borderColor: `${PALETTE.electricBlue}66` }} />
              </div>
              <div className="space-y-1.5">
                <label className="font-bold block">Tags (one per line)</label>
                <textarea rows={2} value={tags.join('\n')} onChange={(e) => { setTags(e.target.value.split('\n').map((tag) => tag.trim()).filter(Boolean)); markUnsaved(); }}
                  className="w-full p-3 rounded-2xl bg-black/40 border text-white focus:outline-none resize-y"
                  style={{ borderColor: `${PALETTE.electricBlue}66` }} />
              </div>
              <div className="space-y-1.5">
                <label className="font-bold block">Example Dialogue</label>
                <textarea rows={4} value={mesExample} onChange={(e) => { setMesExample(e.target.value); markUnsaved(); }}
                  className="w-full p-3 rounded-2xl bg-black/40 border text-white focus:outline-none resize-y"
                  style={{ borderColor: `${PALETTE.electricBlue}66` }} />
              </div>
              <div className="space-y-1.5">
                <label className="font-bold block">System Prompt</label>
                <textarea rows={4} value={systemPrompt} onChange={(e) => { setSystemPrompt(e.target.value); markUnsaved(); }}
                  className="w-full p-3 rounded-2xl bg-black/40 border text-white focus:outline-none resize-y"
                  style={{ borderColor: `${PALETTE.electricBlue}66` }} />
              </div>
              <div className="space-y-1.5">
                <label className="font-bold block">Post-History Instructions</label>
                <p className="text-[10px] text-[#ffd6eb]/65">Sent after the conversation history, immediately before the AI writes each reply. Use this for rules that must be followed every turn.</p>
                <textarea
                  rows={6}
                  maxLength={6000}
                  value={postHistoryInstructions}
                  onChange={(e) => { setPostHistoryInstructions(e.target.value); markUnsaved(); }}
                  placeholder={"Stay in first person as {{char}}. Write only {{char}}'s words, thoughts, and actions. Never write dialogue, thoughts, feelings, reactions, decisions, or actions for {{user}} or Emmy. Stop and leave Emmy's response entirely to the user."}
                  className="w-full p-3 rounded-2xl bg-black/40 border text-white focus:outline-none resize-y"
                  style={{ borderColor: `${PALETTE.hotPink}88` }}
                />
                <span className="block text-right text-[10px] text-white/45">{postHistoryInstructions.length}/6000</span>
              </div>
              <div className="space-y-1.5">
                <label className="font-bold block">Alternate Greetings (one per line)</label>
                <textarea rows={3} value={alternateGreetings.join('\n')} onChange={(e) => { setAlternateGreetings(e.target.value.split('\n').map((greeting) => greeting.trim()).filter(Boolean)); markUnsaved(); }}
                  className="w-full p-3 rounded-2xl bg-black/40 border text-white focus:outline-none resize-y"
                  style={{ borderColor: `${PALETTE.electricBlue}66` }} />
              </div>
              <div className="space-y-1.5">
                <label className="font-bold block">Creator Notes</label>
                <textarea rows={3} value={creatorNotes} onChange={(e) => { setCreatorNotes(e.target.value); markUnsaved(); }}
                  className="w-full p-3 rounded-2xl bg-black/40 border text-white focus:outline-none resize-y"
                  style={{ borderColor: `${PALETTE.electricBlue}66` }} />
              </div>
            </div>
          )}
        </section>
      </main>

      {/* ----------------------------------------------------------------------- */}
      {/* 14. STICKY SAVE BUTTONS BAR AT BOTTOM */}
      {/* ----------------------------------------------------------------------- */}
      <footer
        className="fixed bottom-0 left-0 right-0 z-30 p-3 sm:p-4 backdrop-blur-xl border-t-2"
        style={{
          backgroundColor: '#010925f0',
          borderColor: PALETTE.hotPink,
          boxShadow: '0 -4px 25px rgba(255, 0, 126, 0.3)',
        }}
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          {/* Save Draft */}
          <button
            type="button"
            onClick={handleSaveDraft}
            className="flex-1 py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm text-white transition-all border shadow-lg active:scale-95 flex items-center justify-center space-x-2"
            style={{
              backgroundColor: `${PALETTE.navy}cc`,
              borderColor: PALETTE.electricBlue,
            }}
          >
            <Save className="w-4 h-4" style={{ color: PALETTE.periwinkle }} />
            <span>Save Draft</span>
          </button>

          {/* Create Character */}
          <button
            type="button"
            onClick={() => void handleCreateCharacter()}
            disabled={isSaving}
            className="flex-1 py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm text-white transition-all shadow-xl active:scale-95 disabled:opacity-60 disabled:cursor-wait flex items-center justify-center space-x-2 border"
            style={{
              background: `linear-gradient(135deg, ${PALETTE.hotPink}, ${PALETTE.deepRaspberry})`,
              borderColor: PALETTE.bubblegumPink,
            }}
          >
            <Sparkles className="w-4 h-4 text-[#FF7EB0]" />
            <span>{isSaving ? 'Saving…' : existingCharacter ? 'Update Character' : 'Create Character'}</span>
          </button>
        </div>
      </footer>

      {/* Compact confirmation stays out of the way on small screens. */}
      {createdSuccessChar && (
        <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+5.25rem)] left-3 right-3 z-40 mx-auto max-w-xl rounded-2xl border border-[#39B99F] bg-[#07122f]/95 p-3 shadow-[0_0_24px_rgba(57,185,159,.3)] backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#048074] text-white">
              <Check className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-white">Saved to this device</p>
              <p className="truncate text-xs text-white/75">{createdSuccessChar.name} is in your Character Library.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setCreatedSuccessChar(null);
                if (onOpenLibrary) onOpenLibrary();
                else onBack();
              }}
              className="shrink-0 rounded-xl bg-[#FF007E] px-3 py-2 text-xs font-bold text-white"
            >
              Open Library
            </button>
            <button
              type="button"
              aria-label="Dismiss saved message"
              onClick={() => setCreatedSuccessChar(null)}
              className="shrink-0 rounded-lg p-2 text-white/70 hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
