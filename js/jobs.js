/**
 * Job-related constants and utilities
 */

// Job color mapping from FFLogs
export const JOB_COLORS = {
    // Tanks
    'Paladin': '#A8D2E6',
    'Warrior': '#CF2621',
    'DarkKnight': '#D126CC',
    'Gunbreaker': '#796D30',

    // Healers
    'WhiteMage': '#FFF0DC',
    'Scholar': '#8657FF',
    'Astrologian': '#FFE74A',
    'Sage': '#80A0F0',

    // Melee DPS
    'Monk': '#D69C00',
    'Dragoon': '#4164CD',
    'Ninja': '#AF1964',
    'Samurai': '#E46D04',
    'Reaper': '#965A90',
    'Viper': '#54A868',

    // Physical Ranged DPS
    'Bard': '#91BA5E',
    'Machinist': '#6EE1D6',
    'Dancer': '#E2B0AF',

    // Magical Ranged DPS
    'BlackMage': '#A579D6',
    'Summoner': '#2D9B78',
    'RedMage': '#E87B7B',
    'Pictomancer': '#D4A0C8',
    'BlueMage': '#3B5DC9'
};

// Job name mappings (English to Korean)
export const JOB_NAMES_KR = {
    'Paladin': '나이트',
    'Warrior': '전사',
    'DarkKnight': '암흑기사',
    'Gunbreaker': '건브레이커',
    'WhiteMage': '백마도사',
    'Scholar': '학자',
    'Astrologian': '점성술사',
    'Sage': '현자',
    'Monk': '몽크',
    'Dragoon': '용기사',
    'Ninja': '닌자',
    'Samurai': '사무라이',
    'Reaper': '리퍼',
    'Viper': '바이퍼',
    'Bard': '음유시인',
    'Machinist': '기공사',
    'Dancer': '무도가',
    'BlackMage': '흑마도사',
    'Summoner': '소환사',
    'RedMage': '적마도사',
    'Pictomancer': '픽토맨서',
    'BlueMage': '청마도사'
};

// Job abbreviations (for compact display)
export const JOB_ABBR_KR = {
    'Paladin': '나이트',
    'Warrior': '전사',
    'DarkKnight': '암기',
    'Gunbreaker': '건브',
    'WhiteMage': '백마',
    'Scholar': '학자',
    'Astrologian': '점성',
    'Sage': '현자',
    'Monk': '몽크',
    'Dragoon': '용기사',
    'Ninja': '닌자',
    'Samurai': '사무',
    'Reaper': '리퍼',
    'Viper': '바이퍼',
    'Bard': '음유',
    'Machinist': '기공사',
    'Dancer': '무도가',
    'BlackMage': '흑마',
    'Summoner': '소환사',
    'RedMage': '적마',
    'Pictomancer': '픽토',
    'BlueMage': '청마'
};

// Job order for sorting (tanks, healers, melee, ranged, casters)
const JOB_ORDER = Object.keys(JOB_NAMES_KR);

/**
 * Get job sorting order
 */
export function getJobOrder(jobName) {
    const index = JOB_ORDER.indexOf(jobName);
    return index === -1 ? 999 : index;
}
