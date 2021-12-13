import AudioManager from '../audio.js'
import Properties from '../properties.js'
import Constants, { CHECKPOINTS } from '../constants.js'
import {
    addBounceTween, bringToFront, clearGroup, clearScene, fadeInOutTitle,
    flipPlayer, hideControls, playerSpriteStand, startOutro, updateBody
} from '../helpers.js'

// Additional pre/post-processing of sprites from tilemap
const PRE_PROCESSING = {
    '12-snowflake': addSnowflake,
}
const POST_PROCESSING = {
    '12-gun': processGun,
}
// Initial "health" value of snowflakes
const SNOWFLAKE_SNOW_MAX = 100
// Minimum value
const SNOWFLAKE_SNOW_MIN = 0
// Delta for decreasing helth
const SNOWFLAKE_SNOW_DELTA = 1
// Key points for snowflake opacity update
const SNOWFLAKE_THRESHOLD1 = {
    value: (SNOWFLAKE_SNOW_MAX - SNOWFLAKE_SNOW_MIN) * 2 / 3,
    alpha: 0.85, frame: 1, bodyPercent: 0.6
}
const SNOWFLAKE_THRESHOLD2 = {
    value: (SNOWFLAKE_SNOW_MAX - SNOWFLAKE_SNOW_MIN) * 1 / 3,
    alpha: 0.7, frame: 2, bodyPercent: 0.5
}
// Save snowflakes for making them fall
const SNOWFLAKE_STATES = {
    // First wave
    // Two in background
    927: { snowflake: undefined, delay: 0, duration: 4000 },
    928: { snowflake: undefined, delay: 500, duration: 4500 },
    // Second wave
    // One in front
    930: { snowflake: undefined, delay: 0, duration: 3000 },
    // Three in background
    1006: { snowflake: undefined, delay: 500, duration: 4500 },
    1007: { snowflake: undefined, delay: 150, duration: 5500 },
    1008: { snowflake: undefined, delay: 700, duration: 6000 },
    // Third wave
    // Two in front
    934: { snowflake: undefined, delay: 0, duration: 2000 },
    935: { snowflake: undefined, delay: 700, duration: 3000 },
    // Two in background
    1009: { snowflake: undefined, delay: 2000, duration: 5000 },
    1010: { snowflake: undefined, delay: 300, duration: 6000 },
}
const SNOWFLAKE_WAVES = [
    [927, 928],
    [930, 1006, 1007, 1008],
    [934, 935, 1009, 1010],
]

let fireSprite
let snowflakesGroup, fireCollider, snowflakesCollider

export default {
    preloadScene: function() {
        initSnowflakesGroup()
        // Add objects
        Properties.map.getObjectLayer('scene12').objects.forEach(object => {
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
        // Add flamethrower sound
        AudioManager.base.flamethrower = Properties.scene.sound.add('flamethrower', { loop: true })
    },
    checkpoint: function() {
        // Set checkpoint
        Properties.checkpoint = CHECKPOINTS.snowflakes
        // Clear passed objects
        clearScene()
        // Show title
        fadeInOutTitle('SECRET LEVEL UNLOCKED!')
        // Set colliding with world bounds
        Properties.player.body.setCollideWorldBounds(true)
        // Add a wall after the office
        closeWayBack()
        // Play background audio
        AudioManager.fadeInBackground()
    },
    fallSnowflakes1: function() { startSnowflakesWave(0) },
    fallSnowflakes2: function() { startSnowflakesWave(1) },
    fallSnowflakes3: function() { startSnowflakesWave(2) },
    dropGun: function() { removeGunFire() },
    clear: function() {
        // Destroy colliders
        if (fireCollider && fireCollider.active) { fireCollider.destroy() }
        if (snowflakesCollider && snowflakesCollider.active) { snowflakesCollider.destroy() }
        // Destroy groups
        clearGroup(snowflakesGroup)
        // Stop tweens
        // if (tween) { tween.stop() }
        // Remove animations
        Properties.scene.anims.remove('12-fire-start')
        Properties.scene.anims.remove('12-fire-blow')
        Properties.scene.anims.remove('12-fire-end')
        // Destroy sounds
        AudioManager.destroy('flamethrower')
    }
}

function initSnowflakesGroup() {
    snowflakesGroup = Properties.scene.physics.add.group({ allowGravity: false, immovable: true })
    // Game over on collision with player
    snowflakesCollider = Properties.scene.physics.add.overlap(Properties.player, snowflakesGroup, () => {
        Properties.gameOver()
    })
}

function processGun(gun) {
    // Add physics
    const widthOffset = 8 * 4
    Properties.scene.physics.add.existing(gun, true)
    updateBody({ sprite: gun, width: gun.width - widthOffset, offsetX: widthOffset / 2 })
    // Add bouncing and bring to front
    let tween = addBounceTween(gun)
    bringToFront(gun)
    // Add gun collecting
    let overlap = Properties.scene.physics.add.overlap(Properties.player, gun, () => {
        gun.destroy()
        tween.stop()
        overlap.destroy()
        // Update player state
        Properties.playerState.withGun = true
        // Update physics body
        updatePlayerBody(Constants.PLAYER_BODY_GUN)
        // Add fire
        addGunFire()
        // If jumping, start gun jumping animation from current frame
        if (Properties.playerState.jumping) {
            let currentIndex = Properties.playerSprite.anims.currentFrame.index
            Properties.playerSprite.anims.play('player-jump-gun')
            // Move frames until the last in jump animation
            for (let index = 0; index < currentIndex; index++) {
                Properties.playerSprite.anims.nextFrame()
            }
        }
    })
}

function addSnowflake(object) {
    let snowflake = Properties.scene.add.image(object.x, object.y, '12-snowflake')
    snowflake.setOrigin(0, 1)
    bringToFront(snowflake)
    // Add name param as current snow value 
    snowflake.setName(SNOWFLAKE_SNOW_MAX)
    // Init physics
    snowflakesGroup.add(snowflake)
    const offset = 8 * 4
    updateBody({ sprite: snowflake, width: snowflake.width - offset, offsetX: offset / 2 })
    // Save to states
    SNOWFLAKE_STATES[object.id].snowflake = snowflake
}

function addGunFire() {
    // Create animations
    Properties.scene.anims.create({
        key: '12-fire-start',
        frames: Properties.scene.anims.generateFrameNumbers('12-fire', { start: 0, end: 1 }),
        frameRate: 10
    })
    Properties.scene.anims.create({
        key: '12-fire-blow',
        frames: Properties.scene.anims.generateFrameNumbers('12-fire', { start: 2, end: 7 }),
        frameRate: 10,
        repeat: -1
    })
    Properties.scene.anims.create({
        key: '12-fire-end',
        frames: Properties.scene.anims.generateFrameNumbers('12-fire', { start: 8 }),
        frameRate: 10
    })
    // Create the fire itself
    const yOffset = -15 * 4
    fireSprite = Properties.scene.add.sprite(0, yOffset, '12-fire')
    fireSprite.anims.play('12-fire-start')
    fireSprite.anims.chain('12-fire-blow')
    Properties.player.add(fireSprite)
    Properties.player.sendToBack(fireSprite)
    // Add physics
    Properties.scene.physics.add.existing(fireSprite)
    fireSprite.body.setAllowGravity(false).setImmovable(true)
    const widthOffset = 6 * 4
    updateBody({ sprite: fireSprite, width: fireSprite.width - widthOffset, offsetX: widthOffset / 2 })
    // Init collisions with snowflakes
    fireCollider = Properties.scene.physics.add.overlap(fireSprite, snowflakesGroup, checkFireCollision)
    // Play flamethrower sound
    AudioManager.fadeIn('flamethrower', 0.8, 500)
}

function startSnowflakesWave(waveIndex) {
    for (const snowflakeId of SNOWFLAKE_WAVES[waveIndex]) {
        let { snowflake, delay, duration } = SNOWFLAKE_STATES[snowflakeId]
        fallSnowflake(snowflake, delay, duration)
    }
}

function fallSnowflake(snowflake, appearingDelay = 0, totalDuration = 3500) {
    if (!snowflake) { return }
    // Alpha
    snowflake.setAlpha(0)
    Properties.scene.tweens.add({
        targets: snowflake,
        alpha: 1,
        delay: appearingDelay + totalDuration * 0.2,
        duration: totalDuration * 0.2
    })
    // Vertical
    Properties.scene.tweens.add({
        targets: snowflake,
        delay: appearingDelay,
        y: Properties.foregroundY(),
        ease: 'Quard.easeOut',
        duration: totalDuration
    })
    // Horizontal
    Properties.scene.tweens.timeline({
        targets: snowflake,
        tweens: [
            {
                delay: appearingDelay,
                x: snowflake.x + 4 * 4,
                duration: totalDuration / 4
            },
            {
                x: snowflake.x,
                duration: totalDuration / 4
            },
            {
                x: snowflake.x - 4 * 4,
                duration: totalDuration / 4
            },
            {
                x: snowflake.x,
                duration: totalDuration / 4
            },
        ]
    })
}

function checkFireCollision(_fire, snowflake) {
    const snowflakeIsToRight = snowflake.x > Properties.player.x
    const isFlipped = Properties.playerSprite.flipX
    // Check whether to process collision
    if (snowflakeIsToRight && !isFlipped || !snowflakeIsToRight && isFlipped) {
        meltSnowflake(snowflake)
    }
}

function meltSnowflake(snowflake) {
    snowflake.setName(snowflake.name - SNOWFLAKE_SNOW_DELTA)
    if (snowflake.name <= SNOWFLAKE_SNOW_MIN) {
        snowflake.destroy()
        checkLeftSnowflakes()
    } else if (snowflake.name <= SNOWFLAKE_THRESHOLD2.value) {
        updateSnowfakeState(snowflake, SNOWFLAKE_THRESHOLD2)
    } else if (snowflake.name <= SNOWFLAKE_THRESHOLD1.value) {
        updateSnowfakeState(snowflake, SNOWFLAKE_THRESHOLD1)
    }
}

function updateSnowfakeState(snowflake, { alpha, frame, bodyPercent }) {
    if (snowflake.alpha != alpha) {
        snowflake.setAlpha(alpha)
        snowflake.setFrame(frame)
        const bodySize = snowflake.width * bodyPercent, bodyOffset = snowflake.width * (1 - bodyPercent) / 2
        updateBody({
            sprite: snowflake, width: bodySize, height: bodySize,
            offsetX: bodyOffset, offsetY: bodyOffset
        })
    }
}

function updatePlayerBody({ width, height, offsetX, offsetY }) {
    updateBody({ sprite: Properties.player, width, height, offsetX, offsetY })
}

function removeGunFire(onComplete = null) {
    // Play fire ending animation and destroy it
    fireSprite.anims.play('12-fire-end')
    fireSprite.on('animationcomplete', () => {
        // Update player's body and state
        updatePlayerBody(Constants.PLAYER_BODY)
        Properties.playerState.withGun = false
        // Remove fire sprite from player's container and destroy
        Properties.player.remove(fireSprite, true)
        // Drop gun from player - add to the ground
        const posX = Properties.player.x - 8 * 4, posY = Properties.foregroundY() + 4 * 4
        let gun = Properties.scene.add.image(posX, posY, '12-gun')
        gun.setOrigin(0.5, 1)
        bringToFront(gun)
        if (onComplete) { onComplete() }
    })
    // Fade out flamethrower sound
    AudioManager.fadeOut('flamethrower', 500)
}

function checkLeftSnowflakes() {
    for (const state of Object.values(SNOWFLAKE_STATES)) {
        if (state.snowflake.active) { return }
    }
    // Finish when every snowflake is destroyed
    const delay = 3000, fontSize = 52, waitForOutro = 4000
    // Disable input
    removeGunFire(() => {
        // Reset player params and disable input
        flipPlayer(false)
        playerSpriteStand()
        AudioManager.stop('run')
        Properties.player.body.setVelocity(Properties.playerVelocityBase)
        Properties.inputEnabled = false
        // Hide touch controls
        hideControls()
        // Show success title, then the last outro screen
        fadeInOutTitle(["CONGRATS! YOU'VE MELTED", 'ALL THE SNOWFLAKES!'], null, delay, fontSize)
        Properties.scene.time.delayedCall(waitForOutro, () => startOutro(true))
    })
}

function closeWayBack() {
    const wallWidth = 100, wallHeight = Properties.playerSprite.height * 1.5
    const posX = Properties.player.x - 300, posY = Properties.foregroundY()
    let wall = Properties.scene.add.rectangle(posX, posY, wallWidth, wallHeight).setOrigin(1, 1)
    Properties.scene.physics.add.existing(wall, true)
    Properties.scene.physics.add.collider(Properties.player, wall)
}
