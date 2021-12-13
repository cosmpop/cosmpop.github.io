import AudioManager from './audio.js'
import Constants from './constants.js'
import Properties from './properties.js'
import { moveToEvent } from './timeline.js'
import { bringToFront, showControls, updateBody } from './helpers.js'

export function initObjects() {
    // Reset game
    Properties.reset()
    // Update world gravity
    this.physics.world.gravity.y = Constants.GRAVITY_FROM_HEIGHT * Properties.sceneSize.height
    // Set tile size
    this.physics.world.TILE_BIAS = 64

    // Init animations
    initAnimations.call(this)
    // Create map with objects
    createMap.call(this)
    // Create text
    createTitleText.call(this)
    // Create player
    createPlayer.call(this)
    // Init interactions between objects (physics)
    initPhysics.call(this)
    // Init keyboard events
    initKeyboard.call(this)
    // Init audio which is common for all scenes
    initCommonAudio.call(this)
    // Add sound muting control button
    addSoundControl.call(this)

    if (!Constants.DEBUG) {
        let urlCheckpoint = parseFloat(new URL(window.location.href).searchParams.get('checkpoint'))
        if (!Properties.gameIsLoaded && urlCheckpoint) {
            Properties.checkpoint = urlCheckpoint
        }
        // Shift timeline to the current scene if not debugging
        moveToEvent(Constants.CHECKPOINT_EVENTS[Properties.checkpoint])
    } else {
        // Move the debug point
        moveToEvent(Constants.DEBUG_POINT)
    }

    // Show mobile controls
    if (Properties.checkpoint > 1) {
        showControls()
    }

    if (!Properties.gameIsLoaded) {
        // Update loading state
        Properties.gameIsLoaded = true
        // Add CSS class
        document.body.classList.add('loaded')
        // Add touch events after the first load
        if (Constants.IS_TOUCH_DEVICE) {
            createTouchEvents()
        }
    }
}

function createMap() {
    // Create tilemap
    let map = this.add.tilemap('game')
    let tileset = map.addTilesetImage('tileset', 'tileset')
    // Save to properties
    Properties.map = map
    // Foreground
    let foreground = map.createStaticLayer('foreground', tileset, 0, 0)
    foreground.setDepth(Constants.DEPTH.foregroundMain)
    // Update camera and world bounds
    Properties.camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels)
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels)
    // Fill events from the map and sort by X position
    Properties.timelineEvents = map.getObjectLayer('events').objects.map(event => ({
        x: event.x,
        name: event.name
    })).sort((e1, e2) => e1.x - e2.x)
}

function createTitleText() {
    // Positions and font size
    let posX = Properties.sceneSize.width / 2, posY = 100
    // Title text
    Properties.titleText[0] = this.add.bitmapText(posX, posY, 'light')
    Properties.titleText[1] = this.add.bitmapText(posX, posY, 'light')
    // Set origin
    Properties.titleText[0].setOrigin(0.5, 0.35)
    Properties.titleText[1].setOrigin(0.5, 0.35).setY(posY + Constants.TITLE_FONT_SIZE * 1.5)
    // Set depth and not affected by camera
    Properties.titleText[0].setDepth(Constants.DEPTH.important).setScrollFactor(0)
    Properties.titleText[1].setDepth(Constants.DEPTH.important).setScrollFactor(0)
}

function createPlayer() {
    // Create player container
    let playerContainer = this.add.container(0, 0)
    bringToFront(playerContainer)
    // Create player, set origin, add to container
    let player = this.add.sprite(0, 0, 'player')
    player.setOrigin(0.5, 1)
    playerContainer.add(player)
    // Add physics to container
    this.physics.add.existing(playerContainer)
    // Update body size and offset (container's origin is 0, 0)
    updateBody({
        sprite: playerContainer,
        width: Constants.PLAYER_BODY.width, height: Constants.PLAYER_BODY.height,
        offsetX: Constants.PLAYER_BODY.offsetX, offsetY: Constants.PLAYER_BODY.offsetY
    })
    // Save globally
    Properties.player = playerContainer
    Properties.playerSprite = player
}

function initPhysics() {
    // Create groud group
    Properties.groundGroup = this.physics.add.staticGroup()
    // Set foreground collision by property
    let foreground = Properties.map.getLayer('foreground').tilemapLayer
    foreground.setCollisionByProperty({ collides: true })
    // Player collides with the ground group sprites
    this.physics.add.collider(Properties.player, Properties.groundGroup, function() {
        Properties.landPlayer()
        // Reset base velocity
        Properties.playerVelocityBase = Constants.RESET_VELOCITY_X
    })
    // Player collides with foreground tiles
    this.physics.add.collider(Properties.player, foreground, function() {
        Properties.landPlayer()
        Properties.playerVelocityBase = Constants.RESET_VELOCITY_X
    })
}

function initKeyboard() {
    let cursors = this.input.keyboard.createCursorKeys()
    let wad = this.input.keyboard.addKeys('W,A,D')
    // Save keys
    Properties.keyboard.up = cursors.up
    Properties.keyboard.left = cursors.left
    Properties.keyboard.right = cursors.right
    Properties.keyboard.space = cursors.space
    Properties.keyboard.W = wad.W
    Properties.keyboard.A = wad.A
    Properties.keyboard.D = wad.D
}

function initCommonAudio() {
    AudioManager.base.run = this.sound.add('run', { loop: true, volume: 2 })
    AudioManager.base.push = Properties.scene.sound.add('push', { loop: true })
    AudioManager.base.slide = Properties.scene.sound.add('slide', { loop: false })
    AudioManager.base.jump = this.sound.add('jump', { loop: false, volume: 0.8 })
    AudioManager.base['jump-surf'] = this.sound.add('jump-surf', { loop: false })
    AudioManager.base['game-over'] = this.sound.add('game-over', { loop: false })
    AudioManager.base.collect = this.sound.add('collect', { loop: false, volume: 0.8 })
    // Background music
    AudioManager.base.background = this.sound.add('background', { loop: true, volume: 0.6 })
}

function addSoundControl() {
    const SOUND_STORAGE_KEY = 'sound-muted', SOUND_FRAME_ON = 0, SOUND_FRAME_OFF = 1
    let soundControl = this.add.sprite(48, 32, 'sound').setName(Constants.OBJECT_NAMES.soundControl)
    soundControl.setOrigin(0, 0).setScrollFactor(0).setDepth(Constants.DEPTH.soundControl)
    soundControl.setInteractive()
    // Function for updating audio control visual state
    let updateSoundControlFrame = function(isMuted) {
        soundControl.setFrame(isMuted ? SOUND_FRAME_OFF : SOUND_FRAME_ON)
    }
    // Get and update current state
    AudioManager.setMuted(JSON.parse(localStorage.getItem(SOUND_STORAGE_KEY)) === true)
    updateSoundControlFrame(AudioManager.muted)
    // Add changing mute state
    soundControl.on('pointerup', () => {
        AudioManager.setMuted(!AudioManager.muted)
        localStorage.setItem(SOUND_STORAGE_KEY, JSON.stringify(AudioManager.muted))
        updateSoundControlFrame(AudioManager.muted)
    })
}

function createTouchEvents() {
    let left = document.getElementById('left')
    let right = document.getElementById('right')
    let up = document.getElementById('up')

    for (const control of [left, right, up]) {
        // Activate on touch start
        control.addEventListener('touchstart', function(e) {
            e.preventDefault()
            this.classList.add('active')
            Properties.touches[control.id] = true
        })
        // Deactivate on touch end
        let endTimeout
        control.addEventListener('touchend', function() {
            this.classList.remove('active')
            clearTimeout(endTimeout)
            endTimeout = setTimeout(() => Properties.touches[control.id] = false, this.id === 'up' ? 300 : 0)
        })
        // Check whether is out when moving
        control.addEventListener('touchmove', function(e) {
            let { clientX, clientY } = e.touches[0]
            if (!touchesElement(this, clientX, clientY)) {
                this.dispatchEvent(new Event('touchend'))
            }
        })
    }
}

function touchesElement(el, pointX, pointY) {
    let { x, y, width, height } = el.getBoundingClientRect()
    return pointX >= x && pointX <= x + width && pointY >= y && pointY <= y + height
}

function initAnimations() {
    // Base player animations
    this.anims.create({
        key: 'player-idle',
        frames: this.anims.generateFrameNumbers('player', { start: 0, end: 5 }),
        frameRate: 10,
        repeat: -1
    })
    this.anims.create({
        key: 'player-jump',
        frames: this.anims.generateFrameNumbers('player', { start: 6, end: 11 }),
        frameRate: 10
    })
    this.anims.create({
        key: 'player-fall',
        frames: this.anims.generateFrameNumbers('player', { start: 10, end: 11 }),
        frameRate: 10,
        repeat: -1
    })
    this.anims.create({
        key: 'player-run',
        frames: this.anims.generateFrameNumbers('player', { start: 12, end: 19 }),
        frameRate: 10,
        repeat: -1
    })
    // Push and slide
    this.anims.create({
        key: 'player-push',
        frames: this.anims.generateFrameNumbers('player', { start: 20, end: 26 }),
        frameRate: 10,
        repeat: -1
    })
    this.anims.create({
        key: 'player-slide',
        frames: this.anims.generateFrameNumbers('player', { start: 27, end: 28 }),
        frameRate: 10,
        repeat: -1
    })
    // Surfing
    this.anims.create({
        key: 'player-idle-surf',
        frames: this.anims.generateFrameNumbers('player', { start: 29, end: 34 }),
        frameRate: 10,
        repeat: -1
    })
    this.anims.create({
        key: 'player-jump-surf',
        frames: this.anims.generateFrameNumbers('player', { start: 35, end: 38 }),
        frameRate: 10,
        repeat: -1
    })
    // Flamethrower
    this.anims.create({
        key: 'player-idle-gun',
        frames: this.anims.generateFrameNumbers('player', { start: 39, end: 44 }),
        frameRate: 10,
        repeat: -1
    })
    this.anims.create({
        key: 'player-run-gun',
        frames: this.anims.generateFrameNumbers('player', { start: 45, end: 52 }),
        frameRate: 10,
        repeat: -1
    })
    this.anims.create({
        key: 'player-jump-gun',
        frames: this.anims.generateFrameNumbers('player', { start: 53, end: 58 }),
        frameRate: 10
    })
}
