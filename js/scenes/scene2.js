import AudioManager from '../audio.js'
import Properties from '../properties.js'
import Constants, { CHECKPOINTS } from '../constants.js'
import { bringToFront, clearScene, playerSpritePush, updateBody } from '../helpers.js'

// Additional pre/post-processing of sprites from tilemap
const PRE_PROCESSING = {
    //
}
const POST_PROCESSING = {
    '2-pipe1': bringToFront,
    '2-pipe2': bringToFront,
    '2-slot': processSlot,
    '2-logo6': bringToFront,
    '2-logo8': bringToFront,
    '2-logo1': bringToFront,
    '2-logo3': bringToFront,
    '2-logo2': processLogo,
    '2-logo5': processLogo,
    '2-logo4': processLogo,
    '2-logo7': processLogo,
    '2-barrier-bottom': processBarrierBottom,
    '2-barrier-top': processBarrierTop,
}
// Inactive slots
const INACTIVE_SLOT_IDS = { 196: '2-logo2', 198: '2-logo5', 297: '2-logo4', 299: '2-logo7' }
// Logo active frame number
const LOGO_ACTIVE_FRAME = 1
// Indicator colors for states
const INDICATOR_COLORS = {
    // active: 0x36ff3c,
    active: 0x3bff58,
    inactive: 0xff3838
    // inactive: 0x859789
}
// Bottom barrier state frames
const BARRIER_BOTTOM_ACTIVE = 0, BARRIER_BOTTOM_INACTIVE = 1

// Movable cubes
let logoCubes = {}
// Indicators for tweening
let indicators, indicatorsTweening
// Barrier props
let barrierBottom, barrierTop, barrierCollider

export default {
    preloadScene: function() {
        initLogoCubes()
        // Unset indicators
        indicators = []
        indicatorsTweening = true
        // Sparks
        createSparksAnimaton()
        // Add objects
        Properties.map.getObjectLayer('scene2').objects.forEach(object => {
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
        // Add tween for active indicators
        tweenIndicators()
        // Add barrier sound
        AudioManager.base.barrier = Properties.scene.sound.add('barrier', { loop: false, volume: 1 })
    },
    checkpoint: function() {
        // Set checkpoint
        Properties.checkpoint = CHECKPOINTS.dataSources
        // Clear passed objects
        clearScene()
        // Play background audio
        AudioManager.fadeInBackground()
    },
    showSpeechBubble: function() {
        // Create speech bubble elements
        let background = Properties.scene.add.image(0, 0, '1-cloud2').setOrigin(0.5)
        let fontSize = 16, lineHeight = fontSize * 1.4, offsetX = -2 * 4
        let text1 = Properties.scene.add.bitmapText(offsetX, -lineHeight * 1.5, 'dark', 'DAMN, IT SEEMS', fontSize).setOrigin(0.5, 0.85)
        let text2 = Properties.scene.add.bitmapText(offsetX, -lineHeight * 0.5, 'dark', 'LIKE MY ELT', fontSize).setOrigin(0.5, 0.85)
        let text3 = Properties.scene.add.bitmapText(offsetX, lineHeight * 0.5, 'dark', 'PIPELINES ARE', fontSize).setOrigin(0.5, 0.85)
        let text4 = Properties.scene.add.bitmapText(offsetX, lineHeight * 1.5, 'dark', 'BROKEN...', fontSize).setOrigin(0.5, 0.85)
        // Create parent container
        const posX = background.width / 2 + 6 * 4, posY = -Properties.playerSprite.height - background.height / 2 + 6 * 4
        let speech = Properties.scene.add.container(posX, posY, [background, text1, text2, text3, text4])
        // Save name for not flipping
        speech.setName(Constants.OBJECT_NAMES.playerSpeechBubble)
        Properties.player.add(speech)
        // Delay and delete after 3s
        Properties.scene.time.delayedCall(3000, () => speech.destroy())
    },
    clear: function() {
        // Destroy movable logos colliders
        for (const cubeName in logoCubes) {
            let collider = logoCubes[cubeName].collider
            if (collider && collider.active) {
                collider.destroy()
            }
        }
        // Barrier collider
        if (barrierCollider && barrierCollider.active) { barrierCollider.destroy() }
        // Stop indicators tweening
        indicatorsTweening = false
        // Remove sparks animation
        Properties.scene.anims.remove('2-sparks')
        // Clear sounds
        AudioManager.destroy('barrier')
    }
}

function initLogoCubes() {
    logoCubes = {
        // Direction: to right - true; to left - false
        '2-logo2': {
            toRight: true, inplace: false, collider: null,
            slot: undefined, indicator: undefined, sparks: undefined
        },
        '2-logo5': {
            toRight: false, inplace: false, collider: null,
            slot: undefined, indicator: undefined, sparks: undefined
        },
        '2-logo4': {
            toRight: true, inplace: false, collider: null,
            slot: undefined, indicator: undefined, sparks: undefined
        },
        '2-logo7': {
            toRight: false, inplace: false, collider: null,
            slot: undefined, indicator: undefined, sparks: undefined
        }
    }
}

function createSparksAnimaton() {
    Properties.scene.anims.create({
        key: '2-sparks',
        frames: '2-sparks',
        frameRate: 10,
        repeat: -1,
        repeatDelay: 1500
    })
}

function processSlot(slot) {
    // Define indicator positions
    let posX = slot.x + 11 * 4, posY = slot.y - 8 * 4
    // Update physics for inactive slots
    if (slot.name in INACTIVE_SLOT_IDS) {
        // Save slot for its cube
        logoCubes[INACTIVE_SLOT_IDS[slot.name]].slot = slot
        // Add offset and hidden static platforms
        updateBody({ sprite: slot, offsetY: 12 })
        // Create rects with needed sizes
        const width1 = 6 * 4, width2 = 3 * 4, height = 16 * 4
        let left = Properties.scene.add.rectangle(slot.x, slot.y, width1, height)
        left.setOrigin(0, 1).setDepth(slot.depth)
        let right = Properties.scene.add.rectangle(slot.x + slot.width, slot.y, width2, height)
        right.setOrigin(1, 1).setDepth(slot.depth)
        // Add to the groud group
        Properties.groundGroup.add(left).add(right)
        // Add inactive indicator
        logoCubes[INACTIVE_SLOT_IDS[slot.name]].indicator = createIndicator(posX, posY, false)
        // Add sparks
        createSparks(slot)
    } else {
        // Add active indicator
        createIndicator(posX, posY)
    }
}

function createSparks(slot) {
    const offsetX = 1 * 4, offsetY = 3 * 4
    let sparks = Properties.scene.add.sprite(slot.x + offsetX, slot.y - slot.height + offsetY, '2-sparks')
    sparks.setOrigin(0, 1).setDepth(Constants.DEPTH.foregroundSecondary)
    sparks.anims.play('2-sparks')
    logoCubes[INACTIVE_SLOT_IDS[slot.name]].sparks = sparks
}

function createIndicator(posX, posY, isActive = true) {
    // Dimensions: 1x3
    const width = 3 * 4, height = 1 * 4
    // Make inactive at first
    let indicator = Properties.scene.add.rectangle(posX, posY, width, height, INDICATOR_COLORS.inactive)
    indicator.setOrigin(0, 1)
    bringToFront(indicator)
    // Add to indicators for tweening
    indicators.push(indicator)
    // Activate indicator for active ones
    if (isActive) {
        activateIndicator(indicator)
    }
    return indicator
}

function activateIndicator(indicator) {
    // Set active color
    indicator.setFillStyle(INDICATOR_COLORS.active)
}

function tweenIndicators() {
    Properties.scene.add.tween({
        targets: indicators,
        alpha: 0.6,
        delay: 400, // 300
        duration: 100, // 0
        hold: 400, // 300
        yoyo: true,
        onComplete: function() {
            if (indicatorsTweening) {
                // Create new tween with current active indicators
                tweenIndicators()
            }
        }
    })
}

function processLogo(logo) {
    bringToFront(logo)
    Properties.scene.physics.add.existing(logo)
    logo.body.setAllowGravity(false).setImmovable(true)
    // Define collider and save for the specific logo
    let collider = Properties.scene.physics.add.collider(Properties.player, logo, processPush)
    logoCubes[logo.texture.key].collider = collider
}

function processPush(_, logo) {
    if (Properties.playerState.jumping && !Properties.player.body.touching.down) { return }

    let state = logoCubes[logo.texture.key]

    // Use logo as static if it is already inplace
    if (state.inplace) {
        Properties.landPlayer()
        return
    }

    if (Properties.player.body.touching.right && state.toRight) {
        playerSpritePush()
        Properties.playerState.pushingRight = true
        logo.x += 1
        checkMovingLogo(logo)
    } else if (Properties.player.body.touching.left && !state.toRight) {
        playerSpritePush()
        Properties.playerState.pushingLeft = true
        logo.x -= 1
        checkMovingLogo(logo)
    } else {
        Properties.landPlayer()
    }
}

function checkMovingLogo(logo) {
    // Play pushing sound and stop running
    AudioManager.play('push')
    AudioManager.stop('run')
    // Logos should be 3 pixels from right and 4 pixels from top of its slot
    const perfectDist = 3 * 4, minDist = 0 * 4, maxDist = 6 * 4, topDist = 5 * 4
    let state = logoCubes[logo.texture.key]
    let distance = state.slot.x + state.slot.width - logo.x - logo.width
    // Set inplace if distance is appropriate
    if (distance >= minDist && distance <= maxDist) {
        state.inplace = true
        // Tween cube down (and update position X)
        Properties.scene.tweens.add({
            targets: logo,
            x: state.slot.x + state.slot.width - logo.width - perfectDist,
            y: state.slot.y - state.slot.height + topDist,
            duration: 100,
            ease: 'Cubic.easeIn',
            // Update frame and activate indicator on complete
            onComplete: () => {
                logo.setFrame(LOGO_ACTIVE_FRAME)
                activateIndicator(state.indicator)
                state.sparks.destroy()
                lowerBarrier()
            }
        })
        // Update state for animations
        if (state.toRight) {
            Properties.playerState.pushingRight = false
        } else {
            Properties.playerState.pushingLeft = false
        }
    }
}

function processBarrierBottom(sprite) {
    barrierBottom = sprite
    bringToFront(barrierBottom)
    // Set frame to inactive state
    barrierBottom.setFrame(BARRIER_BOTTOM_INACTIVE)
}

function processBarrierTop(sprite) {
    barrierTop = sprite
    barrierTop.setDepth(Constants.DEPTH.foregroundSecondary)
    // Add physics
    Properties.scene.physics.add.existing(barrierTop)
    barrierTop.body.setImmovable(true).setAllowGravity(false)
    barrierCollider = Properties.scene.physics.add.collider(Properties.player, barrierTop)
}

function lowerBarrier() {
    const offset = barrierTop.height / 2
    const smallDistance = (barrierTop.height - offset) / 4
    const inactivePercent = inactiveLogosPercent()
    let currentDistance = !inactivePercent ? offset + smallDistance : smallDistance
    Properties.scene.tweens.add({
        targets: barrierTop,
        y: `+=${currentDistance}`,
        duration: 500,
        ease: 'Sine.easeInOut',
        onComplete: () => {
            // Update bottom barrier state if there are no inactive logos
            if (!inactivePercent) {
                barrierBottom.setFrame(BARRIER_BOTTOM_ACTIVE)
            }
        }
    })
    // Play barrier sound
    AudioManager.play('barrier')
}

function inactiveLogosPercent() {
    let inactive = 0, all = 0
    for (const key in logoCubes) {
        all += 1
        if (!logoCubes[key].inplace) {
            inactive += 1
        }
    }
    return inactive / all
}
