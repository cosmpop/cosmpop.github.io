import AudioManager from './audio.js'
import Constants from './constants.js'
import { addGameOverLayer, addLogo, playerSpriteStand } from './helpers.js'

const PROPERTIES = {
    // Loaded state
    gameIsLoaded: false,
    // Base scene object
    scene: undefined,
    // Tilemap
    map: undefined,
    // Player container object
    player: undefined,
    playerSprite: undefined,
    // Main camera
    camera: undefined,
    cameraFollowingEnabled: true,
    // Keyboard keys
    keyboard: {
        up: undefined, left: undefined, right: undefined,
        W: undefined, A: undefined, D: undefined, space: undefined
    },
    // Ground physics group
    groundGroup: undefined,
    // Main title bitmap text
    titleText: [undefined, undefined],
    // Foreground position
    foregroundY: function() {
        return this.sceneSize.height * (1 - Constants.FOREGROUND)
    },
    // How far is current ratio from maximum one
    ratioPercent: function() {
        let ratio = this.sceneSize.width / this.sceneSize.height
        return (Constants.MAX_GAME_RATIO - ratio) / (Constants.MAX_GAME_RATIO - Constants.MIN_GAME_RATIO)
    },
    // Scene size
    sceneSize: { width: 0, height: 0 },
    // Current scene
    checkpoint: Constants.BASE_CHECKPOINT,
    // Player state
    playerState: {
        jumping: false,
        pushingLeft: false,
        pushingRight: false,
        sliding: false,
        blinged: false,
        surfing: false,
        withGun: false,
        onDashboard: false,
    },
    playerVelocityBase: Constants.RESET_VELOCITY_X,
    playerVelocityRun: function() {
        let multiplier = this.playerState.surfing ? 1.25 : 1
        return Constants.VELOCITY_X_FROM_HEIGHT * this.sceneSize.height * multiplier
    },
    playerVelocityJump: function() {
        let multiplier = this.playerState.surfing ? 1.25 : 1
        return Constants.VELOCITY_Y_FROM_HEIGHT * this.playerSprite.height * multiplier
    },
    // Events
    timelineEvents: undefined,
    // Whether input in being processing
    inputEnabled: true,
    // Whether game is over
    gameIsOver: false,
    // Reset
    reset: function() {
        this.gameIsOver = false
        this.inputEnabled = true
        this.playerState.jumping = false
        this.playerState.sliding = false
        this.playerState.blinged = false
        this.playerState.surfing = false
        this.playerState.withGun = false
        this.playerState.onDashboard = false
        // Destroy all the sounds
        this.scene.sound.sounds.forEach(sound => {
            if (!sound.pendingRemove) {
                sound.destroy();
            }
        })
    },
    // Set scene size
    setSceneSize: function() {
        this.sceneSize.width = this.scene.game.canvas.width
        this.sceneSize.height = this.scene.game.canvas.height
    },
    // Touch states
    touches: { left: false, right: false, up: false },
    // Movement states
    holdsRight: function() {
        return this.keyboard.right.isDown || this.keyboard.D.isDown || this.touches.right
    },
    holdsLeft: function() {
        return this.keyboard.left.isDown || this.keyboard.A.isDown || this.touches.left
    },
    holdsUp: function() {
        return this.keyboard.space.isDown || this.keyboard.up.isDown || this.keyboard.W.isDown || this.touches.up
    },
    // Player stands
    playerStands: function() { return this.player.body.onFloor() || this.player.body.touching.down },
    // Collision with ground
    landPlayer: function() {
        if (this.playerState.jumping && this.playerStands()) {
            // Reset state and update animation
            this.playerState.jumping = false
            playerSpriteStand()
        } else if (this.playerState.sliding) {
            // Reset state and update animation
            this.playerState.sliding = false
            playerSpriteStand()
            // Reset velocity and enable input
            this.player.body.setVelocityX(this.playerVelocityBase)
            this.inputEnabled = true
        }
    },
    // Take control from the player
    takeControl: function() {
        this.inputEnabled = false
        // Stop player
        this.player.body.setVelocityX(this.playerVelocityBase)
        // Stand animation
        playerSpriteStand()
    },
    // Give control to the player
    giveControl: function() {
        this.inputEnabled = true
    },
    // Add image from map
    addMapImage: function(image) {
        let newImage
        // Check if collision
        if (image.type === Constants.OBJECT_TYPES.static) {
            // Create static image
            newImage = this.scene.physics.add.staticImage(image.x, image.y, image.name)
            // Set origin and refresh body
            newImage.setOrigin(0, 1).refreshBody()
            // Add to the physics group
            this.groundGroup.add(newImage)
            // Set foreground main depth
            newImage.setDepth(Constants.DEPTH.foregroundMain)
        } else if (image.type === Constants.OBJECT_TYPES.logo) {
            newImage = addLogo(image)
        } else {
            newImage = this.scene.add.image(image.x, image.y, image.name)
            // Set origin
            newImage.setOrigin(0, 1)
            // Set depth: background or main secondary
            if (image.type === Constants.OBJECT_TYPES.background) {
                newImage.setDepth(Constants.DEPTH.background)
            } else {
                newImage.setDepth(Constants.DEPTH.foregroundSecondary)
            }
        }
        // Set name
        newImage.setName(image.id)
        // Result
        return newImage
    },
    // Game over
    gameOver: function() {
        // Game Over
        this.gameIsOver = true
        // Stop physics
        this.scene.physics.pause()
        // Remove all tweens
        this.scene.tweens.pauseAll()
        // Stop all timer events
        this.scene.time.removeAllEvents()
        // Remove animation
        this.playerSprite.anims.stop()
        // Add game over layer
        addGameOverLayer()
        // Play game over sound
        AudioManager.play('game-over')
        // Stop other sounds
        AudioManager.stopSounds()
    }
}

export default PROPERTIES
