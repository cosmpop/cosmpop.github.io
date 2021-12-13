import AudioManager from '../audio.js'
import Properties from '../properties.js'
import { CHECKPOINTS } from '../constants.js'
import { bringToFront, clearScene, updateBody } from '../helpers.js'

// Additional pre/post-processing of sprites from tilemap
const PRE_PROCESSING = {
    //
}
const POST_PROCESSING = {
    '8-speech-s': processSpeech,
    '8-speech-m': processSpeech,
    '8-speech-l': processSpeech,
    '8-person3': flipPerson,
    '8-person5': flipPerson,
    '8-data': flipPerson,
}
// Cloud texts
const CLOUD_TEXTS = {
    788: ['WHEN SHOULD I', 'EXPECT THE DATA?'],
    789: ['WHY IS MY DASHBOARD', 'SO SLOW?'],
    790: ['WHY CAN I ONLY SEE', 'ONE MONTH BACK?'],
    791: ["WHY CAN'T I", 'DRILL DOWN?'],
    792: ["WHY ISN'T", 'THE DATA FRESH?'],
    921: ['WHY IS IT SO', '%{*# EXPENSIVE?'],
    961: ['SHOW ME', 'THE DATA'],
}

export default {
    preloadScene: function() {
        // Add objects
        Properties.map.getObjectLayer('scene8').objects.forEach(object => {
            if (object.name in PRE_PROCESSING) {
                // Pre processing
                PRE_PROCESSING[object.name](object)
            } else {
                let sprite = Properties.addMapImage(object)
                // Post processing
                if (object.name in POST_PROCESSING) {
                    POST_PROCESSING[object.name](sprite)
                }
            }
        })
    },
    checkpoint: function() {
        // Set checkpoint
        Properties.checkpoint = CHECKPOINTS.dataQuotes
        // Clear passed objects
        clearScene()
        // Play background audio
        AudioManager.fadeInBackground()
    }
}

function processSpeech(cloud) {
    // Update physics body
    let offsetWidth = 4 * 4, offsetHeight = 6 * 4
    updateBody({
        sprite: cloud,
        width: cloud.width - offsetWidth,
        height: cloud.height - offsetHeight,
        offsetX: offsetWidth / 2,
        offsetY: offsetHeight / 2
    })
    // Update depth
    bringToFront(cloud)
    // Add text
    addCloudText(cloud)
}

function addCloudText(cloud) {
    if (!(cloud.name in CLOUD_TEXTS)) { return }

    let textLines = CLOUD_TEXTS[cloud.name]
    let maxLineLength = Math.max(textLines[0].length, textLines.length > 1 ? textLines[1].length : 0)
    // Define font size
    let fontSize
    if (maxLineLength < 10) {
        fontSize = 22
    } else if (maxLineLength < 13) {
        fontSize = 19
    } else {
        fontSize = 17
    }

    // Positions
    let posX = cloud.x + cloud.width / 2, posY = cloud.y - cloud.height / 2
    // Add texts for one and two lines
    if (textLines.length === 1) {
        let text = Properties.scene.add.bitmapText(posX, posY, 'dark', textLines[0], fontSize)
        text.setOrigin(0.5, 0.85)
        bringToFront(text)
    } else {
        // Texts for two lines
        let offset = fontSize / 2 + 4
        let text1 = Properties.scene.add.bitmapText(posX, posY - offset, 'dark', textLines[0], fontSize)
        let text2 = Properties.scene.add.bitmapText(posX, posY + offset, 'dark', textLines[1], fontSize)
        // Set origin to shift texts
        text1.setOrigin(0.5, 0.85)
        text2.setOrigin(0.5, 0.85)
        bringToFront(text1)
        bringToFront(text2)
    }
}

function flipPerson(person) {
    person.setFlip(true)
}
