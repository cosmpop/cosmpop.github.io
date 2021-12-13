// Checkpoint names with numbers
export const CHECKPOINTS = {
    startOffice: 1,
    dataSources: 2,
    dataPipeline: 3,
    dataFactory: 4,
    dataClouds: 5,
    dataLake: 6,
    dataTsunami: 6.5,
    dataIsOil: 7,
    dataQuotes: 8,
    dataBricks: 9,
    dashboard: 10,
    endOffice: 11,
    snowflakes: 12,
}

export default {
    // Device params
    IS_TOUCH_DEVICE: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    MIN_GAME_RATIO: 2,
    MAX_GAME_RATIO: 3.3,
    // CDN
    ASSETS_URL: '.',
    // Debug
    DEBUG: false,
    DEBUG_POINT: '',
    // Checkpoints
    BASE_CHECKPOINT: CHECKPOINTS.startOffice,
    CHECKPOINT_EVENTS: {
        [CHECKPOINTS.startOffice]: '1-checkpoint',
        [CHECKPOINTS.dataSources]: '2-checkpoint',
        [CHECKPOINTS.dataPipeline]: '3-checkpoint',
        [CHECKPOINTS.dataFactory]: '4-checkpoint',
        [CHECKPOINTS.dataClouds]: '5-checkpoint',
        [CHECKPOINTS.dataLake]: '6-checkpoint1',
        [CHECKPOINTS.dataTsunami]: '6-checkpoint2',
        [CHECKPOINTS.dataIsOil]: '7-checkpoint',
        [CHECKPOINTS.dataQuotes]: '8-checkpoint',
        [CHECKPOINTS.dataBricks]: '9-checkpoint',
        [CHECKPOINTS.dashboard]: '10-checkpoint',
        [CHECKPOINTS.endOffice]: '11-checkpoint',
        [CHECKPOINTS.snowflakes]: '12-checkpoint',
    },
    // Player Y position from foreground for different checkpoints
    CHECKPOINT_POSITIONS: {
        [CHECKPOINTS.dataFactory]: 0.35,
        [CHECKPOINTS.dataClouds]: 0.25,
        [CHECKPOINTS.dataLake]: 0.1,
        [CHECKPOINTS.dataTsunami]: 0.1,
    },
    VOLUME: {
        // introMusic: 0.7,
    },
    // For Arcade
    RESET_VELOCITY_X: 0,
    GRAVITY_FROM_HEIGHT: 3,
    VELOCITY_X_FROM_HEIGHT: 0.8,
    VELOCITY_Y_FROM_HEIGHT: -5,
    // Player body
    PLAYER_BODY: { width: 14 * 4, height: 29 * 4, offsetX: -7 * 4, offsetY: -29 * 4 },
    PLAYER_BODY_SURF: { width: 44 * 4, height: 35 * 4, offsetX: -20 * 4, offsetY: -29 * 4 },
    PLAYER_BODY_GUN: { width: 26 * 4, height: 29 * 4, offsetX: -13 * 4, offsetY: -29 * 4 },
    // Foreground from height
    FOREGROUND: 0.1,
    // Game objects params
    TITLE_FONT_SIZE: 64,
    // Object names needed in different modules
    OBJECT_NAMES: {
        soundControl: 'sound-control',
        playerSpeechBubble: 'player-speech-bubble',
        playerFireboltAura: 'player-firebolt-aura',
    },
    // Depth values
    DEPTH: {
        // Super first plan
        important: 1,
        // Main plan
        foregroundMain: 0,
        // Secondary
        foregroundSecondary: -1,
        // Background
        background: -2,
        // Depth for specific objects
        soundControl: 2,
        lastScreen: 3,
    },
    // Tween durations
    DURATION: {
        // something: 1000
    },
    // Tilemap main image types
    OBJECT_TYPES: {
        image: 'image',
        static: 'static',
        background: 'background',
        logo: 'logo'
    },
    // Scale values of logos on houses
    LOGO_SCALES: {
        'c-logo1': 0.7,
        'c-logo2': 0.75,
        'c-logo3': 0.5,
        'c-logo4': 0.6,
        'c-logo5': 0.8,
        'c-logo6': 0.8,
        'c-logo7': 0.9,
        'c-logo8': 0.75,
        'c-logo9': 0.6,
        'c-logo10': 0.5,
        'c-logo11': 0.7,
        'c-logo12': 0.7,
        'c-logo13': 0.35,
        'c-logo14': 0.65,
        'c-logo15': 0.65,
        'c-logo16': 0.65,
    }
}
