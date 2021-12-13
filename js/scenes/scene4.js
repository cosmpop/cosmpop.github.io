import AudioManager from '../audio.js'
import Properties from '../properties.js'
import Constants, { CHECKPOINTS } from '../constants.js'
import { bringToFront, clearGroup, clearScene, updateBody } from '../helpers.js'

// Additional pre/post-processing of sprites from tilemap
const PRE_PROCESSING = {
    '4-panel': addPanel,
    '4-brush': addBrush,
    '4-carousel': addCarousel,
}
const POST_PROCESSING = {
    '4-start1': bringToFront,
    '4-transparent': bringToFront,
    '4-start1': processStart1,
    '4-start2': processStart2,
    '4-end1': processEnd1,
    '4-end2': processEnd2,
    '4-press1': processPress1,
    '4-press2': processPress2,
}
// Speed of the carousel (additional speed for player)
const CAROUSEL_VELOCITY_FROM_HEIGHT = 0.25
// Box timer constants
const BOX_INTERVAL_APPEAR = 2500
// Box frames (frame => width percent, height percent)
const BOX_FRAMES = {
    0: [0.7, 1],
    1: [0.75, 0.83],
    2: [0.9, 0.66],
    3: [1, 0.5],
    4: [1, 0.5]
}
// Machine IDS
const PRESS1_ID = 224, PRESS2_ID = 225, PRESS3_ID = 226, BRUSH_ID = 244
// TODO: Check whether this keys work for different browsers
// Press offsets for the down position
const MACHINES_DATA = { 
    // Press 1
    [PRESS1_ID]: {
        // Offset from the bottom factory carousel
        offset: 10 * 4,
        // Frame to set after overlapping with the box
        boxFrame: 1
    },
    // Press 2
    [PRESS2_ID]: { offset: 8 * 4, boxFrame: 2 },
    // Press 3
    [PRESS3_ID]: { offset: 6 * 4, boxFrame: 3 },
    // Brush
    [BRUSH_ID]: { offset: 0, boxFrame: 4 }
}

// Carousel params
let carouselGroup, carouselCollider
let carouselVelocity = 0
// Box params
let boxGroup, boxCollider, boxInterval
let boxPosX, boxPosY, boxLastCollideX
let startPoint
// Machines on the factory
let machinesGroup, machinesBoxOverlap, machinesPlayerOverlap
// Ending overlap
let endBoxOverlap

export default {
    preloadScene: function() {
        // Set carousel velocity force and init static group
        carouselVelocity = CAROUSEL_VELOCITY_FROM_HEIGHT * Properties.sceneSize.height
        initCarouselGroup()
        // Set box group and interval for adding boxes on the carousel
        initBoxGroupAndInterval()
        // Set machines group for interaction with the player
        initMachinesGroup()
        // Add objects
        Properties.map.getObjectLayer('scene4').objects.forEach(object => {
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
        // Init box positions from the carousel object
        defineBoxPositions()
        // Generate boxes with different states on the carousel
        generateBoxes()
        // Add clear bling sound
        AudioManager.base['clear-bling'] = Properties.scene.sound.add('clear-bling', { loop: false })
    },
    checkpoint: function() {
        // Set checkpoint
        Properties.checkpoint = CHECKPOINTS.dataFactory
        // Clear passed objects
        clearScene()
        // Play background audio
        AudioManager.fadeInBackground()
    },
    clear: function() {
        // Remove interval
        if (boxInterval) { boxInterval.remove() }
        // Destroy colliders
        if (carouselCollider && carouselCollider.active) { carouselCollider.destroy() }
        if (boxCollider && boxCollider.active) { boxCollider.destroy() }
        if (machinesBoxOverlap && machinesBoxOverlap.active) { machinesBoxOverlap.destroy() }
        if (machinesPlayerOverlap && machinesPlayerOverlap.active) { machinesPlayerOverlap.destroy() }
        if (endBoxOverlap && endBoxOverlap.active) { endBoxOverlap.destroy() }
        // Destroy groups
        clearGroup(carouselGroup)
        clearGroup(boxGroup)
        clearGroup(machinesGroup, true)
        // Destroy animations
        Properties.scene.anims.remove('4-panel')
        Properties.scene.anims.remove('4-carousel')
        Properties.scene.anims.remove('4-brush')
        Properties.scene.anims.remove('4-dust')
        Properties.scene.anims.remove('4-clean-box')
        Properties.scene.anims.remove('4-clean-player')
        // Destroy audio
        AudioManager.destroy('clear-bling')
    }
}

function addPanel(object) {
    // Create animation
    Properties.scene.anims.create({
        key: '4-panel',
        frames: '4-panel',
        frameRate: 10,
        repeat: -1
    })
    // Create panel and bring to front
    let panel = Properties.scene.add.sprite(object.x, object.y, object.name).setOrigin(0, 1)
    panel.anims.play('4-panel')
    bringToFront(panel)
}

function addCarousel(object) {
    // Add to the group
    let carousel = carouselGroup.create(object.x, object.y, object.name)
    carousel.setOrigin(0, 1).refreshBody()
    // Run animation
    carousel.anims.play('4-carousel')
}

function addBrush(object) {
    // Create animation
    Properties.scene.anims.create({
        key: '4-brush',
        frames: '4-brush',
        frameRate: 10,
        repeat: -1
    })
    // Create brush and bring to front
    let brush = Properties.scene.add.sprite(object.x, object.y, object.name)
    brush.anims.play('4-brush')
    bringToFront(brush)
    // Match origin and set name
    brush.setOrigin(0.5, 1).setName(object.id)
    // Get and set Y offset from bottom
    const offsetBottom = MACHINES_DATA[brush.name].offset
    brush.setY(brush.y - offsetBottom)
    // Add to machines and update body width
    machinesGroup.add(brush)
    const brushWidth = 8 * 4, brushOffset = brush.width * 0.85
    updateBody({ sprite: brush, width: brushWidth, offsetX: brushOffset })
    // Create clean animation for boxes
    initCleanAnimation()
}

function initCarouselGroup() {
    // Init static group
    carouselGroup = Properties.scene.physics.add.staticGroup()
    // Create animation
    Properties.scene.anims.create({
        key: '4-carousel',
        frames: '4-carousel',
        frameRate: 10,
        repeat: -1
    })
    // Create collider
    carouselCollider = Properties.scene.physics.add.collider(Properties.player, carouselGroup, () => {
        Properties.playerVelocityBase = carouselVelocity
        Properties.landPlayer()
    })
}

function initBoxGroupAndInterval() {
    boxGroup = Properties.scene.physics.add.group({ allowGravity: false, immovable: true })
    boxCollider = Properties.scene.physics.add.collider(Properties.player, boxGroup, () => {
        Properties.playerVelocityBase = Constants.RESET_VELOCITY_X
        Properties.landPlayer()
    }, (_player, box) => {
        // Don't collide with player if box position is more than max point for collision
        return box.x < boxLastCollideX
    })
    boxInterval = Properties.scene.time.addEvent({
        delay: BOX_INTERVAL_APPEAR,
        callback: addBox,
        loop: true,
        startAt: BOX_INTERVAL_APPEAR
    })
}

function initMachinesGroup() {
    initDustAnimation()
    machinesGroup = Properties.scene.physics.add.group({ allowGravity: false, immovable: true })
    machinesBoxOverlap = Properties.scene.physics.add.overlap(machinesGroup, boxGroup, machineAffectsBox)
    machinesPlayerOverlap = Properties.scene.physics.add.overlap(
        machinesGroup,
        Properties.player,
        (_player, machine) => {
            // Game over only when player touches presses
            if (machine.name !== BRUSH_ID) {
                Properties.gameOver()
            } else if (!Properties.playerState.blinged) {
                const posX = 12 * 4,
                      posY = -Properties.playerSprite.height * 0.85
                let bling = Properties.scene.add.sprite(posX, posY, '4-clean-player')
                bling.setDepth(Constants.DEPTH.important).anims.play('4-clean-player')
                // Add to the player container
                Properties.player.add(bling)
                Properties.playerState.blinged = true
                // Destroy on animation complete
                bling.on('animationcomplete', () => bling.destroy())
                // Play bling sound
                AudioManager.play('clear-bling')
            }
        }
    )
}

function initDustAnimation() {
    Properties.scene.anims.create({
        key: '4-dust',
        frames: '4-dust',
        frameRate: 10,
        hideOnComplete: true
    })
}

function initCleanAnimation() {
    Properties.scene.anims.create({
        key: '4-clean-box',
        frames: '4-clean-box',
        frameRate: 10,
        hideOnComplete: true
    })
    Properties.scene.anims.create({
        key: '4-clean-player',
        frames: '4-clean-player',
        frameRate: 20,
        hideOnComplete: true
    })
}

function defineBoxPositions() {
    let firstCarousel = carouselGroup.getChildren()[0]
    const boxOffsetX = 100
    boxPosX = startPoint.x - boxOffsetX
    boxPosY = firstCarousel.y - firstCarousel.height
}

function generateBoxes() {
    // Generate boxes
    const distanceBetween = carouselVelocity * BOX_INTERVAL_APPEAR / 1000
    addBox(boxPosX + distanceBetween, 0)
    addBox(boxPosX + 2 * distanceBetween, 0)
    addBox(boxPosX + 3 * distanceBetween, 1)
    addBox(boxPosX + 4 * distanceBetween, 1)
    addBox(boxPosX + 5 * distanceBetween, 2)
    addBox(boxPosX + 6 * distanceBetween, 2)
    addBox(boxPosX + 7 * distanceBetween, 3)
    addBox(boxPosX + 8 * distanceBetween, 4)
    addBox(boxPosX + 9 * distanceBetween, 4)
}

function addBox(boxX = null, boxState = null) {
    let box = boxGroup.create(boxX ? boxX : boxPosX, boxPosY, '4-box')
    box.setOrigin(0.5, 1).setDepth(Constants.DEPTH.foregroundSecondary)
    box.setVelocityX(carouselVelocity).setFriction(1)
    // Set initial state
    updateBoxState(box, boxState ? boxState : 0)
}

function updateBoxState(box, newFrame) {
    // Get new width and height params
    let [newWidthPercent, newHeightPercent] = BOX_FRAMES[newFrame]
    // Update frame and physics body
    box.setFrame(newFrame)
    updateBody({
        sprite: box,
        width: box.width * newWidthPercent,
        height: box.height * newHeightPercent,
        offsetX: box.width * (1 - newWidthPercent) / 2,
        offsetY: box.height * (1 - newHeightPercent)
    })
}

function machineAffectsBox(machine, box) {
    // Get box frame for the current machine
    let newFrame = MACHINES_DATA[machine.name].boxFrame
    // Return if new frame is an old one
    if (box.frame.name === newFrame) { return }
    // Update box phame and physics
    updateBoxState(box, newFrame)
    // Create dust for presses and create bling for brush
    if (machine.name === BRUSH_ID) {
        Properties.scene.time.delayedCall(500, () => {
            if (!box.active || !box) { return }
            // Create bling from the box
            let bling = Properties.scene.physics.add.sprite(box.x - box.width / 2, box.y, '4-clean-box')
            bling.setOrigin(0, 1).setDepth(Constants.DEPTH.foregroundSecondary)
            bling.body.setAllowGravity(false).setVelocityX(carouselVelocity)
            bling.anims.play('4-clean-box')
            // Destroy on animation complete
            bling.on('animationcomplete', () => bling.destroy())
        })
    } else {
        let dust = Properties.scene.add.sprite(box.x, box.y, '4-dust')
        dust.setOrigin(0.5, 1).setDepth(Constants.DEPTH.background)
        dust.anims.play('4-dust')
        // Destroy on animation complete
        dust.on('animationcomplete', () => dust.destroy())
    }
}

const startOffsetY = 4, endOffsetY = 16

function processStart1(sprite) {
    updateBody({ sprite, offsetY: startOffsetY })
    bringToFront(sprite)
}

function processStart2(sprite) {
    const widthOffset = 16
    updateBody({ sprite, width: sprite.width - widthOffset, offsetY: startOffsetY })
    sprite.setDepth(Constants.DEPTH.background)
    startPoint = sprite
}

function processEnd1(sprite) {
    const widthOffset = 16
    updateBody({ sprite, width: sprite.width - widthOffset, offsetX: widthOffset, offsetY: endOffsetY })
    sprite.setDepth(Constants.DEPTH.background)
    // Set the point where boxes stop colliding with the player
    const offset = 48 * 4
    boxLastCollideX = sprite.x - offset
}

function processEnd2(sprite) {
    updateBody({ sprite, offsetY: endOffsetY })
    sprite.setDepth(Constants.DEPTH.foregroundMain)
    // Destroy box after overlap
    endBoxOverlap = Properties.scene.physics.add.overlap(sprite, boxGroup, (end, box) => {
        if (box.x - box.width / 2 > end.x) {
            box.destroy()
        }
    })
}

function processPress1(sprite) {
    // Update origin to match needed distance
    sprite.setOrigin(0.5, 1)
    bringToFront(sprite)
}

function processPress2(sprite) {
    // Specify up and down points
    const offsetBottom = MACHINES_DATA[sprite.name].offset
    const downY = sprite.y - offsetBottom, upY = sprite.y - (sprite.height - 17 * 4)
    // Update origin to match needed distance and initial Y position
    sprite.setOrigin(0.5, 1).setY(downY)
    bringToFront(sprite)
    // Add to the group
    machinesGroup.add(sprite)
    // Update body
    const pressWidth = 35 * 4
    updateBody({ sprite, width: pressWidth, offsetX: (sprite.width - pressWidth) / 2 })
    // Add up-down tweening
    const correction = 30
    Properties.scene.tweens.timeline({
        targets: sprite,
        tweens: [
            {
                delay: 0,
                duration: BOX_INTERVAL_APPEAR * 0.5,
                y: upY,
                ease: 'Sine.easeOut'
            },
            {
                delay: BOX_INTERVAL_APPEAR * 0.34 - correction,
                duration: BOX_INTERVAL_APPEAR * 0.16,
                y: downY,
                ease: 'Quart.easeIn',
                // ease: 'Circ.easeIn',
                // ease: 'Quint.easeIn',
                // ease: 'Expo.easeIn',
            }
        ],
        loop: -1
    })
}
