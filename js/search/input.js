/**
 * Search input parsing utilities
 */

import { getServerNameKR } from '../constants.js';
import { AppError, ErrorCodes } from '../errors.js';
import { parseCharacterInput } from '../utils/characterParser.js';
import { MESSAGES } from '../config/messages.js';

/**
 * Search for character ID
 * @param {Object} api - API instance
 * @param {string} searchInput - Search input in format "CharacterName ServerName"
 * @param {string} region - Server region
 * @returns {Promise<number>} Character ID
 */
export async function searchCharacterId(api, searchInput, region) {
    const { characterName, serverName } = parseCharacterInput(searchInput);

    if (!characterName || !serverName) {
        throw new Error(MESSAGES.SEARCH.INVALID_FORMAT);
    }

    // Search for the character ID
    const characterId = await api.searchCharacter(characterName, serverName, region);

    if (!characterId) {
        const serverNameKR = getServerNameKR(serverName);
        throw new AppError(MESSAGES.SEARCH.CHARACTER_NOT_FOUND(characterName, serverNameKR), ErrorCodes.CHARACTER_NOT_FOUND);
    }

    return characterId;
}
