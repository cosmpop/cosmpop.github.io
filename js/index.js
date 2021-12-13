import './lib/phaser.min.js'
import Constants from './constants.js'
import Properties from './properties.js'
import { preloadAssets } from './preload.js'
import { initObjects } from './create.js'
import { processEachStep } from './update.js'

// Device sizes
const WIDTH = window.outerWidth, HEIGHT = window.outerHeight
// Check ratio from URL
let urlRatio = parseFloat(new URL(window.location.href).searchParams.get('ratio'))
// Height is constant - adjust width and scale
const GAME_HEIGHT = 640
// Game container and loading block objects
const CONTAINER = document.getElementById('game')

// Load game with appropriate ratio
loadFont()

function loadFont() {
    let pixelFont = new FontFace('Pixel', `url(${Constants.ASSETS_URL}/assets/font/main.ttf)`)
    pixelFont.load().then(function(loadedFontFace) {
        document.fonts.add(loadedFontFace)
        document.body.style.fontFamily = 'Pixel'
        loadGame()
    })
}

function loadGame() {
    if (Constants.IS_TOUCH_DEVICE) {
        if (WIDTH < HEIGHT) {
            // Tell to rotate
            document.body.classList.add('rotate')
        } else {
            document.body.classList.add('mobile')

            // Check for loaded
            let interval = setInterval(() => {
                if (document.body) {
                    // Clear checking and scroll to the top
                    clearInterval(interval)
                    window.scrollTo(0, 0)
                    // Get sizes
                    let offsetY = 30
                    let leftHeight = window.innerHeight - offsetY
                    let ratio = WIDTH / leftHeight
                    let finalRatio = Math.max(Math.min(ratio, Constants.MAX_GAME_RATIO), Constants.MIN_GAME_RATIO)
                    // Check from URL
                    const GAME_RATIO = urlRatio ? urlRatio : finalRatio
                    const GAME_WIDTH = GAME_HEIGHT * GAME_RATIO
                    // Define scale from current window inner width
                    const SCALE = window.innerWidth / GAME_WIDTH
                    initGame(GAME_WIDTH, GAME_HEIGHT, SCALE)
                }
            }, 100)
        }
    } else {
        // Usual computers – leave max ratio
        const GAME_RATIO = urlRatio ? urlRatio : Constants.MAX_GAME_RATIO
        const GAME_WIDTH = GAME_HEIGHT * GAME_RATIO
        // Define scale from current window inner width
        const SCALE = window.innerWidth / GAME_WIDTH
        initGame(GAME_WIDTH, GAME_HEIGHT, SCALE)
    }
}

function initGame(gameWidth, gameHeight, scale) {
    // Config for the game
    let config = {
        type: Phaser.CANVAS,
        width: gameWidth,
        height: gameHeight,
        physics: {
            default: 'arcade',
            arcade: {
                debug: new URL(window.location.href).searchParams.get('debug') == 1
            }
        },
        fps: {
            target: 60,
        },
        scene: {
            preload: preloadAssets,
            create: initObjects,
            update: processEachStep
        },
        backgroundColor: 0x57bef8,
        parent: CONTAINER
    }

    // Init Phaser game
    new Phaser.Game(config)

    // Set height from scale
    CONTAINER.style.height = `${scale * gameHeight}px`
    // Set transform - scale
    CONTAINER.children[0].style.transform = `scale(${scale}) translateY(-2px)`
}

// Reload page on rotate
window.addEventListener('orientationchange', () => {
    if (!Properties.gameIsLoaded) {
        window.location.reload()
    } else {
        setTimeout(() => {
            if (window.innerWidth < window.innerHeight) {
                document.body.classList.remove('loaded')
                document.body.classList.add('rotate')
            } else {
                document.body.classList.add('loaded')
                document.body.classList.remove('rotate')
            }
        }, 500)
    }
})
