import AudioManager from '../audio.js'
import Properties from '../properties.js'
import { CHECKPOINTS } from '../constants.js'
import {
    bringToFront, clearGroup, clearScene, flipPlayer,
    playerSpriteJump, playerSpriteSlide, updateBody
} from '../helpers.js'

// Additional pre/post-processing of sprites from tilemap
const PRE_PROCESSING = {
    '5-snake1': addSnake,
    '5-snake2': addSnake
}
const POST_PROCESSING = {
    '5-pipe1': processPipe,
    '5-pipe2': processPipe,
    '5-pipe3': processPipe,
    '5-pipe4': processPipe,
    '5-pipe5': processPipe,
    '5-pipe-stand': bringToFront,
    '5-microsoft': processCloud,
    '5-amazon': processCloud,
    '5-google': processCloud,
    '5-ground': sprite => Properties.groundGroup.add(sprite)
}
// Key pipes
const JUMP_PIPE_ID = 317
const LAST_PIPE_ID = 369
// All clouds
const CLOUD1_ID = 322, CLOUD2_ID = 321, CLOUD3_ID = 323
// Snakes moving left and snakes duration
const SNAKES_TO_LEFT_IDS = new Set([361, 368, 367, 358, 362, 357])
const SNAKES_DURATION = 1200

// Snake params
let snakeGroup, snakeCollider
// Clouds params
let cloudsGroup, cloudsCollider
let cloudStates = {}
// States for configuring pipes interaction for clouds states
let reachedClouds, notOnFirstCloud

export default {
    preloadScene: function() {
        reachedClouds = false, notOnFirstCloud = true
        initCloudStates()
        initCloudsGroup()
        initSnakeGroup()
        // Add objects
        Properties.map.getObjectLayer('scene5').objects.forEach(object => {
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
        tweenClouds()
        // Add cloud jumping sound
        AudioManager.base['jump-clouds'] = Properties.scene.sound.add('jump-clouds', { loop: false })
        AudioManager.base.snakes = Properties.scene.sound.add('snakes', { loop: true })
    },
    checkpoint: function() {
        // Set checkpoint
        Properties.checkpoint = CHECKPOINTS.dataClouds
        // Clear passed objects
        clearScene()
        // Play background audio
        AudioManager.fadeInBackground()
    },
    clear: function() {
        // Destroy colliders
        if (cloudsCollider && cloudsCollider.active) { cloudsCollider.destroy() }
        if (snakeCollider && snakeCollider.active) { snakeCollider.destroy() }
        // Destroy groups
        clearGroup(cloudsGroup)
        clearGroup(snakeGroup)
        // Remove animations
        Properties.scene.anims.remove('5-snake1')
        Properties.scene.anims.remove('5-snake2')
        // Destroy audio
        AudioManager.destroy('jump-cloud')
        AudioManager.destroy('snakes')
    }
}

function initCloudStates() {
    cloudStates = {
        [CLOUD1_ID]: {
            scale: 1,
            tween: undefined,
            raisesPlayer: false,
        },
        [CLOUD2_ID]: {
            scale: 0.8,
            tween: undefined,
            raisesPlayer: false,
        },
        [CLOUD3_ID]: {
            scale: 0.6,
            tween: undefined,
            raisesPlayer: false,
        }
    }
}

function initCloudsGroup() {
    cloudsGroup = Properties.scene.physics.add.group({ allowGravity: false, immovable: true })
    cloudsCollider = Properties.scene.physics.add.collider(Properties.player, cloudsGroup, raisePlayer)
}

function initSnakeGroup() {
    snakeGroup = Properties.scene.physics.add.group({ allowGravity: false, immovable: true })
    snakeCollider = Properties.scene.physics.add.collider(
        Properties.player,
        snakeGroup,
        () => Properties.gameOver()
    )
    // Create animations
    for (const spriteName of ['5-snake1', '5-snake2']) {
        Properties.scene.anims.create({
            key: spriteName,
            frames: spriteName,
            frameRate: 10,
            repeat: -1
        })
    }
}

function addSnake(object) {
    let snake = snakeGroup.create(object.x, object.y, object.name).setOrigin(0, 1)
    updateBody({ sprite: snake, offsetY: snake.height * 0.2 })
    // Move snakes if current scene is not passed
    if (Properties.checkpoint <= CHECKPOINTS.dataClouds) {
        // Delay randomly
        const delayMin = 0, delayMax = 300, randomDelay = randomInt(delayMin, delayMax)
        Properties.scene.time.delayedCall(randomDelay, () => {
            snake.anims.play(object.name)
            // Move left or right, then flip
            let distance = 64 * 4
            // Update for the moving left ones
            if (SNAKES_TO_LEFT_IDS.has(object.id)) {
                distance = -distance
                snake.setFlip(true)
            }
            // Move horizontally, flip, then back
            Properties.scene.tweens.add({
                targets: snake,
                x: snake.x + distance,
                yoyo: true,
                flipX: true,
                delay: randomDelay,
                duration: SNAKES_DURATION,
                repeat: -1,
            })
        })
    }
}

function raisePlayer(player, cloud) {
    let cloudState = cloudStates[cloud.name]
    // Update velocity when reached the first cloud
    if (!reachedClouds) {
        Properties.inputEnabled = true
        player.body.setVelocityX(Properties.playerVelocityBase)
        reachedClouds = true
    }
    // Update state whether player is on the first cloud
    notOnFirstCloud = cloud.name !== CLOUD1_ID
    // Continue only if player is on top of the cloud and doesn't touch it
    if (cloudState.raisesPlayer || !cloud.body.touching.up) { return }
    // Update states
    cloudState.tween.pause()
    cloudState.raisesPlayer = true
    // Tween bounce animation
    let currentY = cloud.y
    const downY = 3 * 4, upY = 3 * 4
    Properties.scene.tweens.timeline({
        targets: cloud,
        tweens: [
            {
                y: currentY + downY,
                duration: 60,
                ease: 'Sine.easeOut',
                onComplete: () => {
                    // Set velocity from the cloud
                    player.body.setVelocityY(Properties.playerVelocityJump() * 1.5)
                    playerSpriteJump()
                }
            },
            {
                y: currentY - upY,
                duration: 250,
                ease: 'Sine.easeOut',
            },
            {
                y: currentY,
                duration: 200,
                ease: 'Sine.easeInOut',
            }
        ],
        onComplete: () => {
            // Update states
            cloudState.raisesPlayer = false
            cloudState.tween.resume()
        }
    })
    // Play cloud jump sound
    AudioManager.play('jump-clouds')
}

function processPipe(pipe) {
    // Bring to front and add physics
    bringToFront(pipe)
    Properties.scene.physics.add.existing(pipe, true)
    Properties.scene.physics.add.collider(Properties.player, pipe, processSlide)
    // Update body, make height a bit less
    let offsetHeight = 4
    updateBody({ sprite: pipe, offsetY: offsetHeight })
}

function processSlide(player, pipe) {
    // Jump before clouds
    if (pipe.name === JUMP_PIPE_ID) {
        jumpFromPipes()
        reachedClouds = false
        AudioManager.play('snakes')
        return
    }
    // Jump on the last pipe
    if (pipe.name === LAST_PIPE_ID) {
        jumpFromPipes()
        AudioManager.stop('snakes')
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
        if ((!reachedClouds || notOnFirstCloud) && Properties.cameraFollowingEnabled) {
            Properties.camera.startFollow(player)
        }
        // Play sliding sound
        AudioManager.play('slide')
    }
}

function jumpFromPipes() {
    Properties.playerState.sliding = false
    Properties.playerState.jumping = true
    Properties.player.body.setVelocityY(Properties.playerVelocityJump())
    playerSpriteJump()
    // Stop sliding sound
    AudioManager.stop('slide')
    // Play usual jump sound
    AudioManager.play('jump')
}

function processCloud(cloud) {
    cloud.setScale(cloudStates[cloud.name].scale)
    // Offset - difference between scaled and original
    const widthDifference = cloud.width - cloud.width * cloudStates[cloud.name].scale
    cloud.setX(cloud.x + widthDifference / 2)
    bringToFront(cloud)
    // Add physics
    cloudsGroup.add(cloud)
    const width = 0.8 * cloud.width, height = 0.5 * cloud.height
    const offsetX = (cloud.width - width) / 2, offsetY = cloud.height - height
    updateBody({ sprite: cloud, width, height, offsetX, offsetY })
}

function tweenClouds() {
    // Tween clouds up and down
    for (const cloud of cloudsGroup.getChildren()) {
        const delayMin = 0, delayMax = 1000
        const randomDelay = randomInt(delayMin, delayMax)
        cloudStates[cloud.name].tween = Properties.scene.tweens.add({
            targets: cloud,
            y: '+=5',
            yoyo: true,
            delay: randomDelay,
            duration: 1000,
            ease: 'Sine.easeInOut',
            repeat: -1
        })
    }
}

function randomInt(min, max) {
    return Math.round(min - 0.5 + Math.random() * (max - min + 1))
}
