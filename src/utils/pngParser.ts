import { Character, FeatureMark, Lorebook, Persona } from '../types/roleplay';

function decodeUtf8(bytes: Uint8Array): string {
  try {
    return new TextDecoder('utf-8').decode(bytes);
  } catch {
    let out = '';
    for (let i = 0; i < bytes.length; i++) {
      out += String.fromCharCode(bytes[i]);
    }
    return out;
  }
}

async function inflatePngText(bytes: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream === 'undefined') throw new Error('PNG text decompression is unavailable');
  const safeBuffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(safeBuffer).set(bytes);
  const stream = new Blob([safeBuffer]).stream().pipeThrough(new DecompressionStream('deflate'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

export async function parsePngMetadata(file: File): Promise<{ textChunks: Record<string, string>; base64Image: string }> {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  const isPng =
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a;

  const textChunks: Record<string, string> = {};

  if (isPng) {
    let offset = 8;
    while (offset < bytes.length) {
      if (offset + 8 > bytes.length) break;

      const length =
        (bytes[offset] << 24) |
        (bytes[offset + 1] << 16) |
        (bytes[offset + 2] << 8) |
        bytes[offset + 3];

      const type = String.fromCharCode(
        bytes[offset + 4],
        bytes[offset + 5],
        bytes[offset + 6],
        bytes[offset + 7]
      );

      const dataStart = offset + 8;
      const dataEnd = dataStart + length;

      if (dataEnd > bytes.length) break;

      if (type === 'tEXt' || type === 'zTXt' || type === 'iTXt') {
        const chunkData = bytes.slice(dataStart, dataEnd);
        const keywordEnd = chunkData.indexOf(0);
        if (keywordEnd > 0) {
          const keyword = decodeUtf8(chunkData.slice(0, keywordEnd));
          try {
            let textBytes: Uint8Array;
            if (type === 'tEXt') {
              textBytes = chunkData.slice(keywordEnd + 1);
            } else if (type === 'zTXt') {
              const compressionMethod = chunkData[keywordEnd + 1];
              if (compressionMethod !== 0) throw new Error('Unsupported PNG text compression');
              textBytes = await inflatePngText(chunkData.slice(keywordEnd + 2));
            } else {
              const compressionFlag = chunkData[keywordEnd + 1];
              const compressionMethod = chunkData[keywordEnd + 2];
              let cursor = keywordEnd + 3;
              const languageEnd = chunkData.indexOf(0, cursor);
              if (languageEnd < 0) throw new Error('Malformed PNG international text');
              cursor = languageEnd + 1;
              const translatedKeywordEnd = chunkData.indexOf(0, cursor);
              if (translatedKeywordEnd < 0) throw new Error('Malformed PNG international text');
              cursor = translatedKeywordEnd + 1;
              textBytes = compressionFlag === 1
                ? await inflatePngText(chunkData.slice(cursor))
                : chunkData.slice(cursor);
              if (compressionFlag === 1 && compressionMethod !== 0) throw new Error('Unsupported PNG text compression');
            }
            textChunks[keyword] = decodeUtf8(textBytes);
          } catch {
            // Ignore malformed or unsupported optional text metadata.
          }
        }
      }

      offset = dataEnd + 4;
    }
  }

  const base64Image = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error || new Error('Could not read the selected PNG file.'));
    reader.readAsDataURL(file);
  });

  return { textChunks, base64Image };
}

function asString(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return fallback;
}

function firstDefined(data: Record<string, any>, ...keys: string[]) {
  for (const key of keys) {
    if (data[key] !== undefined && data[key] !== null && data[key] !== '') return data[key];
  }
  return undefined;
}

function normalizeFeatureMarks(value: unknown): FeatureMark[] {
  if (!Array.isArray(value)) return [];
  return value.map((item: any, index) => {
    if (typeof item === 'string') return { id: `imported_mark_${index}`, location: '', description: item };
    return {
      id: asString(item?.id, `imported_mark_${index}`),
      location: asString(item?.location ?? item?.place),
      description: asString(item?.description ?? item?.details ?? item?.text),
    };
  });
}

function unwrapCard(parsed: any): Record<string, any> {
  let data = parsed?.data || parsed?.character || parsed;
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Character card JSON must contain an object.');
  // Some exporters wrap card data more than once.
  if (data.data && typeof data.data === 'object') data = data.data;
  return data;
}

function normalizeCharacterCard(parsed: any, fallbackName: string, avatar?: string): Partial<Character> {
  const data = unwrapCard(parsed);
  const backstory = firstDefined(data, 'backstory', 'history', 'background', 'lore');
  const summary = firstDefined(data, 'summary', 'short_description');
  const familyRaw = firstDefined(data, 'familyMembers', 'family_members', 'relatives');
  const familyMembers = Array.isArray(familyRaw) ? familyRaw.map((item: any, index) => ({
    id: asString(item?.id, `imported_family_${index}`),
    name: asString(item?.name, typeof item === 'string' ? item : ''),
    relationship: asString(item?.relationship ?? item?.relation, 'Other'),
    age: asString(item?.age),
    description: asString(item?.description),
    status: asString(item?.status, 'Unknown'),
    characterId: asString(item?.characterId ?? item?.character_id) || undefined,
  })) : [];
  const spouseRaw = firstDefined(data, 'spouse', 'current_spouse');
  const spouse = typeof spouseRaw === 'string'
    ? (spouseRaw ? { name: spouseRaw, relationshipStatus: '' } : undefined)
    : spouseRaw && typeof spouseRaw === 'object'
      ? { name: asString(spouseRaw.name), relationshipStatus: asString(spouseRaw.relationshipStatus ?? spouseRaw.relationship_status ?? spouseRaw.status), characterId: asString(spouseRaw.characterId ?? spouseRaw.character_id) || undefined }
      : undefined;

  const consumed = new Set([
    'name', 'nicknames', 'nickname', 'aliases', 'age', 'ethnicity', 'race', 'birthday', 'birth_date', 'birthYear', 'birth_year', 'zodiacSign', 'zodiac_sign',
    'avatar', 'image', 'height', 'bodyType', 'body_type', 'build', 'scars', 'birthmarks', 'tattoos',
    'hairColor', 'hair_color', 'eyeColor', 'eye_color', 'description', 'physical_description', 'appearance', 'looks',
    'voiceDescription', 'voice_description', 'voice', 'voiceTags', 'voice_tags', 'personality', 'backstory', 'history', 'background', 'lore', 'first_message', 'example', 'physicalDescription', 'creator_notes',
    'spouse', 'current_spouse', 'familyMembers', 'family_members', 'relatives', 'scenario', 'first_mes', 'greeting', 'firstMessage',
    'pov', 'summary', 'short_description', 'mes_example', 'example_dialogue', 'system_prompt', 'tags', 'alternate_greetings', 'creator_notes',
    'customFields', 'custom_fields', 'extensions', 'creator', 'character_version', 'spec', 'spec_version', 'post_history_instructions', 'postHistoryInstructions',
  ]);
  const rawCustom = firstDefined(data, 'customFields', 'custom_fields', 'extensions');
  const unknownFields = Object.fromEntries(Object.entries(data).filter(([key]) => !consumed.has(key)));
  const customFields = { ...(rawCustom && typeof rawCustom === 'object' && !Array.isArray(rawCustom) ? rawCustom : {}), ...unknownFields };

  const tagsRaw = firstDefined(data, 'tags');
  const greetingsRaw = firstDefined(data, 'alternate_greetings', 'alternateGreetings');
  const nicknamesRaw = firstDefined(data, 'nicknames', 'nickname', 'aliases');
  const rawPov = asString(firstDefined(data, 'pov', 'reply_pov'));
  const normalizedPov = /first/i.test(rawPov) ? 'first_person' : /third/i.test(rawPov) ? 'third_person' : rawPov;
  const description = asString(firstDefined(data, 'description', 'physical_description', 'appearance', 'looks'));
  const cardSummary = asString(summary, description.slice(0, 150));

  return {
    name: asString(firstDefined(data, 'name'), fallbackName),
    nicknames: Array.isArray(nicknamesRaw) ? nicknamesRaw.map((value: unknown) => asString(value)).filter(Boolean) : (typeof nicknamesRaw === 'string' ? nicknamesRaw.split(',').map((v: string) => v.trim()).filter(Boolean) : []),
    age: asString(firstDefined(data, 'age')),
    ethnicity: asString(firstDefined(data, 'ethnicity', 'race')),
    birthday: asString(firstDefined(data, 'birthday', 'birth_date')),
    birthYear: asString(firstDefined(data, 'birthYear', 'birth_year')),
    zodiacSign: asString(firstDefined(data, 'zodiacSign', 'zodiac_sign')),
    avatar: avatar || asString(firstDefined(data, 'avatar', 'image')),
    height: asString(firstDefined(data, 'height')),
    bodyType: asString(firstDefined(data, 'bodyType', 'body_type', 'build')),
    scars: normalizeFeatureMarks(data.scars),
    birthmarks: normalizeFeatureMarks(data.birthmarks),
    tattoos: normalizeFeatureMarks(data.tattoos),
    hairColor: asString(firstDefined(data, 'hairColor', 'hair_color')),
    eyeColor: asString(firstDefined(data, 'eyeColor', 'eye_color')),
    description,
    voiceDescription: asString(firstDefined(data, 'voiceDescription', 'voice_description', 'voice')),
    voiceTags: Array.isArray(firstDefined(data, 'voiceTags', 'voice_tags')) ? firstDefined(data, 'voiceTags', 'voice_tags').map((v: unknown) => asString(v)).filter(Boolean) : [],
    personality: asString(firstDefined(data, 'personality')),
    backstory: asString(backstory),
    spouse,
    familyMembers,
    scenario: asString(firstDefined(data, 'scenario')),
    first_mes: asString(firstDefined(data, 'first_mes', 'greeting', 'firstMessage', 'first_message'), 'Hello!'),
    pov: normalizedPov,
    summary: cardSummary,
    mes_example: asString(firstDefined(data, 'mes_example', 'example_dialogue', 'example')),
    system_prompt: asString(firstDefined(data, 'system_prompt')),
    post_history_instructions: asString(firstDefined(data, 'post_history_instructions', 'postHistoryInstructions') ?? firstDefined(rawCustom || {}, 'post_history_instructions', 'postHistoryInstructions')),
    tags: Array.isArray(tagsRaw) ? tagsRaw.map((v: unknown) => asString(v)).filter(Boolean) : (typeof tagsRaw === 'string' ? tagsRaw.split(',').map((v: string) => v.trim()).filter(Boolean) : []),
    alternate_greetings: Array.isArray(greetingsRaw) ? greetingsRaw.map((v: unknown) => asString(v)).filter(Boolean) : [],
    creator_notes: asString(firstDefined(data, 'creator_notes')),
    customFields,
  };
}

function decodeCardPayload(raw: string): any {
  const normalized = raw.replace(/\u0000/g, '').trim();
  const candidates = [normalized];
  const base64Payload = normalized.replace(/^data:[^,]*;base64,/i, '').replace(/\s+/g, '');
  const encoded = base64Payload.replace(/-/g, '+').replace(/_/g, '/');
  try {
    const binary = atob(encoded.padEnd(Math.ceil(encoded.length / 4) * 4, '='));
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    candidates.unshift(new TextDecoder('utf-8', { fatal: true }).decode(bytes).replace(/^\uFEFF/, '').trim());
  } catch {}
  for (const candidate of candidates) {
    try { return JSON.parse(candidate); } catch {}
    try { return JSON.parse(decodeURIComponent(candidate)); } catch {}
  }
  throw new Error('No valid character card data was found in this PNG.');
}

function hasCharacterCardData(parsed: any): boolean {
  try {
    const data = unwrapCard(parsed);
    return ['name', 'description', 'personality', 'scenario', 'first_mes', 'first_message', 'greeting', 'mes_example', 'backstory', 'history', 'system_prompt']
      .some((key) => typeof data[key] === 'string' && data[key].trim().length > 0);
  } catch {
    return false;
  }
}

export async function parseCharacterFile(file: File): Promise<Partial<Character>> {
  const normalizedName = file.name.toLowerCase();
  const fallbackName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') || 'Unnamed Character';
  const isJson = normalizedName.endsWith('.json') || file.type === 'application/json' || file.type.endsWith('+json');
  if (isJson) {
    return normalizeCharacterCard(JSON.parse(await file.text()), fallbackName);
  }

  // Some mobile file pickers omit the filename extension or MIME type. Detect
  // PNG by its signature too, while retaining the image-only fallback below.
  const signature = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  const hasPngSignature =
    signature[0] === 0x89 &&
    signature[1] === 0x50 &&
    signature[2] === 0x4e &&
    signature[3] === 0x47 &&
    signature[4] === 0x0d &&
    signature[5] === 0x0a &&
    signature[6] === 0x1a &&
    signature[7] === 0x0a;
  const isPng = normalizedName.endsWith('.png') || file.type === 'image/png' || hasPngSignature;
  if (!isPng) throw new Error('Choose a character PNG or JSON card.');

  const { textChunks, base64Image } = await parsePngMetadata(file);
  const metadataPriority = ['chara', 'ccv3', 'ccv2', 'character', 'character_card', 'character_card_v2', 'chara_card', 'chara_card_v2', 'chara_card_v3', 'description', 'comment'];
  const attempted = new Set<string>();
  const tryEmbeddedCard = (key: string, rawCard: string): Partial<Character> | undefined => {
    attempted.add(key.toLowerCase());
    try {
      const decoded = decodeCardPayload(rawCard);
      if (!hasCharacterCardData(decoded)) return undefined;
      return normalizeCharacterCard(decoded, fallbackName, base64Image);
    } catch (error) {
      console.warn(`Could not read embedded ${key} character card data:`, error);
      return undefined;
    }
  };

  for (const preferredKey of metadataPriority) {
    const entry = Object.entries(textChunks).find(([key]) => key.toLowerCase() === preferredKey);
    if (!entry) continue;
    const parsed = tryEmbeddedCard(entry[0], entry[1]);
    if (parsed) return parsed;
  }

  // PNG exporters use different text keywords. Check remaining chunks for
  // recognizable character data before treating the image as avatar-only.
  for (const [key, rawCard] of Object.entries(textChunks)) {
    if (attempted.has(key.toLowerCase())) continue;
    const parsed = tryEmbeddedCard(key, rawCard);
    if (parsed) return parsed;
  }

  return {
    name: fallbackName,
    avatar: base64Image,
    summary: 'PNG image imported as the character avatar. No embedded character card data was found.',
    description: '',
    personality: '',
    scenario: '',
    first_mes: 'Hello!',
    mes_example: '',
    tags: [],
    customFields: { importWarning: 'This PNG contains no readable character card metadata. Only its image was imported.' },
  };
}

function unwrapPersona(parsed: any): Record<string, any> {
  let data = parsed?.data || parsed?.persona || parsed?.profile || parsed;
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Persona card JSON must contain an object.');
  if (data.data && typeof data.data === 'object') data = data.data;
  return data;
}

export function normalizePersonaJson(parsed: any, fallbackName = 'Imported Persona', avatar?: string): Partial<Persona> {
  const data = unwrapPersona(parsed);
  const name = asString(firstDefined(data, 'name', 'full_name', 'username', 'display_name'), fallbackName);
  const nicknamesRaw = firstDefined(data, 'nicknames', 'nickname', 'aliases');
  const nicknames = Array.isArray(nicknamesRaw)
    ? nicknamesRaw.map((v: unknown) => asString(v)).filter(Boolean).join(', ')
    : asString(nicknamesRaw);
  const traitRaw = firstDefined(data, 'traits', 'tags', 'personality_traits');
  const traits = Array.isArray(traitRaw)
    ? traitRaw.map((v: unknown) => asString(v)).filter(Boolean)
    : typeof traitRaw === 'string' ? traitRaw.split(/[,;|]/).map((v: string) => v.trim()).filter(Boolean) : [];
  const defaultValue = firstDefined(data, 'is_default', 'isDefault');
  return {
    id: asString(data.id) || undefined,
    name,
    display_name: asString(firstDefined(data, 'display_name', 'nickname', 'name', 'full_name'), name),
    nicknames,
    occupation: asString(firstDefined(data, 'occupation', 'job', 'role', 'title')),
    avatar: avatar || asString(firstDefined(data, 'avatar', 'avatar_url', 'image', 'persona_image')),
    description: asString(firstDefined(data, 'persona_description', 'description', 'personality_description', 'persona', 'personality')),
    appearance: asString(firstDefined(data, 'appearance', 'physical_description', 'looks')),
    backstory: asString(firstDefined(data, 'backstory', 'history', 'background', 'lore', 'scenario')),
    speaking_style: asString(firstDefined(data, 'speaking_style', 'speakingStyle', 'voice_description', 'voice', 'style')),
    traits,
    is_default: defaultValue === true || defaultValue === 'true',
    favorite: data.favorite === true || data.favorite === 'true',
  };
}

export async function parsePersonaFile(file: File): Promise<Partial<Persona>> {
  const fallbackName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') || 'Unnamed Persona';
  if (file.name.toLowerCase().endsWith('.json')) {
    return normalizePersonaJson(JSON.parse(await file.text()), fallbackName);
  }
  if (!file.name.toLowerCase().endsWith('.png')) throw new Error('Choose a persona JSON or PNG card.');
  const { textChunks, base64Image } = await parsePngMetadata(file);
  const metadataPriority = ['persona', 'persona_card', 'profile', 'chara', 'ccv3', 'description', 'comment'];
  for (const preferredKey of metadataPriority) {
    const embedded = Object.entries(textChunks).find(([key]) => key.toLowerCase() === preferredKey)?.[1];
    if (!embedded) continue;
    try {
      return normalizePersonaJson(decodeCardPayload(embedded), fallbackName, base64Image);
    } catch (error) {
      console.warn(`Could not read embedded ${preferredKey} persona card data:`, error);
    }
  }
  return normalizePersonaJson({}, fallbackName, base64Image);
}

function normalizeLorebookJson(parsed: any, fallbackName: string, avatar?: string): Partial<Lorebook> {
  const data = parsed?.data || parsed?.world_info || parsed?.worldInfo || parsed;
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Lorebook JSON must contain an object.');
  const rawEntries = data.entries ?? data.world_info?.entries ?? [];
  const entriesList: any[] = Array.isArray(rawEntries) ? rawEntries : Object.values(rawEntries || {});
  const entries = entriesList.map((entry: any, index: number) => {
    const keysRaw = entry?.keys ?? entry?.key ?? entry?.keywords ?? [];
    const secondaryRaw = entry?.secondary_keys ?? entry?.keysecondary ?? entry?.key_secondary ?? [];
    const toList = (value: unknown): string[] => Array.isArray(value)
      ? value.map((item) => asString(item)).filter(Boolean)
      : typeof value === 'string' ? value.split(',').map((item) => item.trim()).filter(Boolean) : [];
    const rawPosition = entry?.position;
    const position = rawPosition === 'after_char' || rawPosition === 1 || rawPosition === '1' || rawPosition === 'after_character'
      ? 'after_char' : 'before_char';
    return {
      id: asString(entry?.id ?? entry?.uid, `entry_${index}`),
      keys: toList(keysRaw),
      secondary_keys: toList(secondaryRaw),
      comment: asString(entry?.comment ?? entry?.name ?? entry?.title),
      content: asString(entry?.content ?? entry?.text),
      constant: entry?.constant === true || entry?.constant === 'true',
      selective: entry?.selective === true || entry?.selective === 'true',
      insertion_order: Number(entry?.insertion_order ?? entry?.insertionOrder ?? entry?.order ?? index) || index,
      position: position as 'before_char' | 'after_char',
      enabled: entry?.enabled !== false,
    };
  });
  return {
    name: asString(data.name ?? data.title, fallbackName),
    description: asString(data.description ?? data.comment),
    avatar,
    scan_depth: Number(data.scan_depth ?? data.scanDepth ?? 4) || 4,
    token_budget: Number(data.token_budget ?? data.tokenBudget ?? 1500) || 1500,
    recursive_scanning: data.recursive_scanning === true || data.recursive_scanning === 'true' || data.recursiveScanning === true,
    entries,
  };
}

export async function parseLorebookFile(file: File): Promise<Partial<Lorebook>> {
  const fallbackName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') || 'Imported Lorebook';
  if (file.name.toLowerCase().endsWith('.json')) {
    return normalizeLorebookJson(JSON.parse(await file.text()), fallbackName);
  }
  if (!file.name.toLowerCase().endsWith('.png')) throw new Error('Choose a lorebook PNG or JSON file.');
  const { textChunks, base64Image } = await parsePngMetadata(file);
  const rawLore = textChunks['lorebook'] || textChunks['world_info'] || textChunks['chara'];
  if (rawLore) {
    try {
      const parsed = decodeCardPayload(rawLore);
      return normalizeLorebookJson(parsed, fallbackName, base64Image);
    } catch (error) {
      console.warn('Could not read embedded lorebook data:', error);
    }
  }
  return {
    name: fallbackName,
    description: 'Imported Lorebook',
    avatar: base64Image,
    entries: [],
  };
}

export function exportCharacterJson(character: Character) {
  const v2Card = {
    spec: 'chara_card_v2',
    spec_version: '2.0',
    data: {
      name: character.name,
      nicknames: character.nicknames || [],
      age: character.age || '',
      ethnicity: character.ethnicity || '',
      birthday: character.birthday || '',
      birthYear: character.birthYear || '',
      zodiacSign: character.zodiacSign || '',
      avatar: character.avatar,
      height: character.height || '',
      bodyType: character.bodyType || '',
      scars: character.scars || [],
      birthmarks: character.birthmarks || [],
      tattoos: character.tattoos || [],
      hairColor: character.hairColor || '',
      eyeColor: character.eyeColor || '',
      voiceDescription: character.voiceDescription || '',
      voiceTags: character.voiceTags || [],
      backstory: character.backstory || '',
      spouse: character.spouse,
      familyMembers: character.familyMembers || [],
      pov: character.pov || 'third_person',
      description: character.description,
      personality: character.personality,
      scenario: character.scenario,
      first_mes: character.first_mes,
      mes_example: character.mes_example,
      creator_notes: character.creator_notes || 'Created with Pretty Little Fantasies',
      system_prompt: character.system_prompt || '',
      post_history_instructions: character.post_history_instructions || '',
      tags: character.tags,
      alternate_greetings: character.alternate_greetings || [],
      customFields: character.customFields || {},
    },
  };

  const blob = new Blob([JSON.stringify(v2Card, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${character.name.toLowerCase().replace(/\s+/g, '_')}_card.json`;
  a.click();
  URL.revokeObjectURL(url);
}
