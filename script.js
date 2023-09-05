"use strict";
const fileReader = new FileReader();
class Tile {
    constructor(x, y,cost){
        this.cost = Number.parseInt(cost);
        this.visitable = cost > -1;
        this.x = x;
        this.y = y;
        this.open = false;
        this.closed = false;
        this.path = false;
        this.isStartTile = false;
        this.isDestTile = false;
    }
    
    setOpen() {
        if (!this.visitable) throw new Error("Node is not visitable");
        this.open = true;
        this.closed = false;
    }
    setClosed() {
        if (!this.visitable) throw new Error("Node is not visitable");
        this.open = false;
        this.closed = true;
    }
}

const colors = {
    open:           'rgb(200, 200, 200)',
    closed:         'rgb(150, 150, 150)',
    unexplored:     'rgb(255, 255, 255)',
    path:           'rgb(255, 255,   0)',
    unvisitable:    'rgb(255,   0,   0)',
    start:          'rgb(  0,   0, 255)',
    dest:           'rgb(255, 192, 203)',
    text:           'rgb(  0,   0,   0)',
}

class Map{
    constructor(tiles2d){
        this.tiles2d = tiles2d;
        this.height = tiles2d.length;
        this.width = tiles2d[0].length;
    }
    
    visitable(x,y) {
        return this.getTile(x,y).visitable;
    }

    cost(x,y) {
        return this.getTile(x,y).cost;
    }

    getTile(x,y) {
        if(y >= this.tiles2d.length || x >= this.tiles2d[0].length || x < 0 || y < 0) {
            return null;
        }
        return this.tiles2d[y][x];
    }
}

class Node{
    constructor(tile,parent){
        this.tile = tile;
        this.f = 0;
        this.parent = parent;
        this.h = 0;
        this.g = 0;
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
        
        const logTileUnderCursor = (e, tileSize) => {
            const cursorX = e.offsetX;
            const cursorY = e.offsetY;
            console.log("X: " + Math.floor(cursorX/tileSize) + "\nY: " + 
            Math.floor(cursorY/tileSize));
        }
        const onClick = (e) => logTileUnderCursor(e, tileSize);
        this.canvas.onclick = this.logTileUnderCursor;
        this.canvas.addEventListener('click', onClick);

    }

    drawMap() {
        // console.log('\"darwmapo i have come to bargain\" -the bargainer')
        this.map.tiles2d.forEach(row => {row.forEach((tile) => {
            this.drawTile(tile);
        })});
    }

    drawTile(tile) {

        const getColor = (tile) => {
            if(tile.startTile) return colors.start;
            if(tile.destTile) return colors.dest;
            if(tile.path) return colors.path;
            if(tile.closed) return colors.closed;
            if(tile.open) return colors.open;
            if(!tile.visitable) return colors.unvisitable;
            return colors.unexplored;
        }
        const color = getColor(tile);
        const xCoord = this.tileSize * tile.x;
        const yCoord = this.tileSize * (tile.y);
        this.ctx.fillStyle = color;
        this.ctx.fillRect(xCoord, yCoord, this.tileSize, this.tileSize);
        this.ctx.strokeStyle = '1px solid black';
        this.ctx.fillStyle = colors.text;
        this.ctx.font = this.tileSize * 0.5 + 'px Comic Sans MS'
        this.ctx.textBaseline = 'middle';
        this.ctx.textAlign = 'center';
        if (tile.visitable){
            this.ctx.fillText(tile.cost, xCoord + this.tileSize / 2, yCoord +
                this.tileSize / 2)
            this.ctx.strokeRect(xCoord, yCoord, this.tileSize, this.tileSize);
        }
    }

    aStar(startTile, destTile) {
        startTile.startTile = true;
        destTile.destTile = true;
        const traceback = (node) => {
            if (node){
                node.tile.path = true;
                traceback(node.parent);
            }
        }
        
        const open = [];
        const closed = [];
        open.push(new Node(startTile, null));
        startTile.open = true;
        while(open.length){
            this.astarIter(open, destTile, traceback, closed);
            this.drawMap();
        }
    }

    astarIter(open, destTile, traceback, closed) {
        let q = open.pop();
        q.tile.open = false;
        [
            new Node(this.map.getTile(q.tile.x - 1, q.tile.y), q),
            new Node(this.map.getTile(q.tile.x + 1, q.tile.y), q),
            new Node(this.map.getTile(q.tile.x, q.tile.y - 1), q),
            new Node(this.map.getTile(q.tile.x, q.tile.y + 1), q),
        ].filter((successor) => successor.tile && successor.tile.visitable).forEach(successor => {
            if (successor.tile === destTile) {
                console.log("goal found");
                traceback(successor);
                this.drawMap();
                throw new Error("we did it");
            }
            successor.g = q.g + successor.tile.cost;
            successor.h = Math.abs(successor.tile.x - destTile.x) + Math.abs(successor.tile.y - destTile.y);
            successor.f = successor.g + successor.h;
            if (open.filter((node) => node.tile === successor.tile && node.f < successor.f).length) {
                return;
            }
            if (closed.filter((node) => node.tile === successor.tile && node.f < successor.f).length) {
                return;
            }
            open.push(successor);
            successor.tile.open = true;
            open.sort((a, b) => b.f - a.f);
        });
        closed.push(q);
        q.tile.closed = true;
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
        const blobStr = reader.result;
        mazeInit(blobStr);
      },
      false,
    );

    if (file) {
      reader.readAsText(file);
    }
}

function mazeInit(blobStr) {
    const array = blobStr.split("\n").map((row) => row.split(",")).filter(row => row.length > 1);
    const tiles2d = array.map((row, y) => row.map((number, x) => new Tile(x, y, number))).filter(row => row.length > 1);
    const map = new Map(tiles2d);
    const mapCanvas = new MapCanvas(map, canvasDiv, 30);
    mapCanvas.drawMap();
    mapCanvas.aStar(map.getTile(18, 40), map.getTile(18, 6));
    // mapCanvas.aStar(map.getTile(18, 6),map.getTile(32, 40));

    // mapCanvas.aStar(map.getTile(17, 27), map.getTile(27, 26));
    // mapCanvas.aStar(map.getTile(17, 27), map.getTile(16, 27));
    // mapCanvas.aStar(map.getTile(17, 27), map.getTile(18, 27));
    mapCanvas.drawMap();
}

const blobStr = document.getElementById('data').innerHTML;
mazeInit(blobStr); 