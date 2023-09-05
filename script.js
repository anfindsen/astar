"use strict";
const fileReader = new FileReader()

class Tile {
    constructor(x, y,cost){
        this.cost = cost;
        this.visited = false;
        this.visitable = cost > -1;
        this.x = x;
        this.y = y;
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

    visit(x,y) {
        this.getTile(x,y).visited = true;
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
        this.map.tiles2d.forEach(row => {row.forEach((tile) => {
            this.drawTile(tile);
        })});
    }

    drawTile(tile) {
        const visitableColor = tile.visited ? colors.visited : colors.unexplored;
        const color = tile.visitable ? visitableColor : colors.unvisitable;
        const xCoord = this.tileSize * tile.x;
        const yCoord = this.tileSize * tile.y;
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
            this.drawTile(x,y);
        }
        else {
            console.error("Nei fysj og fy nå prøvde du å besøga ein tile som ikkje går an å besøga kompis")
        }
    }

    aStar(startNode, destNode) {
        const open = [{node: startNode,
        g: 0}];
        const closed = [];
        const successorNodes = [];
        const currentNode = null;
        const comparator = (node, prevNode) => node.g - prevNode.g;
        while(open.length) {
            open.sort(comparator);
            currentNode = open.pop()
            if (currentNode == destNode){
                console.log("u win, congrat")
                break
            }
            successorNodes += [
                this.map.getTile(currentNode.x,currentNode.y-1),
                this.map.getTile(currentNode.x-1,currentNode.y),
                this.map.getTile(currentNode.x,currentNode.y+1),
                this.map.getTile(currentNode.x+1,currentNode.y),
            ].filter(node);
            successorNodes.forEach(successorNode => {
                // If open contains successornode
                if (open.filter(node => node.node === successorNode.node).length) {
                    if(successorNode.g > currentNode.g + successorNode.cost) {
                        successorNode.g = currentNode.g + successorNode.cost
                    }
                }
                else{
                    open.push(successorNode)
                    open.sort(comparator);
                }
            });
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
        const tiles2d = array.map((row, y) => row.map((number, x) => new Tile(x, y, number))).filter(row => row.length > 1);
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

/** Heuristic function implementing Euclidian distance 
 * uses like pythagoras and such
*/
function h(startTile, destTile) {
    const deltaX = destTile.x - startTile.x;
    const deltaY = destTile.y - startTile.y;
    return Math.sqrt(deltaX ** 2 + deltaY ** 2);
}