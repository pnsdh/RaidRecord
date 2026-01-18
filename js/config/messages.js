/**
 * Centralized UI messages for localization and consistency
 */

import { getObjectParticle } from '../utils/korean.js';

export const MESSAGES = {
    // Search related
    SEARCH: {
        ENTER_CHARACTER_NAME: '캐릭터명을 입력해주세요.',
        INVALID_CHARACTER_NAME: '올바른 캐릭터명을 입력해주세요.',
        CHARACTER_NOT_FOUND: (name, server) => `캐릭터를 찾을 수 없습니다: ${name} @ ${server}`,
        SELECT_SERVER: (name) => `<strong>${name}</strong>${getObjectParticle(name)} 검색할 서버를 선택해주세요.`,
        NOT_FOUND_ON_ANY_SERVER: (name) => `${name}${getObjectParticle(name)} 모든 서버에서 찾을 수 없습니다.`,
        SELECT_OTHER_SERVER: (name, server) => `<strong>${name}@${server}</strong>${getObjectParticle(server)} 찾을 수 없습니다.<br>다른 서버를 선택해주세요.`,
        NO_RAID_RECORDS: (name, server) => `<strong>${name}@${server}</strong>의 레이드 기록을 찾을 수 없습니다.<br>다른 서버를 선택해주세요.`,
        SEARCH_ERROR: '검색 중 오류가 발생했습니다.',
        SEARCH_CANCELLED: '검색이 취소되었습니다.',
        SEARCHING_CHARACTER: '캐릭터 검색 중...',
        SEARCHING_RAID_HISTORY: '레이드 이력 검색 중...',
        INVALID_FORMAT: '검색 형식: 캐릭터명 서버명 (예: 빛의영자 카벙클)',
        FETCHING_RAID_DATA: '레이드 클리어 기록 조회 중',
        FETCHING_PARTY_MEMBERS: '파티 멤버 정보 조회 중'
    },

    // API related
    API: {
        INSUFFICIENT_POINTS: (required, remaining, resetMinutes) =>
            `API 포인트가 부족합니다.\n` +
            `필요: 약 ${required} 포인트\n` +
            `남은 포인트: ${remaining} 포인트\n` +
            `${resetMinutes}분 후 리셋됩니다. 잠시 후 다시 시도해주세요.`,
        RESET_TIME: (minutes) => `(${minutes}분 후 리셋)`
    },

    // Settings related
    SETTINGS: {
        MISSING_CREDENTIALS: 'Client ID와 Client Secret을 입력해주세요.',
        SAVED: '설정이 저장되었습니다.',
        COMPLETE_API_SETTINGS: '먼저 FFLogs API 설정을 완료해주세요.'
    },

    // Raid selection related
    RAID_SELECTION: {
        SAVED: (count) => `${count}개의 레이드가 선택되었습니다.`
    },

    // Export related
    EXPORT: {
        NO_RESULTS: '내보낼 결과가 없습니다.',
        ELEMENT_NOT_FOUND: '캡처할 요소를 찾을 수 없습니다.',
        TABLE_NOT_FOUND: '테이블을 찾을 수 없습니다.',
        SAVE_ERROR: '이미지 저장 중 오류가 발생했습니다.'
    },

    // General
    GENERAL: {
        COPY_FAILED: '복사에 실패했습니다.',
        CONFIRM_CANCEL_SEARCH: '검색을 취소하시겠습니까?'
    }
};
