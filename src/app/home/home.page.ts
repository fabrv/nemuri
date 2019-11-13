import { Component, ElementRef, ViewChild } from '@angular/core';
import { ScreenOrientation } from '@ionic-native/screen-orientation/ngx';

import { TaskTimer, Task } from 'tasktimer'

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  @ViewChild('map', {static: false}) map: ElementRef
  chunks: Array<{chunk: Array<Array<any>>, position: {x: number, y: number}}> = []
  playerPos: {x: number, y: number} = {x: 0, y: 0}
  seed:number = 34
  dimension: number = 35
  gameState: boolean = false
  showHud: number = 0
  gameCreated: boolean = false

  mainMenu: boolean = true
  dead: boolean = false
  pauseMenu: boolean = false
  storeMenu: boolean = false

  money: number = 5
  trees: number = 0

  frameSpeed: number = 30

  playerAreaDimension: number = 128

  componentsToDraw: Array<any> = []

  backgroundMusic: any

  collectSound: any
  damageSound: any
  enemyDamageSound: any
  witchSkullSound: any

  drawLoopInterval: any

  lifes = 4

  sound = function (src: string, volume: number = 1) {
    this.sound = document.createElement("audio")
    this.sound.src = src
    this.sound.volume = volume
    this.sound.setAttribute("preload", "auto")
    this.sound.setAttribute("controls", "none")
    this.sound.style.display = "none"
    document.body.appendChild(this.sound)
    this.play = function(){
      this.sound.play()
    }
    this.stop = function(){
      this.sound.pause()
    }
  }

  component = function (x: number, 
                        y: number,
                        spriteX: number,
                        spriteY: number,                        
                        width: number,
                        height: number,
                        context: CanvasRenderingContext2D) {

    this.sX = spriteX
    this.sY = spriteY
    this.width = width
    this.height = height
    this.src = '../../assets/chars_tileset.png'
    this.life = 3
    
    this.context = context

    this.location = {x: x, y: y}
    this.position = {x: 0, y: y}
    this.image
    this.init = () => {
      this.image = new Image()
      this.image.src = this.src

      this.image.onload = () => {
        this.context.drawImage(
          this.image, 
          this.sX, 
          this.sY, 
          this.width, 
          this.height, 
          this.location.x,
          this.location.y, 
          this.width, 
          this.height
        )
      }
    }

    this.reDraw = () => {
      this.context.drawImage(
        this.image, 
        this.sX, 
        this.sY, 
        this.width, 
        this.height, 
        this.location.x,
        this.location.y, 
        this.width, 
        this.height
      )
    }
  }

  drawLoop () {
    this.backgroundMusic.play()
    const pCanvas: any = document.getElementById('components')
    const pContext: CanvasRenderingContext2D = pCanvas.getContext('2d')

    const draw = () => {
      pContext.clearRect(0, 0, pCanvas.width, pCanvas.height)

      for (let chunk in this.chunks) {
        const currentChunk = this.chunks[chunk]
        const mCanvas: any = document.getElementById(`enemies${currentChunk.position.x}${currentChunk.position.y}`)
        const mContext: CanvasRenderingContext2D = mCanvas.getContext('2d')
        mContext.clearRect(0, 0, mCanvas.width, mCanvas.height)
      }

      for (let components in this.componentsToDraw) {
        this.componentsToDraw[components].reDraw()
      }
      //window.requestAnimationFrame(draw)
    }

    this.drawLoopInterval = setInterval(draw, this.frameSpeed)
    this.gameState = true
    //window.requestAnimationFrame(draw)
  }

  fly = false

  timer = new TaskTimer(200)

  constructor(private screenOrientation: ScreenOrientation) {
    this.createChunks()

    if (localStorage.lastGame) {
      this.gameCreated = true
    }
    
    window.addEventListener('keydown', (event)=> {
      switch (event.keyCode) {
        case 87:
          this.move(0, 1)
        break
        case 65:
          this.move(-1, 0)
        break
        case 83:
          this.move(0, -1)
        break
        case 68:
          this.move(1, 0)
        break  
        case 32:
          this.showHud = 0
        break
        case 39:
          this.throwDagger(1,0)
        break
        case 38:
          this.throwDagger(0,-1)
        break
        case 40:
          this.throwDagger(0,1)
        break
        case 37:
          this.throwDagger(-1,0)
          break
        case 27:
          this.pauseMenu = !this.pauseMenu
          this.pauseResume()
        break
      }
      //console.log(event.keyCode)
    })
  }

  createGame () {
    this.seed = Math.floor(Math.random() * 10000)
    this.createChunks()

    setTimeout(() => {
      this.drawMap()
      this.drawHud()
      this.drawLoop()
      this.drawEnemies()

      this.mainMenu = false

      this.saveGame()
    }, 100)
  }

  loadGame () {
    const seed = parseInt(localStorage.getItem('lastGame'))
    const game = JSON.parse(localStorage.getItem(`${seed}`))
    this.seed = seed
    this.componentsToDraw[0].life = game.life
    this.lifes = game.life
    this.money = game.money
    this.trees = game.trees

    this.createChunks()

    setTimeout(() => {
      this.drawMap()
      this.drawHud()
      this.drawLoop()
      this.drawEnemies()

      this.mainMenu = false
    }, 10)    
  }

  createChunks () {
    let savedChunks: any
    if (localStorage.getItem(`${this.seed}`)) {
      savedChunks = JSON.parse(localStorage.getItem(`${this.seed}`)).savedChunks
    }
    let row = -1
    for (let i = 0; i < 9; i++) {
      if (i % 3 == 0) {
        row += 1
      }
      const rateX = Math.abs((i % 3) - 1)
      const rateY = Math.abs(row - 1)
      
      let newChunk: any

      let calcChunk = true

      if (localStorage.getItem(`${this.seed}`)) {
        if (savedChunks[`${((i % 3) - 1) * (this.dimension * 50)}-${(row - 1) * (this.dimension * 50)}`]) {
          newChunk = savedChunks[`${((i % 3) - 1) * (this.dimension * 50)}-${(row - 1) * (this.dimension * 50)}`]
          calcChunk = false
        }
      }
      if (calcChunk) {
        newChunk = {
          chunk: this.hashFunction(this.mod((i % 3) - 1, 255), this.mod(row - 1, 255), this.seed, this.mapRate(rateX, rateY)), 
          position: {
            x: ((i % 3) - 1) * (this.dimension * 50), 
            y: (row - 1) * (this.dimension * 50)
          }
        }
      }
      this.chunks[i] = newChunk
    }
  }

  ngAfterViewInit() {
    this.drawMap()
    this.drawMainCharacter()
    
    const bgMusic = [
      '/assets/music/02store2.wav',
      '/assets/music/02store1.wav',
      '/assets/music/01town0.wav',
      '/assets/music/01town1.wav',
      '/assets/music/01town1.wav',
      '/assets/music/04forest1.wav',
      '/assets/music/04forest3.wav',
      '/assets/music/08travel1.wav'
    ]

    this.backgroundMusic = new this.sound('/assets/music/02store2.wav', 0.5)
    this.backgroundMusic.currentSong = 0
    this.backgroundMusic.play = () => {
      this.backgroundMusic.sound.play()

      this.backgroundMusic.sound.onended = () => {
        this.backgroundMusic.currentSong = (this.backgroundMusic.currentSong + 1) % bgMusic.length
        this.backgroundMusic.sound.src = bgMusic[this.backgroundMusic.currentSong]
        this.backgroundMusic.sound.play()
      }
    }

    this.collectSound = new this.sound('/assets/music/Fruit collect 1.wav')
    this.damageSound = new this.sound('/assets/music/Hit damage 1.wav')
    this.enemyDamageSound = new this.sound('/assets/music/Boss hit 1.wav')
    this.witchSkullSound = new this.sound('/assets/music/Balloon Pop 1.wav')

    this.backgroundMusic.play()

    this.screenOrientation.lock(this.screenOrientation.ORIENTATIONS.LANDSCAPE)
  }

  throwDagger (x: number, y: number) {
    x = x * 8
    y = y * 8

    const canvas: any = document.getElementById('components')
    const context: CanvasRenderingContext2D = canvas.getContext('2d')

    let multiplier = 1
    if (x < 0 || y < 0) {
      multiplier = -1
    }
    const angle = ((Math.acos(x/Math.sqrt(x*x + y*y)) * multiplier) / Math.PI) * 2 + 2
    const swordCanPos = [3, 0, 1, 2]
    const swordPhase = [-10, -7, 0, -7]
    const dagger = new this.component(this.playerAreaDimension / 2 + swordPhase[angle], this.playerAreaDimension / 2 - 7, 288 + (swordCanPos[angle] * 16), 5, 16, 16, context)
    dagger.init()
    dagger.move = () => {
      let frame = 0
      let dx = x
      let dy = y
      let intervalID
      let daggerDistance = [0,0]
      const changeLocation = () => {
        const chunkPos = {
          x: Math.floor((this.playerPos.x + (this.dimension * 25))/(this.dimension * 50)), 
          y: (Math.floor((this.playerPos.y + (this.dimension * 25))/(this.dimension * 50))) * -1
        }
        const blockPos = {
          x: this.mod((this.playerPos.x) / 50 + (Math.floor(this.dimension / 2)), this.dimension), 
          y: (this.dimension - 1) - this.mod((this.playerPos.y) / 50 + (Math.floor(this.dimension / 2)), this.dimension) 
        }

        try {
          const currentChunk = this.chunks.find(chunk => chunk.position.x / (this.dimension * 50) == chunkPos.x && chunk.position.y / (this.dimension * 50) == chunkPos.y)
          daggerDistance = [daggerDistance[0] + dy, daggerDistance[1] + dx]
          const daggerBlock = [Math.floor(daggerDistance[0] / 16), Math.floor(daggerDistance[1] / 16)]
          const currentBlock = currentChunk.chunk[blockPos.y + daggerBlock[0]][blockPos.x + daggerBlock[1]]

          const collisionElems = [14, 16]
          if (collisionElems.includes(currentBlock)) {
            this.enemyDamageSound.play()
            // DAGGER COLLISION
            switch (currentBlock){
              case 14:
                const randCoin = Math.random()
                if (randCoin < 0.2) {
                  this.coinDrop((blockPos.x + daggerBlock[1]) * 16, (blockPos.y + daggerBlock[0]) * 16, 1)
                } else if (randCoin > 0.9) {
                  this.coinDrop((blockPos.x + daggerBlock[1]) * 16, (blockPos.y + daggerBlock[0]) * 16, 2)
                } else if (randCoin > 0.2 && randCoin < 0.3) {
                  this.coinDrop((blockPos.x + daggerBlock[1]) * 16, (blockPos.y + daggerBlock[0]) * 16, 1, 8)
                }
                currentChunk.chunk[blockPos.y + daggerBlock[0]][blockPos.x + daggerBlock[1]] = 15
                this.drawChunk(`canvas${currentChunk.position.x}${currentChunk.position.y}`, currentChunk.chunk)

                this.saveGame(currentChunk)
              break
              case 16:
                const enemy = this.componentsToDraw.find((element) => {
                  return element.position.x == blockPos.x + daggerBlock[1] && element.position.y == blockPos.y + daggerBlock[0]
                })
                enemy.location.x += x * 1.5
                enemy.location.y += y * 1.5
                enemy.life -= 1
                if (enemy.life == 0) {
                  currentChunk.chunk[blockPos.y + daggerBlock[0]][blockPos.x + daggerBlock[1]] = 1
                  this.componentsToDraw.splice(this.componentsToDraw.indexOf(enemy), 1)
                  clearInterval(enemy.interval)

                  this.coinDrop((blockPos.x + daggerBlock[1]) * 16, (blockPos.y + daggerBlock[0]) * 16, enemy.money)
                }
              break
            }

            frame = 8
          } 
        } catch (error) {
          frame = 8
        }

        dagger.location.x += dx
        dagger.location.y += dy

        frame += 1
        if (frame > 5) {
          clearInterval(intervalID)
          this.componentsToDraw.splice(this.componentsToDraw.indexOf(dagger), 1)
        }
      }      
      
      intervalID = setInterval(changeLocation, this.frameSpeed);
    }
    dagger.move()
    this.componentsToDraw.push(dagger)
  }

  //draw

  drawMainCharacter () {
    const canvas: any = document.getElementById('components')
    const context: CanvasRenderingContext2D = canvas.getContext('2d')

    const character = new this.component(this.playerAreaDimension / 2 - 6, this.playerAreaDimension / 2 - 20, 128, 41, 16, 24, context)
    character.life = 4
    character.init()

    const standCycle = [0, 1]
    const flyCycle = [5, 6]
    let currentSprite = 0

    character.move = () => {
      let frame = 0
      const changeFrame = () => {
        frame = (frame + 1) % 9
        if (frame == 0) {
          if (this.fly) {
            character.sX = 128 + (16 * flyCycle[currentSprite])  
          } else {
            character.sX = 128 + (16 * standCycle[currentSprite])
          }
          currentSprite = (currentSprite + 1) % standCycle.length
        }
      }

      setInterval(changeFrame, this.frameSpeed)
    }
    character.move()

    this.componentsToDraw.push(character)
  }

  drawHud () {
    const canvas: any = document.getElementById('components')
    const context: CanvasRenderingContext2D = canvas.getContext('2d')
    const hearts = [
      new this.component(this.playerAreaDimension / 2 - 13, this.playerAreaDimension / 2 - 35, 288, 256, 16, 16, context), 
      new this.component(this.playerAreaDimension / 2 + 3, this.playerAreaDimension / 2 - 35, 288, 256, 16, 16, context)
    ]
    hearts[0].min = 1
    hearts[0].max = 2
    hearts[1].min = 3
    hearts[1].max = 4

    for (let i = 0; i < hearts.length; i++) {
      hearts[i].reDraw = () => {
        if (this.showHud < 150) {
          if (this.componentsToDraw[0].life < hearts[i].min) {
            hearts[i].sX = 288 + 16 * 2
          } else if (this.componentsToDraw[0].life == hearts[i].min) {
            hearts[i].sX = 288 + 16
          } else if (this.componentsToDraw[0].life >= hearts[i].min) {
            hearts[i].sX = 288
          }

          hearts[i].context.drawImage(
            hearts[i].image, 
            hearts[i].sX, 
            hearts[i].sY, 
            hearts[i].width, 
            hearts[i].height, 
            hearts[i].location.x,
            hearts[i].location.y, 
            hearts[i].width, 
            hearts[i].height
          )
          this.showHud ++
        }
      }

      hearts[i].init()
      this.componentsToDraw.push(hearts[i])
    }

    const coin = new this.component(this.playerAreaDimension / 2 - 10, this.playerAreaDimension / 2 + 5, 288, 272, 8, 8, context)
    coin.frame = 0
    coin.animFrame = 0
    coin.reDraw = () => {
      if (this.showHud < 150) {
        this.fly = true
        if (coin.frame == 0) {
          coin.sX = 288 + coin.animFrame * 8
          coin.animFrame = (coin.animFrame + 1) % 4
        }
        coin.frame = (coin.frame + 1) % 6

        coin.context.drawImage(
          coin.image, 
          coin.sX, 
          coin.sY, 
          coin.width, 
          coin.height, 
          coin.location.x,
          coin.location.y, 
          coin.width, 
          coin.height
        )
        coin.context.font = 'bold 8px Consolas'
        coin.context.fillText(this.money, this.playerAreaDimension / 2, this.playerAreaDimension / 2 + 12)
      } else {
        this.fly = false
      }
    }
    coin.init()
    this.componentsToDraw.push(coin)


    const tree = new this.component(this.playerAreaDimension / 2 - 10, this.playerAreaDimension / 2 + 15, 288, 272 + 8, 8, 8, context)
    tree.frame = 0
    tree.animFrame = 0
    tree.reDraw = () => {
      if (this.showHud < 150) {
        this.fly = true
        if (tree.frame == 0) {
          tree.sX = 288 + tree.animFrame * 8
          tree.animFrame = (tree.animFrame + 1) % 4
        }
        tree.frame = (tree.frame + 1) % 6

        tree.context.drawImage(
          tree.image, 
          tree.sX, 
          tree.sY, 
          tree.width, 
          tree.height, 
          tree.location.x,
          tree.location.y, 
          tree.width, 
          tree.height
        )
        tree.context.font = 'bold 8px Consolas'
        tree.context.fillText(this.trees, this.playerAreaDimension / 2, this.playerAreaDimension / 2 + 22)
      } else {
        this.fly = false
      }
    }
    tree.init()
    this.componentsToDraw.push(tree)
  }

  drawMap () {
    this.drawStore()
    for (let chunk in this.chunks) {
      this.drawChunk(`canvas${this.chunks[chunk].position.x}${this.chunks[chunk].position.y}`, this.chunks[chunk].chunk)
    }    
  }

  drawStore () {
    let n = 0
    for (let i = 0; i < 16; i++) {
      this.chunks[4].chunk[6 + n][6 + (i % 4)] = 18 + i
      if (i % 4 == 3) {
        n ++
      }
    }
    this.chunks[4].chunk[10][6] = 1
    this.chunks[4].chunk[10][7] = 1
    this.chunks[4].chunk[10][8] = 35
    this.chunks[4].chunk[10][9] = 1
  }

  drawEnemies (wavesize: number = 10) {
    const chunkPos = {
      x: Math.floor((this.playerPos.x + (this.dimension * 25))/(this.dimension * 50)), 
      y: (Math.floor((this.playerPos.y + (this.dimension * 25))/(this.dimension * 50))) * -1
    }
    const currentChunk = this.chunks.find(chunk => chunk.position.x / (this.dimension * 50) == chunkPos.x && chunk.position.y / (this.dimension * 50) == chunkPos.y)

    const canvas: any = document.getElementById(`enemies${currentChunk.position.x}${currentChunk.position.y}`)
    const context: CanvasRenderingContext2D = canvas.getContext('2d')

    for (let e = 0; e < wavesize; e++) {
      let position = {x: Math.floor(Math.random() * this.dimension), y: Math.floor(Math.random() * this.dimension)}
      while(currentChunk.chunk[position.y][position.x] != 1 && currentChunk.chunk[position.y][position.x] != 15) {
        position.x = (position.x + 1) % this.dimension
      }
      //console.log(currentChunk.chunk[position.y][position.x])
      
      const enemy = new this.component(position.x * 16, position.y * 16, 368, 20, 16, 16, context)
      
      currentChunk.chunk[position.y][position.x] = 16
      enemy.init()
      enemy.position = {x: position.x, y: position.y}
      enemy.animCycle = [1, 2, 3]
      enemy.type = 'fast'
      enemy.money = 3

      if (Math.random() < 0.3) {
        enemy.sX = 368
        enemy.sY = 271
        enemy.animCycle = [0, 1]
        enemy.type = 'witch'
        enemy.life = 2
        enemy.money = 5
        enemy.skullFrame = 0
      }
      
      enemy.move = () => {
        // enemy.animCycle = [3, 4, 5, 6, 7]
        // enemy.enemy.animCycle = [1, 2, 3]
        let currentSprite = Math.floor(Math.random() * enemy.animCycle.length)
        let frame = 0
        let newSquareReached = true
        let collisionCount = 1
        const changeFrame = () => {
          if (this.gameState) {
            const pBlockPos = {
              x: this.mod((this.playerPos.x) / 50 + (Math.floor(this.dimension / 2)), this.dimension), 
              y: (this.dimension - 1) - this.mod((this.playerPos.y) / 50 + (Math.floor(this.dimension / 2)), this.dimension) 
            }

            //console.log(pBlockPos)
            const distance = this.distance(enemy.position.x, pBlockPos.x, enemy.position.y, pBlockPos.y)
            if (distance < 6) {
              switch (enemy.type) {
                case 'fast':
                  enemy.animCycle = [3, 4, 5, 6, 7]
                  break
                case 'witch':
                  enemy.animCycle = [0, 1, 2, 3]
                  if (enemy.skullFrame == 0 && distance < 4) {
                    this.throwSkull(enemy.location.x, enemy.location.y)
                  }
                  enemy.skullFrame = (enemy.skullFrame + 1) % 55
                  break
              }

              let minBlock: {x: number, y: number}
              let minDistance = 100
              const blocks = [
                {x: 1, y: 0},
                {x: -1, y: 0},
                {x: 0, y: 1},
                {x: 0, y: -1},
                {x: 0, y: 0}
              ]
              for (let block in blocks) {
                const adder = blocks[block]
                try {
                  if ((currentChunk.chunk[enemy.position.y + adder.y][enemy.position.x + adder.x] == 1 || currentChunk.chunk[enemy.position.y + adder.y][enemy.position.x + adder.x] == 15) && (this.distance(enemy.position.x + adder.x, pBlockPos.x, enemy.position.y + adder.y, pBlockPos.y) < minDistance)) {
                    if (enemy.type == 'witch') {
                      minDistance = this.distance(enemy.position.x + adder.x, pBlockPos.x - 2, enemy.position.y + adder.y, pBlockPos.y - 2)
                    } else {
                      minDistance = this.distance(enemy.position.x + adder.x, pBlockPos.x, enemy.position.y + adder.y, pBlockPos.y)
                    }
                    minBlock = {x: enemy.position.x + adder.x, y: enemy.position.y + adder.y}
                  }
                } catch (error) {}
              }

              if (newSquareReached) {
                const blockPos = {
                  x: this.mod(this.playerPos.x / 50 + (Math.floor(this.dimension / 2)), this.dimension), 
                  y: (this.dimension - 1) - this.mod((this.playerPos.y) / 50 + (Math.floor(this.dimension / 2)), this.dimension) 
                }
                
                if (blockPos.x == minBlock.x && blockPos.y == minBlock.y) {
                  // DAMAGE TO PLAYER
                  if (collisionCount == 0) {
                    this.damageSound.play()
                    this.componentsToDraw[0].life -= 1
                    this.lifes = this.componentsToDraw[0].life
                    this.showHud = 0
                  }
                  collisionCount = (collisionCount + 1) % 2
                }
                if (currentChunk.chunk[enemy.position.y][enemy.position.x] != 17) {
                  currentChunk.chunk[enemy.position.y][enemy.position.x] = 1
                }

                enemy.position.x = minBlock.x
                enemy.position.y = minBlock.y

                currentChunk.chunk[enemy.position.y][enemy.position.x] = 16

                newSquareReached = false

                if (this.componentsToDraw[0].life <= 0) {
                  currentChunk.chunk[blockPos.y][blockPos.x] = 17
                  this.drawChunk(`canvas${currentChunk.position.x}${currentChunk.position.y}`, currentChunk.chunk)
                  newSquareReached = true
                  this.money = Math.ceil(this.money / 2)
                  this.respawn()
                }
              } else {
                const diff = {
                  x: (enemy.location.x - (enemy.position.x * 16)) / 16,
                  y: (enemy.location.y - (enemy.position.y * 16)) / 16
                }

                enemy.location.x -= Math.sign(diff.x) * (diff.x / diff.x || 1)
                enemy.location.y -= Math.sign(diff.y) * (diff.y / diff.y || 1)

                if ((enemy.location.x == enemy.position.x * 16) && (enemy.location.y == enemy.position.y * 16)) {
                  enemy.location.x = enemy.position.x * 16
                  enemy.location.y = enemy.position.y * 16
                  newSquareReached = true
                }
              }
            } else {
              enemy.animCycle = [1, 2, 3]
            }

            frame = (frame + 1) % 9
            if (frame === 0) {
              enemy.sX = 368 + (16 * enemy.animCycle[currentSprite])
              currentSprite = (currentSprite + 1) % enemy.animCycle.length
            }
          }
        }

        enemy.interval = setInterval(changeFrame, 1000/60)
      }
      enemy.move()

      this.componentsToDraw.push(enemy)
    }
  }

  throwSkull (x: number, y: number) {
    const chunkPos = {
      x: Math.floor((this.playerPos.x + (this.dimension * 25))/(this.dimension * 50)), 
      y: (Math.floor((this.playerPos.y + (this.dimension * 25))/(this.dimension * 50))) * -1
    }
    const pBlockPos = {
      x: this.mod((this.playerPos.x) / 50 + (Math.floor(this.dimension / 2)), this.dimension), 
      y: (this.dimension - 1) - this.mod((this.playerPos.y) / 50 + (Math.floor(this.dimension / 2)), this.dimension) 
    }
    const currentChunk = this.chunks.find(chunk => chunk.position.x / (this.dimension * 50) == chunkPos.x && chunk.position.y / (this.dimension * 50) == chunkPos.y)
    
    const canvas: any = document.getElementById(`enemies${currentChunk.position.x}${currentChunk.position.y}`)
    const context: CanvasRenderingContext2D = canvas.getContext('2d')

    const skull = new this.component(x + 6, y + 6, 229, 231, 6, 6, context)
    skull.dist = 0
    skull.init()
    const throwVector = {x: pBlockPos.x - (x / 16), y: pBlockPos.y - (y / 16)}

    skull.reDraw = () => {
      if (skull.dist < 64) {
        skull.location.x += throwVector.x
        skull.location.y += throwVector.y

        skull.dist += Math.sqrt(Math.pow(throwVector.x, 2) + Math.pow(throwVector.y, 2))

        // SKULL COLLISSION
        const playerPos = {
          x: (this.mod((this.playerPos.x) / 50 + (Math.floor(this.dimension / 2)), this.dimension)) * 16 + 6, 
          y: ((this.dimension - 1) - this.mod((this.playerPos.y) / 50 + (Math.floor(this.dimension / 2)), this.dimension)) * 16 + 6 
        }
        const vector = {x: playerPos.x - skull.location.x, y: playerPos.y - skull.location.y}
        const collissionDistance = Math.sqrt(Math.pow(vector.x, 2) + Math.pow(vector.y, 2))
        
        if (collissionDistance < 16) {
          this.damageSound.play()
          this.componentsToDraw.splice(this.componentsToDraw.indexOf(skull), 1)
          this.componentsToDraw[0].life -= 1
          this.lifes = this.componentsToDraw[0].life
          this.showHud = 0
        }
        
        skull.context.drawImage(
          skull.image, 
          skull.sX, 
          skull.sY, 
          skull.width, 
          skull.height, 
          skull.location.x,
          skull.location.y, 
          skull.width, 
          skull.height
        )
      } else {
        this.componentsToDraw.splice(this.componentsToDraw.indexOf(skull), 1)
      }
    }

    this.componentsToDraw.push(skull)
  }

  drawChunk(canvasId: string, map: any) {
    const mapSprite = new Image()
    const canvas: any = document.getElementById(canvasId)
    const context = canvas.getContext('2d')
    const tileSize = 16

    const dict = [
      {x: 1, y: 5},
      {x: 0, y: 0},
      {x: 0, y: 4},{x: 1, y: 4},{x: 2, y: 4},
      {x: 0, y: 5}             ,{x: 2, y: 5},
      {x: 0, y: 6},{x: 1, y: 6},{x: 2, y: 6},
      {x: 0, y: 7},{x: 1, y: 7},
      {x: 0, y: 8},{x: 1, y: 8},
      {x: 11, y: 7},{x: 11, y: 9},
      {x: 0, y: 0},
      {x: 6, y: 16},
      {x: 0, y: 12},{x: 1, y: 12},{x: 2, y: 12},{x: 3, y: 12},
      {x: 0, y: 13},{x: 1, y: 13},{x: 2, y: 13},{x: 3, y: 13},
      {x: 0, y: 14},{x: 1, y: 14},{x: 2, y: 14},{x: 3, y: 14},
      {x: 0, y: 15},{x: 1, y: 15},{x: 2, y: 15},{x: 3, y: 15},
                                 ,{x: 4, y: 3}
    ]

    mapSprite.src = `../../assets/overworld_tileset_grass.png`

    mapSprite.onload = () => {
      for (let r = 0; r < map.length; r++) {
        for (let c = 0; c < map[r].length; c++) {
          context.drawImage(
            mapSprite, 
            dict[map[r][c]].x * tileSize, 
            dict[map[r][c]].y * tileSize, 
            tileSize, 
            tileSize, 
            c * tileSize,
            r * tileSize, 
            tileSize, 
            tileSize
          )
        }
      }
    }
  }

  coinDrop(x: number, y: number, q: number, treeMod: number = 0) {
    this.collectSound.play()

    if (treeMod > 0) {
      this.trees += 1
    } else {
      this.money += q
    }
    const chunkPos = {
      x: Math.floor((this.playerPos.x + (this.dimension * 25))/(this.dimension * 50)), 
      y: (Math.floor((this.playerPos.y + (this.dimension * 25))/(this.dimension * 50))) * -1
    }
    const currentChunk = this.chunks.find(chunk => chunk.position.x / (this.dimension * 50) == chunkPos.x && chunk.position.y / (this.dimension * 50) == chunkPos.y)

    const canvas: any = document.getElementById(`enemies${currentChunk.position.x}${currentChunk.position.y}`)
    const context: CanvasRenderingContext2D = canvas.getContext('2d')

    
    const coin = new this.component(x + 4, y + 4, 288, 272 + treeMod, 8, 8, context)
    coin.frame = 0
    coin.animFrame = 0
    coin.flyFrame = 0
    coin.reDraw = () => {
      if (coin.flyFrame < 50) {
        if (coin.frame == 0) {
          coin.sX = 288 + coin.animFrame * 8
          coin.animFrame = (coin.animFrame + 1) % 4
        }
        coin.location.y -= coin.frame
        coin.flyFrame ++
        coin.frame = (coin.frame + 1) % 6

        coin.context.drawImage(
          coin.image, 
          coin.sX, 
          coin.sY, 
          coin.width, 
          coin.height, 
          coin.location.x,
          coin.location.y, 
          coin.width, 
          coin.height
        )
        coin.context.font = 'bold 8px Consolas'
        coin.context.fillText(`+${q}`, coin.location.x + 12, coin.location.y + 10)

        if (coin.flyFrame >= 49) {
          this.componentsToDraw.splice(this.componentsToDraw.indexOf(coin), 1)
        }
      }
    }
    coin.init()
    this.componentsToDraw.push(coin)
  }

  hashFunction(x: number, y: number, seed: number, biome: number): Array<Array<number>> {
    const chunkSeed = parseInt(seed + '' + x + '' + y)
    let chunk = []
    for (let i = 0; i < this.dimension; i++) {
      let row = []
      for (let o = 0; o < this.dimension; o++) {
        row.push(+ (this.random(parseInt(chunkSeed + '' + i + '' + o)) > biome))
      }
      chunk.push(row)
    }

    chunk = this.treeChunk(this.sandChunk(this.softenChunk(chunk)))
    return chunk
  }

  softenChunk (chunk: Array<Array<number>>): Array<Array<number>> {
    for (let i = 0; i < this.dimension; i++) {
      for (let o = 0; o < this.dimension; o++) {
        if (i > 0 && o > 0 && i < this.dimension - 1 && o < this.dimension - 1) {
          let sides = 0
          if (chunk[i][o - 1] == 0) sides += 1
          if (chunk[i][o + 1] == 0) sides += 1
          if (chunk[i - 1][o] == 0) sides += 1
          if (chunk[i + 1][o] == 0) sides += 1

          if (sides >= 3) {
            chunk[i][o] = 0
          }
        }
      }      
    }

    for (let i = 0; i < this.dimension; i++) {
      for (let o = 0; o < this.dimension; o++) {
        try {
          if (chunk[i][o] == 0) {
            if ((chunk[i + 1][o] == 1 && chunk[i - 1][o] == 1) || (chunk[i][o + 1] == 1 && chunk[i][o - 1] == 1)) {
              chunk[i][o + 1] = 0
              chunk[i + 1][o + 1] = 0
              chunk[i + 1][o] = 0

              if (chunk[i + 2][o + 1] == 0) chunk[i + 2][o] = 0
              if (chunk[i + 1][o + 2] == 0) chunk[i + 2][o] = 0
            }
          }
        } catch (error) {}
      }
    }


    return chunk
  }

  sandChunk (chunk: Array<Array<number>>): Array<Array<number>> {
    for (let r = 0; r < chunk.length; r++) {
      for (let c = 0; c < chunk.length; c++) {
        if (chunk[r][c] === 0) {
          try {
            if ((chunk[r - 1][c] === 1 || chunk[r - 1][c] > 14) && (chunk[r][c + 1] === 1 || chunk[r][c + 1] > 14)) {
              chunk[r][c] = 4
            }
            else if ((chunk[r - 1][c] === 1 || chunk[r - 1][c] > 14) && (chunk[r][c - 1] === 1 || chunk[r][c - 1] > 14)) {
              chunk[r][c] = 2
            } else if ((chunk[r + 1][c] === 1 || chunk[r + 1][c] > 14) && (chunk[r][c - 1] === 1 || chunk[r][c - 1] > 14)) {
              chunk[r][c] = 7
            }
            else if ((chunk[r + 1][c] === 1 || chunk[r + 1][c] > 14) && (chunk[r][c + 1] === 1 || chunk[r][c + 1] > 14)) {
              chunk[r][c] = 9
            }
            else if (chunk[r - 1][c] === 1) {
              chunk[r][c] = 3
            }
            else if (chunk[r + 1][c] === 1) {
              chunk[r][c] = 8
            }
            else if (chunk[r][c - 1] === 1) {
              chunk[r][c] = 5
            }
            else if (chunk[r][c + 1] === 1) {
              chunk[r][c] = 6
            }
            else if (chunk[r - 1][c - 1] === 1) {
              chunk[r][c] = 13
            }
            else if (chunk[r - 1][c + 1] === 1) {
              chunk[r][c] = 12
            }
            else if (chunk[r + 1][c - 1] === 1) {
              chunk[r][c] = 11
            }
            else if (chunk[r + 1][c + 1] === 1) {
              chunk[r][c] = 10
            }
          } catch (error) {
            
          }
        }
      }
    }

    return chunk
  }

  treeChunk (chunk: Array<Array<number>>): Array<Array<number>> {
    for (let i = 0; i < this.dimension; i++) {
      for (let o = 0; o < this.dimension; o++) {
        if (i > 0 && o > 0 && i < this.dimension - 1 && o < this.dimension - 1) {
          let row = -1
          let sides = 0

          for (let n = 0; n < 9; n++) {
            if (n % 3 == 0) {
              row += 1
            }
                        
            if (chunk[i + (row - 1)][o + ((n % 3) - 1)] == 1 || chunk[i + (row - 1)][o + ((n % 3) - 1)] == 14) {
              sides += 1
            }

            if (sides > 8 && (i != Math.floor(this.dimension / 2) || o != Math.floor(this.dimension / 2))) {
              chunk[i][o] = 14
            }
          }
        }
      }
    }
    return chunk
  }

  random(seed: number) {
    var x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  }

  mod(n: number, m: number) {
    return ((n % m) + m) % m;
  }

  mapRate(x: number, y: number) {
    return Math.abs(Math.sin(Math.PI * Math.max(x + 0.5, y + 0.5) / 30))
  }

  flyStyle() {
    console.log(this.fly)
    /*if (this.fly) {
      document.getElementById('player').classList.add('fly')
    } else {
      document.getElementById('player').classList.remove('fly')
    }*/
  }

  respawn () {
    this.dead = true
    this.backgroundMusic.sound.src = '/assets/music/13gameover1V1NL.wav'
    this.backgroundMusic.play()
    this.pauseResume()

    this.playerPos.x = 0
    this.playerPos.y = 0
    this.move(0, 0)

    this.componentsToDraw[0].life = 4
    this.lifes = this.componentsToDraw[0].life
  }

  pauseResume () {
    if (this.gameState) {
      clearInterval(this.drawLoopInterval)
      this.gameState = false
    } else {
      this.drawLoop()
    }
  }

  move (x: number, y: number) {
    x = x * 50
    y = y * 50
    
    let savedChunks: any
    if (localStorage.getItem(`${this.seed}`)) {
      savedChunks = JSON.parse(localStorage.getItem(`${this.seed}`)).savedChunks
    }
    
    const chunkPos = {
      x: Math.floor((this.playerPos.x + x + (this.dimension * 25))/(this.dimension * 50)), 
      y: (Math.floor((this.playerPos.y + y + (this.dimension * 25))/(this.dimension * 50))) * -1
    }
    const blockPos = {
      x: this.mod((this.playerPos.x + x) / 50 + (Math.floor(this.dimension / 2)), this.dimension), 
      y: (this.dimension - 1) - this.mod((this.playerPos.y + y) / 50 + (Math.floor(this.dimension / 2)), this.dimension) 
    }

    //Collision
    const currentChunk = this.chunks.find(chunk => chunk.position.x / (this.dimension * 50) == chunkPos.x && chunk.position.y / (this.dimension * 50) == chunkPos.y)
    if (currentChunk.chunk[blockPos.y][blockPos.x] == 1 || currentChunk.chunk[blockPos.y][blockPos.x] == 15  || currentChunk.chunk[blockPos.y][blockPos.x] == 17 || currentChunk.chunk[blockPos.y][blockPos.x] == 35) {
      this.playerPos.x += x
      this.playerPos.y += y
      this.map.nativeElement.style.transform = `translateX(calc(-50% - ${this.playerPos.x}px)) translateY(calc(-50% + ${this.playerPos.y}px))`    

      if (x != 0){
        const filter = this.chunks.filter(chunk => chunk.position.x / (this.dimension * 50) !== chunkPos.x - (2 * Math.sign(x))) 
        if (this.chunks.length > filter.length) {
          this.chunks = filter
          
          for (let i = chunkPos.y - 1; i < chunkPos.y + 2; i++) {
            const rateX = Math.abs(chunkPos.x + 1 * Math.sign(x))
            const rateY = Math.abs(i)

            let newChunk: any

            let calcChunk = true

            if (localStorage.getItem(`${this.seed}`)) {
              if (savedChunks[`${(chunkPos.x + 1 * Math.sign(x)) * (this.dimension * 50)}-${i * (this.dimension * 50)}`]) {
                newChunk = savedChunks[`${(chunkPos.x + 1 * Math.sign(x)) * (this.dimension * 50)}-${i * (this.dimension * 50)}`]
                calcChunk = false
              }
            }

            if (calcChunk) {
              newChunk = {
                chunk: this.hashFunction(this.mod(chunkPos.x + 1 * Math.sign(x), 255), this.mod(i, 255), this.seed, this.mapRate(rateX, rateY)),
                position: {
                  x: (chunkPos.x + 1 * Math.sign(x)) * (this.dimension * 50), 
                  y: i * (this.dimension * 50)
                }
              }
            }

            this.chunks.push(newChunk)
            setTimeout(() => {
              this.drawChunk(`canvas${newChunk.position.x}${newChunk.position.y}`, newChunk.chunk)
            }, 500)
          }
        }
      }    
      if (y != 0) {
        const filter = this.chunks.filter(chunk => chunk.position.y / (this.dimension * 50) !== chunkPos.y + (2 * Math.sign(y)))
        if (this.chunks.length > filter.length) {
          this.chunks = filter

          for (let i = chunkPos.x - 1; i < chunkPos.x + 2; i++) {
            const rateX = Math.abs(i)
            const rateY = Math.abs(chunkPos.y - 1 * Math.sign(y))

            let newChunk: any

            let calcChunk = true

            if (localStorage.getItem(`${this.seed}`)) {
              if (savedChunks[`${i * (this.dimension * 50)}-${(chunkPos.y - 1 * Math.sign(y)) * (this.dimension * 50)}`]) {
                newChunk = savedChunks[`${i * (this.dimension * 50)}-${(chunkPos.y - 1 * Math.sign(y)) * (this.dimension * 50)}`]
                calcChunk = false
              }
            }

            if (calcChunk) {
              newChunk = {
                chunk: this.hashFunction(this.mod(i, 255), this.mod(chunkPos.y - 1 * Math.sign(y), 255), this.seed, this.mapRate(rateX, rateY)), 
                position: {
                  x: i * (this.dimension * 50), 
                  y: (chunkPos.y - 1 * Math.sign(y)) * (this.dimension * 50)
                }
              }
            }
            

            this.chunks.push(newChunk)
            setTimeout(() => {
              this.drawChunk(`canvas${newChunk.position.x}${newChunk.position.y}`, newChunk.chunk)
            }, 500)
          }
        }
      }
    }
    if (currentChunk.chunk[blockPos.y][blockPos.x] == 35) {
      this.pauseResume()
      this.storeMenu = true
    }
  }

  controllersP0: any = {}
  controllersIntervals: any = {}
  controllersParams: Array<{x: number, y: number}> = [{x: 0, y: 0}, {x: 0, y: 0}]
  touchStick (event: TouchEvent) {
    const target: any = event.target
    const P0 = {x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY}
    this.controllersP0[`${target.id}`] = P0

    switch (target.id) {
      case 'a-click':
          this.controllersIntervals[`${target.id}`] = setInterval(() => {
            this.move(this.controllersParams[0].x, -this.controllersParams[0].y)
          }, 200)
        break
      case 'b-click':
          this.controllersIntervals[`${target.id}`] = setInterval(() => {
            this.plantTree(this.controllersParams[1].x, this.controllersParams[1].y)
          }, 100)
        break
    }

    target.style.transform = `translateX(-50%) translateY(-50%) scale(2)`
  }

  pullStick (event: TouchEvent) {
    const target: any = event.target
    const vector = {
      x: event.changedTouches[0].clientX - this.controllersP0[`${target.id}`].x,
      y: event.changedTouches[0].clientY - this.controllersP0[`${target.id}`].y
    }
    if (this.distance(event.changedTouches[0].clientX, this.controllersP0[`${target.id}`].x, event.changedTouches[0].clientY, this.controllersP0[`${target.id}`].y) < 100) {
      target.style.transform = `translateX(calc(${vector.x}px - 50%)) translateY(calc(${vector.y}px - 50%)) scale(2)`
    }

    const direction = {
      x: Math.round(vector.x / 50) / Math.round(vector.x / 50) * Math.sign(Math.round(vector.x / 50)) || 0,
      y: Math.round(vector.y / 50) / Math.round(vector.y / 50) * Math.sign(Math.round(vector.y / 50)) || 0
    }

    switch (target.id) {
      case 'a-click':
        this.controllersParams[0].x = direction.x
        this.controllersParams[0].y = direction.y
        break
      case 'b-click':
        this.controllersParams[1].x = direction.x
        this.controllersParams[1].y = direction.y
        break
    }
  }
  
  touchEndStick (event: TouchEvent) {
    const target: any = event.target
    target.style.transform = `translateX(-50%) translateY(-50%)`

    clearInterval(this.controllersIntervals[`${target.id}`])
  }

  plantTree (x: number, y: number) {
    if (this.trees > 0 && Math.abs(x) + Math.abs(y) != 0) {
      const chunkPos = {
        x: Math.floor((this.playerPos.x + (this.dimension * 25))/(this.dimension * 50)), 
        y: (Math.floor((this.playerPos.y + (this.dimension * 25))/(this.dimension * 50))) * -1
      }
      const pBlockPos = {
        x: this.mod((this.playerPos.x) / 50 + (Math.floor(this.dimension / 2)), this.dimension), 
        y: (this.dimension - 1) - this.mod((this.playerPos.y) / 50 + (Math.floor(this.dimension / 2)), this.dimension) 
      }
      const currentChunk = this.chunks.find(chunk => chunk.position.x / (this.dimension * 50) == chunkPos.x && chunk.position.y / (this.dimension * 50) == chunkPos.y)
      
      if (currentChunk.chunk[pBlockPos.y + y][pBlockPos.x + x] == 1 || currentChunk.chunk[pBlockPos.y + y][pBlockPos.x + x] == 15) {
        if (!(pBlockPos.y + y == Math.floor(this.dimension / 2) && pBlockPos.x + x == Math.floor(this.dimension / 2))) {
          this.witchSkullSound.play()
          currentChunk.chunk[pBlockPos.y + y][pBlockPos.x + x] = 14
          this.drawChunk(`canvas${currentChunk.position.x}${currentChunk.position.y}`, currentChunk.chunk)
          this.saveGame(currentChunk)
          this.trees -= 1
        }
      }
    }
  }

  distance (x1: number, x2: number, y1: number, y2: number) {
    return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2))
  }

  saveGame (chunkToSave = null) {
    let game = {
      savedChunks: {},
      money: this.money,
      playerPos: this.playerPos,
      life: this.componentsToDraw[0].life,
      seed: this.seed,
      trees: this.trees
    }

    if (localStorage.getItem(this.seed.toString())) {
      game.savedChunks = JSON.parse(localStorage.getItem(this.seed.toString())).savedChunks
    }

    if (chunkToSave != null) {
      for (let r in chunkToSave.chunk) {
        for (let c in chunkToSave.chunk[r]) {
          if (chunkToSave.chunk[r][c] == 16) chunkToSave.chunk[r][c] = 1
        }
      }
      game.savedChunks[`${chunkToSave.position.x}-${chunkToSave.position.y}`] = chunkToSave
    }    

    localStorage.setItem(this.seed.toString(), JSON.stringify(game))
    localStorage.lastGame = this.seed
  }
}