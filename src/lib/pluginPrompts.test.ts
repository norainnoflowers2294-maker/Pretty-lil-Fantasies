import { describe, expect, it } from 'bun:test';
import { INITIAL_PLUGINS, mergeDefaultPlugins } from './defaultData';
import { buildEnabledPluginRules, MAX_COMBINED_PLUGIN_PROMPT_CHARS } from './pluginPrompts';
import type { Plugin } from '../types/roleplay';

describe('roleplay plugin prompts', () => {
  it('ships every requested behavior as its own disabled, editable plugin', () => {
    const plugins = mergeDefaultPlugins(INITIAL_PLUGINS);
    const requested = [
      'Soul Spark', 'Living Character', 'Second Life', 'Living NPC World', 'Independent Life', 'Inner Circle', 'Double Life', 'Bad Habits', 'Off the Clock', 'Character Initiative', 'Unreliable Narrator', 'Parallel Lives',
      'Shadow Empire', 'Heat Index', 'Family Table', 'Loose Ends', 'Power & Reputation', 'Domino Effect', 'Pressure Point', 'Unvarnished Truth', 'Backbone', 'The Long Grudge',
      'Official Couple Mode', 'Love in Real Life', 'Chemistry Lab', 'Unsaid', 'Age Gap Realism', "Daddy’s Rules", 'Sensory Chemistry', 'After Dark', 'Adult Chemistry & Sensory Detail',
      'Silver Screen', 'Director’s Cut', 'Soundstage', 'Cold Open', 'World in Motion', 'Every Body Tells a Story', 'Melanin & Texture Realism', 'Street Speak', 'Roleplay Quality Optimizer',
    ];
    expect(requested).toHaveLength(40);
    for (const name of requested) {
      const plugin = plugins.find((item) => item.name === name);
      expect(plugin).toBeDefined();
      expect(plugin?.enabled).toBe(false);
      expect(plugin?.customPrompt?.length).toBeGreaterThan(0);
    }
  });

  it('preserves saved toggle and prompt edits while adding missing defaults', () => {
    const original = mergeDefaultPlugins(INITIAL_PLUGINS);
    const living = original.find((plugin) => plugin.id === 'plugin_soul_spark')!;
    const merged = mergeDefaultPlugins([...INITIAL_PLUGINS, { ...living, enabled: true, customPrompt: 'My edited voice rule' }]);
    expect(merged.find((plugin) => plugin.id === living.id)).toMatchObject({ enabled: true, customPrompt: 'My edited voice rule' });
    expect(merged.some((plugin) => plugin.id === 'plugin_parallel_lives')).toBe(true);
  });

  it('includes only enabled rules, removes duplicates, and respects its prompt-size bound', () => {
    const makePlugin = (id: string, enabled: boolean, customPrompt: string): Plugin => ({
      id, name: id, icon: 'Puzzle', description: '', category: 'style', enabled, customPrompt, config: {},
    });
    const prompt = buildEnabledPluginRules([
      makePlugin('one', true, 'Use distinct voices.'),
      makePlugin('two', true, 'Use   distinct voices.'),
      makePlugin('off', false, 'Do not include this.'),
      makePlugin('large', true, 'x'.repeat(MAX_COMBINED_PLUGIN_PROMPT_CHARS)),
    ]);
    expect(prompt).toContain('one: Use distinct voices.');
    expect(prompt).not.toContain('two:');
    expect(prompt).not.toContain('off:');
    expect(prompt.length).toBeLessThanOrEqual(MAX_COMBINED_PLUGIN_PROMPT_CHARS + 300);
  });
});
