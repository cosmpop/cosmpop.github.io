import AudioManager from '../audio.js'
import Properties from '../properties.js'
import Constants, { CHECKPOINTS } from '../constants.js'
import {
    bringToFront, clearGroup, clearScene,
    fadeInOutTitle, playerSpriteJump, updateBody
} from '../helpers.js'

// Additional pre/post-processing of sprites from tilemap
const PRE_PROCESSING = {
    '6-water1': addWater,
    '6-water2': addWater,
    '6-water3': addWater,
    '6-water4': addWater,
    '6-water5': addWater,
    '6-water6': addWater,
    '6-water7': addWater,
    '6-jet': addElephantJet,
    '6-board': addBoard,
}
const POST_PROCESSING = {
    '6-wood': processWoodObstacle,
    '6-crocodile': processCrocodileObstacle,
    '6-rock': processRockObstacle,
    '6-shark': processSharkObstacle,
    '6-sand': saveLastSand,
    '6-warning2': tweenWarning2,
}
// First and last water to create physics body
const FIRST_WATER_ID = 372, LAST_WATER_ID = 728
const BOARD_STOP_ACCELERATION = 1.2
const TSUNAMI_VELOCITY_MULTIPLIER = 1.075
// Last sand ID for tsunami to collapse
const LAST_SAND_ID = 742

// Export board for moving around in checkpoints
export let board
let waterStartX, waterEndX
let waterBody, obstacles, lastSand
let waterTween, waterTweeningObjects
// Colliders
let playerWaterCollider, playerBoardCollider, obstaclesCollider,
    tsunamiCollider, lastSandTsunamiCollider, lastSandPlayerCollider

export default {
    preloadScene: function() {
        waterTweeningObjects = []
        initWaterAnimations()
        initObstaclesGroup()
        // Add objects
        Properties.map.getObjectLayer('scene6').objects.forEach(object => {
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
        // Create hidden water body
        initWaterBody()
        // Init physics collisions
        initColliders()
        // Create floating on top effect
        tweenWater()
        // Add motorboat and tsunami sounds
        AudioManager.base.motorboat = Properties.scene.sound.add('motorboat', { loop: true })
        AudioManager.base.tsunami = Properties.scene.sound.add('tsunami', { loop: true })
    },
    checkpoint1: function() {
        // Set first checkpoint
        Properties.checkpoint = CHECKPOINTS.dataLake
        // Clear passed objects
        clearScene()
        // Play background audio
        AudioManager.fadeInBackground()
    },
    startBoardBoost: function() {
        board.anims.play('6-board-boost', true)
        AudioManager.fadeIn('motorboat', 1, 50)
    },
    stopBoardBoost: function() {
        board.anims.stop()
        board.setFrame(0)
        AudioManager.fadeOut('motorboat', 500)
        // Process stoping player's surfing
        if (Properties.player.body.velocity.x > Properties.playerVelocityBase) {
            Properties.player.body.setAccelerationX(-BOARD_STOP_ACCELERATION * Properties.sceneSize.height)
        } else {
            Properties.player.body.setVelocityX(Properties.playerVelocityBase)
            Properties.player.body.setAccelerationX(0)
        }
    },
    jumpBoard: function() {
        board.anims.play('6-board-jump')
        // Reset acceleration while jumping
        Properties.player.body.setAccelerationX(0)
    },
    dataSwampTitle: function() {
        fadeInOutTitle('DATA SWAMP')
    },
    checkpoint2: function() {
        // Set second checkpoint
        Properties.checkpoint = CHECKPOINTS.dataTsunami
        // Play background audio
        AudioManager.fadeInBackground()
    },
    startDataWave: function() {
        fadeInOutTitle('BIG DATA WAVE')
        addMovingTsunami()
        // Fade out background music
        AudioManager.fadeOutBackground()
        // Play tsunami chasing theme
        AudioManager.fadeIn('tsunami', 1, 500)
    },
    clear: function() {
        // Destroy colliders
        if (playerWaterCollider && playerWaterCollider.active) { playerWaterCollider.destroy() }
        if (playerBoardCollider && playerBoardCollider.active) { playerBoardCollider.destroy() }
        if (obstaclesCollider && obstaclesCollider.active) { obstaclesCollider.destroy() }
        if (tsunamiCollider && tsunamiCollider.active) { tsunamiCollider.destroy() }
        if (lastSandPlayerCollider && lastSandPlayerCollider.active) { lastSandPlayerCollider.destroy() }
        if (lastSandTsunamiCollider && lastSandTsunamiCollider.active) { lastSandTsunamiCollider.destroy() }
        // Destroy groups
        clearGroup(obstacles)
        // Stop tweens
        if (waterTween) { waterTween.stop() }
        // Remove animations
        for (let index = 0; index < 7; index++) {
            Properties.scene.anims.remove(`6-water${index + 1}`)
        }
        Properties.scene.anims.remove('6-jet')
        Properties.scene.anims.remove('6-board-boost')
        Properties.scene.anims.remove('6-board-jump')
        // Destroy sounds
        AudioManager.destroy('motorboat')
        AudioManager.destroy('tsunami')
    }
}

function initWaterAnimations() {
    for (let index = 0; index < 7; index++) {
        let start = index * 8, end = start + 7
        Properties.scene.anims.create({
            key: `6-water${index + 1}`,
            frames: Properties.scene.anims.generateFrameNumbers('6-water', { start, end }),
            frameRate: 10,
            repeat: -1
        })
    }
}

function initObstaclesGroup() {
    obstacles = Properties.scene.physics.add.group({ allowGravity: false, immovable: true })
}

function addWater(object) {
    let water = Properties.scene.add.sprite(object.x, object.y, '6-water')
    water.setOrigin(0, 1)
    water.anims.play(object.name)
    bringToFront(water)
    // Fix positions
    if (object.id === FIRST_WATER_ID) {
        waterStartX = object.x
    } else if (object.id === LAST_WATER_ID) {
        waterEndX = object.x + object.width
    }
}

function addElephantJet(object) {
    Properties.scene.anims.create({
        key: '6-jet',
        frames: '6-jet',
        frameRate: 10,
        repeat: -1
    })
    let jet = Properties.scene.add.sprite(object.x, object.y, '6-jet')
    jet.setOrigin(0, 1).setDepth(Constants.DEPTH.foregroundSecondary)
    jet.anims.play('6-jet')
}

function addBoard(object) {
    board = Properties.scene.physics.add.sprite(object.x, object.y, '6-board')
    board.setOrigin(0.5, 1).setDepth(Constants.DEPTH.foregroundSecondary)
    // Set physics body params
    board.setImmovable(true)
    board.body.setAllowGravity(false)
    updateBody({
        sprite: board,
        offsetY: 12 * 4
    })
    // Create boost and jump animations
    Properties.scene.anims.create({
        key: '6-board-boost',
        frames: Properties.scene.anims.generateFrameNumbers('6-board', { start: 1, end: 4 }),
        frameRate: 10,
        repeat: -1
    })
    Properties.scene.anims.create({
        key: '6-board-jump',
        frames: Properties.scene.anims.generateFrameNumbers('6-board', { start: 5, end: 8 }),
        frameRate: 10,
        repeat: -1
    })
}

function processWoodObstacle(wood) {
    const width = wood.width - 8 * 4, offsetX = 4 * 4, offsetY = 4 * 4
    addObstacle(wood, width, offsetX, offsetY, true)
}

function processCrocodileObstacle(crocodile) {
    const width = crocodile.width - 6 * 4, offsetX = 3 * 4, offsetY = 2 * 4
    addObstacle(crocodile, width, offsetX, offsetY, true)
}

function processRockObstacle(rock) {
    const width = rock.width - 16 * 4, offsetX = 10 * 4, offsetY = 4 * 4
    addObstacle(rock, width, offsetX, offsetY, false)
}

function processSharkObstacle(shark) {
    const width = shark.width - 12 * 4, offsetX = 6 * 4, offsetY = 4 * 4
    addObstacle(shark, width, offsetX, offsetY, true)
}

function addObstacle(obstacle, width, offsetX, offsetY, tweening = true) {
    // Bring to main
    obstacle.setDepth(Constants.DEPTH.foregroundMain)
    // Add physics
    obstacles.add(obstacle)
    updateBody({ sprite: obstacle, width, offsetX, offsetY })
    // Add tweening
    if (tweening) { waterTweeningObjects.push(obstacle) }
}

function saveLastSand(sand) {
    if (sand.name === LAST_SAND_ID) {
        lastSand = sand
    }
}

function tweenWarning2(warning) {
    waterTweeningObjects.push(warning)
}

function initWaterBody() {
    const posX = waterStartX, posY = Properties.sceneSize.height
    const width = waterEndX - waterStartX, height = 10 * 4
    waterBody = Properties.scene.add.rectangle(posX, posY, width, height).setOrigin(0, 1)
    Properties.scene.physics.add.existing(waterBody)
    waterBody.body.setImmovable(true)
    waterBody.body.setAllowGravity(false)
}

function initColliders() {
    // Collide board with player - add board
    playerBoardCollider = Properties.scene.physics.add.collider(Properties.player, board, addBoardToPlayer)
    // Collide board with water
    playerWaterCollider = Properties.scene.physics.add.collider(waterBody, Properties.player, landBoard)
    // Game over after obstacles collision
    obstaclesCollider = Properties.scene.physics.add.collider(Properties.player, obstacles, () => {
        Properties.gameOver()
    })
}

function addBoardToPlayer(player, board) {
    // Update state and land player
    Properties.playerState.surfing = true
    Properties.landPlayer()
    // Set new board positions in player's container
    board.setX(-3 * 4).setY(6 * 4)
    // Destroy body and previous collider
    playerBoardCollider.destroy()
    board.body.destroy()
    // Add to container and send to back
    player.add(board)
    player.sendToBack(board)
    // Update player container body
    updateBody({
        sprite: player,
        width: Constants.PLAYER_BODY_SURF.width,
        height: Constants.PLAYER_BODY_SURF.height,
        offsetX: Constants.PLAYER_BODY_SURF.offsetX,
        offsetY: Constants.PLAYER_BODY_SURF.offsetY,
    })
    // Enable input after pipes and set light velocity
    Properties.inputEnabled = true
    player.body.setVelocityX(Properties.playerVelocityRun() * 0.75)
}

function landBoard() {
    Properties.landPlayer()
}

function tweenWater() {
    waterTween = Properties.scene.tweens.add({
        targets: [waterBody, ...waterTweeningObjects],
        y: '+=4',
        yoyo: true,
        ease: 'Sine.easeInOut',
        duration: 750,
        repeat: -1,
    })
}

function addMovingTsunami() {
    // Move player to the back
    Properties.player.setDepth(Constants.DEPTH.foregroundSecondary)
    // Create animation
    Properties.scene.anims.create({
        key: '6-tsunami',
        frames: '6-tsunami',
        frameRate: 10,
        repeat: -1
    })
    // Create sprite
    const posX = Properties.camera.scrollX, posY = Properties.foregroundY() + 4 * 4
    let tsunami = Properties.scene.add.sprite(posX, posY, '6-tsunami')
    tsunami.setDepth(Constants.DEPTH.foregroundMain).setOrigin(1, 1)
    tsunami.anims.play('6-tsunami')
    // Add physics
    Properties.scene.physics.add.existing(tsunami)
    tsunami.body.setAllowGravity(false).setImmovable(false)
    updateBody({ sprite: tsunami, width: tsunami.width * 0.65 })
    // Set speed faster than player
    tsunami.body.setVelocityX(Properties.playerVelocityRun() * TSUNAMI_VELOCITY_MULTIPLIER)
    // Game over on collision
    tsunamiCollider = Properties.scene.physics.add.collider(Properties.player, tsunami, () => Properties.gameOver())
    // Add last sand to finish tsunami level
    addLastSandCollisions(tsunami)
}

function addLastSandCollisions(tsunami) {
    Properties.scene.physics.add.existing(lastSand, true)
    // End tsunami when collides with the last sand
    lastSandTsunamiCollider = Properties.scene.physics.add.overlap(lastSand, tsunami, endTsunami)
    // Jump from board when collides with last sand
    lastSandPlayerCollider = Properties.scene.physics.add.overlap(lastSand, Properties.player, jumpFromBoard)
}

function endTsunami(_lastSand, tsunami) {
    // Remove collision with player
    tsunamiCollider.destroy()
    // Remove collision with last sand
    lastSandTsunamiCollider.destroy()
    // Slow down
    tsunami.body.setVelocityX(tsunami.body.velocity.x * 0.75)
    // Move down and destroy
    Properties.scene.tweens.add({
        targets: tsunami,
        y: tsunami.y + tsunami.height,
        duration: 500,
        ease: 'Sine.easeIn',
        onComplete: () => tsunami.destroy()
    })
    //  Fade out tsunami theme
    AudioManager.fadeOut('tsunami', 500)
}

function jumpFromBoard(lastSand, player) {
    // Jump after half of the last sand
    if (player.x > lastSand.x + lastSand.width * 0.4) {
        // Make player jump with current velocity
        player.body.setVelocity(Properties.playerVelocityRun(), Properties.playerVelocityJump())
        // Reset acceleration
        player.body.setAccelerationX(0)
        // Disable input, remove surfing state
        Properties.inputEnabled = false
        Properties.playerState.surfing = false
        // Imitate sliding for landing on the ground and enabling input
        Properties.playerState.sliding = true
        // Set jump animation
        playerSpriteJump()
        // Hide and destroy board
        Properties.scene.tweens.add({
            targets: board,
            x: {
                value: board.x - board.width * 2,
                ease: 'Sine.easeOut'
            },
            y: {
                value: board.y + board.height * 4,
                ease: 'Expo.easeOut'
            },
            duration: 1200,
            onComplete: () => {
                board.destroy()
                // Move player back to front
                bringToFront(player)
            }
        })
        // Update player physics body back to normal
        updateBody({
            sprite: player,
            width: Constants.PLAYER_BODY.width,
            height: Constants.PLAYER_BODY.height,
            offsetX: Constants.PLAYER_BODY.offsetX,
            offsetY: Constants.PLAYER_BODY.offsetY,
        })
        // Destroy collider
        lastSandPlayerCollider.destroy()
        // Fade out motorboat sound
        AudioManager.fadeOut('motorboat', 250)
        // Play jumping sound
        AudioManager.play('jump')
    }
}
