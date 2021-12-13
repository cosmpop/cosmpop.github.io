import AudioManager from '../audio.js'
import Properties from '../properties.js'
import Constants, { CHECKPOINTS } from '../constants.js'
import { addBounceTween, bringToFront, clearScene, clearGroup, updateBody } from '../helpers.js'

// Additional pre/post-processing of sprites from tilemap
const PRE_PROCESSING = {
    '9-lava': addLava,
    '9-brick1': addSingleBrick,
    '9-brick2': addDoubleBrick,
    '9-spark': addSpark,
}
const POST_PROCESSING = {
    //
}
// Double bricks which are initially moving down
const MOVING_DOWN_BRICK_IDS = new Set([854, 856])
// Destroyed single brick frame index
const DESTROYED_BRICK_FRAME_INDEX = 8

// Physics objects
let lavaGroup, lavaCollider
let destructionGroup, destructionCollider, destructionOverlap
let movingGroup, movingCollider, movingOverlap

export default {
    preloadScene: function() {
        initLavaGroup()
        initDesctructionGroup()
        initMovingGroup()
        createSparkFlashAnimation()
        // Add objects
        Properties.map.getObjectLayer('scene9').objects.forEach(object => {
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
        Properties.checkpoint = CHECKPOINTS.dataBricks
        // Clear passed objects
        clearScene()
        // Play background audio
        AudioManager.fadeInBackground()
    },
    clear: function() {
        // Destroy colliders
        if (lavaCollider && lavaCollider.active) { lavaCollider.destroy() }
        if (destructionCollider && destructionCollider.active) { destructionCollider.destroy() }
        if (movingCollider && movingCollider.active) { movingCollider.destroy() }
        if (destructionOverlap && destructionOverlap.active) { destructionOverlap.destroy() }
        if (movingOverlap && movingOverlap.active) { movingOverlap.destroy() }
        // Destroy groups
        clearGroup(lavaGroup)
        clearGroup(destructionGroup)
        clearGroup(movingGroup)
        // Stop tweens
        // if (tween) { tween.stop() }
        // Remove animations
        Properties.scene.anims.remove('9-lava')
        Properties.scene.anims.remove('9-spark')
    }
}

function initLavaGroup() {
    // Init animation
    Properties.scene.anims.create({
        key: '9-lava',
        frames: '9-lava',
        frameRate: 7,
        repeat: -1
    })
    // Init physics
    lavaGroup = Properties.scene.physics.add.staticGroup()
    lavaCollider = Properties.scene.physics.add.collider(Properties.player, lavaGroup, () => {
        Properties.gameOver()
    })
}

function initDesctructionGroup() {
    // Init animation
    Properties.scene.anims.create({
        key: '9-destruction',
        frames: '9-destruction',
        frameRate: 10
    })
    // Init physics
    destructionGroup = Properties.scene.physics.add.staticGroup()
    destructionCollider = Properties.scene.physics.add.collider(
        Properties.player,
        destructionGroup,
        landAndDestructBrick
    )
    destructionOverlap = Properties.scene.physics.add.overlap(
        Properties.player,
        destructionGroup,
        checkBrickOverlap
    )
}

function initMovingGroup() {
    movingGroup = Properties.scene.physics.add.group({ allowGravity: false, immovable: true })
    movingCollider = Properties.scene.physics.add.collider(
        Properties.player,
        movingGroup,
        () => Properties.landPlayer()
    )
    movingOverlap = Properties.scene.physics.add.overlap(
        Properties.player,
        movingGroup,
        checkBrickOverlap
    )
}

function addLava(object) {
    let lava = Properties.scene.add.sprite(object.x, object.y, '9-lava')
    lava.setOrigin(0, 1).anims.play('9-lava')
    bringToFront(lava)
    lavaGroup.add(lava)
    updateBody({ sprite: lava, offsetY: 7 * 4 })
}

function addSingleBrick(object) {
    let singleBrick
    if (object.type === Constants.OBJECT_TYPES.static) {
        singleBrick = Properties.addMapImage(object)
    } else {
        // Add destructing brick sprite
        singleBrick = Properties.scene.add.sprite(object.x, object.y, object.name)
        singleBrick.setOrigin(0, 0).setY(singleBrick.y - singleBrick.height)
        // Set up physics
        destructionGroup.add(singleBrick)
        updateBrickBody(singleBrick)
    }
    updateBrickBody(singleBrick)
    bringToFront(singleBrick)
}

function addDoubleBrick(object) {
    let doubleBrick
    if (object.type === Constants.OBJECT_TYPES.static) {
        doubleBrick = Properties.addMapImage(object)
    } else {
        // Add moving double brick
        doubleBrick = Properties.scene.add.image(object.x, object.y, object.name)
        doubleBrick.setOrigin(0, 1)
        // Set up physics
        movingGroup.add(doubleBrick)
        updateBrickBody(doubleBrick)
        // Move up and down
        moveBrickUpAndDown(doubleBrick, object.id)
    }
    updateBrickBody(doubleBrick)
    bringToFront(doubleBrick)
}

function addSpark(object) {
    let spark = Properties.scene.add.sprite(object.x, object.y, object.name)
    spark.setOrigin(0, 1).setDepth(Constants.DEPTH.foregroundSecondary)
    // Add physics
    Properties.scene.physics.add.existing(spark, true)
    const size = 16 * 4, offsetX = (spark.width - size) / 2, offsetY = (spark.height - size) / 2
    updateBody({ sprite: spark, width: size, height: size, offsetX, offsetY })
    // Add bouncing
    let tween = addBounceTween(spark)
    // Add overlap for collecting the star
    let overlap = Properties.scene.physics.add.overlap(Properties.player, spark, () => {
        // Destroy sprite, tween and overlap
        tween.stop()
        overlap.destroy()
        // Play flash animation and then destroy
        spark.anims.play('9-spark')
        spark.on('animationcomplete', () => spark.destroy())
        // Play collection sound
        AudioManager.play('collect', true)
    })
}

function createSparkFlashAnimation() {
    Properties.scene.anims.create({
        key: '9-spark',
        frames: Properties.scene.anims.generateFrameNumbers('9-spark', { start: 1, end: 2 }),
        frameRate: 14
    })
}

function updateBrickBody(brick) {
    const offsetY = 3 * 4
    updateBody({ sprite: brick, height: brick.height - offsetY * 2, offsetY })
}

function moveBrickUpAndDown(brick, brickId) {
        const pauseDuration = 100, movementDuration = 800, velocity = 270
        // Define velocity signs for top and bottom bricks
        // Example: top ones move down, so first velocity is positive
        let firstVelocitySign = MOVING_DOWN_BRICK_IDS.has(brickId) ? 1 : -1
        // Tween velocity positively and negatively
        Properties.scene.tweens.timeline({
            targets: brick.body.velocity,
            tweens: [
                {
                    y: firstVelocitySign * velocity,
                    yoyo: true,
                },
                {
                    delay: pauseDuration,
                    y: -firstVelocitySign * velocity,
                    yoyo: true,
                },
            ],
            ease: 'Cubic.easeInOut',
            duration: movementDuration,
            loopDelay: pauseDuration,
            loop: -1
        })
}

function landAndDestructBrick(_player, singleBrick) {
    Properties.landPlayer()
    // Destroy if not animating already
    if (singleBrick.body.touching.up && !singleBrick.anims.isPlaying) {
        singleBrick.anims.play('9-destruction')
        // Destroy physics on given animation index
        singleBrick.on('animationupdate', (_, frame) => {
            if (frame.index === DESTROYED_BRICK_FRAME_INDEX) {
                destructionGroup.remove(singleBrick)
            }
        })
        singleBrick.on('animationcomplete', () => singleBrick.destroy())
    }
}

function checkBrickOverlap(player, brick) {
    // Game over if player is lower than brick (it means that he touches it with head)
    if (player.y > brick.y) {
        Properties.gameOver()
    }
}
