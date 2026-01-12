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
                rateLimitData {
                    limitPerHour
                    pointsSpentThisHour
                    pointsResetIn
                }
            }
        `;

        const data = await this.query(queryString, {
            name: characterName,
            server: serverName.toLowerCase(),
            region: serverRegion
        });

        if (!data?.characterData?.character) {
            return null;
        }

        return data.characterData.character;
    }

    /**
     * Get character's raid rankings for a specific zone
     */
    async getCharacterRankings(characterId, zoneId, difficulty, partition) {
        const queryString = `
            query($characterId: Int!, $zoneId: Int!, $difficulty: Int, $partition: Int) {
                characterData {
                    character(id: $characterId) {
                        zoneRankings(zoneID: $zoneId, difficulty: $difficulty, partition: $partition)
                    }
                }
            }
        `;

        const data = await this.query(queryString, {
            characterId,
            zoneId,
            difficulty,
            partition
        });

        return data.characterData.character.zoneRankings;
    }

    /**
     * Get character's all parses for a specific encounter
     */
    async getCharacterEncounterParses(characterId, encounterId, difficulty, partition) {
        const queryString = `
            query($characterId: Int!, $encounterId: Int!, $difficulty: Int, $partition: Int) {
                characterData {
                    character(id: $characterId) {
                        encounterRankings(encounterID: $encounterId, difficulty: $difficulty, partition: $partition)
                    }
                }
            }
        `;

        const data = await this.query(queryString, {
            characterId,
            encounterId,
            difficulty,
            partition
        });

        const encounterRankings = data.characterData.character.encounterRankings;

        if (!encounterRankings) {
            return null;
        }

        // encounterRankings is JSON, parse it
        const rankings = encounterRankings.ranks || [];

        return rankings;
    }

    /**
     * Get character's earliest clear for a specific encounter using encounter rankings
     */
    async getEarliestClear(characterId, zoneId, encounterId, difficulty, partition) {
        // First, get basic ranking data to confirm there's a clear
        const rankings = await this.getCharacterRankings(characterId, zoneId, difficulty, partition);

        if (!rankings) {
            return null;
        }

        const rankingsArray = rankings.rankings || [];
        const encounterRanking = rankingsArray.find(r => r.encounter && r.encounter.id === encounterId);

        if (!encounterRanking) {
            return null;
        }

        // Now get all parses for this specific encounter to find the earliest
        const encounterParses = await this.getCharacterEncounterParses(characterId, encounterId, difficulty, partition);

        if (!encounterParses || encounterParses.length === 0) {
            // Fall back to ranking data
            return encounterRanking;
        }

        // Sort by date (earliest first)
        encounterParses.sort((a, b) => a.startTime - b.startTime);

        return encounterParses[0];
    }

    /**
     * Get all-star points for a character in a zone
     */
    async getAllStarPoints(characterId, zoneId, partition) {
        const queryString = `
            query($characterId: Int!, $zoneId: Int!, $partition: Int) {
                characterData {
                    character(id: $characterId) {
                        zoneRankings(zoneID: $zoneId, partition: $partition)
                    }
                }
            }
        `;

        const data = await this.query(queryString, {
            characterId,
            zoneId,
            partition
        });

        const zoneRankings = data.characterData.character.zoneRankings;

        // zoneRankings is a JSON object, parse it
        if (zoneRankings) {
            // The zoneRankings object contains allStars array
            const allStars = zoneRankings.allStars || [];

            if (allStars.length > 0) {
                return {
                    points: allStars[0].points || 0,
                    rank: allStars[0].rank || null,
                    total: allStars[0].total || null
                };
            }
        }

        return { points: 0, rank: null, total: null };
    }
}
