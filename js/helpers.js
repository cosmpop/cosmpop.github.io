import Constants from './constants.js'
import Properties from './properties.js'

// Outro screen DOM elements
const OUTRO_BACKGROUND = document.getElementById('outro-background')
const OUTRO_ACTIONS = document.getElementById('outro-actions')
// Restart button DOM element
const RESTART_BUTTON = document.getElementById('restart')

let controls = document.getElementById('controls')

export function showControls() {
    controls.style.display = 'flex'
}

export function hideControls() {
    controls.style.display = 'none'
}

function playerSpritePostfix() {
    if (Properties.playerState.surfing) { return '-surf' }
    if (Properties.playerState.withGun) { return '-gun' }
    return ''
}

export function playerSpriteRun() {
    Properties.playerSprite.anims.play('player-run' + playerSpritePostfix(), true)
}

export function playerSpriteStand() {
    Properties.playerSprite.anims.play('player-idle' + playerSpritePostfix(), true)
}

export function playerSpriteJump() {
    Properties.playerSprite.anims.play('player-jump' + playerSpritePostfix())
}

export function playerSpriteFall() {
    Properties.playerSprite.anims.play('player-fall')
}

export function playerSpritePush() {
    Properties.playerSprite.anims.play('player-push', true)
}

export function playerSpriteSlide() {
    Properties.playerSprite.anims.play('player-slide')
}

export function flipPlayer(isFlipped = true) {
    Properties.player.each(child => {
        // Flip everything except Scene2 speech bubble
        if (child.name !== Constants.OBJECT_NAMES.playerSpeechBubble) {
            child.setFlip(isFlipped)
        }
    })
}

export function updateBody({ sprite, width = null, height = null, offsetX = null, offsetY = null }) {
    height = height || sprite.height
    offsetX = offsetX || 0
    offsetY = offsetY || 0

    sprite.body.setSize(width, height)
    sprite.body.setOffset(offsetX, offsetY)
}

export function bringToFront(sprite) {
    sprite.setDepth(Constants.DEPTH.important)
}

export function addBounceTween(object) {
    return Properties.scene.tweens.add({
        targets: object,
        duration: 800,
        y: '-=5',
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
    })
}

export function addLogo(object) {
    let logo = Properties.scene.add.image(object.x, object.y, object.name)
    logo.setOrigin(0.5, 1).setX(logo.x + logo.width / 2)
    logo.setDepth(Constants.DEPTH.background)
    logo.setScale(Constants.LOGO_SCALES[object.name])
    return logo
}

export function fadeInOutTitle(text, duration = null, delay = null, fontSize = null) {
    // Duration and delay
    duration = duration === null ? 600 : duration
    delay = delay === null ? 1500 : delay
    // Set font size
    Properties.titleText[0].setFontSize(fontSize || Constants.TITLE_FONT_SIZE)
    Properties.titleText[1].setFontSize(fontSize || Constants.TITLE_FONT_SIZE)
    // Update text
    if (Array.isArray(text)) {
        Properties.titleText[0].setText(text[0])
        Properties.titleText[1].setText(text[1])
        // Fade in and out
        fadeInOut(Properties.titleText[0], duration, delay)
        fadeInOut(Properties.titleText[1], duration, delay)
    } else {
        Properties.titleText[0].setText(text)
        Properties.titleText[1].setText('')
        // Fade in and out
        fadeInOut(Properties.titleText[0], duration, delay)
    }
}

export function fadeInOut(target, duration, delay, onComplete = null) {
    // Fade in
    fadeIn(target, duration, function() {
        // Wait and fade out
        Properties.scene.time.delayedCall(delay, () => fadeOut(target, duration, onComplete))
    })
}

export function fadeIn(target, duration, onComplete = null, targetAlpha = 1) {
    // Reset
    target.alpha = 0
    // Fade in
    return Properties.scene.tweens.add({
        targets: target,
        alpha: targetAlpha,
        duration: duration,
        onComplete: onComplete
    })
}

export function fadeOut(target, duration, onComplete = null) {
    // Fade out
    return Properties.scene.tweens.add({
        targets: target,
        alpha: 0,
        duration: duration,
        onComplete: onComplete
    })
}

export function addGameOverLayer() {
    // Hide title if it is visible
    Properties.titleText[0].alpha = 0
    Properties.titleText[1].alpha = 0
    // Position – center by X and 0.2 from the top by Y
    let posX = Properties.sceneSize.width / 2, posY = Properties.sceneSize.height * 0.2
    // Title, subtitle and play button
    let titleSize = 64, subtitleSize = 38, offset = 24
    let title = Properties.scene.add.bitmapText(0, 0, 'light', 'GAME OVER', titleSize)
    let subtitle = Properties.scene.add.bitmapText(0, titleSize + 2 * offset, 'light', 'START FROM CHECKPOINT', subtitleSize)
    let play = Properties.scene.add.image(0, subtitle.y + subtitleSize + 2 * offset, 'play')
    // Update origins
    title.setOrigin(0.5, 0.35)
    subtitle.setOrigin(0.5, 0.35)
    play.setOrigin(0.5, 0)
    // Interactions
    play.setInteractive().setScrollFactor(0)
    // Root element
    let container = Properties.scene.add.container(posX, posY, [title, subtitle, play])
    container.setScrollFactor(0).setDepth(Constants.DEPTH.important)
    // Play button handler - restart
    let restartGame = () => {
        container.destroy()
        Properties.scene.scene.restart()
    }
    // Start game as pointer raises
    play.once('pointerup', () => {
        // Remove space events
        Properties.keyboard.space.removeAllListeners()
        restartGame()
    })
    // Start game on space
    Properties.keyboard.space.once('up', () => {
        // Remove play button listeners
        play.removeAllListeners()
        restartGame()
    })
}

export function clearGroup(group, destroyTweens = false) {
    if (group && group.active) {
        // Clear tweens
        if (destroyTweens) {
            for (const child of group.getChildren()) {
                Properties.scene.tweens.killTweensOf(child)
            }
        }
        // Destroy group with children
        group.destroy(true)
    }
}

export function clearScene() {
    if (Constants.DEBUG) {
        console.log('Was:')
        console.log('Children:', Properties.scene.children.length)
        console.log('Colliders:', Properties.scene.physics.world.colliders.length)
        console.log('Tweens:', Properties.scene.tweens.getAllTweens().length)
    }

    clearObjects()

    if (Constants.DEBUG) {
        setTimeout(() => {
            console.log('Now:')
            console.log('Children:', Properties.scene.children.length)
            console.log('Colliders:', Properties.scene.physics.world.colliders.length)
            console.log('Tweens:', Properties.scene.tweens.getAllTweens().length)
        }, 100)
    }
}

function clearObjects() {
    // Loop from the end
    let i = Properties.scene.children.length - 1
    while (i >= 0) {
        // Get child
        let child = Properties.scene.children.list[i]
        // Check for image or sprite
        if ((child.type === 'Image' || child.type === 'Sprite')
            && child.name !== Constants.OBJECT_NAMES.soundControl)
        {
            // Check whether it is passed
            if (child.x + child.width < Properties.camera.scrollX) {
                // Remove child
                child.destroy()
                // Remove all its tweens
                Properties.scene.tweens.killTweensOf(child)
            }
        }
        // Decrement
        i--
    }
}

export function initTutorialControls() {
    // Add controls for desktop
    let moved = false, tutorialControls
    Properties.scene.time.delayedCall(5000, () => {
        if (!moved && !Constants.IS_TOUCH_DEVICE) {
            tutorialControls = addTutorialControls.call(Properties.scene)
        }
    })
    // Check every 100ms player movement to remove bird
    let playerX = Properties.player.x
    let movementInterval = Properties.scene.time.addEvent({
        delay: 300,
        startAt: 300,
        loop: true,
        callback: () => {
            if (playerX !== Properties.player.x) {
                moved = true
                movementInterval.remove()
                if (tutorialControls) {
                    removeTutorialControls.call(Properties.scene, tutorialControls)
                }
            }
        }
    })
}

function addTutorialControls() {
    let scale = 0.65, width = 128 * scale, height = 128 * scale, offset = 8 * scale, alpha = 0.7
    // Create arrows
    let arrowUp = this.add.image(0, (-height - offset) / 2, 'arrow-up').setScale(scale)
    let arrowLeft = this.add.image(-width - offset, (height + offset) / 2, 'arrow-left').setScale(scale)
    let arrowRight = this.add.image(width + offset, (height + offset) / 2, 'arrow-right').setScale(scale)
    let arrowDown = this.add.image(0, (height + offset) / 2, 'arrow-down').setScale(scale)
    // Set opacity
    arrowUp.setAlpha(alpha)
    arrowLeft.setAlpha(alpha)
    arrowRight.setAlpha(alpha)
    arrowDown.setAlpha(0.1)
    // Create container
    let posX = Properties.sceneSize.width * 0.5, posY = Properties.sceneSize.height * 0.45
    let container = this.add.container(posX, posY, [arrowUp, arrowLeft, arrowRight, arrowDown])
    container.setScrollFactor(0).setAlpha(0)
    // Fade in
    this.tweens.add({
        targets: container,
        alpha: 1,
        duration: 200
    })
    // Add tweens
    let alphaPercent = 0.5
    let tween = this.tweens.timeline({
        delay: 500,
        duration: 200,
        hold: 900,
        yoyo: true,
        tweens: [
            { targets: arrowRight, alpha: alpha * alphaPercent },
            { targets: arrowLeft, alpha: alpha * alphaPercent },
            { targets: arrowUp, alpha: alpha * alphaPercent },
        ],
        loop: -1
    })
    return { container, arrowLeft, arrowRight, arrowUp, arrowDown, tween }
}

function removeTutorialControls(controls) {
    this.tweens.add({
        targets: controls.container,
        alpha: 0,
        duration: 200,
        onComplete: () => {
            controls.tween.stop()
            controls.arrowLeft.destroy()
            controls.arrowRight.destroy()
            controls.arrowUp.destroy()
            controls.arrowDown.destroy()
            controls.container.destroy()
        }
    })
}

export function startOutro(afterBonusLevel = false) {
    const { width, height } = Properties.sceneSize, imagePosY = -height * 0.05
    let background = Properties.scene.add.rectangle(0, 0, width, height, 0xf72a2f)
    let screen1 = Properties.scene.add.image(0, imagePosY, '11-outro1')
    // Hide next ones
    let screen2 = Properties.scene.add.image(0, imagePosY, '11-outro2')
    // Last share screen with icons and restart button
    const logoPosY = -height * 0.3, titlePosY = -height * 0.075
    const iconScale = 0.4, iconWidth = 96 * iconScale, iconMargin = iconWidth * 2
    let logo = Properties.scene.add.image(0, logoPosY, '11-logo').setScale(0.8)
    let shareTitle = Properties.scene.add.image(0, titlePosY, '11-share').setScale(0.35)
    let icon1 = Properties.scene.add.image(-iconMargin * 1.5, titlePosY + iconWidth * 1.75, '11-icon1').setScale(iconScale)
    let icon2 = Properties.scene.add.image(-iconMargin / 2, titlePosY + iconWidth * 1.75, '11-icon2').setScale(iconScale)
    let icon3 = Properties.scene.add.image(iconMargin / 2, titlePosY + iconWidth * 1.75, '11-icon3').setScale(iconScale)
    let icon4 = Properties.scene.add.image(iconMargin * 1.5, titlePosY + iconWidth * 1.75, '11-icon4').setScale(iconScale)
    let shareScreen = Properties.scene.add.container(0, 0, [logo, shareTitle, icon1, icon2, icon3, icon4])
    // Make share screen buttons clickable
    addShareScreenInteractions(logo, icon1, icon2, icon3, icon4)
    // Form a container of all screens
    let container = Properties.scene.add.container(width / 2, height / 2, [
        background, screen1, screen2, shareScreen
    ])
    // Initially hide the container itself
    container.setScrollFactor(0).setAlpha(0).setDepth(Constants.DEPTH.lastScreen)
    // Set player to be in front of the last screen
    Properties.player.setDepth(Constants.DEPTH.lastScreen + 1)
    // Usual outro after the whole game. Only the last screen after the bonus level
    if (!afterBonusLevel) {
        screen2.setAlpha(0)
        shareScreen.setAlpha(0)
    } else {
        screen1.setAlpha(0)
        screen2.setAlpha(0)
    }
    // Show background screen with a slight delay
    OUTRO_BACKGROUND.classList.remove('hidden')
    // Show DOM actions immediately for the bonus level
    if (afterBonusLevel) { OUTRO_ACTIONS.classList.remove('hidden') }
    Properties.scene.time.delayedCall(100, () => {
        // Show background red color
        OUTRO_BACKGROUND.classList.add('shown')
        // Start fading in and out
        const fadeDuration = 500, delayDuration = 1500
        if (!afterBonusLevel) {
            fadeIn(container, fadeDuration, () => {
                Properties.scene.time.delayedCall(delayDuration, () => fadeOut(screen1, fadeDuration, () => {
                    fadeIn(screen2, fadeDuration, () => {
                        Properties.scene.time.delayedCall(delayDuration, () => {
                            OUTRO_ACTIONS.classList.remove('hidden')
                            fadeOut(screen2, fadeDuration, () => {
                                OUTRO_ACTIONS.classList.add('shown')
                                fadeIn(shareScreen, fadeDuration)
                                // Add bonus level oppotunity after 5 seconds
                                const bonusDelay = 5000
                                Properties.scene.time.delayedCall(bonusDelay, () => {
                                    Properties.inputEnabled = true
                                    showControls()
                                    // Hide jump control
                                    controls.classList.add('no-up')
                                    // Check every 100ms player movement to remove outro
                                    let playerX = Properties.player.x
                                    let movementInterval = Properties.scene.time.addEvent({
                                        delay: 300,
                                        startAt: 300,
                                        loop: true,
                                        callback: () => {
                                            if (playerX !== Properties.player.x) {
                                                movementInterval.remove()
                                                OUTRO_BACKGROUND.classList.remove('shown')
                                                OUTRO_ACTIONS.classList.remove('shown')
                                                fadeOut(container, fadeDuration, () => {
                                                    OUTRO_BACKGROUND.classList.add('hidden')
                                                    OUTRO_ACTIONS.classList.add('hidden')
                                                    // Remove restart button click handler
                                                    RESTART_BUTTON.removeEventListener('click', restartGame)
                                                    container.destroy()
                                                    // Show jump control
                                                    controls.classList.remove('no-up')
                                                })
                                            }
                                        }
                                    })
                                })
                            })
                        })
                    })
                }))
            })
        } else {
            fadeIn(container, fadeDuration)
            OUTRO_ACTIONS.classList.add('shown')
        }
    })
}

function addShareScreenInteractions(logo, linkedin, facebook, twitter, copy) {
    // Open share links in new windows when share icons are clicked
    addClickEvent(linkedin, () => window.open('https://www.linkedin.com/sharing/share-offsite/?url=firebolt.io/big-data-game', '_blank'))
    addClickEvent(facebook, () => window.open('https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Ffirebolt.io/big-data-game&t=https%3A%2F%2Ffirebolt.io/big-data-game', '_blank'))
    addClickEvent(twitter, () => window.open('https://twitter.com/intent/tweet?url=https%3A%2F%2Ffirebolt.io/big-data-game', '_blank'))
    // Copy game link when copy icon is clicked
    addClickEvent(copy, () => copyTextToClipboard('https://firebolt.io/big-data-game'), false, true)
    // Move to firebolt website when logo is clicked
    addClickEvent(logo, () => window.open('https://www.firebolt.io', '_blank'))
    // Highlight all buttons on hover
    highlightOnHover(logo)
    highlightOnHover(linkedin)
    highlightOnHover(facebook)
    highlightOnHover(twitter)
    highlightOnHover(copy)
    // Add event listener
    RESTART_BUTTON.addEventListener('click', restartGame)
}

// Restart the game on click (once)
function restartGame () {
    // Remove DOM outro screens
    OUTRO_BACKGROUND.classList.remove('shown')
    OUTRO_BACKGROUND.classList.add('hidden')
    OUTRO_ACTIONS.classList.remove('shown')
    OUTRO_ACTIONS.classList.add('hidden')
    // Reset checkpoints
    Properties.checkpoint = Constants.BASE_CHECKPOINT
    // Restart everything
    Properties.scene.scene.restart()
    // Remove event listener
    RESTART_BUTTON.removeEventListener('click', restartGame)
}

function addClickEvent(button, handler, once = false, hightlight = false) {
    let handleClick = function() {
        handler()
        if (hightlight) {
            button.setAlpha(1)
            Properties.scene.tweens.add({
                targets: button,
                alpha: 0.6,
                duration: 150,
                yoyo: true
            })
        }
    }

    button.setInteractive({ cursor: 'pointer' }).setScrollFactor(0)
    if (once) {
        button.once('pointerup', handleClick)
    } else {
        button.on('pointerup', handleClick)
    }
}

function highlightOnHover(button) {
    button.on('pointerover', () => button.setAlpha(0.8))
    button.on('pointerout', () => button.setAlpha(1))
}

function fallbackCopyTextToClipboard(text) {
    var textArea = document.createElement('textarea')
    textArea.value = text
    // Avoid scrolling to bottom
    textArea.style.top = '0'
    textArea.style.left = '0'
    textArea.style.position = 'fixed'
    // Append and select text
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    // Copy and show success message
    if (document.execCommand('copy')) {
        // Success message
    }
    // Destroy
    document.body.removeChild(textArea)
}

function copyTextToClipboard(text) {
    // Use deprecated method if clipboard is not availalbe
    if (!navigator.clipboard) {
        fallbackCopyTextToClipboard(text)
        return
    }
    // Copy and show success message
    navigator.clipboard.writeText(text).then(function() {
        // Success message
    })
}

