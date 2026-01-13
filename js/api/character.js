/**
 * FFLogs API - Character related queries
 */

/**
 * Character search and ranking methods
 */
export class CharacterAPI {
    /**
     * Search for a character by name and server
     */
    async searchCharacter(characterName, serverName, serverRegion) {
        const queryString = `
            query($name: String!, $server: String!, $region: String!) {
                characterData {
                    character(name: $name, serverSlug: $server, serverRegion: $region) {
                        id
                        name
                        server {
                            name
                            region {
                                slug
                            }
                        }
                    }
                }
            }
        `;

        const data = await this.query(queryString, {
            name: characterName,
            server: serverName.toLowerCase(),
            region: serverRegion
        }, true);

        if (!data?.characterData?.character) {
            return null;
        }

        return data.characterData.character;
    }

    /**
     * Get combined data for multiple tiers in a single batch query
     */
    async getBatchTierData(characterId, tiers) {
        // Build query with aliases for each tier
        let queryFields = '';
        const variables = { characterId };

        tiers.forEach((tier, index) => {
            const difficulty = tier.type === 'SAVAGE' ? 101 : 100;
            const alias = `tier${index}`;

            // Add variables for this tier
            variables[`zoneId${index}`] = tier.zoneId;
            variables[`encounterId${index}`] = tier.finalEncounterId;
            variables[`difficulty${index}`] = difficulty;
            variables[`partition${index}`] = tier.partition;

            // Add query field with alias
            queryFields += `
                ${alias}: character(id: $characterId) {
                    zoneRankingsWithDifficulty: zoneRankings(
                        zoneID: $zoneId${index},
                        difficulty: $difficulty${index},
                        partition: $partition${index}
                    )
                    encounterRankings(
                        encounterID: $encounterId${index},
                        difficulty: $difficulty${index},
                        partition: $partition${index}
                    )
                    allStarRankings: zoneRankings(
                        zoneID: $zoneId${index},
                        difficulty: $difficulty${index},
                        partition: $partition${index}
                    )
                }
            `;
        });

        // Build variable definitions
        let variableDefinitions = '$characterId: Int!';
        tiers.forEach((_, index) => {
            variableDefinitions += `, $zoneId${index}: Int!, $encounterId${index}: Int!, $difficulty${index}: Int, $partition${index}: Int`;
        });

        const queryString = `
            query(${variableDefinitions}) {
                characterData {
                    ${queryFields}
                }
            }
        `;

        const data = await this.query(queryString, variables, true);

        // Process results for each tier
        const results = [];
        tiers.forEach((tier, index) => {
            const alias = `tier${index}`;
            const character = data.characterData[alias];

            if (!character) {
                results.push(null);
                return;
            }

            // Extract earliest clear
            const zoneRankings = character.zoneRankingsWithDifficulty;
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

                        // Calculate job frequency from all parses
                        const jobStats = {};
                        encounterParses.forEach((parse, index) => {
                            // Parse.spec is a string like "BlackMage", not a numeric ID
                            const jobSpec = parse.spec;
                            if (jobSpec) {
                                if (!jobStats[jobSpec]) {
                                    jobStats[jobSpec] = {
                                        count: 0,
                                        mostRecentIndex: index
                                    };
                                }
                                jobStats[jobSpec].count++;
                                // Keep track of most recent occurrence (smallest index)
                                jobStats[jobSpec].mostRecentIndex = Math.min(
                                    jobStats[jobSpec].mostRecentIndex,
                                    index
                                );
                            }
                        });

                        // Convert to array and sort by frequency (descending), then by recency (ascending index)
                        jobFrequency = Object.entries(jobStats)
                            .map(([spec, stats]) => ({
                                spec: spec, // spec is already a string like "BlackMage"
                                count: stats.count,
                                mostRecentIndex: stats.mostRecentIndex
                            }))
                            .sort((a, b) => {
                                if (a.count !== b.count) {
                                    return b.count - a.count; // Higher count first
                                }
                                return a.mostRecentIndex - b.mostRecentIndex; // More recent first
                            });
                    } else {
                        earliestClear = encounterRanking;
                    }
                }
            }

            // Extract all-star data
            const allStarRankings = character.allStarRankings;
            let allStarData = { points: 0, rank: null, total: null };
            if (allStarRankings) {
                const allStars = allStarRankings.allStars || [];
                if (allStars.length > 0) {
                    const bestAllStar = allStars.reduce((best, current) => {
                        return (current.points || 0) > (best.points || 0) ? current : best;
                    }, allStars[0]);

                    allStarData = {
                        points: bestAllStar.points || 0,
                        rank: bestAllStar.rank || null,
                        total: bestAllStar.total || null
                    };
                }
            }

            results.push({
                earliestClear,
                allStarData,
                jobFrequency
            });
        });

        return results;
    }
}
