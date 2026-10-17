import type { Plugin } from '../types/roleplay';

export const MAX_COMBINED_PLUGIN_PROMPT_CHARS = 16000;

/** Combine enabled plugin directives into one compact, de-duplicated prompt block. */
export function buildEnabledPluginRules(plugins: Plugin[]): string {
  const seen = new Set<string>();
  const rules: string[] = [];
  let remaining = MAX_COMBINED_PLUGIN_PROMPT_CHARS;
  for (const plugin of plugins) {
    if (!plugin.enabled) continue;
    const prompt = (plugin.customPrompt?.trim() || plugin.description.trim()).replace(/\s+/g, ' ');
    const key = prompt.toLocaleLowerCase();
    if (!prompt || seen.has(key) || remaining < 12) continue;
    seen.add(key);
    const line = `${plugin.name}: ${prompt}`;
    if (line.length > remaining) continue;
    rules.push(line);
    remaining -= line.length + 1;
  }
  if (!rules.length) return '';
  return `[ENABLED PLUGIN RULES]\nFollow only these enabled, distinct plugin rules. They support the character cards and established canon; they never override consent, continuity, or the non-negotiable rule not to speak, think, feel, or act for {{user}}/Emmy.\n${rules.map((rule) => `- ${rule}`).join('\n')}`;
}
