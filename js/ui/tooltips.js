/**
 * Tooltip utilities - Public API
 * Re-exports tooltip functionality for backward compatibility
 */

// Export content generators (for testing or direct use)
export {
    createPartyMembersHTML,
    createRaidInfoHTML,
    createDateTooltipHTML,
    createJobFrequencyHTML,
    createEncounterScoresHTML,
    createEncounterPercentilesHTML,
    createEncounterRanksHTML
} from './tooltip/content.js';

// Export listener attachment (main API)
export { attachTooltipListeners } from './tooltip/listeners.js';
