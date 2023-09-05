"use strict";
const fileReader = new FileReader()

class Tile{
    constructor(cost){
        this.cost = cost;
        this.visited = false;
        this.visitable = cost > -1;
    }
}

const colors = {
    visited:        'rgb(200, 200, 200)',
    unexplored:     'rgb(255, 255, 255)',
    path:           'rgb(255, 255,   0)',
    unvisitable:    'rgb(255,   0,   0)',
    text:           'rgb(  0,   0,   0)'
}

class Map{
    constructor(tiles2d){
        this.tiles2d = tiles2d;
        this.height = tiles2d.length;
        this.width = tiles2d[0].length;
    }

    visit(x,y){
        this.getTile(x,y).visited = true;
    }
    
    visitable(x,y){
        return this.getTile(x,y).visitable;
    }

    cost(x,y){
        return this.getTile(x,y).cost;
    }

    getTile(x,y){
        return this.tiles2d[y][x];
    }
}

class MapCanvas{
    constructor(map,parent,tileSize){
        this.map = map
        this.height = map.height;
        this.width = map.width;
        this.parent = parent;
        this.tileSize = tileSize;
        this.canvas = document.createElement('canvas')
        this.canvas.height = this.height * this.tileSize;
        this.canvas.width = this.width * this.tileSize;
        this.parent.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
    }

    drawMap() {
        console.log('\"darwmapo i have come to bargain\" -the bargainer')
        this.map.tiles2d.forEach((row, y) => {row.forEach((tile, x) => {
            this.drawTile(x, y, tile);
        })});
    }

    drawTile(x, y, tile) {
        const visitableColor = tile.visited ? colors.visited : colors.unexplored;
        const color = tile.visitable ? visitableColor : colors.unvisitable;
        const xCoord = this.tileSize * x;
        const yCoord = this.tileSize * y;
        this.ctx.fillStyle = color;
        this.ctx.fillRect(xCoord, yCoord, this.tileSize, this.tileSize);
        this.ctx.strokeStyle = '1px solid black';
        this.ctx.fillStyle = colors.text;
        this.ctx.font = this.tileSize * 0.5 + 'px Comic Sans MS'
        this.ctx.textBaseline = 'middle';
        this.ctx.textAlign = 'center';
        if (tile.visitable){
            this.ctx.fillText(tile.cost, xCoord + this.tileSize / 2, yCoord + this.tileSize / 2)
            this.ctx.strokeRect(xCoord, yCoord, this.tileSize, this.tileSize);
        }
    }

    visit(x,y){
        if(this.map.visitable(x,y)){
            this.map.visit(x,y);
            this.drawTile(x, y, this.map.getTile(x,y));
        }
        else {
            console.error("Nei fysj og fy nå prøvde du å besøga ein tile som ikkje går an å besøga kompis")
        }
    }
}

const canvasDiv = document.getElementById("canvasdiv");
if(!canvasDiv) {
    console.error("bæbubæbu me he problem, divven te canvas finst ikkje")
}
const fileSelector = document.getElementById('fileselector')

if(!fileSelector) {
    console.error("bæbubæbu me he problem, file selector finst ikkje")
}

function setcsv() {
    const [file] = document.querySelector("input[type=file]").files;
    const reader = new FileReader();
  
    reader.addEventListener(
      "load",
      () => {
        const blobStr = reader.result
        const array = blobStr.split("\n").map((row) => row.split(","));
        const tiles2d = array.map(row => row.map(number => new Tile(number))).filter(row => row.length > 1);
        const map = new Map(tiles2d);
        const mapCanvas = new MapCanvas(map, canvasDiv, 30);
        mapCanvas.drawMap();
        mapCanvas.visit(2, 9);
      },
      false,
    );
  
    if (file) {
      reader.readAsText(file);
    }
  }
