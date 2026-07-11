/**
 * FFLogs API - Party member clear-order queries
 *
 * For each party member of a clear, determines how many times that member had
 * cleared the encounter up to and including that clear ("몇 번째 클리어").
 * ordinal = number of the member's kills whose startTime <= the clear's fight-start.
 */

/**
 * Compute a single member's clear ordinal from their encounterRankings blob.
 *
 * We anchor on the member's OWN rank for this exact (report, fight) when present,
 * so the count uses fully self-consistent timestamps; otherwise we fall back to
 * the searched player's fight-start time, which aligns exactly with the member's
 * rank for the same pull (report.startTime + fight.startTime === rank.startTime).
 *
 * @param {Object|null} encounterRankings - encounterRankings JSON (has ranks[])
 * @param {number|null} anchorTime - fallback anchor (examined clear's fight-start, ms)
 * @param {string|null} reportCode - examined clear's report code
 * @param {number|null} fightId - examined clear's fight ID
 * @returns {number|null} 1-based ordinal, or null if undeterminable (private/no data)
 */
function computeMemberClearOrder(encounterRankings, anchorTime, reportCode, fightId) {
    if (!encounterRankings) return null;

    const ranks = encounterRankings.ranks || [];
    if (ranks.length === 0) return null;

    // Prefer the member's own rank for this exact fight as the anchor
    let anchor = anchorTime;
    const ownRank = ranks.find(r =>
        r.report && r.report.code === reportCode && r.report.fightID === fightId
    );
    if (ownRank && typeof ownRank.startTime === 'number') {
        anchor = ownRank.startTime;
    }

    if (anchor === null || anchor === undefined) return null;

    let order = 0;
    for (const r of ranks) {
        if (typeof r.startTime === 'number' && r.startTime <= anchor) {
            order++;
        }
    }

    return order > 0 ? order : null;
}

/**
 * Party member clear-order methods
 */
export class MemberClearsAPI {
    /**
     * @param {Object} core - FFLogsAPICore instance
     */
    constructor(core) {
        this.core = core;
    }

    /**
     * Get clear ordinals for party members across multiple clears in a single batch query.
     *
     * @param {Array} requests - Per-clear requests:
     *   [{ encounterId, difficulty, partition, anchorTime, reportCode, fightId,
     *      members: [{ name, server }] }]
     * @param {string} serverRegion - Server region (e.g. 'KR')
     * @returns {Promise<Array<Array<number|null>>>} Orders parallel to `requests`,
     *   each an array parallel to that request's `members` (null = undeterminable).
     */
    async getBatchMemberClearOrders(requests, serverRegion) {
        const emptyResult = () => (requests || []).map(req => (req.members || []).map(() => null));

        if (!requests || requests.length === 0) {
            return [];
        }

        // Flatten to individual (requestIndex, memberIndex) lookups with a valid name+server
        const entries = [];
        requests.forEach((req, i) => {
            (req.members || []).forEach((member, j) => {
                if (member && member.name && member.server) {
                    entries.push({ i, j, name: member.name, server: member.server, req });
                }
            });
        });

        if (entries.length === 0) {
            return emptyResult();
        }

        // Build one aliased character() field per member lookup.
        // encounterID/difficulty/partition are trusted integers from config → inlined.
        // name/server are strings → passed as variables to avoid escaping issues.
        let queryFields = '';
        const variableDefinitions = ['$region: String!'];
        const variables = { region: serverRegion };

        entries.forEach((entry, idx) => {
            const alias = `m${idx}`;
            const encounterId = Number(entry.req.encounterId);
            const difficulty = Number(entry.req.difficulty);
            const partition = Number(entry.req.partition);

            queryFields += `
                ${alias}: character(name: $n${idx}, serverSlug: $s${idx}, serverRegion: $region) {
                    encounterRankings(encounterID: ${encounterId}, difficulty: ${difficulty}, partition: ${partition})
                }
            `;

            variableDefinitions.push(`$n${idx}: String!`, `$s${idx}: String!`);
            variables[`n${idx}`] = entry.name;
            variables[`s${idx}`] = String(entry.server).toLowerCase();
        });

        const queryString = `
            query(${variableDefinitions.join(', ')}) {
                characterData {
                    ${queryFields}
                }
            }
        `;

        const data = await this.core.query(queryString, variables, true);

        const orders = emptyResult();
        if (!data || !data.characterData) {
            return orders;
        }

        entries.forEach((entry, idx) => {
            const character = data.characterData[`m${idx}`];
            const encounterRankings = character ? character.encounterRankings : null;
            orders[entry.i][entry.j] = computeMemberClearOrder(
                encounterRankings,
                entry.req.anchorTime,
                entry.req.reportCode,
                entry.req.fightId
            );
        });

        return orders;
    }
}
