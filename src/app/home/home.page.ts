import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  chunks: Array<{chunk: Array<Array<number>>, position: {x: number, y: number}}> = []
  constructor() {
    let row = -1
    for (let i = 0; i < 9; i++) {
      if (i % 3 == 0) {
        row += 1
      }
      this.chunks[i] = {chunk: this.hashFunction((i % 3), row, 2, 0.5), position: {x: ((i % 3) - 1) * 1000, y: (row - 1) * 1000}}
      console.log(i % 3, row)
      console.log(this.chunks[i].position)
    }
  }

  hashFunction(x: number, y: number, seed: number, biome: number): Array<Array<number>> {
    const chunkSeed = parseInt(seed + '' + x + '' + y)
    let chunk = []
    for (let i = 0; i < 20; i++) {
      let row = []
      for (let o = 0; o < 20; o++) {
        row.push(+ (this.random(parseInt(chunkSeed + '' + i + '' + o)) > biome))
      }
      chunk.push(row)
    }

    chunk = this.sandChunk(this.softenChunk(chunk))
    return chunk
  }

  softenChunk (chunk: Array<Array<number>>): Array<Array<number>> {
    for (let i = 0; i < 20; i++) {
      for (let o = 0; o < 20; o++) {
        if (i > 0 && o > 0 && i < 19 && o < 19) {
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
    for (let i = 0; i < 20; i++) {
      for (let o = 0; o < 20; o++) {
        if (i > 0 && o > 0 && i < 19 && o < 19) {
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
}
