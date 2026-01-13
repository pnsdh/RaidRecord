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
     * Get combined data for a tier (rankings + encounter parses + all-star) in one query
     */
    async getCombinedTierData(characterId, zoneId, encounterId, difficulty, partition) {
        const queryString = `
            query($characterId: Int!, $zoneId: Int!, $encounterId: Int!, $difficulty: Int, $partition: Int) {
                characterData {
                    character(id: $characterId) {
                        zoneRankingsWithDifficulty: zoneRankings(
                            zoneID: $zoneId,
                            difficulty: $difficulty,
                            partition: $partition
                        )
                        encounterRankings(
                            encounterID: $encounterId,
                            difficulty: $difficulty,
                            partition: $partition
                        )
                        allStarRankings: zoneRankings(
                            zoneID: $zoneId,
                            difficulty: $difficulty,
                            partition: $partition
                        )
                    }
                }
            }
        `;

        const data = await this.query(queryString, {
            characterId,
            zoneId,
            encounterId,
            difficulty,
            partition
        }, true);

        const character = data.characterData.character;

        // Extract earliest clear and all clears using existing logic
        const zoneRankings = character.zoneRankingsWithDifficulty;
        const encounterParses = character.encounterRankings?.ranks || [];

        let earliestClear = null;
        let allClears = [];
        if (zoneRankings) {
            const rankingsArray = zoneRankings.rankings || [];
            const encounterRanking = rankingsArray.find(r => r.encounter?.id === encounterId);

            if (encounterRanking) {
                if (encounterParses.length > 0) {
                    // Sort by date (earliest first)
                    encounterParses.sort((a, b) => a.startTime - b.startTime);
                    earliestClear = encounterParses[0];
                    // Collect all clears with their jobs
                    allClears = encounterParses.map(parse => ({
                        spec: parse.spec,
                        startTime: parse.startTime
                    }));
                } else {
                    // Fall back to ranking data
                    earliestClear = encounterRanking;
                    allClears = [{ spec: encounterRanking.spec, startTime: encounterRanking.startTime }];
                }
            }
        }

        // Extract all-star data (use highest points if multiple jobs)
        const allStarRankings = character.allStarRankings;
        let allStarData = { points: 0, rank: null, total: null };
        if (allStarRankings) {
            const allStars = allStarRankings.allStars || [];
            if (allStars.length > 0) {
                // Find the entry with highest points
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

        return {
            earliestClear,
            allClears,
            allStarData
        };
    }
}
