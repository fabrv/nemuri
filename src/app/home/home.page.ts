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
  chunks: Array<{chunk: Array<Array<number>>, position: {x: number, y: number}}> = []
  playerPos: {x: number, y: number} = {x: 0, y: 0}
  seed:number = 5
  dimension: number = 35
  pressed: boolean = false

  //component

  fly = false

  timer = new TaskTimer(200)

  constructor(private screenOrientation: ScreenOrientation) {
    //this.drawMap()

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
        case 37:

      }
      console.log(event.keyCode)
    })
  }

  ngAfterViewInit() {
    this.drawMap()
    this.drawMainCharacter()
    this.screenOrientation.lock(this.screenOrientation.ORIENTATIONS.LANDSCAPE)
  }

  drawMainCharacter () {
    const charSprite = new Image()
    const canvas: any = document.getElementById('player')
    const context = canvas.getContext('2d')
    const tileSize = {height: 24, width: 16}

    const standCycle = [0, 1]
    let standIndex = 0

    let frames = 0

    charSprite.src = '../../assets/chars_tileset.png'

    charSprite.onload = () => {
      window.requestAnimationFrame(standStep)
    }

    const standStep = () => {
      frames = (frames + 1) % 15      

      if (frames == 0) {
        context.clearRect(0, 0, canvas.width, canvas.height)
        if (this.fly) {
          drawFrame(8)
        } else {
          drawFrame(standCycle[standIndex])
        }
        
        standIndex = (standIndex + 1) % standCycle.length
      }
      
      window.requestAnimationFrame(standStep)
      return
    }

    const drawFrame = (frame: number) => {
      context.drawImage(
        charSprite, 
        128 + tileSize.width * frame, 
        41, 
        tileSize.width, 
        tileSize.height, 
        0,
        0, 
        tileSize.width, 
        tileSize.height
      )
    }
  }

  drawMap () {
    for (let chunk in this.chunks) {
      this.drawChunk(`canvas${this.chunks[chunk].position.x}${this.chunks[chunk].position.y}`, this.chunks[chunk].chunk)
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
      {x: 11, y: 7}      
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

  timerRun(start: boolean, x: number = 0, y: number = 0) {
    if (start) { this.timer.add(task => this.move(x, y)).start(); }
    else { this.timer.reset() }
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

  //finalRunChunk (chunk: Array<)

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
    if (this.fly) {
      document.getElementById('player').classList.add('fly')
    } else {
      document.getElementById('player').classList.remove('fly')
    }
  }

  move (x: number, y: number) {
    if (x > 0) {
      document.getElementById('player').classList.remove('player-inverted')
    } else if (x < 0) {
      document.getElementById('player').classList.add('player-inverted')
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
    console.log(currentChunk.chunk[blockPos.y][blockPos.x])
    if (currentChunk.chunk[blockPos.y][blockPos.x] == 1 || currentChunk.chunk[blockPos.y][blockPos.x] == 15 || this.fly) {
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
}