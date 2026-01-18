/**
 * FFLogs API - Character related queries
 */

import { buildTierQueryField, buildTierQueryVariables, buildServerSearchField, buildServerSearchVariables } from './queryBuilder.js';

/**
 * Calculate job frequency from encounter parses
 * @param {Array} parses - Array of encounter parses
 * @returns {Array} Sorted job frequency data
 */
function calculateJobFrequency(parses) {
    const jobStats = {};

    parses.forEach((parse, index) => {
        const jobSpec = parse.spec;
        if (jobSpec) {
            if (!jobStats[jobSpec]) {
                jobStats[jobSpec] = { count: 0, mostRecentIndex: index };
            }
            jobStats[jobSpec].count++;
            jobStats[jobSpec].mostRecentIndex = Math.min(
                jobStats[jobSpec].mostRecentIndex,
                index
            );
        }
    });

    return Object.entries(jobStats)
        .map(([spec, stats]) => ({
            spec,
            count: stats.count,
            mostRecentIndex: stats.mostRecentIndex
        }))
        .sort((a, b) => {
            if (a.count !== b.count) return b.count - a.count;
            return a.mostRecentIndex - b.mostRecentIndex;
        });
}

/**
 * Extract all-star data from zone rankings
 * @param {Object} zoneRankings - Zone rankings data
 * @returns {Object} Best all-star data
 */
function extractAllStarData(zoneRankings) {
    if (!zoneRankings) {
        return { points: 0, rank: null, total: null };
    }

    const allStars = zoneRankings.allStars || [];
    if (allStars.length === 0) {
        return { points: 0, rank: null, total: null };
    }

    const bestAllStar = allStars.reduce((best, current) => {
        return (current.points || 0) > (best.points || 0) ? current : best;
    }, allStars[0]);

    return {
        points: bestAllStar.points || 0,
        rank: bestAllStar.rank || null,
        total: bestAllStar.total || null
    };
}

/**
 * Extract per-encounter all-star data from zone rankings
 * @param {Object} zoneRankings - Zone rankings data
 * @returns {Array} Encounter all-star data
 */
function extractEncounterAllStars(zoneRankings) {
    if (!zoneRankings) return [];

    const rankingsArray = zoneRankings.rankings || [];
    rankingsArray.sort((a, b) => (a.encounter?.id || 0) - (b.encounter?.id || 0));

    return rankingsArray
        .filter(ranking => ranking.encounter && ranking.allStars)
        .map(ranking => ({
            encounterId: ranking.encounter.id,
            encounterName: ranking.encounter.name,
            spec: ranking.spec || ranking.bestSpec || null,
            points: ranking.allStars.points || 0,
            rank: ranking.allStars.rank || null,
            total: ranking.allStars.total || null
        }));
}

/**
 * Process tier data for a single tier
 * @param {Object} character - Character data from query
 * @param {Object} tier - Tier configuration
 * @returns {Object|null} Processed tier data
 */
function processTierResult(character, tier) {
    if (!character) return null;

    const zoneRankings = character.zoneRankings;
    const encounterParses = character.encounterRankings?.ranks || [];
    const encounterId = tier.finalEncounterId;

    let earliestClear = null;
    let jobFrequency = [];

    if (zoneRankings) {
        const rankingsArray = zoneRankings.rankings || [];
        const encounterRanking = rankingsArray.find(r => r.encounter?.id === encounterId);

        if (encounterRanking) {
            if (encounterParses.length > 0) {
                encounterParses.sort((a, b) => a.startTime - b.startTime);
                earliestClear = encounterParses[0];
                jobFrequency = calculateJobFrequency(encounterParses);
            } else {
                earliestClear = encounterRanking;
            }
        }
    }

    return {
        earliestClear,
        allStarData: extractAllStarData(zoneRankings),
        jobFrequency,
        encounterAllStars: extractEncounterAllStars(zoneRankings)
    };
}

/**
 * Character search and ranking methods
 */
export class CharacterAPI {
    /**
     * @param {Object} core - FFLogsAPICore instance
     */
    constructor(core) {
        this.core = core;
    }

    /**
     * Search for a character by name and server
     * @returns {number|null} Character ID or null if not found
     */
    async searchCharacter(characterName, serverName, serverRegion) {
        const queryString = `
            query($name: String!, $server: String!, $region: String!) {
                characterData {
                    character(name: $name, serverSlug: $server, serverRegion: $region) {
                        id
                    }
                }
            }
        `;

        const data = await this.core.query(queryString, {
            name: characterName,
            server: serverName.toLowerCase(),
            region: serverRegion
        }, true);

        return data?.characterData?.character?.id || null;
    }

    /**
     * Get combined data for multiple tiers in a single batch query
     */
    async getBatchTierData(characterId, tiers) {
        // Build query with aliases for each tier
        let queryFields = '';
        let variableDefinitions = '$characterId: Int!';
        const variables = { characterId };

        tiers.forEach((tier, index) => {
            // Build query field
            queryFields += buildTierQueryField(index);

            // Build variables
            const { definitions, values } = buildTierQueryVariables(tier, index);
            variableDefinitions += `, ${definitions}`;
            Object.assign(variables, values);
        });

        const queryString = `
            query(${variableDefinitions}) {
                characterData {
                    ${queryFields}
                }
            }
        `;

        const data = await this.core.query(queryString, variables, true);

        // Process results for each tier using helper function
        return tiers.map((tier, index) => {
            const alias = `tier${index}`;
            const character = data.characterData[alias];
            return processTierResult(character, tier);
        });
    }

    /**
     * Search for a character across multiple servers in a single batch query
     * @param {string} characterName - Character name
     * @param {string[]} servers - Array of server names (English)
     * @param {string} serverRegion - Server region
     * @returns {Object} Map of serverName -> characterId (or null if not found)
     */
    async searchCharacterOnServers(characterName, servers, serverRegion) {
        // Build query with aliases for each server
        let queryFields = '';
        let variableDefinitions = '$name: String!, $region: String!';
        const variables = {
            name: characterName,
            region: serverRegion
        };

        servers.forEach((server, index) => {
            queryFields += buildServerSearchField(index);
            const { definitions, values } = buildServerSearchVariables(server.toLowerCase(), index);
            variableDefinitions += `, ${definitions}`;
            Object.assign(variables, values);
        });

        const queryString = `
            query(${variableDefinitions}) {
                characterData {
                    ${queryFields}
                }
            }
        `;

        const data = await this.core.query(queryString, variables, true);

        // Build result map
        const result = {};
        servers.forEach((server, index) => {
            const alias = `server${index}`;
            const character = data?.characterData?.[alias];
            result[server] = character?.id || null;
        });

        return result;
    }
}
