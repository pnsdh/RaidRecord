/**
 * Character name parsing utilities
 * Handles character name and server extraction from user input
 */

import { KR_SERVERS } from '../config/servers.js';

/**
 * Valid character name pattern
 * - Korean characters (가-힣)
 * - English letters (a-zA-Z)
 * - Apostrophe (')
 */
const VALID_CHAR_PATTERN = /^[가-힣a-zA-Z']+$/;

/**
 * Format FFXIV character name (first letter uppercase, rest lowercase for each word)
 * Only applies to English characters; Korean names are unchanged
 * e.g., "JOHN DOE" -> "John Doe", "john doe" -> "John Doe"
 */
function formatCharacterName(name) {
    return name.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

/**
 * Parse character input to extract name and server
 * Supports formats like:
 * - "name@server"
 * - "name server"
 * - Server name can be part of character name
 *
 * @param {string} input - User input with optional server specification
 * @returns {{characterName: string, serverName: string|null}} Parsed character name and server
 */
export function parseCharacterInput(input) {
    if (!input || typeof input !== 'string') {
        return { characterName: '', serverName: null };
    }

    const trimmed = input.trim();
    if (!trimmed) {
        return { characterName: '', serverName: null };
    }

    // Build regex pattern for all server names (both KR and EN)
    const allServerNames = [];
    KR_SERVERS.forEach(server => {
        allServerNames.push(server.nameKR);
        allServerNames.push(server.nameEN);
    });

    // Sort by length (descending) to match longer names first
    allServerNames.sort((a, b) => b.length - a.length);

    // Try to find server name with @ separator
    const atMatch = trimmed.match(/^(.+?)[@＠](.+)$/);
    if (atMatch) {
        const potentialName = atMatch[1].trim();
        const potentialServer = atMatch[2].trim();

        // Validate that character name contains only valid characters
        if (!VALID_CHAR_PATTERN.test(potentialName)) {
            return { characterName: '', serverName: null };
        }

        // Check if potential server matches any known server
        const matchedServer = findMatchingServer(potentialServer, allServerNames);
        if (matchedServer) {
            return {
                characterName: formatCharacterName(potentialName),
                serverName: matchedServer
            };
        }
    }

    // Try to find server name with space separator
    // Look for server name from the end (greedy character name, minimal server name)
    for (const serverName of allServerNames) {
        // Match server name at the end, with optional space before it
        const pattern = new RegExp(`^(.+?)\\s+(${escapeRegex(serverName)})$`, 'i');
        const spaceMatch = trimmed.match(pattern);

        if (spaceMatch) {
            const potentialName = spaceMatch[1].trim();
            const matchedServer = spaceMatch[2];

            // Validate that character name contains only valid characters
            if (VALID_CHAR_PATTERN.test(potentialName)) {
                return {
                    characterName: formatCharacterName(potentialName),
                    serverName: findMatchingServer(matchedServer, allServerNames)
                };
            }
        }
    }

    // No server found in input
    // Validate character name before returning
    if (!VALID_CHAR_PATTERN.test(trimmed)) {
        return { characterName: '', serverName: null };
    }

    return {
        characterName: formatCharacterName(trimmed),
        serverName: null
    };
}

/**
 * Find matching server name from input (case-insensitive)
 * Returns the English server name
 *
 * @param {string} input - Server name input (KR or EN)
 * @param {string[]} allServerNames - All server names to search
 * @returns {string|null} English server name or null
 */
function findMatchingServer(input, allServerNames) {
    const lowerInput = input.toLowerCase();

    for (const server of KR_SERVERS) {
        if (server.nameKR.toLowerCase() === lowerInput || server.nameEN.toLowerCase() === lowerInput) {
            return server.nameEN; // Always return English name for API
        }
    }

    return null;
}

/**
 * Escape special regex characters
 */
function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
