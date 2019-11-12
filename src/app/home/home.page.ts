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
  seed:number = 15
  dimension: number = 35
  pressed: boolean = false
  showHearts: number = 0

  money: number = 15

  frameSpeed: number = 30

  playerAreaDimension: number = 128

  componentsToDraw: Array<any> = []  

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

    setInterval(draw, this.frameSpeed)
    //window.requestAnimationFrame(draw)
  }

  fly = false

  timer = new TaskTimer(200)

  constructor(private screenOrientation: ScreenOrientation) {
    let row = -1
    for (let i = 0; i < 9; i++) {
      if (i % 3 == 0) {
        row += 1
      }
      const rateX = Math.abs((i % 3) - 1)
      const rateY = Math.abs(row - 1)
      
      const newChunk = {
        chunk: this.hashFunction(this.mod((i % 3) - 1, 255), this.mod(row - 1, 255), this.seed, this.mapRate(rateX, rateY)), 
        position: {
          x: ((i % 3) - 1) * (this.dimension * 50), 
          y: (row - 1) * (this.dimension * 50)
        }
      }
      this.chunks[i] = newChunk
    }

    window.addEventListener('keydown', (event)=> {
      switch (event.keyCode) {
        case 87:
          this.move(0, 50)
        break
        case 65:
          this.move(-50, 0)
        break
        case 83:
          this.move(0, -50)
        break
        case 68:
          this.move(50, 0)
        break  
        case 32:
          this.showHearts = 0
        break
        case 39:
          this.throwDagger(8,0)
        break
        case 38:
          this.throwDagger(0,-8)
        break
        case 40:
          this.throwDagger(0,8)
        break
        case 37:
          this.throwDagger(-8,0)
        break
      }
      //console.log(event.keyCode)
    })
  }

  ngAfterViewInit() {
    this.drawMap()
    this.drawMainCharacter()
    this.drawHud()
    this.drawLoop()
    this.drawEnemies()
    this.screenOrientation.lock(this.screenOrientation.ORIENTATIONS.LANDSCAPE)
  }

  throwDagger (x: number, y: number) {
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
            // DAGGER COLLISION
            switch (currentBlock){
              case 14:
                currentChunk.chunk[blockPos.y + daggerBlock[0]][blockPos.x + daggerBlock[1]] = 15
                this.drawChunk(`canvas${currentChunk.position.x}${currentChunk.position.y}`, currentChunk.chunk)
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
    for (let i = 0; i < hearts.length; i++) {
      hearts[i].reDraw = () => {
        if (this.showHearts < 150) {
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
          this.showHearts ++
        }
      }

      hearts[i].init()
      this.componentsToDraw.push(hearts[i])
    }

    const coin = new this.component(this.playerAreaDimension / 2 - 10, this.playerAreaDimension / 2 + 5, 288, 272, 8, 8, context)
    coin.frame = 0
    coin.animFrame = 0
    coin.reDraw = () => {
      if (this.showHearts < 150) {
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
  }

  drawMap () {
    for (let chunk in this.chunks) {
      this.drawChunk(`canvas${this.chunks[chunk].position.x}${this.chunks[chunk].position.y}`, this.chunks[chunk].chunk)
    }
  }

  drawEnemies () {
    const chunkPos = {
      x: Math.floor((this.playerPos.x + (this.dimension * 25))/(this.dimension * 50)), 
      y: (Math.floor((this.playerPos.y + (this.dimension * 25))/(this.dimension * 50))) * -1
    }
    const currentChunk = this.chunks.find(chunk => chunk.position.x / (this.dimension * 50) == chunkPos.x && chunk.position.y / (this.dimension * 50) == chunkPos.y)

    const canvas: any = document.getElementById(`enemies${currentChunk.position.x}${currentChunk.position.y}`)
    const context: CanvasRenderingContext2D = canvas.getContext('2d')

    for (let e = 0; e < 10; e++) {
      let position = {x: Math.floor(Math.random() * this.dimension), y: Math.floor(Math.random() * this.dimension)}
      while(currentChunk.chunk[position.y][position.x] != 1 && currentChunk.chunk[position.y][position.x] != 15) {
        position.x = (position.x + 1) % this.dimension
      }
      //console.log(currentChunk.chunk[position.y][position.x])
      
      const fast = new this.component(position.x * 16, position.y * 16, 368, 20, 16, 16, context)
      currentChunk.chunk[position.y][position.x] = 16
      fast.init()
      fast.position = {x: position.x, y: position.y}
      fast.animCycle = [1, 2, 3]
      fast.move = () => {
        // fast.animCycle = [3, 4, 5, 6, 7]
        // fast.fast.animCycle = [1, 2, 3]
        let currentSprite = Math.floor(Math.random() * fast.animCycle.length)
        let frame = 0
        let newSquareReached = true
        const changeFrame = () => {
          const pBlockPos = {
            x: this.mod((this.playerPos.x) / 50 + (Math.floor(this.dimension / 2)), this.dimension), 
            y: (this.dimension - 1) - this.mod((this.playerPos.y) / 50 + (Math.floor(this.dimension / 2)), this.dimension) 
          }

          //console.log(pBlockPos)
          const distance = this.distance(fast.position.x, pBlockPos.x, fast.position.y, pBlockPos.y)
          if (distance < 6) {
            fast.animCycle = [3, 4, 5, 6, 7]

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
                if ((currentChunk.chunk[fast.position.y + adder.y][fast.position.x + adder.x] == 1 || currentChunk.chunk[fast.position.y + adder.y][fast.position.x + adder.x] == 15) && (this.distance(fast.position.x + adder.x, pBlockPos.x, fast.position.y + adder.y, pBlockPos.y) < minDistance)) {
                  minDistance = this.distance(fast.position.x + adder.x, pBlockPos.x, fast.position.y + adder.y, pBlockPos.y)
                  minBlock = {x: fast.position.x + adder.x, y: fast.position.y + adder.y}
                }
              } catch (error) {}
            }

            if (newSquareReached) {
              currentChunk.chunk[fast.position.y][fast.position.x] = 1

              fast.position.x = minBlock.x
              fast.position.y = minBlock.y

              currentChunk.chunk[fast.position.y][fast.position.x] = 16

              newSquareReached = false
            } else {
              const diff = {
                x: (fast.location.x - (fast.position.x * 16)) / 16,
                y: (fast.location.y - (fast.position.y * 16)) / 16
              }

              fast.location.x -= Math.sign(diff.x) * (diff.x / diff.x || 1)
              fast.location.y -= Math.sign(diff.y) * (diff.y / diff.y || 1)

              if ((fast.location.x == fast.position.x * 16) && (fast.location.y == fast.position.y * 16)) {
                fast.location.x = fast.position.x * 16
                fast.location.y = fast.position.y * 16
                newSquareReached = true
              }
            }
          } else {
            fast.animCycle = [1, 2, 3]
          }

          frame = (frame + 1) % 9
          if (frame === 0) {
            fast.sX = 368 + (16 * fast.animCycle[currentSprite])
            currentSprite = (currentSprite + 1) % fast.animCycle.length
          }
        }

        fast.interval = setInterval(changeFrame, 1000/60)
      }
      fast.move()

      this.componentsToDraw.push(fast)
    }
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
      {x: 0, y: 0}
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

  move (x: number, y: number) {
    /*if (x > 0) {
      document.getElementById('player').classList.remove('player-inverted')
    } else if (x < 0) {
      document.getElementById('player').classList.add('player-inverted')
    }*/
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
    if (currentChunk.chunk[blockPos.y][blockPos.x] == 1 || currentChunk.chunk[blockPos.y][blockPos.x] == 15) {
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
            const newChunk = {
              chunk: this.hashFunction(this.mod(chunkPos.x + 1 * Math.sign(x), 255), this.mod(i, 255), this.seed, this.mapRate(rateX, rateY)),
              position: {
                x: (chunkPos.x + 1 * Math.sign(x)) * (this.dimension * 50), 
                y: i * (this.dimension * 50)
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
            const newChunk = {
              chunk: this.hashFunction(this.mod(i, 255), this.mod(chunkPos.y - 1 * Math.sign(y), 255), this.seed, this.mapRate(rateX, rateY)), 
              position: {
                x: i * (this.dimension * 50), 
                y: (chunkPos.y - 1 * Math.sign(y)) * (this.dimension * 50)
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
  }

  distance (x1: number, x2: number, y1: number, y2: number) {
    return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2))
  }
}