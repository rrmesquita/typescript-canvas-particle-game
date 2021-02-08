import gsap from 'gsap'

import Player from "./Models/Player"
import Projectile from "./Models/Projectile"
import Enemy from "./Models/Enemy"
import Particle from "./Models/Particle"

import GameUI from "./GameUI"
import GameState from "./GameState"

import { getRandomInt } from './Utils'

export default class Main {
    gameUi: GameUI

    context!: CanvasRenderingContext2D
    animationFrame!: number

    enemySpawnInterval?: NodeJS.Timeout

    player!: Player

    readonly VIEWPORT_CENTER_X = Math.floor(innerWidth / 2);
    readonly VIEWPORT_CENTER_Y = Math.floor(innerHeight / 2);

    constructor(gameUi: GameUI) {
        this.gameUi = gameUi
        this.context = this.gameUi.canvas.getContext('2d') as CanvasRenderingContext2D
    }

    main() {
        this.gameUi.canvas.width = window.innerWidth
        this.gameUi.canvas.height = window.innerHeight

        this.animate()

        this.gameUi.root.addEventListener('click', (event) => {
            if (GameState.status === 'started') {
                const angle = Math.atan2(
                    event.clientY - this.VIEWPORT_CENTER_Y,
                    event.clientX - this.VIEWPORT_CENTER_X
                )

                new Projectile(
                    this.context,
                    this.VIEWPORT_CENTER_X,
                    this.VIEWPORT_CENTER_Y,
                    5,
                    "white",
                    {
                        x: Math.cos(angle),
                        y: Math.sin(angle),
                    }
                )
            }
        })

        this.gameUi.modalStartButton.addEventListener('click', () => {
            this.startGame()
        })
    }

    startGame() {
        this.player = new Player(
            this.context,
            this.VIEWPORT_CENTER_X,
            this.VIEWPORT_CENTER_Y,
            10,
            "white"
        );

        Projectile.instances = []
        Enemy.instances = []
        Particle.instances = []

        this.setScore(0)

        GameState.setDefaultValues()

        this.gameUi.modal.style.display = 'none'

        this.spawnEnemies()

        GameState.status = 'started'
    }

    endGame() {
        if (this.enemySpawnInterval) {
            clearInterval(this.enemySpawnInterval)
        }

        this.gameUi.modal.style.display = 'block'

        GameState.status = 'over'
    }

    animate() {
        this.animationFrame = requestAnimationFrame(this.animate.bind(this));
        this.context.fillStyle = 'black'
        this.context.fillRect(0, 0, this.gameUi.canvas.width, this.gameUi.canvas.height)

        if (GameState.status === 'started') {
            this.player.draw()

            for (const projectile of Projectile.instances) {
                const isOutOfCanvasBounds = projectile.xPos + projectile.radius < 0
                    || projectile.yPos + projectile.radius < 0
                    || projectile.xPos - projectile.radius > this.gameUi.canvas.width
                    || projectile.yPos - projectile.radius > this.gameUi.canvas.height

                if (isOutOfCanvasBounds) {
                    setTimeout(() => {
                        projectile.destroy()
                    }, 0)
                } else {
                    projectile.update()
                }
            }

            for (const enemy of Enemy.instances) {
                enemy.update()

                if (enemy.isCollidingWith(this.player)) {
                    this.endGame()
                }

                for (const projectile of Projectile.instances) {
                    if (enemy.isCollidingWith(projectile)) {
                        setTimeout(() => {
                            for (let i = 0; i < enemy.radius; i++) {
                                new Particle(
                                    this.context,
                                    projectile.xPos,
                                    projectile.yPos,
                                    getRandomInt(1, 4),
                                    enemy.color,
                                    {
                                        x: Math.random() - 0.5,
                                        y: Math.random() - 0.5,
                                    }
                                )
                            }

                            if (enemy.radius - 10 < 10) {
                                this.setScore(GameState.score + 250)
                                enemy.destroy()
                            } else {
                                this.setScore(GameState.score + 100)
                                gsap.to(enemy, {
                                    radius: enemy.radius - 10
                                })
                            }

                            projectile.destroy()
                        }, 0)
                    }
                }
            }

            for (const particle of Particle.instances) {
                if(particle.alpha <= 0) {
                    particle.destroy()
                } else {
                    particle.update()
                }
            }

            if (GameState.score >= 2000) {
                GameState.projectileAccel = 8
                GameState.enemyAccel = 1.5
            }
        }
    }

    spawnEnemies() {
        this.enemySpawnInterval = setInterval(() => {
            const radius = getRandomInt(10, 30)
            let xPos
            let yPos

            if (Math.random() < 0.5) {
                xPos = Math.random() < 0.5 ? 0 - radius : this.gameUi.canvas.width + radius
                yPos = Math.random() * this.gameUi.canvas.height
            } else {
                xPos = Math.random() * this.gameUi.canvas.width
                yPos = Math.random() < 0.5 ? 0 - radius : this.gameUi.canvas.height + radius
            }

            const angle = Math.atan2(
                this.VIEWPORT_CENTER_Y - yPos,
                this.VIEWPORT_CENTER_X - xPos
            )

            new Enemy(
                this.context,
                xPos,
                yPos,
                radius,
                `hsl(${Math.random() * 360}, 50%, 50%)`,
                {
                    x: Math.cos(angle),
                    y: Math.sin(angle),
                }
            )
        }, 1000)
    }

    setScore (value: number) {
        GameState.score = value

        this.gameUi.scoreCounter.innerText = String(value)
        this.gameUi.modalScoreCounter.innerText = String(value)
    }
}