import AudioManager from '../audio.js'
import Properties from '../properties.js'
import Constants, { CHECKPOINTS } from '../constants.js'
import {
    clearScene, fadeOut, hideControls,
    playerSpriteRun, playerSpriteStand, startOutro
} from '../helpers.js'

// Additional pre/post-processing of sprites from tilemap
const PRE_PROCESSING = {
    '11-person1': processManager,
    '11-person2': processManager,
    '11-person3': processManager,
    '11-person4': processManager,
    '11-person5': processManager,
    '11-firework1': processFirework,
    '11-firework2': processFirework,
    '11-firework3': processFirework,
}
const POST_PROCESSING = {
    //
}

let fireworks

export default {
    preloadScene: function() {
        fireworks = []
        // Add objects
        Properties.map.getObjectLayer('scene11').objects.forEach(object => {
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
        // Add fireworks and ovation sounds
        AudioManager.base.fireworks = Properties.scene.sound.add('fireworks', { loop: false })
        AudioManager.base.ovation = Properties.scene.sound.add('ovation', { loop: false })
    },
    checkpoint: function() {
        // Set checkpoint
        Properties.checkpoint = CHECKPOINTS.endOffice
        // Clear passed objects
        clearScene()
        // Start winning scene
        gameWin()
        // Play background audio
        AudioManager.fadeInBackground()
    },
    clear: function() {
        // Destroy colliders
        // if (collider && collider.active) { collider.destroy() }
        // Destroy groups
        // clearGroup(group)
        // Stop tweens
        // if (tween) { tween.stop() }
        // Remove animations
        // Properties.scene.anims.remove('animation')
    }
}

function processManager(object) {
    let manager = Properties.scene.add.sprite(object.x, object.y, object.name)
    manager.setOrigin(0, 1).setDepth(Constants.DEPTH.foregroundSecondary)
    // Animation
    const randomDelay = 1000 * Math.random()
    Properties.scene.anims.create({
        key: object.name,
        frames: object.name,
        frameRate: 10,
        delay: randomDelay,
        repeat: -1
    })
    manager.anims.play(object.name)
}

function processFirework(object) {
    let firework = Properties.scene.add.sprite(object.x, object.y, object.name)
    // Create animation
    if (!Properties.scene.anims.exists(object.name)) {
        Properties.scene.anims.create({
            key: object.name,
            frames: object.name,
            frameRate: 10,
            repeat: -1,
            hideOnComplete: true
        })
    }
    // Save name
    firework.setName(object.name)
    // Properties
    firework.setOrigin(0, 1).setAlpha(0).setDepth(Constants.DEPTH.foregroundSecondary)
    // Add to array
    fireworks.push(firework)
}

function gameWin() {
    // Remove player's aura if it exists
    Properties.player.each(child => {
        if (child.name === Constants.OBJECT_NAMES.playerFireboltAura) {
            fadeOut(child, 500, () => child.destroy())
        }
    })
    // Disable player input
    Properties.inputEnabled = false
    // Hide controls
    hideControls()
    // If player is jumping - unset velocity and wait until it lands
    if (!Properties.playerStands()) {
        // Reset velocity
        Properties.player.body.setVelocityX(0)
        // Wait for player to land
        let interval = Properties.scene.time.addEvent({
            delay: 25,
            loop: true,
            callback: () => {
                if (Properties.playerStands()) {
                    interval.remove()
                    // Set velocity back
                    Properties.player.body.setVelocityX(Properties.playerVelocityRun())
                    playerSpriteRun()
                    // Finish after landed and started running
                    finishGame()
                }
            }
        })
    } else {
        finishGame()
    }
}

function finishGame() {
    // Play running and ovation sounds
    AudioManager.play('run')
    AudioManager.fadeIn('ovation', 1, 500)
    // Wait and stop
    const RUNNING_TIME = 3800, OUTRO_DELAY = 3000
    Properties.scene.time.delayedCall(RUNNING_TIME, () => {
        Properties.player.body.setVelocityX(0)
        playerSpriteStand()
        // Stop running sound
        AudioManager.stop('run')
        Properties.scene.time.delayedCall(OUTRO_DELAY, startOutro)
        // Fade out ovation sound before outro
        AudioManager.fadeOut('ovation', OUTRO_DELAY)
    })
    // Add speech bubble
    let background = Properties.scene.add.image(0, 0, '1-cloud2').setOrigin(0.5)
    let fontSize = 24, lineHeight = fontSize * 1.5, offsetX = -2 * 4
    let text1 = Properties.scene.add.bitmapText(offsetX, -lineHeight / 2, 'dark', 'I GOT', fontSize).setOrigin(0.5, 0.85)
    let text2 = Properties.scene.add.bitmapText(offsetX, lineHeight / 2, 'dark', 'THE DATA!', fontSize).setOrigin(0.5, 0.85)
    const posX = background.width / 2 + 6 * 4, posY = -Properties.playerSprite.height - background.height / 2 + 6 * 4
    let speech = Properties.scene.add.container(posX, posY, [background, text1, text2])
    Properties.player.add(speech)
    // Delay and delete speech after 3s
    Properties.scene.time.delayedCall(3000, () => speech.destroy())
    // Firework play function
    let showFirework = firework => {
        firework.setAlpha(1)
        firework.anims.play(firework.name)
    }
    // Delayed calls
    Properties.scene.time.delayedCall(600, () => {
        showFirework(fireworks[0])
        // Fade in fireworks sound
        AudioManager.fadeIn('fireworks', 1, 150)
    })
    Properties.scene.time.delayedCall(1800, () => showFirework(fireworks[1]))
    Properties.scene.time.delayedCall(1000, () => showFirework(fireworks[2]))
    Properties.scene.time.delayedCall(2500, () => showFirework(fireworks[3]))
}
