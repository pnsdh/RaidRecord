/**
 * HTML utilities
 */

/**
 * Escape a string for safe insertion into HTML via innerHTML.
 * Use for any externally-sourced text (character names, server names, etc.)
 * that gets interpolated into an HTML string.
 * @param {*} value - Value to escape (coerced to string; null/undefined → '')
 * @returns {string}
 */
export function escapeHtml(value) {
    if (value === null || value === undefined) {
        return '';
    }
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
