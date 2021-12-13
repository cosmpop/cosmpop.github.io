import AudioManager from './audio.js'
import Properties from './properties.js'
import Scene6 from './scenes/scene6.js'
import { CHECKPOINTS } from './constants.js'
import { checkTimeline } from './timeline.js'
import { flipPlayer, playerSpriteJump, playerSpriteRun, playerSpriteStand } from './helpers.js'

export function processEachStep() {
    if (Properties.gameIsOver) {
        return false
    } else if (!Properties.inputEnabled) {
        checkTimeline()
        return false
    }

    // Get player
    let player = Properties.player

    // Moving right – follow player after the screen center (include camera scroll)
    // Moving left – only until the left border of the screen
    if (Properties.holdsRight()) {
        // PROCESS MOVEMENT TO THE RIGHT
        // Set velocity
        player.body.setVelocityX(Properties.playerVelocityRun() + Properties.playerVelocityBase)
        // Flip sprite back
        flipPlayer(false)
        // Set running animation if not jumping or pushing
        if (!(Properties.playerState.jumping || Properties.playerState.pushingRight)) {
            // If surfing, update only board
            if (Properties.playerState.surfing) {
                Scene6.startBoardBoost()
            } else {
                playerSpriteRun()
                // Play running sound
                AudioManager.play('run')
            }
        }
        // Follow camera after the center
        if (player.x - Properties.camera.scrollX >= Properties.sceneSize.width / 2
            && Properties.cameraFollowingEnabled)
        {
            Properties.camera.startFollow(player)
        }
        // Check for timeline events
        checkTimeline()
        // Update player state
        Properties.playerState.pushingLeft = false
        // Stop pushing sound if player is not pushing right
        if (!Properties.playerState.pushingRight) { AudioManager.stop('push') }
    } else if (Properties.holdsLeft()
        && player.x - Properties.player.body.width / 2 > Properties.camera.scrollX
        && !Properties.playerState.surfing)
    {
        // PROCESS MOVEMENT TO THE LEFT
        // Set velocity
        player.body.setVelocityX(-Properties.playerVelocityRun() + Properties.playerVelocityBase)
        // Flip sprite
        flipPlayer(true)
        // Set running animation if not jumping or pushing
        if (!(Properties.playerState.jumping || Properties.playerState.pushingLeft)) {
            playerSpriteRun()
            // Play running sound
            AudioManager.play('run')
        }
        // Stop follow when player goes left (except Scene2 with data sources)
        if (Properties.checkpoint !== CHECKPOINTS.dataSources
            && Properties.checkpoint !== CHECKPOINTS.snowflakes)
        {
            Properties.camera.stopFollow()
        }
        // Update player state
        Properties.playerState.pushingRight = false
        // Stop pushing sound if player is not pushing left
        if (!Properties.playerState.pushingLeft) { AudioManager.stop('push') }
    } else {
        // PROCESS STANDING
        // Reset velocity immediately if not surfing
        if (!Properties.playerState.surfing) {
            player.body.setVelocityX(Properties.playerVelocityBase)
        }
        // Set standing animation if not jummping
        if (!Properties.playerState.jumping) {
            playerSpriteStand()
            // Stop board if surfing
            if (Properties.playerState.surfing) {
                Scene6.stopBoardBoost()
            } else {
                // Stop running sound
                AudioManager.stop('run')
            }
        }
        // Add camera following in case if base velocity is not zero
        if (player.x - Properties.camera.scrollX >= Properties.sceneSize.width / 2
            && Properties.cameraFollowingEnabled)
        {
            Properties.camera.startFollow(player)
        }
        // Update player state
        Properties.playerState.pushingLeft = false
        Properties.playerState.pushingRight = false
        // Stop pushing sound
        AudioManager.stop('push')
    }

    // Jump if key is down and player is not jumping (also if not on the dashboard)
    if (Properties.holdsUp()
        && !Properties.playerState.jumping
        && !Properties.playerState.onDashboard
        && Properties.playerStands())
    {
        // Jump
        player.body.setVelocityY(Properties.playerVelocityJump())
        // Set jump animation
        playerSpriteJump()
        // Update board jump and acceleration if surfing
        if (Properties.playerState.surfing) {
            Scene6.jumpBoard()
            // Play surf jump sound
            AudioManager.play('jump-surf')
        } else {
            // Play usual jump sound
            AudioManager.play('jump')
        }
        // Update state
        Properties.playerState.jumping = true
        Properties.playerState.pushingLeft = false
        Properties.playerState.pushingRight = false
        // Stop running sound
        AudioManager.stop('run')
    }
}
