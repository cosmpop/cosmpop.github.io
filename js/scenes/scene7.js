import AudioManager from '../audio.js'
import Properties from '../properties.js'
import Constants, { CHECKPOINTS } from '../constants.js'
import { addBounceTween, bringToFront, clearScene, fadeInOutTitle, updateBody } from '../helpers.js'

// Additional pre/post-processing of sprites from tilemap
const PRE_PROCESSING = {
    //
}
const POST_PROCESSING = {
    '7-data': processDataOil,
}
// Directions for money bags
const MONEY_BAG_DIRECTIONS = {
    left: -1,
    right: 1,
    up: 0,
}
// Duration for Harry flight from right to left
const HARRY_FLIGHT_DURATION = 5000

export default {
    preloadScene: function() {
        // Add objects
        Properties.map.getObjectLayer('scene7').objects.forEach(object => {
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
        Properties.checkpoint = CHECKPOINTS.dataIsOil
        // Clear passed objects
        clearScene()
        // Play background audio
        AudioManager.fadeInBackground()
    },
    addHarryPotter: function() {
        const posX = Properties.player.x + Properties.sceneSize.width * 0.5,
              posY = Properties.sceneSize.height * 0.25
        let harry = Properties.scene.add.sprite(posX, posY, '7-harry')
        harry.setOrigin(0, 0.5).setFlip(true)
        // Create and play animation
        Properties.scene.anims.create({
            key: '7-harry',
            frames: '7-harry',
            frameRate: 10,
            repeat: -1
        })
        harry.anims.play('7-harry')
        // Tween to left
        Properties.scene.tweens.add({
            targets: harry,
            x: harry.x - Properties.sceneSize.width - harry.width,
            y: {
                value: harry.y - 3 * 4,
                yoyo: true,
                duration: 500,
                repeat: -1,
            },
            duration: HARRY_FLIGHT_DURATION,
            onComplete: () => harry.destroy()
        })
    },
    showTitle: function() {
        fadeInOutTitle('DATA IS THE NEW OIL')
    },
    clear: function() {
        Properties.scene.anims.remove('7-harry')
    }
}

function processDataOil(data) {
    const scaleValue = 0.85
    data.setScale(scaleValue)
    // Add physics
    const widthOffset = 8 * 4
    Properties.scene.physics.add.existing(data, true)
    updateBody({
        sprite: data,
        width: data.width * scaleValue - widthOffset,
        height: data.height * scaleValue,
        offsetX: widthOffset / 2
    })
    // Add bouncing tween and bring to front
    let tween = addBounceTween(data)
    bringToFront(data)
    // Add overlap – collect
    let overlap = Properties.scene.physics.add.overlap(Properties.player, data, () => {
        // Destroy sprite
        data.destroy()
        // Destroy tween
        tween.stop()
        // Destroy overlap
        overlap.destroy()
        // Add money bags
        addMoneyBag(data, MONEY_BAG_DIRECTIONS.left)
        addMoneyBag(data, MONEY_BAG_DIRECTIONS.right)
        addMoneyBag(data, MONEY_BAG_DIRECTIONS.up)
        // Play collection sound
        AudioManager.play('collect', true)
    })
}

function addMoneyBag(dataOil, direction) {
    let moneyBag = Properties.scene.physics.add.image(dataOil.x + dataOil.width / 2, dataOil.y, '7-money')
    moneyBag.setOrigin(0.5, 1).setDepth(Constants.DEPTH.foregroundSecondary)
    // Define velocity depending on given direction
    const velocityXFromHeight = 2, velocityYFromHeight = 11
    let velocityX, velocityY
    switch (direction) {
        case MONEY_BAG_DIRECTIONS.left:
            velocityX = -velocityXFromHeight * moneyBag.height
            velocityY = -velocityYFromHeight * moneyBag.height
            break

        case MONEY_BAG_DIRECTIONS.right:
            velocityX = velocityXFromHeight * moneyBag.height
            velocityY = -velocityYFromHeight * moneyBag.height
            break

        case MONEY_BAG_DIRECTIONS.up:
            velocityX = 0
            velocityY = -velocityYFromHeight * moneyBag.height
            break
    }
    // Set velocity
    moneyBag.body.setVelocity(velocityX, velocityY)
    // Hide and destroy
    Properties.scene.tweens.add({
        targets: moneyBag,
        alpha: 0,
        delay: 500,
        duration: 200,
        onComplete: () => {
            moneyBag.destroy()
        }
    })
}
