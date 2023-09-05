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
        console.log('\"darwmapo i have come to bargain\" -the bargainer')
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

    aStar(startNode, destNode) {
        startNode.startTile = true;
        destNode.destTile = true;
        // 1 Open list starts at start node
        const open = [{node: startNode,
        g: 0, 
        parent: null}];
        const closed = [];
        let currentNode = null;
        const nodeInit = (node) => {
            return {node, g: 0, parent: null}
        }

        const traverseParents = (node) => {
            if (node) {
                console.log(node);
                node.node.path = true;
                traverseParents(node.parent);
            }
        };
        
        const comparator = (node, prevNode) => f(prevNode, destNode) - f(node, destNode);
        
        // 2 While open list is not empty
        while(open.length) {
            // 3,4 Take node from open with lowest f. Assumes open array is sorted descending w.r.t. f.
            currentNode = open.pop();

            // 5 If the current node is the destination node we have found a solution. 
            if (currentNode.node === destNode){
                console.log("u win, congrat");
                traverseParents(currentNode);
                this.drawMap()
                break;
            }
            
            // 6 Get all nodes one can visit from current node
            const successorNodes = [
                nodeInit(this.map.getTile(currentNode.node.x,currentNode.node.y-1)),
                nodeInit(this.map.getTile(currentNode.node.x-1,currentNode.node.y)),
                nodeInit(this.map.getTile(currentNode.node.x,currentNode.node.y+1)),
                nodeInit(this.map.getTile(currentNode.node.x+1,currentNode.node.y)),
            ].filter(currentNode => {
                return currentNode.node.cost > -1
            });
            // 7 Check all possible next nodes
            successorNodes.forEach(successorNode => {
                // 8 Set cost of travelling to successorNode to current node + cost 
                const successorCurrCost = currentNode.g + successorNode.cost
                
                // 9 If open contains successornode
                if (open.filter(node => node.node === successorNode.node).length) {
                    // 10
                    if (successorCurrCost> currentNode.g + successorNode.cost) {
                        return; // 10 Continue to next step in forEach iteration
                    }
                }
                // 11 If closed contains successor node and this path is cheaper
                else if (closed.filter(node => node.node === successorNode.node).length) {
                    // 13
                    if (successorCurrCost > currentNode.g + successorNode.cost){
                        const i = closed.findIndex(node => node.node === successorNode.node);
                        closed.splice(i, 1); // Remove element from closed
                        open.push(successorNode);
                        successorNode.node.setOpen();
                        open.sort(comparator);
                    }
                    // 12
                    else return;
                }
                // 14
                else {
                    // 15
                    open.push(successorNode)
                    successorNode.node.setOpen()
                    open.sort(comparator);
                }
                successorNode.g = successorCurrCost; // 18
                successorNode.parent = currentNode; // 19
            });
            closed.push(currentNode) // 21
            currentNode.node.setClosed()
            this.drawMap();
        }
        if (currentNode.node !== destNode) {
            console.error('Det finnes ingen vei.');
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
    mapCanvas.aStar(map.getTile(35, 41), map.getTile(32, 28));
    mapCanvas.drawMap();
}

const blobStr = document.getElementById('data').innerHTML;
mazeInit(blobStr);

/** Heuristic function implementing Euclidian distance 
 * uses like pythagoras and such
*/
function h(startTile, destTile) {
    const deltaX = destTile.x - startTile.x;
    const deltaY = destTile.y - startTile.y;
    return Math.abs(deltaX) + Math.abs(deltaY);
}

/**
 * Assumes input nodes on form {node, g, parent}
 */
function f(currentNode, destNode) {
    return h(currentNode.node, destNode) + currentNode.g;
}