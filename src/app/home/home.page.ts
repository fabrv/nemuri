import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  chunk: Array<Array<number>>
  constructor() {
    this.chunk = this.hashFunction(0, 0, 4)
  }

  hashFunction(x: number, y: number, seed: number) {
    const chunkSeed = parseInt(seed + '' + x + '' + y)
    let chunk = []
    for (let i = 0; i < 20; i++) {
      let row = []
      for (let o = 0; o < 20; o++) {
        row.push(this.random(parseInt(chunkSeed + '' + i + '' + o)) > 0.5)
      }
      chunk.push(row)
    }

    for (let i = 0; i < 20; i++) {
      for (let o = 0; o < 20; o++) {
        if (i > 0 && o > 0 && i < 19 && o < 19) {
          if (chunk[i][o - 1] && chunk[i][o + 1] && chunk[i - 1][o] && chunk[i + 1][o]) {
            chunk[i][o] = true
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
}
