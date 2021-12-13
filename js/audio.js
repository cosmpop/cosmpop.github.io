import Properties from './properties.js'

let fadeInTweens = {}, fadeOutTweens = {}

export default {
    muted: false,
    base: {
        // Music tracks
        background: undefined,
        // Sounds
        run: undefined,
        jump: undefined,
        'jump-surf': undefined,
        'jump-clouds': undefined,
        'game-over': undefined,
        push: undefined,
        slide: undefined,
        collect: undefined,
        manager1: undefined,
        manager2: undefined,
        snakes: undefined,
        motorboat: undefined,
        flamethrower: undefined,
        fireworks: undefined,
        ovation: undefined,
        tsunami: undefined,
        // New
        'clear-bling': undefined,
        'firebolt-power': undefined,
        dashboard1: undefined,
        dashboard2: undefined,
        dashboard3: undefined,
        barrier: undefined,
    },
    setMuted: function(isMuted) {
        this.muted = isMuted
        // Mute or unmute sounds on the game level
        Properties.scene.game.sound.mute = isMuted
    },
    // currentMain: undefined,
    // setMain: function(key) {
    //     let nextMain = `main-${key}`

    //     if (this.currentMain === nextMain) {
    //         return
    //     } else if (!this.currentMain) {
    //         this.currentMain = nextMain
    //         this.base[nextMain].play()
    //     } else {
    //         let current = this.base[this.currentMain]
    //         current.once('looped', () => {
    //             current.stop()
    //             this.currentMain = nextMain
    //             this.base[nextMain].play()
    //         })
    //     }
    // },
    // unsetMain: function() {
    //     this.currentMain = undefined
    // },
    play: function(key, force = false) {
        if (force || !this.base[key].isPlaying) {
            this.base[key].play()
        }
    },
    resume: function(key) {
        if (!this.base[key].isPlaying) {
            if (this.base[key].isPaused) {
                this.base[key].resume()
            } else {
                this.base[key].play()
            }
        }
    },
    pause: function(key) {
        if (this.base[key].isPlaying) {
            this.base[key].pause()
        }
    },
    stop: function(key) {
        if (this.base[key].isPlaying) {
            this.base[key].stop()
            // Unset current main if it is being stopped
            // if (this.currentMain === key) { this.unsetMain() }
        }
    },
    destroy: function(key) {
        if (this.base[key] && this.base[key].manager) {
            this.base[key].destroy()
        }
    },
    fadeInBackground: function(duration = 500) {
        this.fadeIn('background', 0.6, duration)
    },
    fadeOutBackground: function() {
        this.fadeOut('background', 500)
    },
    fadeIn: function(key, volume, duration = 1000, onComplete = null) {
        if (!this.base[key].isPlaying) {
            if (key in fadeOutTweens) {
                fadeOutTweens[key].stop()
                delete fadeOutTweens[key]
            }
            this.base[key].setVolume(0)
            this.base[key].play()
            fadeInTweens[key] = Properties.scene.tweens.add({
                targets: this.base[key],
                volume: volume,
                duration: duration,
                onComplete: () => {
                    if (onComplete) { onComplete() }
                    delete fadeInTweens[key]
                }
            })
        }
    },
    fadeOut: function(key, duration = 1000, onComplete = null) {
        if (this.base[key].isPlaying && !(key in fadeOutTweens)) {
            if (key in fadeInTweens) {
                fadeInTweens[key].stop()
                delete fadeInTweens[key]
            }
            fadeOutTweens[key] = Properties.scene.tweens.add({
                targets: this.base[key],
                volume: 0,
                duration: duration,
                onComplete: () => {
                    this.base[key].stop()
                    if (onComplete) { onComplete() }
                    delete fadeOutTweens[key]
                }
            })
        }
    },
    stopSounds: function() {
        const longSounds = [
            'run', 'push', 'slide',
            'snakes', 'motorboat', 'flamethrower',
            'fireworks', 'ovation', 'tsunami', 'background',
        ]
        for (const key of longSounds) {
            if (this.base[key]) {
                this.stop(key)
            }
        }
    }
}
