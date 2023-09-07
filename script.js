"use strict";
const fileReader = new FileReader();

class Tile {
    constructor(x, y, cost) {
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
    open: 'rgb(200, 200, 200)',
    closed: 'rgb(150, 150, 150)',
    unexplored: 'rgb(255, 255, 255)',
    path: 'rgb(255, 255,   0)',
    unvisitable: 'rgb(255,   0,   0)',
    start: 'rgb(  0,   0, 255)',
    dest: 'rgb(   0, 255,   0)',
    text: 'rgb(  0,   0,   0)',
}

class Map {
    constructor(tiles2d) {
        this.tiles2d = tiles2d;
        this.height = tiles2d.length;
        this.width = tiles2d[0].length;
    }

    visitable(x, y) {
        return this.getTile(x, y).visitable;
    }

    cost(x, y) {
        return this.getTile(x, y).cost;
    }

    getTile(x, y) {
        if (y >= this.tiles2d.length || x >= this.tiles2d[0].length || x < 0 || y < 0) {
            return null;
        }
        return this.tiles2d[y][x];
    }
}

class Node {
    constructor(tile, parent) {
        this.tile = tile;
        this.parent = parent;
        this.h;
        this.f;
        this.g;
    }
}

/**
 * logs tile under the cursor to console
 * @param {*} e - event from onclick
 * @param {*} tileSize - tileSize of the mapCanvas
 * @returns returns an object with x and y property corresponding to x and y of 
 * tile under cursor.
 */
function logTileUnderCursor (e, tileSize) {
    const cursorX = e.offsetX;
    const cursorY = e.offsetY;
    console.log("X: " + Math.floor(cursorX / tileSize) + "\nY: " +
        Math.floor(cursorY / tileSize));
    return {x: Math.floor(cursorX / tileSize), y: Math.floor(cursorY / tileSize)};
}

class MapCanvas {
    constructor(map, parent, tileSize) {
        this.map = map;
        this.height = map.height;
        this.width = map.width;
        this.parent = parent;
        this.tileSize = tileSize;
        this.canvas = document.createElement('canvas')
        this.canvas.height = this.height * this.tileSize;
        this.canvas.width = this.width * this.tileSize;
        this.parent.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
        const onClick = (e) => logTileUnderCursor(e, tileSize);
        this.canvas.onclick = this.logTileUnderCursor;
        this.canvas.addEventListener('click', onClick);

    }

    /**
     * iterates over all tiles in the map and draws all of them.
     */
    drawMap() {
        console.log('\"darwmapo i have come to bargain\" -the bargainer')
        this.map.tiles2d.forEach(row => {
            row.forEach((tile) => {
                this.drawTile(tile);
            })
        });
    }

    // returns true if 
    hasBetterOption = (arr, succ) => arr.filter(node => node.tile === succ.tile && node.f <= succ.f).length;

    /**
     * gui function to draw a tile.
     * @param {*} tile the tile you wish to draw on the gui.
     */
    drawTile(tile) {

        const getColor = (tile) => {
            if (tile.isStartTile) return colors.start;
            if (tile.isDestTile) return colors.dest;
            if (tile.path) return colors.path;
            if (tile.closed) return colors.closed;
            if (tile.open) return colors.open;
            if (!tile.visitable) return colors.unvisitable;
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
        if (tile.visitable) {
            this.ctx.fillText(tile.cost, xCoord + this.tileSize / 2, yCoord +
                this.tileSize / 2)
            this.ctx.strokeRect(xCoord, yCoord, this.tileSize, this.tileSize);
        }
    }

    /**
     * 
     * @param {*} startTile - the Tile the algorithm should start search in.
     * @param {*} destTile  - the Tile the algorithm should find the lowest
     * cost path to.
     */
   async aStar(startTile, destTile) {
        let win = false;
        // for gui
        startTile.isStartTile = true;
        destTile.isDestTile = true;

        // algorithm
        const open = [];
        const closed = [];
        open.push(new Node(startTile, null));
        open[0].f = 0;
        open[0].g = 0;
        // cannot walk diagonally 
        const generateSuccessors = (node) => [
            generateSuccessor(node, -1, 0),
            generateSuccessor(node, 1, 0),
            generateSuccessor(node, 0, -1),
            generateSuccessor(node, 0, 1)
        ];
        const generateSuccessor = (node, xChange, yChange) => new Node(
            this.map.getTile(node.tile.x + xChange, node.tile.y + yChange), node);
        const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));
        while (open.length && !win) {
            await sleep(1); // for animation
            win = this.astarIteration(open, generateSuccessors, destTile, win, closed);
        }
    }

    colorPath = (node) => {
                        node.tile.path = true;
                        if (node.parent) {
                            this.colorPath(node.parent);
                        }
                    }
    uncolorPath = (node) => {
        node.tile.path = false;
        if (node.parent) {
            this.uncolorPath(node.parent);
        }
    }

    /**
     * one iteration of aStar. should only be called by astar
     * @param {*} open
     * @param {*} generateSuccessors 
     * @param {*} destTile 
     * @param {*} win 
     * @param {*} closed 
     * @returns boolean whether we found the destination or not
     */
    astarIteration(open, generateSuccessors, destTile, win, closed) {
        const q = open.pop();
        this.colorPath(q);

        generateSuccessors(q).filter(successor => successor.tile && successor.tile.visitable).forEach(
            successor => {
                if (successor.tile === destTile) {
                    console.log("bra jobba karar dokk vant");
                    win = true;
                    
                    this.colorPath(successor);
                }
                successor.g = q.g + successor.tile.cost;
                successor.h = Math.abs(successor.tile.x - destTile.x) + Math.abs(successor.tile.y - destTile.y);
                successor.f = successor.g + successor.h;

                if (!(this.hasBetterOption(open, successor) || this.hasBetterOption(closed, successor))) {
                    open.push(successor);
                    open.sort((a, b) => b.f - a.f);
                    successor.tile.setOpen();
                }
            });
        closed.push(q);
        q.tile.setClosed();
        this.drawMap();
        this.uncolorPath(q);
        return win;
    }
}

const canvasDiv = document.getElementById("canvasdiv");
if (!canvasDiv) {
    console.error("bæbubæbu me he problem, divven te canvas finst ikkje")
}
const fileSelector = document.getElementById('fileselector')

if (!fileSelector) {
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
    mapCanvas.aStar(map.getTile(18, 40), map.getTile(4, 9));
    mapCanvas.drawMap();
}


const selectEl = document.getElementById('select');
selectEl.addEventListener('change', () =>{
    startPos = null;
    endPos = null;
    canvasDiv.innerHTML = "";
    const blobStr = document.getElementById('data'+selectEl.value).innerHTML;
    // mazeInit(blobStr);
    
    const array = blobStr.split("\n").map((row) => row.split(",")).filter(row => row.length > 1);
    const tiles2d = array.map((row, y) => row.map((number, x) => new Tile(x, y, number))).filter(row => row.length > 1);
    const map = new Map(tiles2d);
    const tileSize = 30;
    const mapCanvas = new MapCanvas(map, canvasDiv, tileSize);
    mapCanvas.drawMap();
    mapCanvas.canvas.addEventListener('click', (e) => onClick(e, mapCanvas, tileSize));
});

/** Expects blobStr on same format as mazeInit, startPos and destPos on format {x: number, y: number} */
function astarInit(startPos, destPos, mapCanvas) {
    mapCanvas.drawMap();
    mapCanvas.aStar(mapCanvas.map.getTile(startPos.x, startPos.y), mapCanvas.map.getTile(destPos.x, destPos.y));
    mapCanvas.drawMap();
}

let startPos;
let endPos;

function onClick(e, mapCanvas, tileSize) {
    if (!endPos){
        const pos = logTileUnderCursor(e, tileSize);

        const tile = mapCanvas.map.getTile(pos.x, pos.y);
        if(!tile.visitable) {
            return;
        }
        if(startPos){
            endPos = pos;
            tile.isDestTile = true;
            astarInit(startPos, endPos, mapCanvas)
            return;
        }
        startPos = pos;
        tile.isStartTile = true;
        mapCanvas.drawMap()
    }
}




