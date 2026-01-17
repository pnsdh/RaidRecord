/**
 * Search input parsing utilities
 */

import { getServerNameKR } from '../constants.js';
import { AppError, ErrorCodes } from '../errors.js';
import { parseCharacterInput } from '../utils/characterParser.js';

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
        throw new Error('검색 형식: 캐릭터명 서버명 (예: 빛의영자 카벙클)');
    }

    // Search for the character ID
    const characterId = await api.searchCharacter(characterName, serverName, region);

    if (!characterId) {
        const serverNameKR = getServerNameKR(serverName);
        throw new AppError(`캐릭터를 찾을 수 없습니다: ${characterName} @ ${serverNameKR}`, ErrorCodes.CHARACTER_NOT_FOUND);
    }

    return characterId;
}
