/**
 * String utilities — fuzzy matching and text processing.
 */

const FUZZY_MATCH_THRESHOLD = 1;

/**
 * Levenshtein distance between two strings.
 * Used for fuzzy name matching between passport and booking names.
 */
export function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b[i - 1] === a[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

/** Check if two words are fuzzy-equal within the threshold */
export function isFuzzyMatch(a: string, b: string): boolean {
  return a === b || levenshtein(a, b) <= FUZZY_MATCH_THRESHOLD;
}

/**
 * Fill template variables in a prompt string.
 * Replaces {{key}} with the corresponding value.
 */
export function fillTemplate(
  template: string,
  vars: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
  }
  return result;
}

/** Strip base64 data URL prefix */
export const DATA_URL_PREFIX_REGEX = /^data:image\/\w+;base64,/;

export function stripDataUrlPrefix(dataUrl: string): string {
  return dataUrl.replace(DATA_URL_PREFIX_REGEX, "");
}
