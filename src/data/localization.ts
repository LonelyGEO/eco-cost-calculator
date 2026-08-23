import translations from './game-zh-cn.json';

const gameTranslations = translations as Record<string, string>;

/**
 * Keep English game identifiers in state and saved profiles, and translate
 * only at the presentation layer so old exports remain compatible.
 */
export function localizeGameText(source: string): string {
  return gameTranslations[source] ?? source;
}
