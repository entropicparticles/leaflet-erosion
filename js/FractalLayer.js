L.TileLayer.FractalLayer = L.TileLayer.Canvas.extend({
	
	options: {
		async: true,
		maxZoom:23,
        continuousWorld:false
	},
	
	initialize: function (colorController, numWorkers, input) {
		this.numWorkers = numWorkers;
		this._workers = [];
        this._colorController = colorController;        
        this.messages={};
        this.queue={total: numWorkers};
        this._paletteName = null;
        this._paletteSended = false;
        this.maxIter = input.maxIter || 5000;
		this.input   = input;
	},
	
    onAdd: function(map) {
        var _this = this;
    	var i = 0;
        var next;
        this.queue.free = [];
        this.queue.len =0;
        this.queue.tiles = [];
        this._workers = new Array(this.numWorkers);
        
    	while(i<this.numWorkers){
            this.queue.free.push(i);
		    this._workers[i]=new Worker("js/FractalWorker.js");
            
            
            this._workers[i].onmessage=function(e) {
                if (!e.data) {
                    return;
                };
                
                var canvas;
                if(_this.queue.len) {
                    _this.queue.len--;
                    next = _this.queue.tiles.shift();
                    _this._renderTile(next[0],next[1],e.data.workerID);
                } else {
                    _this.queue.free.push(e.data.workerID);
                }
                if (e.data.tileID in _this.messages) {
                    canvas = _this.messages[e.data.tileID];
                } else {
                    return;
                }
                
                var array = new Uint8Array(e.data.pixels);
                var ctx = canvas.getContext('2d');
                var imagedata = ctx.getImageData(0, 0, 256, 256);
                imagedata.data.set(array);
                ctx.putImageData(imagedata, 0, 0);
                _this.tileDrawn(canvas);
            };
		    i++;
		}
        
        this._sendPalette();
        
        this.on("tileunload", function(e) {
            if(e.tile._tileIndex){
                var pos = e.tile._tileIndex,
                    tileID = [pos.x, pos.y, pos.z].join(':');
                if(tileID in _this.messages){
                    delete _this.messages[tileID];
                }
            }
        });
        
         map.on("zoomstart",function() {
            this.queue.len = 0;
            this.queue.tiles = [];
        }, this);
        
        return L.TileLayer.Canvas.prototype.onAdd.call(this,map);
    },
	
    onRemove:function(map){
        this.messages={};
        var len = this._workers.length;
        var i =0;
            while(i<len){
            this._workers[i].terminate();
            i++;
        }
        this._workers = [];
        this._paletteSended = false;
        return L.TileLayer.Canvas.prototype.onRemove.call(this,map);
    },
    
	drawTile: function (canvas, tilePoint) {
        if (!this._paletteName) {
            this.tileDrawn(canvas);
            return;
        }        
        if (!this.queue.free.length){
            this.queue.tiles.push([canvas,tilePoint]);
            this.queue.len++;
        } else {
            this._renderTile(canvas, tilePoint,this.queue.free.pop());
        }
	},
	
    setPalette: function(paletteName) {
        this._paletteName = paletteName;        
        this._paletteSended = false;
        this._sendPalette();        
        this.queue.len = 0;
        this.queue.tiles = [];
        if (this._map) {
            this.redraw();
        }
    },
    
    _sendPalette: function() {
        if (this._paletteSended || !this._workers.length || !this._paletteName) {
            return;
        }        
        var palette = this._colorController.getPaletteAsBuffer(this._paletteName, this.maxIter);
        for (var w = 0; w < this.numWorkers; w++) {
            var paletteClone = palette.slice(0);
            this._workers[w].postMessage({
                command: 'palette',
                palette: paletteClone
            }, [paletteClone]);
        }        
        this._paletteSended = true;
    },
    
    _renderTile: function (canvas, tilePoint, workerID) {
        var z = this._map.getZoom();
    	canvas._tileIndex = {x: tilePoint.x, y: tilePoint.y, z: z};
        var tileID=tilePoint.x+":"+tilePoint.y+":"+z;
        this.messages[tileID]=canvas;
		
		var inputWorker = this.input;
        inputWorker = {
          'type':       this.input.type,
          'maxIter':    this.input.maxIter,
          'seed':       this.input.seed,
          'sea':        this.input.sea,
          'max':        this.input.max,
          'ran':        this.input.ran,
          'angle':      this.input.angle,
          'nivel8':     this.input.nivel8,
          'resolution': this.input.resolution
        }		
        var scale = Math.pow(2, z - 1);
		var level = 0;
		if( this.input.type == "perlin" || this.input.type == "perlin3" ) level = scale*this.input.nivel8/256;
        var x0 = (tilePoint.x-0.5) / scale - 1;
        var y0 = (tilePoint.y-0.5) / scale - 1;
        var x1 = (tilePoint.x+1.5) / scale - 1;
        var y1 = (tilePoint.y+1.5+level) / scale - 1;
		var ijk = Math.pow(2,Math.max(0,this.input.resolution-z));
		
		var inputGrid = [];
		for(var k=0;k<this.input.grid.length;k++){
		  var g = this.input.grid[k];
		  var gx = g.x;
		  var gy = g.y;			
		  if( this.input.type == "perlin" || this.input.type == "perlin3" ) {
			 var ggx = gx;
			 var ggy = gy;
			 var angle_R = -this.input.angle;
			 gx = Math.cos(angle_R*Math.PI)*ggx-Math.sin(angle_R*Math.PI)*ggy;
			 gy = 0.5*(Math.sin(angle_R*Math.PI)*ggx+Math.cos(angle_R*Math.PI)*ggy); 			 
		  }
		  if(x0 < gx && gx < x1 && y0 < gy && gy < y1 && Math.floor(g.id/this.input.gridLength) % ijk == 0 && (g.id % this.input.gridLength) % ijk == 0) inputGrid[g.id] = g;
		}
		inputWorker.grid = inputGrid;
		inputWorker.gridLength = this.input.gridLength;
		
        this._workers[workerID].postMessage({
            command: 'render',
              x:          tilePoint.x, 
              y:          tilePoint.y, 
              z:          z,
              tileID:     tileID,
              workerID:   workerID,
			  input:      inputWorker
        });
    }
});

L.tileLayer.fractalLayer = function(colorController, numWorkers, input){
	return new L.TileLayer.FractalLayer(colorController, numWorkers, input);
}
