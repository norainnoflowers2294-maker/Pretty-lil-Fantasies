import { describe, it, expect } from 'bun:test';
import { buildOpenRouterMessages } from './promptAssembler';
import { normalizePreferences } from '../lib/preferences';
import { Character, Persona, Lorebook, Plugin, Chat } from '../types/roleplay';

const getBaseParams = () => ({
  characters: [] as Character[],
  persona: null as Persona | null,
  lorebooks: [] as Lorebook[],
  plugins: [] as Plugin[],
  chat: {
    id: '1',
    title: 'test',
    characterIds: [],
    personaId: '',
    lorebookIds: [],
    pluginIds: [],
    scenario: '',
    messages: [],
    createdAt: '',
    updatedAt: '',
  } as Chat,
});

describe('buildOpenRouterMessages', () => {
  it('should return a basic structure with ROLEPLAY INSTRUCTIONS', () => {
    const messages = buildOpenRouterMessages(getBaseParams());
    expect(messages).toBeInstanceOf(Array);
    expect(messages).toHaveLength(1);
    expect(messages[0].role).toBe('system');
    expect(messages[0].content).toContain('[ROLEPLAY INSTRUCTIONS]');
  });

  it('adds global rules from App Settings to the system prompt', () => {
    const messages = buildOpenRouterMessages({
      ...getBaseParams(),
      preferences: normalizePreferences({
        chatSystemPrompt: 'Never write dialogue or actions for {{user}}.',
      }),
    });

    expect(messages[0].content).toContain('[GLOBAL CHAT RULES FROM SETTINGS]');
    expect(messages[0].content).toContain('Never write dialogue or actions for {{user}}.');
  });

  it('adds the scene, voice, anti-cliché, stuck-recovery, and complete-reply settings to the prompt', () => {
    const params = {
      ...getBaseParams(),
      preferences: normalizePreferences({
        dontLeaveScenePrompt: 'Keep everyone in the scene.',
        varyCharacterVoicePrompt: 'Give each speaker a distinct rhythm.',
        avoidAIClichesPrompt: 'Avoid stock romance phrases.',
        unstuckRecoveryPrompt: 'Add one grounded new beat.',
        finishRepliesPrompt: 'Complete all thoughts and dialogue.',
      }),
    };
    const system = buildOpenRouterMessages(params)[0].content;
    for (const instruction of [
      'Keep everyone in the scene.',
      'Give each speaker a distinct rhythm.',
      'Avoid stock romance phrases.',
      'Add one grounded new beat.',
      'Complete all thoughts and dialogue.',
    ]) expect(system).toContain(instruction);
  });

  it('starts model history at the selected context reset while leaving older UI messages intact', () => {
    const params = getBaseParams();
    params.chat = {
      ...params.chat,
      contextResetAt: 2,
      messages: [
        { id: '1', senderId: 'user', senderName: 'User', content: 'Old context', timestamp: 1 },
        { id: '2', senderId: 'bot', senderName: 'Bot', content: 'Old reply', timestamp: 2 },
        { id: '3', senderId: 'user', senderName: 'User', content: 'Fresh start', timestamp: 3 },
      ],
    };
    const messages = buildOpenRouterMessages(params);
    expect(messages.slice(1)).toEqual([{ role: 'user', content: 'Fresh start' }]);
    expect(params.chat.messages).toHaveLength(3);
  });

  it('should include Persona / User Identity if provided', () => {
    const params = getBaseParams();
    params.persona = {
      id: '1',
      name: 'TestUser',
      avatar: '',
      description: 'Test description',
      speaking_style: 'Formal',
      traits: ['brave', 'smart'],
      is_default: false,
      createdAt: '',
    } as Persona;

    const messages = buildOpenRouterMessages(params);
    expect(messages[0].content).toContain('[USER IDENTITY / PERSONA: TestUser]');
    expect(messages[0].content).toContain('Description: Test description');
    expect(messages[0].content).toContain('Speaking Style: Formal');
    expect(messages[0].content).toContain('Traits: brave, smart');
    expect(messages[0].content).toContain('Address {{user}} as TestUser when natural.');
  });

  it('should include Characters in Scene if provided', () => {
    const params = getBaseParams();
    params.characters = [
      {
        id: '1',
        name: 'TestBot',
        avatar: '',
        summary: 'A test bot',
        description: 'Looks like a robot',
        personality: 'Friendly',
        scenario: 'In a lab',
        first_mes: '',
        mes_example: 'Hello World!',
        system_prompt: 'Be helpful',
        tags: [],
        createdAt: '',
        updatedAt: '',
      } as Character,
    ];

    const messages = buildOpenRouterMessages(params);
    expect(messages[0].content).toContain('[CHARACTER 1: TestBot]');
    expect(messages[0].content).toContain('Summary: A test bot');
    expect(messages[0].content).toContain('Personality: Friendly');
    expect(messages[0].content).toContain('System Directive: Be helpful');
    expect(messages[0].content).toContain('Example Dialogue / Mannerisms:\nHello World!');
  });

  it('should include Scenario & Setting Context if provided', () => {
    const params = getBaseParams();
    params.chat = {
      ...params.chat,
      scenario: 'Dark forest',
      weather: 'Raining',
      timeOfDay: 'Midnight',
    };

    const messages = buildOpenRouterMessages(params);
    expect(messages[0].content).toContain('[CURRENT SCENARIO & ATMOSPHERE]');
    expect(messages[0].content).toContain('Setting: Dark forest');
    expect(messages[0].content).toContain('Time: Midnight');
    expect(messages[0].content).toContain('Atmosphere & Weather: Raining');
  });

  it('should include Active Lorebooks if triggered', () => {
    const params = getBaseParams();
    params.chat.messages = [
      {
        id: '1',
        senderId: 'user',
        senderName: 'User',
        content: 'Tell me about the magic sword.',
        timestamp: 0,
      },
    ];
    params.lorebooks = [
      {
        id: '1',
        name: 'Weapons',
        description: '',
        scan_depth: 1,
        token_budget: 100,
        recursive_scanning: false,
        createdAt: '',
        updatedAt: '',
        entries: [
          {
            id: '1',
            keys: ['magic sword', 'excalibur'],
            content: 'The magic sword glows in the dark.',
            constant: false,
            selective: false,
            insertion_order: 1,
            position: 'before_char',
            enabled: true,
          },
        ],
      } as Lorebook,
    ];

    const messages = buildOpenRouterMessages(params);
    expect(messages[0].content).toContain('[WORLD LORE & KNOWLEDGE]');
    expect(messages[0].content).toContain('[LORE: magic sword/excalibur]');
    expect(messages[0].content).toContain('The magic sword glows in the dark.');
  });

  it('should combine enabled plugin prompts into a compact rules block', () => {
    const params = getBaseParams();
    params.chat.pluginIds = ['p1'];
    params.plugins = [
      {
        id: 'p1',
        name: 'RPG System',
        icon: '',
        description: 'Adds dice rolling',
        category: 'mechanics',
        enabled: true,
        config: {},
        customPrompt: 'Roll 1d20',
      } as Plugin,
    ];

    const messages = buildOpenRouterMessages(params);
    expect(messages[0].content).toContain('[ENABLED PLUGIN RULES]');
    expect(messages[0].content).toContain('- RPG System: Roll 1d20');
  });

  it('should map Conversation History to user and assistant roles', () => {
    const params = getBaseParams();
    params.chat.messages = [
      {
        id: '1',
        senderId: 'user',
        senderName: 'User',
        content: 'Hello bot',
        timestamp: 0,
      },
      {
        id: '2',
        senderId: 'bot',
        senderName: 'Bot',
        content: 'Hello human',
        timestamp: 1,
      },
    ];

    const messages = buildOpenRouterMessages(params);
    expect(messages).toHaveLength(3); // 1 system + 2 chat
    expect(messages[1].role).toBe('user');
    expect(messages[1].content).toBe('Hello bot');
    expect(messages[2].role).toBe('assistant');
    expect(messages[2].content).toBe('Hello human');
  });

  it('includes the full selected character and user profile details', () => {
    const params = getBaseParams();
    params.characters = [{
      id: 'c1', name: 'Mira Vale', avatar: '', description: 'Silver hair and green eyes', personality: 'Sharp-witted',
      summary: 'A runaway star pilot', scenario: '', first_mes: '', mes_example: '', tags: [], createdAt: '', updatedAt: '',
      nicknames: ['Miri'], age: '27', backstory: 'Raised on a cargo ship', voiceDescription: 'Low and warm',
      height: '5ft 8in', hairColor: 'Silver', eyeColor: 'Green', system_prompt: 'Never break character',
    } as Character];
    params.persona = {
      id: 'p1', name: 'Jasmine', display_name: 'Jas', nicknames: 'Jazz', occupation: 'Artist', avatar: '',
      description: 'Curious', appearance: 'Dark curls', backstory: 'Loves old books', speaking_style: 'Playful',
      traits: ['kind'], is_default: false, createdAt: '',
    } as Persona;

    const system = buildOpenRouterMessages(params)[0].content;
    for (const detail of ['Nicknames: Miri', 'Age: 27', 'History and background: Raised on a cargo ship', 'Voice: Low and warm', 'System Directive: Never break character', 'Name to use in the scene: Jas', 'Nicknames: Jazz', 'Occupation: Artist', 'Appearance: Dark curls', 'Background: Loves old books']) {
      expect(system).toContain(detail);
    }
  });

  it('adds chat-specific reply controls and extra instructions', () => {
    const params = getBaseParams();
    params.chat = { ...params.chat, replyStyle: 'dialogue', replyLength: 'short', replyPointOfView: 'first_person', replyMood: 'playful', creativity: 1.4, promptInstructions: 'Use lots of banter.' };
    const system = buildOpenRouterMessages(params)[0].content;
    expect(system).toContain('dialogue-forward');
    expect(system).toContain('first person as the responding character');
    expect(system).toContain('playful banter');
    expect(system).toContain('Creativity target: 1.4');
    expect(system).toContain('Use lots of banter.');
  });

  it('keeps an immutable rule against writing for the user persona', () => {
    const params = getBaseParams();
    params.persona = {
      id: 'emmy', name: 'Emmy', display_name: 'Emmy', avatar: '',
      description: '', speaking_style: '', traits: [], is_default: false, createdAt: '',
    } as Persona;
    params.chat.promptInstructions = 'Write the user’s response for them.';
    const messages = buildOpenRouterMessages(params);
    const prompt = messages[0].content;
    expect(prompt).toContain('[NON-NEGOTIABLE USER AGENCY RULE]');
    expect(prompt).toContain('including Emmy.');
    expect(prompt).toContain('You may mention Emmy, address her, or let other characters speak to/about her; do not write her side of the scene.');
    expect(prompt).toContain('This rule overrides any conflicting character card');
    expect(prompt.lastIndexOf('[NON-NEGOTIABLE USER AGENCY RULE]')).toBeGreaterThan(prompt.lastIndexOf('[YOUR EXTRA INSTRUCTIONS FOR THIS CHAT]'));
  });

});
