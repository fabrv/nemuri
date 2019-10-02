import { Component, ElementRef, ViewChild } from '@angular/core';

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

  constructor() {
    let row = -1
    for (let i = 0; i < 9; i++) {
      if (i % 3 == 0) {
        row += 1
      }
      this.chunks[i] = {chunk: this.hashFunction((i % 3), row, this.seed, 0.5), position: {x: ((i % 3) - 1) * (this.dimension * 50), y: (row - 1) * (this.dimension * 50)}}
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

    chunk = this.sandChunk(this.softenChunk(chunk))
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

  random(seed: number) {
    var x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  }

  move (x: number, y: number) {
    this.playerPos.x += x
    this.playerPos.y += y
    this.map.nativeElement.style.transform = `translateX(calc(-50% - ${this.playerPos.x}px)) translateY(calc(-50% + ${this.playerPos.y}px))`
    
    const chunkPos = {x: Math.floor((this.playerPos.x + (this.dimension * 25))/(this.dimension * 50)), y: (Math.floor((this.playerPos.y + (this.dimension * 25))/(this.dimension * 50))) * -1}
    
    if (x != 0){
      const filter = this.chunks.filter(chunk => chunk.position.x / (this.dimension * 50) !== chunkPos.x - (2 * Math.sign(x))) 
      if (this.chunks.length > filter.length) {
        this.chunks = filter
        
        for (let i = chunkPos.y - 1; i < chunkPos.y + 2; i++) {
          this.chunks.push({chunk: this.hashFunction(chunkPos.x + 1 * Math.sign(x), i, this.seed, 0.5), position: {x: (chunkPos.x + 1 * Math.sign(x)) * (this.dimension * 50), y: i * (this.dimension * 50)}})
        }
      }
    }    
    if (y != 0) {
      const filter = this.chunks.filter(chunk => chunk.position.y / (this.dimension * 50) !== chunkPos.y + (2 * Math.sign(y)))
      if (this.chunks.length > filter.length) {
        this.chunks = filter

        for (let i = chunkPos.x - 1; i < chunkPos.x + 2; i++) {
          this.chunks.push({chunk: this.hashFunction(i, chunkPos.y - 1 * Math.sign(y), this.seed, 0.5), position: {x: i * (this.dimension * 50), y: (chunkPos.y - 1 * Math.sign(y)) * (this.dimension * 50)}})
        }
      }
    }
  }
}
