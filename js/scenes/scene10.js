import AudioManager from '../audio.js'
import Properties from '../properties.js'
import Constants, { CHECKPOINTS } from '../constants.js'
import {
    addBounceTween, clearScene, fadeIn,
    flipPlayer, playerSpriteFall, updateBody
} from '../helpers.js'

// Additional pre/post-processing of sprites from tilemap
const PRE_PROCESSING = {
    '10-board': addBoardWithContainer,
    '10-plot1': addPlot, '10-plot2': addPlot,
    '10-plot3': addPlot, '10-plot4': addPlot,
    '10-plot5': addPlot, '10-plot6': addPlot,
    '10-plot7': addPlot, '10-plot8': addPlot,
}
const POST_PROCESSING = {
    '10-box': addBoxPhysics,
}
const BOARD_SCALE = 0.85, BOARD_BODY_OFFSET = 32

let superBox, superBoxActivated
let superBoxCollider, wallCollider
// Storing board container and all its children
let board = {}

export default {
    preloadScene: function() {
        initBoard()
        superBoxActivated = false
        initSpinnerAnimation()
        // Add objects
        Properties.map.getObjectLayer('scene10').objects.forEach(object => {
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
        setBoardScaleAndPhysics()
        // Init audio
        AudioManager.base['firebolt-power'] = Properties.scene.sound.add('firebolt-power', { loop: false })
        AudioManager.base['dashboard1'] = Properties.scene.sound.add('dashboard1', { loop: false })
        AudioManager.base['dashboard2'] = Properties.scene.sound.add('dashboard2', { loop: false })
        AudioManager.base['dashboard3'] = Properties.scene.sound.add('dashboard3', { loop: false })
    },
    checkpoint: function() {
        // Set checkpoint
        Properties.checkpoint = CHECKPOINTS.dashboard
        // Clear passed objects
        clearScene()
        // Play background audio
        AudioManager.fadeInBackground()
    },
    loadPlots1: function() {
        loadPlot('10-plot1')
        loadPlot('10-plot2')
        loadPlot('10-plot3')
        AudioManager.play('dashboard1')
    },
    loadPlots2: function() {
        loadPlot('10-plot4')
        loadPlot('10-plot5')
        AudioManager.play('dashboard2')
    },
    loadPlots3: function() {
        loadPlot('10-plot6')
        loadPlot('10-plot7')
        loadPlot('10-plot8')
        AudioManager.play('dashboard3')
    },
    returnPlayerJump: function() {
        Properties.playerState.onDashboard = false
    },
    clear: function() {
        // Destroy colliders
        if (superBoxCollider && superBoxCollider.active) { superBoxCollider.destroy() }
        if (wallCollider && wallCollider.active) { wallCollider.destroy() }
        // Destroy groups
        // clearGroup(group)
        // Stop tweens
        // if (tween) { tween.stop() }
        // Remove animations
        Properties.scene.anims.remove('10-spinner')
        for (let index = 1; index <= 8; index++) {
            Properties.scene.anims.remove(`10-plot${index}`)
        }
        // Destroy audio
        AudioManager.destroy('firebolt-power')
        AudioManager.destroy('dashboard1')
        AudioManager.destroy('dashboard2')
        AudioManager.destroy('dashboard3')
    }
}

function initBoard() {
    board = {
        container: undefined,
        background: undefined,
        plots: {
            '10-plot1': { sprite: undefined, spinner: undefined },
            '10-plot2': { sprite: undefined, spinner: undefined },
            '10-plot3': { sprite: undefined, spinner: undefined },
            '10-plot4': { sprite: undefined, spinner: undefined },
            '10-plot5': { sprite: undefined, spinner: undefined },
            '10-plot6': { sprite: undefined, spinner: undefined },
            '10-plot7': { sprite: undefined, spinner: undefined },
            '10-plot8': { sprite: undefined, spinner: undefined },
        }
    }
}

function initSpinnerAnimation() {
    // Init animation
    Properties.scene.anims.create({
        key: '10-spinner',
        frames: '10-spinner',
        frameRate: 10,
        repeat: -1
    })
}

function addBoardWithContainer(object) {
    // Init container and background
    board.container = Properties.scene.add.container(object.x, object.y)
    board.background = Properties.scene.add.image(0, 0, object.name)
    board.background.setOrigin(0, 1).setDepth(Constants.DEPTH.foregroundSecondary)
    board.container.add(board.background)
}

function addPlot(object) {
    const posX = object.x - board.container.x, posY = object.y - board.container.y
    let plot = Properties.scene.add.sprite(posX, posY, object.name)
    plot.setOrigin(0, 1).setDepth(Constants.DEPTH.foregroundMain)
    // Create animation
    Properties.scene.anims.create({
        key: object.name,
        frames: object.name,
        frameRate: 14
    })
    // Save and add spinner
    board.container.add(plot)
    board.plots[object.name].sprite = plot
    addSpinner(plot, object.name)
}

function addSpinner(plot, name) {
    // Place at plot center
    const posX = plot.x + plot.width / 2, posY = plot.y - plot.height / 2
    let spinner = Properties.scene.add.sprite(posX, posY, '10-spinner')
    spinner.setOrigin(0.5).setDepth(Constants.DEPTH.foregroundMain)
    // Define scale
    let scale = 1
    if (plot.height <= 120) {
        scale = 0.5
    } else if (plot.height <= 280) {
        scale = 0.75
    }
    spinner.setScale(scale)
    spinner.anims.play('10-spinner')
    // Save
    board.container.add(spinner)
    board.plots[name].spinner = spinner
}

function setBoardScaleAndPhysics() {
    board.container.setScale(BOARD_SCALE)
    // Add physics
    Properties.groundGroup.add(board.container)
    // Update body taking scale into account
    updateBody({
        sprite: board.container,
        width: board.background.width * BOARD_SCALE,
        height: board.background.height * BOARD_SCALE,
        offsetX: BOARD_BODY_OFFSET,
        offsetY: BOARD_BODY_OFFSET - board.background.height * BOARD_SCALE
    })
}

function addBoxPhysics(box) {
    superBox = Properties.scene.physics.add.existing(box, true)
    superBoxCollider = Properties.scene.physics.add.collider(Properties.player, box, addFirebolt)
}

function addFirebolt() {
    if (superBoxActivated) { return }
    else if (!Properties.player.body.touching.up) { return }

    superBoxActivated = true
    // Reset player velocity and disable input
    Properties.inputEnabled = false
    Properties.player.body.setVelocityX(Properties.playerVelocityBase)
    // Add firebolt logo
    const posX = superBox.x + superBox.width / 2, posY = superBox.y - superBox.height / 2
    let firebolt = Properties.scene.physics.add.image(posX, posY, '10-firebolt')
    const velocityX = Properties.sceneSize.height * 0.275, velocityY = -velocityX * 4
    firebolt.body.setVelocity(velocityX, velocityY)
    firebolt.setDepth(superBox.depth - 1)
    // Update body, so it collides higher
    updateBody({ sprite: firebolt, height: firebolt.height * 1.25 })
    // Add collision with the ground
    const { tilemapLayer: foreground } = Properties.map.getLayer('foreground')
    let collider = Properties.scene.physics.add.collider(firebolt, foreground, () => {
        // Destroy collider with the ground
        collider.destroy()
        // Make firebolt static and bounce it
        firebolt.setVelocity(0)
        firebolt.body.setImmovable(true)
        firebolt.body.setAllowGravity(false)
        addBounceTween(firebolt)
        // Enable input
        Properties.inputEnabled = true
        // Add overlap with the player
        let overlap = Properties.scene.physics.add.overlap(Properties.player, firebolt, () => {
            overlap.destroy()
            firebolt.destroy()
            raisePlayerUp()
        })
    })
    // Play collision sound (like jumping on clouds from Scene5)
    AudioManager.play('collect')
}

function raisePlayerUp() {
    // Stop running sound
    AudioManager.stop('run')
    // Play power sound
    AudioManager.play('firebolt-power')
    // Disable player input and physics
    Properties.inputEnabled = false
    Properties.player.body.enable = false
    // Play falling animation, flip player and add aura
    playerSpriteFall()
    flipPlayer(false)
    addPlayerAura()
    // Raise player up to the board
    Properties.scene.tweens.timeline({
        targets: Properties.player,
        tweens: [
            {
                x: board.container.x - 32 * 4,
                duration: 1000,
                ease: 'Sine.easeIn'
            },
            {
                x: board.container.x,
                y: board.container.y - board.background.height * BOARD_SCALE,
                duration: 1500
            },
            {
                x: board.container.x + 12 * 4,
                duration: 750
            }
        ],
        onComplete: () => {
            Properties.playerState.onDashboard = true
            Properties.player.body.enable = true
            Properties.inputEnabled = true
            addWall()
        }
    })
}

function addPlayerAura() {
    let aura = Properties.scene.add.image(0, 0, '10-aura').setOrigin(0.5, 1)
    aura.setAlpha(0)
    fadeIn(aura, 500, null, 0.8)
    Properties.player.add(aura)
    Properties.player.sendToBack(aura)
    // Set aura name to remove it in future
    aura.setName(Constants.OBJECT_NAMES.playerFireboltAura)
}

function addWall() {
    const wallWidth = 100, wallHeight = Properties.playerSprite.height * 1.5
    const posX = board.container.x, posY = board.container.y - board.background.height * BOARD_SCALE
    let wall = Properties.scene.add.rectangle(posX, posY, wallWidth, wallHeight).setOrigin(1, 1)
    Properties.scene.physics.add.existing(wall, true)
    // Add colliders
    wallCollider = Properties.scene.physics.add.collider(Properties.player, wall)
}

function loadPlot(plotName) {
    board.plots[plotName].spinner.destroy()
    board.plots[plotName].sprite.anims.play(plotName)
}
