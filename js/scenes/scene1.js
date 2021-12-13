import AudioManager from '../audio.js'
import Properties from '../properties.js'
import Constants, { CHECKPOINTS } from '../constants.js'
import {
    flipPlayer, initTutorialControls,
    playerSpriteRun, playerSpriteStand, showControls
} from '../helpers.js'

// Additional processing of sprites from tilemap
const PROCESSING = {
    '1-office': addClouds
}
// Intro screen DOM element
const INTRO_SCREEN = document.getElementById('intro')
const INTRO_SCREEN_HELP_TEXT = INTRO_SCREEN.getElementsByTagName('p')[1]

let cloud1, cloud2

// Update intro text for touch devices
if (Constants.IS_TOUCH_DEVICE) {
    INTRO_SCREEN_HELP_TEXT.textContent = 'TOUCH THE SCREEN TO PLAY'
}

export default {
    preloadScene: function() {
        Properties.map.getObjectLayer('scene1').objects.forEach(object => {
            let sprite = Properties.addMapImage(object)
            // Post processing
            if (object.name in PROCESSING) {
                PROCESSING[object.name](sprite)
            }
        })
        // Managers speaking sounds
        AudioManager.base.manager1 = Properties.scene.sound.add('manager1', { loop: false, volume: 2 })
        AudioManager.base.manager2 = Properties.scene.sound.add('manager2', { loop: false })
    },
    startScene: function() {
        // Take control
        Properties.inputEnabled = false
        // Show with a slight delay
        INTRO_SCREEN.classList.remove('hidden')
        Properties.scene.time.delayedCall(100, () => INTRO_SCREEN.classList.add('shown'))
        // Start function
        let minimalTimeLeft = false, actionMade = false, gameStarted = false
        let startFunctionHandler = () => {
            // Whether key is pressed or screen is touched
            actionMade = true
            // Check for minimal time
            if (minimalTimeLeft && !gameStarted) {
                startGame()
                INTRO_SCREEN.classList.remove('shown')
                Properties.scene.time.delayedCall(1000, () => INTRO_SCREEN.classList.add('hidden'))
                // Remove listeners
                document.removeEventListener('keyup', startFunctionHandler)
                document.removeEventListener('pointerup', startFunctionHandler)
                // Additional check
                gameStarted = true
            }
        }
        // Start when any key is pressed
        document.addEventListener('keyup', startFunctionHandler)
        // Start when screen is touched
        document.addEventListener('pointerup', startFunctionHandler)
        // Minimal time when text is shown
        Properties.scene.time.delayedCall(1500, () => {
            minimalTimeLeft = true
            // Start the game if an action has been made
            if (actionMade) {
                startFunctionHandler()
            }
        })
    },
    checkpoint: function() {
        // Set initial checkpoint
        Properties.checkpoint = CHECKPOINTS.startOffice
    },
    clear: function() {
        // Clear sounds
        AudioManager.destroy('manager1')
        AudioManager.destroy('manager2')
    }
}

function startGame() {
    const RUN1_TIME = 2750, RUN2_TIME = 2800
    const CLOUD1_TIME = 1200, CLOUD2_TIME = 2400
    const BETWEEN_TIME = 500
    // Make camera to follow player
    if (Properties.cameraFollowingEnabled) {
        Properties.camera.startFollow(Properties.player)
    }
    // Run in and get commands from managers
    playerRunsIn(RUN1_TIME, () => {
        Properties.scene.time.delayedCall(BETWEEN_TIME, () => {
            cloud1.setAlpha(1)
            AudioManager.play('manager1')
            Properties.scene.time.delayedCall(CLOUD1_TIME, () => {
                cloud1.destroy()
                Properties.scene.time.delayedCall(BETWEEN_TIME, () => {
                    cloud2.setAlpha(1)
                    AudioManager.play('manager2')
                    flipPlayer(true)
                    Properties.scene.time.delayedCall(CLOUD2_TIME, () => {
                        cloud2.destroy()
                        Properties.scene.time.delayedCall(BETWEEN_TIME, () => {
                            flipPlayer(false)
                            playerRunsIn(RUN2_TIME, () => {
                                Properties.inputEnabled = true
                                // Show controls for mobile
                                showControls()
                                // Add tutorial
                                initTutorialControls()
                            })
                        })
                    })
                })
            })
        })
    })
    // Play background audio
    AudioManager.fadeInBackground(1000)
}

function playerRunsIn(timeout, onComplete = null) {
    let playerVelocity = Properties.playerVelocityRun() * 0.75
    Properties.player.body.setVelocityX(playerVelocity)
    playerSpriteRun()
    // TODO: Leave or remove this
    // AudioManager.play('run')
    // Wait and stop
    Properties.scene.time.delayedCall(timeout, () => {
        Properties.player.body.setVelocityX(Properties.playerVelocityBase)
        playerSpriteStand()
        // AudioManager.stop('run')
        if (onComplete) { onComplete() }
    })
}

function addClouds(office) {
    let cloud1X = office.x + office.width * 0.605, cloud2X = office.x + office.width * 0.506
    let cloud1Y = office.y - office.height * 0.4, cloud2Y = office.y - office.height * 0.42
    // Background
    let background1 = Properties.scene.add.image(0, 0, '1-cloud1')
    let background2 = Properties.scene.add.image(0, 0, '1-cloud2')
    // Texts
    let fontSize1 = 23, offsetY1 = fontSize1 * 1.2 / 2, offsetX1 = 6
    let cloud1Text1 = Properties.scene.add.bitmapText(offsetX1, -offsetY1, 'dark', 'GET US', fontSize1).setOrigin(0.5, 0.85)
    let cloud1Text2 = Properties.scene.add.bitmapText(offsetX1, offsetY1, 'dark', 'THE DATA!', fontSize1).setOrigin(0.5, 0.85)
    let fontSize2 = 24, offsetY2 = fontSize2 * 1.2 / 2, offsetX2 = -4
    let cloud2Text1 = Properties.scene.add.bitmapText(offsetX2, -2 * offsetY2, 'dark', 'WE NEED', fontSize2).setOrigin(0.5, 0.85)
    let cloud2Text2 = Properties.scene.add.bitmapText(offsetX2, 0, 'dark', 'NUMBERS!', fontSize2).setOrigin(0.5, 0.85)
    let cloud2Text3 = Properties.scene.add.bitmapText(offsetX2, 2 * offsetY2, 'dark', 'FAST!!', fontSize2).setOrigin(0.5, 0.85)
    // Containers
    cloud1 = Properties.scene.add.container(cloud1X, cloud1Y, [background1, cloud1Text1, cloud1Text2])
    cloud2 = Properties.scene.add.container(cloud2X, cloud2Y, [background2, cloud2Text1, cloud2Text2, cloud2Text3])
    // Hide containers
    cloud1.setAlpha(0)
    cloud2.setAlpha(0)
}
