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
  seed:number = 2
  dimension: number = 15
  pressed: boolean = false

  timer = new TaskTimer(200)

  constructor(private screenOrientation: ScreenOrientation) {
    this.screenOrientation.lock(this.screenOrientation.ORIENTATIONS.PORTRAIT)

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

    return chunk
  }

  sandChunk (chunk: Array<Array<number>>): Array<Array<number>> {
    let dummyChunk = chunk.slice(0, chunk.length)
    for (let i = 0; i < this.dimension; i++) {
      for (let o = 0; o < this.dimension; o++) {
        if (i > 0 && o > 0 && i < this.dimension - 1 && o < this.dimension - 1) {
          let sides = 0
          if (chunk[i][o - 1] == 1) sides += 1
          if (chunk[i][o + 1] == 1) sides += 1
          if (chunk[i - 1][o] == 1) sides += 1
          if (chunk[i + 1][o] == 1) sides += 1

          if (sides > 0 && dummyChunk[i][o] == 0) {
            dummyChunk[i][o] = 2
          }
        }
      }
    }

    return dummyChunk
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
                        
            if (chunk[i + (row - 1)][o + ((n % 3) - 1)] == 1 || chunk[i + (row - 1)][o + ((n % 3) - 1)] == 3) {
              sides += 1
            }

            if (sides > 8 && (i != 7 || o != 7)) {
              chunk[i][o] = 3
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

  move (x: number, y: number) {

    const chunkPos = {
      x: Math.floor((this.playerPos.x + x + (this.dimension * 25))/(this.dimension * 50)), 
      y: (Math.floor((this.playerPos.y + y + (this.dimension * 25))/(this.dimension * 50))) * -1
    }
    const blockPos = {
      x: this.mod((this.playerPos.x + x) / 50 + 7, 15), 
      y: 14 - this.mod((this.playerPos.y + y) / 50 + 7, 15) 
    }

    //Collision
    const currentChunk = this.chunks.find(chunk => chunk.position.x / (this.dimension * 50) == chunkPos.x && chunk.position.y / (this.dimension * 50) == chunkPos.y)
    if (currentChunk.chunk[blockPos.y][blockPos.x] == 1 || currentChunk.chunk[blockPos.y][blockPos.x] == 2) {
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
            this.chunks.push({
              chunk: this.hashFunction(this.mod(chunkPos.x + 1 * Math.sign(x), 255), this.mod(i, 255), this.seed, this.mapRate(rateX, rateY)),
              position: {
                x: (chunkPos.x + 1 * Math.sign(x)) * (this.dimension * 50), 
                y: i * (this.dimension * 50)
              }
            })
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

            this.chunks.push({
              chunk: this.hashFunction(this.mod(i, 255), this.mod(chunkPos.y - 1 * Math.sign(y), 255), this.seed, this.mapRate(rateX, rateY)), 
              position: {
                x: i * (this.dimension * 50), 
                y: (chunkPos.y - 1 * Math.sign(y)) * (this.dimension * 50)
              }
            })
          }
        }
      }
    } 
  }
}
