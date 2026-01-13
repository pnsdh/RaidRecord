/**
 * Raid tier data and utilities
 */

import { STORAGE_KEYS } from './config.js';

// Raid tier data structure
// Each tier contains: type, full name, short name, release date, zone ID, partition ID
export const RAID_TIERS = {
    // 황금의 유산 (Dawntrail)
    DAWNTRAIL: {
        expansion: '황금의 유산',
        tiers: [
            {
                type: 'SAVAGE',
                fullName: '아르카디아 선수권: 크루저급',
                shortName: '크루저',
                releaseDate: '2025-07-22',
                zoneId: 68,
                partition: 5,
                encounterCount: 4,
                finalEncounterId: 100
            },
            {
                type: 'ULTIMATE',
                fullName: '절 또 하나의 미래',
                shortName: '에덴',
                releaseDate: '2025-04-15',
                zoneId: 65,
                partition: 5,
                encounterCount: 1,
                finalEncounterId: 1079
            },
            {
                type: 'SAVAGE',
                fullName: '아르카디아 선수권: 라이트헤비급',
                shortName: '라이트헤비',
                releaseDate: '2025-01-14',
                zoneId: 62,
                partition: 11,
                encounterCount: 4,
                finalEncounterId: 96
            }
        ]
    },
    // 효월의 종언 (Endwalker)
    ENDWALKER: {
        expansion: '효월의 종언',
        tiers: [
            {
                type: 'SAVAGE',
                fullName: '마의 전당 판데모니움: 천옥편',
                shortName: '천옥',
                releaseDate: '2023-11-07',
                zoneId: 54,
                partition: 5,
                encounterCount: 5,
                finalEncounterId: 92
            },
            {
                type: 'ULTIMATE',
                fullName: '절 오메가 검증전',
                shortName: '오메가',
                releaseDate: '2023-07-18',
                zoneId: 53,
                partition: 5,
                encounterCount: 1,
                finalEncounterId: 1068
            },
            {
                type: 'SAVAGE',
                fullName: '마의 전당 판데모니움: 연옥편',
                shortName: '연옥',
                releaseDate: '2023-02-21',
                zoneId: 49,
                partition: 11,
                encounterCount: 5,
                finalEncounterId: 87
            },
            {
                type: 'ULTIMATE',
                fullName: '절 용시전쟁',
                shortName: '용시',
                releaseDate: '2022-10-25',
                zoneId: 45,
                partition: 5,
                encounterCount: 1,
                finalEncounterId: 1065
            },
            {
                type: 'SAVAGE',
                fullName: '마의 전당 판데모니움: 변옥편',
                shortName: '변옥',
                releaseDate: '2022-06-21',
                zoneId: 44,
                partition: 5,
                encounterCount: 5,
                finalEncounterId: 82
            }
        ]
    },
    // 칠흑의 반역자 (Shadowbringers)
    SHADOWBRINGERS: {
        expansion: '칠흑의 반역자',
        tiers: [
            {
                type: 'SAVAGE',
                fullName: '희망의 낙원 에덴: 재생편',
                shortName: '재생',
                releaseDate: '2021-05-18',
                zoneId: 38,
                partition: 5,
                encounterCount: 5,
                finalEncounterId: 77
            },
            {
                type: 'SAVAGE',
                fullName: '희망의 낙원 에덴: 공명편',
                shortName: '공명',
                releaseDate: '2020-09-01',
                zoneId: 33,
                partition: 5,
                encounterCount: 4,
                finalEncounterId: 72
            },
            {
                type: 'ULTIMATE',
                fullName: '절 알렉산더 토벌전',
                shortName: '알렉산더',
                releaseDate: '2020-04-14',
                zoneId: 32,
                partition: 5,
                encounterCount: 1,
                finalEncounterId: 1050
            },
            {
                type: 'SAVAGE',
                fullName: '희망의 낙원 에덴: 각성편',
                shortName: '각성',
                releaseDate: '2020-01-21',
                zoneId: 29,
                partition: 7,
                encounterCount: 4,
                finalEncounterId: 68
            }
        ]
    }
};

/**
 * Get all raid tiers as a flat array
 */
export function getAllRaidTiers() {
    const tiers = [];
    for (const expansion in RAID_TIERS) {
        for (const tier of RAID_TIERS[expansion].tiers) {
            tiers.push({
                ...tier,
                expansion: RAID_TIERS[expansion].expansion,
                // Create unique ID for each tier
                id: `${tier.zoneId}-${tier.partition}`
            });
        }
    }
    return tiers;
}

/**
 * Get selected raid tiers based on user preference
 */
export function getSelectedRaidTiers() {
    const selectedIds = JSON.parse(localStorage.getItem(STORAGE_KEYS.SELECTED_RAIDS) || 'null');
    const allTiers = getAllRaidTiers();

    // If no selection saved, return all tiers
    if (!selectedIds || selectedIds.length === 0) {
        return allTiers;
    }

    // Filter based on selected IDs
    return allTiers.filter(tier => selectedIds.includes(tier.id));
}
