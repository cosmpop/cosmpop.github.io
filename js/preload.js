import Constants from './constants.js'
import Properties from './properties.js'

const CDN_URL = Constants.ASSETS_URL

export function preloadAssets() {
    // Set scene
    Properties.scene = this
    // Set scene size
    Properties.setSceneSize()
    // Set camera
    Properties.camera = this.cameras.main

    // Load bitmap fonts
    let fontUrl = `${CDN_URL}/assets/font`
    this.load.bitmapFont('light', `${fontUrl}/light.png`, `${fontUrl}/light.xml`);
    this.load.bitmapFont('dark', `${fontUrl}/dark.png`, `${fontUrl}/dark.xml`);
    // Load tilemap and tileset
    this.load.tilemapTiledJSON('game', `${CDN_URL}/assets/tilemap.json`)
    this.load.image('tileset', `${CDN_URL}/assets/tileset.png`)

    // Load player
    preloadPlayer.call(this)
    // Audio (sounds)
    preloadAudio.call(this)
    // Buttons (play, donate, etc.)
    preloadButtons.call(this)
    // Load background and common textures
    preloadCommon.call(this)
    // Load scenes
    preloadScene1.call(this)
    preloadScene2.call(this)
    preloadScene3.call(this)
    preloadScene4.call(this)
    preloadScene5.call(this)
    preloadScene6.call(this)
    preloadScene7.call(this)
    preloadScene8.call(this)
    preloadScene9.call(this)
    preloadScene10.call(this)
    preloadScene11.call(this)
    preloadScene12.call(this)

    // Do not add progress bar if game is already loaded
    if (Properties.gameIsLoaded) { return }

    // Progress bar
    let widthPercent = 0.4
    let width = Properties.sceneSize.width * widthPercent, height = 64
    let posX = (Properties.sceneSize.width - width) / 2, posY = (Properties.sceneSize.height - height) / 2
    // Game objects
    let progressBar = this.add.graphics()
    let progressBox = this.add.graphics()
    let percentText = this.make.text({
        x: posX + width / 2,
        y: posY - height * 0.8,
        text: 'LOADING... 0%',
        style: {
            font: '32px Pixel',
            fill: '#ffffff'
        }
    }).setOrigin(0.5, 0.65)
    let warningText = this.make.text({
        x: posX + width / 2,
        y: posY + height * 1.8,
        text: Constants.IS_TOUCH_DEVICE ? 'FOR BEST EXPERIENCE PLAY ON DESKTOP' : '',
        style: {
            font: '32px Pixel',
            fill: '#ffffff'
        }
    }).setOrigin(0.5, 0.65)
    // Bordered progress container
    progressBox.lineStyle(4, 0xffffff, 1)
    progressBox.strokeRect(posX, posY, width, height)

    this.load.on('progress', function(value) {
        // Update progress bar and text
        progressBar.clear()
        progressBar.fillStyle(0xffffff, 1)
        progressBar.fillRect(posX, posY, width * value, height)
        percentText.setText(`LOADING... ${parseInt(value * 100)}%`)
    })

    this.load.on('complete', function() {
        // Destroy all
        progressBar.destroy()
        progressBox.destroy()
        percentText.destroy()
        warningText.destroy()
    })
}

function preloadPlayer() {
    this.load.spritesheet('player', `${CDN_URL}/assets/player/sprite.png`, {
        frameWidth: 192, frameHeight: 128, margin: 1, spacing: 2
    })
}

function preloadAudio() {
    this.load.audio('run', [`${CDN_URL}/assets/audio/run.mp3`])
    this.load.audio('jump', [`${CDN_URL}/assets/audio/jump.mp3`])
    this.load.audio('jump-surf', [`${CDN_URL}/assets/audio/jump-surf.mp3`])
    this.load.audio('jump-clouds', [`${CDN_URL}/assets/audio/jump-clouds.mp3`])
    this.load.audio('push', [`${CDN_URL}/assets/audio/push.mp3`])
    this.load.audio('slide', [`${CDN_URL}/assets/audio/slide.mp3`])
    this.load.audio('game-over', [`${CDN_URL}/assets/audio/game-over.mp3`])
    this.load.audio('collect', [`${CDN_URL}/assets/audio/collect.mp3`])
    this.load.audio('manager1', [`${CDN_URL}/assets/audio/manager1.mp3`])
    this.load.audio('manager2', [`${CDN_URL}/assets/audio/manager2.mp3`])
    this.load.audio('snakes', [`${CDN_URL}/assets/audio/snakes.mp3`])
    this.load.audio('motorboat', [`${CDN_URL}/assets/audio/motorboat.mp3`])
    this.load.audio('flamethrower', [`${CDN_URL}/assets/audio/flamethrower.mp3`])
    this.load.audio('fireworks', [`${CDN_URL}/assets/audio/fireworks.mp3`])
    this.load.audio('ovation', [`${CDN_URL}/assets/audio/ovation.mp3`])
    this.load.audio('tsunami', [`${CDN_URL}/assets/audio/tsunami.mp3`])
    // New sounds
    this.load.audio('clear-bling', [`${CDN_URL}/assets/audio/clear-bling.mp3`])
    this.load.audio('firebolt-power', [`${CDN_URL}/assets/audio/firebolt-power.mp3`])
    this.load.audio('dashboard1', [`${CDN_URL}/assets/audio/dashboard1.mp3`])
    this.load.audio('dashboard2', [`${CDN_URL}/assets/audio/dashboard2.mp3`])
    this.load.audio('dashboard3', [`${CDN_URL}/assets/audio/dashboard3.mp3`])
    this.load.audio('barrier', [`${CDN_URL}/assets/audio/barrier.mp3`])
    // Background music
    this.load.audio('background', [`${CDN_URL}/assets/audio/background.mp3`])
}

function preloadButtons() {
    this.load.image('play', `${CDN_URL}/assets/buttons/play.png`)
    // Sound controls
    this.load.spritesheet('sound', `${CDN_URL}/assets/buttons/sound.png`, {
        frameWidth: 60, frameHeight: 60, margin: 1, spacing: 2
    })
    // Tutorial controls
    this.load.image('arrow-left', `${CDN_URL}/assets/tutorial/left.png`)
    this.load.image('arrow-right', `${CDN_URL}/assets/tutorial/right.png`)
    this.load.image('arrow-up', `${CDN_URL}/assets/tutorial/up.png`)
    this.load.image('arrow-down', `${CDN_URL}/assets/tutorial/down.png`)
}

function preloadCommon() {
    this.load.image('c-city1', `${CDN_URL}/assets/common/city1.png`)
    this.load.image('c-city2', `${CDN_URL}/assets/common/city2.png`)
    this.load.image('c-cloud1', `${CDN_URL}/assets/common/cloud1.png`)
    this.load.image('c-cloud2', `${CDN_URL}/assets/common/cloud2.png`)
    this.load.image('c-cloud3', `${CDN_URL}/assets/common/cloud3.png`)
    // Logos and buildings for them
    this.load.image('c-building1', `${CDN_URL}/assets/common/building1.png`)
    this.load.image('c-building2', `${CDN_URL}/assets/common/building2.png`)
    this.load.image('c-building3', `${CDN_URL}/assets/common/building3.png`)
    this.load.image('c-building4', `${CDN_URL}/assets/common/building4.png`)
    this.load.image('c-building5', `${CDN_URL}/assets/common/building5.png`)
    // 15 logos
    for (let index = 1; index <= 16; index++) {
        this.load.image(`c-logo${index}`, `${CDN_URL}/assets/common/logos/${index}.png`)
    }
}

function preloadScene1() {
    this.load.image('1-office', `${CDN_URL}/assets/scene1/office.png`)
    this.load.image('1-cloud1', `${CDN_URL}/assets/scene1/cloud1.png`)
    this.load.image('1-cloud2', `${CDN_URL}/assets/scene1/cloud2.png`)
}

function preloadScene2() {
    // Logos
    // Active
    this.load.image('2-logo1', `${CDN_URL}/assets/scene2/logos/1.png`)
    this.load.image('2-logo3', `${CDN_URL}/assets/scene2/logos/3.png`)
    this.load.image('2-logo6', `${CDN_URL}/assets/scene2/logos/6.png`)
    this.load.image('2-logo8', `${CDN_URL}/assets/scene2/logos/8.png`)
    // Inactive
    this.load.spritesheet('2-logo2', `${CDN_URL}/assets/scene2/logos/2.png`, {
        frameWidth: 92, frameHeight: 92, margin: 1, spacing: 2
    })
    this.load.spritesheet('2-logo4', `${CDN_URL}/assets/scene2/logos/4.png`, {
        frameWidth: 92, frameHeight: 92, margin: 1, spacing: 2
    })
    this.load.spritesheet('2-logo5', `${CDN_URL}/assets/scene2/logos/5.png`, {
        frameWidth: 92, frameHeight: 92, margin: 1, spacing: 2
    })
    this.load.spritesheet('2-logo7', `${CDN_URL}/assets/scene2/logos/7.png`, {
        frameWidth: 92, frameHeight: 92, margin: 1, spacing: 2
    })
    // Inactive slot sparks
    this.load.spritesheet('2-sparks', `${CDN_URL}/assets/scene2/sparks.png`, {
        frameWidth: 128, frameHeight: 52, margin: 1, spacing: 2
    })
    // Slot and pipes
    this.load.image('2-slot', `${CDN_URL}/assets/scene2/slot.png`)
    this.load.image('2-pipe1', `${CDN_URL}/assets/scene2/pipes/1.png`)
    this.load.image('2-pipe2', `${CDN_URL}/assets/scene2/pipes/2.png`)
    this.load.image('2-pipe3', `${CDN_URL}/assets/scene2/pipes/3.png`)
    this.load.image('2-pipe4', `${CDN_URL}/assets/scene2/pipes/4.png`)
    // Barrier
    this.load.image('2-barrier-top', `${CDN_URL}/assets/scene2/barrier/top.png`)
    this.load.spritesheet('2-barrier-bottom', `${CDN_URL}/assets/scene2/barrier/bottom.png`, {
        frameWidth: 88, frameHeight: 32, margin: 1, spacing: 2
    })
}

function preloadScene3() {
    this.load.image('3-pipe1', `${CDN_URL}/assets/scene3/pipes/1.png`)
    this.load.image('3-pipe2', `${CDN_URL}/assets/scene3/pipes/2.png`)
    this.load.image('3-pipe3', `${CDN_URL}/assets/scene3/pipes/3.png`)
    this.load.image('3-pipe4', `${CDN_URL}/assets/scene3/pipes/4.png`)
    this.load.image('3-pipe5', `${CDN_URL}/assets/scene3/pipes/5.png`)
    this.load.image('3-transition', `${CDN_URL}/assets/scene3/transition.png`)
    this.load.image('3-label', `${CDN_URL}/assets/scene3/label.png`)
    this.load.image('3-construction', `${CDN_URL}/assets/scene3/construction.png`)
    // Background buildings
    this.load.image('3-salesforce', `${CDN_URL}/assets/scene3/salesforce.png`)
    this.load.image('3-pyramid', `${CDN_URL}/assets/scene3/pyramid.png`)
}

function preloadScene4() {
    this.load.image('4-building1', `${CDN_URL}/assets/scene4/building1.png`)
    this.load.image('4-building2', `${CDN_URL}/assets/scene4/building2.png`)
    this.load.image('4-building3', `${CDN_URL}/assets/scene4/building3.png`)
    this.load.image('4-beam1', `${CDN_URL}/assets/scene4/beam1.png`)
    this.load.image('4-beam2', `${CDN_URL}/assets/scene4/beam2.png`)
    this.load.image('4-beam3', `${CDN_URL}/assets/scene4/beam3.png`)
    this.load.image('4-lamp1', `${CDN_URL}/assets/scene4/lamp1.png`)
    this.load.image('4-lamp2', `${CDN_URL}/assets/scene4/lamp2.png`)
    this.load.image('4-lamp3', `${CDN_URL}/assets/scene4/lamp3.png`)
    this.load.image('4-fence', `${CDN_URL}/assets/scene4/fence.png`)
    this.load.image('4-crane1', `${CDN_URL}/assets/scene4/crane1.png`)
    this.load.image('4-crane2', `${CDN_URL}/assets/scene4/crane2.png`)
    this.load.image('4-pipe1', `${CDN_URL}/assets/scene4/pipe1.png`)
    this.load.image('4-pipe2', `${CDN_URL}/assets/scene4/pipe2.png`)
    this.load.image('4-pipe3', `${CDN_URL}/assets/scene4/pipe3.png`)
    this.load.image('4-start1', `${CDN_URL}/assets/scene4/start1.png`)
    this.load.image('4-start2', `${CDN_URL}/assets/scene4/start2.png`)
    this.load.image('4-end1', `${CDN_URL}/assets/scene4/end1.png`)
    this.load.image('4-end2', `${CDN_URL}/assets/scene4/end2.png`)
    this.load.image('4-transparent', `${CDN_URL}/assets/scene4/transparent.png`)
    this.load.image('4-press1', `${CDN_URL}/assets/scene4/press1.png`)
    this.load.image('4-press2', `${CDN_URL}/assets/scene4/press2.png`)
    // Sprites
    this.load.spritesheet('4-panel', `${CDN_URL}/assets/scene4/panel.png`, {
        frameWidth: 336, frameHeight: 96, margin: 1, spacing: 2
    })
    this.load.spritesheet('4-dust', `${CDN_URL}/assets/scene4/dust.png`, {
        frameWidth: 196, frameHeight: 72, margin: 1, spacing: 2
    })
    this.load.spritesheet('4-brush', `${CDN_URL}/assets/scene4/brush.png`, {
        frameWidth: 236, frameHeight: 472, margin: 1, spacing: 2
    })
    this.load.spritesheet('4-carousel', `${CDN_URL}/assets/scene4/carousel.png`, {
        frameWidth: 192, frameHeight: 56, margin: 1, spacing: 2
    })
    this.load.spritesheet('4-box', `${CDN_URL}/assets/scene4/box.png`, {
        frameWidth: 160, frameHeight: 48, margin: 1, spacing: 2
    })
    this.load.spritesheet('4-clean-box', `${CDN_URL}/assets/scene4/clean/box.png`, {
        frameWidth: 180, frameHeight: 52, margin: 1, spacing: 2
    })
    this.load.spritesheet('4-clean-player', `${CDN_URL}/assets/scene4/clean/player.png`, {
        frameWidth: 44, frameHeight: 52, margin: 1, spacing: 2
    })
}

function preloadScene5() {
    this.load.image('5-pipe1', `${CDN_URL}/assets/scene5/pipe1.png`)
    this.load.image('5-pipe2', `${CDN_URL}/assets/scene5/pipe2.png`)
    this.load.image('5-pipe3', `${CDN_URL}/assets/scene5/pipe3.png`)
    this.load.image('5-pipe4', `${CDN_URL}/assets/scene5/pipe4.png`)
    this.load.image('5-pipe5', `${CDN_URL}/assets/scene5/pipe5.png`)
    this.load.image('5-pipe-stand', `${CDN_URL}/assets/scene5/pipe-stand.png`)
    this.load.image('5-microsoft', `${CDN_URL}/assets/scene5/microsoft.png`)
    this.load.image('5-amazon', `${CDN_URL}/assets/scene5/amazon.png`)
    this.load.image('5-google', `${CDN_URL}/assets/scene5/google.png`)
    this.load.image('5-ground', `${CDN_URL}/assets/scene5/ground.png`)
    this.load.image('5-on-premise', `${CDN_URL}/assets/scene5/on-premise.png`)
    // Snake sprites
    this.load.spritesheet('5-snake1', `${CDN_URL}/assets/scene5/snake1.png`, {
        frameWidth: 212, frameHeight: 72, margin: 1, spacing: 2
    })
    this.load.spritesheet('5-snake2', `${CDN_URL}/assets/scene5/snake2.png`, {
        frameWidth: 204, frameHeight: 72, margin: 1, spacing: 2
    })
}

function preloadScene6() {
    // Background
    this.load.image('6-house1', `${CDN_URL}/assets/scene6/background/house1.png`)
    this.load.image('6-house2', `${CDN_URL}/assets/scene6/background/house2.png`)
    this.load.image('6-hill1', `${CDN_URL}/assets/scene6/background/hill1.png`)
    this.load.image('6-hill2', `${CDN_URL}/assets/scene6/background/hill2.png`)
    this.load.image('6-trees', `${CDN_URL}/assets/scene6/background/trees.png`)
    this.load.image('6-forest1', `${CDN_URL}/assets/scene6/background/forest1.png`)
    this.load.image('6-forest2', `${CDN_URL}/assets/scene6/background/forest2.png`)
    this.load.image('6-mountains', `${CDN_URL}/assets/scene6/background/mountains.png`)
    this.load.image('6-bamboo1', `${CDN_URL}/assets/scene6/background/bamboo1.png`)
    this.load.image('6-bamboo2', `${CDN_URL}/assets/scene6/background/bamboo2.png`)
    this.load.image('6-swamp1', `${CDN_URL}/assets/scene6/background/swamp1.png`)
    this.load.image('6-swamp2', `${CDN_URL}/assets/scene6/background/swamp2.png`)
    this.load.image('6-swamp3', `${CDN_URL}/assets/scene6/background/swamp3.png`)
    this.load.image('6-swamp4', `${CDN_URL}/assets/scene6/background/swamp4.png`)
    this.load.image('6-sand', `${CDN_URL}/assets/scene6/background/sand.png`)
    this.load.image('6-elephant', `${CDN_URL}/assets/scene6/elephant.png`)
    this.load.image('6-warning1', `${CDN_URL}/assets/scene6/background/warning1.png`)
    this.load.image('6-warning2', `${CDN_URL}/assets/scene6/background/warning2.png`)
    // Obstacles
    this.load.image('6-wood', `${CDN_URL}/assets/scene6/wood.png`)
    this.load.image('6-crocodile', `${CDN_URL}/assets/scene6/crocodile.png`)
    this.load.image('6-rock', `${CDN_URL}/assets/scene6/rock.png`)
    this.load.image('6-shark', `${CDN_URL}/assets/scene6/shark.png`)
    // Sprites
    this.load.spritesheet('6-water', `${CDN_URL}/assets/scene6/water.png`, {
        frameWidth: 64, frameHeight: 64, margin: 1, spacing: 2
    })
    this.load.spritesheet('6-jet', `${CDN_URL}/assets/scene6/jet.png`, {
        frameWidth: 248, frameHeight: 148, margin: 1, spacing: 2
    })
    this.load.spritesheet('6-board', `${CDN_URL}/assets/scene6/board.png`, {
        frameWidth: 300, frameHeight: 68, margin: 1, spacing: 2
    })
    this.load.spritesheet('6-tsunami', `${CDN_URL}/assets/scene6/tsunami.png`, {
        frameWidth: 912, frameHeight: 492, margin: 1, spacing: 2
    })
}

function preloadScene7() {
    this.load.image('7-bridge', `${CDN_URL}/assets/scene7/bridge.png`)
    this.load.image('7-data', `${CDN_URL}/assets/scene7/data.png`)
    this.load.image('7-money', `${CDN_URL}/assets/scene7/money.png`)
    this.load.spritesheet('7-harry', `${CDN_URL}/assets/scene7/harry.png`, {
        frameWidth: 244, frameHeight: 116, margin: 1, spacing: 2
    })
}

function preloadScene8() {
    this.load.image('8-person1', `${CDN_URL}/assets/scene8/people/1.png`)
    this.load.image('8-person2', `${CDN_URL}/assets/scene8/people/2.png`)
    this.load.image('8-person3', `${CDN_URL}/assets/scene8/people/3.png`)
    this.load.image('8-person4', `${CDN_URL}/assets/scene8/people/4.png`)
    this.load.image('8-person5', `${CDN_URL}/assets/scene8/people/5.png`)
    this.load.image('8-person6', `${CDN_URL}/assets/scene8/people/6.png`)
    this.load.image('8-data', `${CDN_URL}/assets/scene8/people/data.png`)
    this.load.image('8-bubble1', `${CDN_URL}/assets/scene8/bubbles/1.png`)
    this.load.image('8-bubble2', `${CDN_URL}/assets/scene8/bubbles/2.png`)
    this.load.image('8-bubble3', `${CDN_URL}/assets/scene8/bubbles/3.png`)
    this.load.image('8-bubble4', `${CDN_URL}/assets/scene8/bubbles/4.png`)
    this.load.image('8-speech-s', `${CDN_URL}/assets/scene8/speech-s.png`)
    this.load.image('8-speech-m', `${CDN_URL}/assets/scene8/speech-m.png`)
    this.load.image('8-speech-l', `${CDN_URL}/assets/scene8/speech-l.png`)
}

function preloadScene9() {
    this.load.image('9-brick1', `${CDN_URL}/assets/scene9/brick1.png`)
    this.load.image('9-brick2', `${CDN_URL}/assets/scene9/brick2.png`)
    this.load.image('9-warning', `${CDN_URL}/assets/scene9/warning.png`)
    // Sprites
    this.load.spritesheet('9-spark', `${CDN_URL}/assets/scene9/spark.png`, {
        frameWidth: 136, frameHeight: 136, margin: 1, spacing: 2
    })
    this.load.spritesheet('9-lava', `${CDN_URL}/assets/scene9/lava.png`, {
        frameWidth: 64, frameHeight: 64, margin: 1, spacing: 2
    })
    this.load.spritesheet('9-destruction', `${CDN_URL}/assets/scene9/destruction.png`, {
        frameWidth: 128, frameHeight: 136, margin: 1, spacing: 2
    })
}

function preloadScene10() {
    this.load.image('10-statue', `${CDN_URL}/assets/scene10/statue.png`)
    this.load.image('10-box', `${CDN_URL}/assets/scene10/box.png`)
    this.load.image('10-aura', `${CDN_URL}/assets/scene10/aura.png`)
    this.load.image('10-board', `${CDN_URL}/assets/scene10/board.png`)
    this.load.image('10-firebolt', `${CDN_URL}/assets/scene10/firebolt.png`)
    // Sprites
    this.load.spritesheet('10-plot1', `${CDN_URL}/assets/scene10/plots/1.png`, {
        frameWidth: 228, frameHeight: 152, margin: 1, spacing: 2
    })
    this.load.spritesheet('10-plot2', `${CDN_URL}/assets/scene10/plots/2.png`, {
        frameWidth: 228, frameHeight: 100, margin: 1, spacing: 2
    })
    this.load.spritesheet('10-plot3', `${CDN_URL}/assets/scene10/plots/3.png`, {
        frameWidth: 228, frameHeight: 144, margin: 1, spacing: 2
    })
    this.load.spritesheet('10-plot4', `${CDN_URL}/assets/scene10/plots/4.png`, {
        frameWidth: 252, frameHeight: 120, margin: 1, spacing: 2
    })
    this.load.spritesheet('10-plot5', `${CDN_URL}/assets/scene10/plots/5.png`, {
        frameWidth: 252, frameHeight: 292, margin: 1, spacing: 2
    })
    this.load.spritesheet('10-plot6', `${CDN_URL}/assets/scene10/plots/6.png`, {
        frameWidth: 212, frameHeight: 224, margin: 1, spacing: 2
    })
    this.load.spritesheet('10-plot7', `${CDN_URL}/assets/scene10/plots/7.png`, {
        frameWidth: 212, frameHeight: 172, margin: 1, spacing: 2
    })
    this.load.spritesheet('10-plot8', `${CDN_URL}/assets/scene10/plots/8.png`, {
        frameWidth: 440, frameHeight: 188, margin: 1, spacing: 2
    })
    this.load.spritesheet('10-spinner', `${CDN_URL}/assets/scene10/spinner.png`, {
        frameWidth: 80, frameHeight: 76, margin: 1, spacing: 2
    })
}

function preloadScene11() {
    this.load.image('11-office', `${CDN_URL}/assets/scene11/office.png`)
    this.load.image('11-table', `${CDN_URL}/assets/scene11/table.png`)
    this.load.image('11-outro1', `${CDN_URL}/assets/scene11/outro/screen1.png`)
    this.load.image('11-outro2', `${CDN_URL}/assets/scene11/outro/screen2.png`)
    this.load.image('11-logo', `${CDN_URL}/assets/scene11/outro/logo.png`)
    this.load.image('11-link', `${CDN_URL}/assets/scene11/outro/link.png`)
    this.load.image('11-share', `${CDN_URL}/assets/scene11/outro/share.png`)
    this.load.image('11-restart', `${CDN_URL}/assets/scene11/outro/restart.png`)
    this.load.image('11-icon1', `${CDN_URL}/assets/scene11/outro/icon1.png`)
    this.load.image('11-icon2', `${CDN_URL}/assets/scene11/outro/icon2.png`)
    this.load.image('11-icon3', `${CDN_URL}/assets/scene11/outro/icon3.png`)
    this.load.image('11-icon4', `${CDN_URL}/assets/scene11/outro/icon4.png`)
    // Managers sprites
    this.load.spritesheet('11-person1', `${CDN_URL}/assets/scene11/people/1.png`, {
        frameWidth: 92, frameHeight: 140, margin: 1, spacing: 2
    })
    this.load.spritesheet('11-person2', `${CDN_URL}/assets/scene11/people/2.png`, {
        frameWidth: 84, frameHeight: 136, margin: 1, spacing: 2
    })
    this.load.spritesheet('11-person3', `${CDN_URL}/assets/scene11/people/3.png`, {
        frameWidth: 92, frameHeight: 136, margin: 1, spacing: 2
    })
    this.load.spritesheet('11-person4', `${CDN_URL}/assets/scene11/people/4.png`, {
        frameWidth: 84, frameHeight: 136, margin: 1, spacing: 2
    })
    this.load.spritesheet('11-person5', `${CDN_URL}/assets/scene11/people/5.png`, {
        frameWidth: 84, frameHeight: 140, margin: 1, spacing: 2
    })
    // Fireworks
    this.load.spritesheet('11-firework1', `${CDN_URL}/assets/scene11/fireworks/1.png`, {
        frameWidth: 440, frameHeight: 392, margin: 1, spacing: 2
    })
    this.load.spritesheet('11-firework2', `${CDN_URL}/assets/scene11/fireworks/2.png`, {
        frameWidth: 440, frameHeight: 392, margin: 1, spacing: 2
    })
    this.load.spritesheet('11-firework3', `${CDN_URL}/assets/scene11/fireworks/3.png`, {
        frameWidth: 440, frameHeight: 396, margin: 1, spacing: 2
    })
}

function preloadScene12() {
    this.load.image('12-mountains', `${CDN_URL}/assets/scene12/mountains.png`)
    this.load.image('12-gun', `${CDN_URL}/assets/scene12/gun.png`)
    // Sprites
    this.load.spritesheet('12-snowflake', `${CDN_URL}/assets/scene12/snowflake.png`, {
        frameWidth: 92, frameHeight: 92, margin: 1, spacing: 2
    })
    this.load.spritesheet('12-fire', `${CDN_URL}/assets/scene12/fire.png`, {
        frameWidth: 760, frameHeight: 112, margin: 1, spacing: 2
    })
}
