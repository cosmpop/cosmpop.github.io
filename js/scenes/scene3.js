import AudioManager from '../audio.js'
import Properties from '../properties.js'
import { CHECKPOINTS } from '../constants.js'
import { bringToFront, clearScene, flipPlayer, playerSpriteSlide, updateBody } from '../helpers.js'

// Additional processing of sprites from tilemap
const PROCESSING = {
    '3-label': bringToFront,
    '3-pipe1': processPipe,
    '3-pipe5': processPipe,
    '3-transition': transition => processPipe(transition, true),
    '3-construction': bringToFront
}

const LAST_PIPE_ID = 251

// If player already slided => just walk on the pipes
let slided

export default {
    preloadScene: function() {
        slided = false
        Properties.map.getObjectLayer('scene3').objects.forEach(object => {
            let sprite = Properties.addMapImage(object)
            // Post processing
            if (object.name in PROCESSING) {
                PROCESSING[object.name](sprite)
            }
        })
    },
    checkpoint: function() {
        // Set checkpoint
        Properties.checkpoint = CHECKPOINTS.dataPipeline
        // Clear passed objects
        clearScene()
        // Play background audio
        AudioManager.fadeInBackground()
    }
}

function processPipe(pipe, isTransition = false) {
    // Bring to front and add physics
    bringToFront(pipe)
    Properties.scene.physics.add.existing(pipe, true)
    Properties.scene.physics.add.collider(Properties.player, pipe, processSlide)
    // Update body, make height a bit less
    let offsetHeight = isTransition ? 12 : 4
    updateBody({ sprite: pipe, offsetY: offsetHeight })
}

function processSlide(player, pipe) {
    // Stop on the last pipe
    if (pipe.name === LAST_PIPE_ID || Properties.checkpoint > CHECKPOINTS.dataPipeline) {
        slided = true
        AudioManager.stop('slide')
    }
    // Land and run if player already slided
    if (slided) {
        if (Properties.playerState.sliding || Properties.playerState.jumping) {
            Properties.landPlayer()
        }
        return
    }
    // Set sliding only if player is on top and is not already sliding
    if (pipe.body.touching.up && !Properties.playerState.sliding) {
        // Disable input
        Properties.inputEnabled = false
        // Update states
        Properties.playerState.jumping = false
        Properties.playerState.sliding = true
        // Set usual running velocity
        player.body.setVelocityX(Properties.playerVelocityRun())
        // Update animation and clearly set flip (in case if player jumps back to the pipe)
        playerSpriteSlide()
        flipPlayer(false)
        // Set camera to follow player
        if (Properties.cameraFollowingEnabled) {
            Properties.camera.startFollow(player)
        }
        // Play sliding sound
        AudioManager.play('slide')
    }
}
