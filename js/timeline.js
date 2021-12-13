import Constants, { CHECKPOINTS } from './constants.js'
import Properties from './properties.js'
import Scene1 from './scenes/scene1.js'
import Scene2 from './scenes/scene2.js'
import Scene3 from './scenes/scene3.js'
import Scene4 from './scenes/scene4.js'
import Scene5 from './scenes/scene5.js'
import Scene6, { board } from './scenes/scene6.js'
import Scene7 from './scenes/scene7.js'
import Scene8 from './scenes/scene8.js'
import Scene9 from './scenes/scene9.js'
import Scene10 from './scenes/scene10.js'
import Scene11 from './scenes/scene11.js'
import Scene12 from './scenes/scene12.js'
import { playerSpriteFall } from './helpers.js'

const HANDLERS = {
    // Scene 1
    '1-load': Scene1.preloadScene,
    '1-checkpoint': Scene1.checkpoint,
    '1-clear': Scene1.clear,
    // Scene 2
    '2-load': Scene2.preloadScene,
    '2-checkpoint': Scene2.checkpoint,
    '2-speech': Scene2.showSpeechBubble,
    '2-clear': Scene2.clear,
    // Scene 3
    '3-load': Scene3.preloadScene,
    '3-checkpoint': Scene3.checkpoint,
    // Scene 4
    '4-load': Scene4.preloadScene,
    '4-checkpoint': Scene4.checkpoint,
    '4-clear': Scene4.clear,
    // Scene 5
    '5-load': Scene5.preloadScene,
    '5-checkpoint': Scene5.checkpoint,
    '5-clear': Scene5.clear,
    // Scene 6
    '6-load': Scene6.preloadScene,
    '6-checkpoint1': Scene6.checkpoint1,
    '6-swamp': Scene6.dataSwampTitle,
    '6-checkpoint2': Scene6.checkpoint2,
    '6-wave': Scene6.startDataWave,
    '6-clear': Scene6.clear,
    // Scene 7
    '7-load': Scene7.preloadScene,
    '7-checkpoint': Scene7.checkpoint,
    '7-harry': Scene7.addHarryPotter,
    '7-title': Scene7.showTitle,
    '7-clear': Scene7.clear,
    // Scene 8
    '8-load': Scene8.preloadScene,
    '8-checkpoint': Scene8.checkpoint,
    // Scene 9
    '9-load': Scene9.preloadScene,
    '9-checkpoint': Scene9.checkpoint,
    '9-clear': Scene9.clear,
    // Scene 10
    '10-load': Scene10.preloadScene,
    '10-checkpoint': Scene10.checkpoint,
    '10-plots1': Scene10.loadPlots1,
    '10-plots2': Scene10.loadPlots2,
    '10-plots3': Scene10.loadPlots3,
    '10-reset': Scene10.returnPlayerJump,
    '10-clear': Scene10.clear,
    // Scene 11
    '11-load': Scene11.preloadScene,
    '11-checkpoint': Scene11.checkpoint,
    // Bonus level - Scene 12
    '12-load': Scene12.preloadScene,
    '12-checkpoint': Scene12.checkpoint,
    '12-snowflakes1': Scene12.fallSnowflakes1,
    '12-snowflakes2': Scene12.fallSnowflakes2,
    '12-snowflakes3': Scene12.fallSnowflakes3,
    // '12-drop': Scene12.dropGun,
    // '12-clear': Scene12.clear,
}

let current = Constants.BASE_CHECKPOINT

export function moveToEvent(eventName) {
    // Shift
    shiftTimeline(eventName)
    // Get event
    let event = Properties.timelineEvents[current]
    // Get current scene number
    let scene = parseInt(event.name.split('-')[0])
    // Check and load previous scene (for the first scene load the next one also)
    if (scene > Constants.BASE_CHECKPOINT) { handleEvent(`${scene - 1}-load`) }
    // Then load current scene
    handleEvent(`${scene}-load`)
    // Move camera and player
    if (scene === Constants.BASE_CHECKPOINT) {
        // Reset camera
        Properties.camera.scrollX = event.x
        // Start the beginning scene
        Scene1.startScene()
        // Place player outside the map
        const offset = 1 * 4
        Properties.player.x = event.x - Properties.player.body.width / 2 + offset
    } else {
        // Place in center for other scenes
        Properties.camera.scrollX = event.x - Properties.sceneSize.width / 2
        Properties.player.x = event.x
    }
    // Set player Y position from checkpoints data
    const offset = (Constants.CHECKPOINT_POSITIONS[scene] || 0) * Properties.sceneSize.height
    Properties.player.y = Properties.foregroundY() - offset
    // Set jumping if offset is not zero
    if (offset) {
        Properties.playerState.jumping = true
        playerSpriteFall()
        // Disable control for surfing beginning
        if (Properties.checkpoint === CHECKPOINTS.dataLake ||
            Properties.checkpoint === CHECKPOINTS.dataTsunami)
        {
            Properties.inputEnabled = false
            // Shift board position
            const boardOffset = -3 * 4
            board.x = Properties.player.x + boardOffset
        }
    }
}

export function shiftTimeline(eventName) {
    // Seek for the event
    let index = Properties.timelineEvents.findIndex(event => event.name === eventName)
    // Set current from index (to first if not found)
    current = index !== -1 ? index : 0
}

export function checkTimeline() {
    if (current >= Properties.timelineEvents.length) { return }

    if (Properties.timelineEvents[current].x <= Properties.player.x) {
        let currentEvent = Properties.timelineEvents[current].name
        // Handle
        handleEvent(currentEvent)
        // Move to next event
        current++
    }
}

function handleEvent(event) {
    if (event in HANDLERS) {
        HANDLERS[event]()
    } else {
        console.log(`${event} event handler not found`)
    }
}
