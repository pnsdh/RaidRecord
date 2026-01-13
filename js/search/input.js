/**
 * Search input parsing utilities
 */

/**
 * Parse character search input
 * Expected format: "CharacterName ServerName"
 */
function parseSearchInput(input) {
    const parts = input.trim().split(/\s+/);

    if (parts.length < 2) {
        throw new Error('검색 형식: 캐릭터명 (예: 빛의영자하나)');
    }

    const characterName = parts.slice(0, -1).join(' ');
    const serverName = parts[parts.length - 1];

    return { characterName, serverName };
}

/**
 * Search for character
 */
export async function searchCharacter(api, searchInput, region) {
    const { characterName, serverName } = parseSearchInput(searchInput);

    // Search for the character
    const character = await api.searchCharacter(characterName, serverName, region);

    if (!character) {
        throw new Error(`캐릭터를 찾을 수 없습니다: ${characterName} @ ${serverName}`);
    }

    return character;
}
