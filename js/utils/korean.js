/**
 * Korean language utilities
 */

/**
 * Check if character has a final consonant (받침)
 * @param {string} char - Single character
 * @returns {boolean} True if has final consonant
 */
function hasFinalConsonant(char) {
    const code = char.charCodeAt(0);
    // Korean syllable range: 0xAC00 ~ 0xD7A3
    if (code < 0xAC00 || code > 0xD7A3) {
        // Non-Korean character: assume no final consonant for vowel-like endings
        return false;
    }
    // Final consonant = (code - 0xAC00) % 28
    // 0 means no final consonant
    return (code - 0xAC00) % 28 !== 0;
}

/**
 * Get appropriate particle (을/를) based on the last character
 * @param {string} word - Word to check
 * @returns {string} '을' or '를'
 */
export function getObjectParticle(word) {
    if (!word || word.length === 0) return '를';
    const lastChar = word.charAt(word.length - 1);
    return hasFinalConsonant(lastChar) ? '을' : '를';
}
