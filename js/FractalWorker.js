var palette = null;

var commands = {
	
    palette: function(data, cb) {
        palette = new Uint32Array(data.palette);
    },
	
    render: function(data,cb) {
        if (!palette) {
            cb();
            return;
        };
        
        var scale = Math.pow(2, data.z - 1);
        var x0 = data.x / scale - 1;
        var y0 = data.y / scale - 1;
        var d = 1/(scale<<8);
        var pixels = new Array(65536);
		var voxel = Math.pow(2,9);
        var iter,i=65535;
		
		var nivel8     = data.input.nivel8; //pixeles a subir de tope
		var angle      = data.input.angle;
		var pMax       = data.input.max;
		var pSea       = data.input.sea;
		var pSeed      = data.input.seed;
		var rands      = data.input.ran;
        var maxIter    = data.input.maxIter;
		var type       = data.input.type;
		var grid       = data.input.grid;
		var gridLength = data.input.gridLength;
		var resolution = data.input.resolution;
        
        var debugIter = [];

		if(type == "perlin" ||type == "perlin3" ) {
			
          var maxIterAltura = type == "perlin" ? 512:512;          
		  i = 0;
          while (i <65536+256*nivel8*scale) {
            var px = i%256;
            var py = (i-px)>>8;
            var cx = x0 + px*d;
            var cy = y0 + py*d;		  	
		  	var ccx = (Math.cos(angle*Math.PI)*cx-Math.sin(angle*Math.PI)*cy*2);
		  	var ccy = (Math.sin(angle*Math.PI)*cx+Math.cos(angle*Math.PI)*cy*2);
		  	if( type == "perlin" )	{
		  	  ccx = Math.floor(voxel*ccx+0.5)/voxel;
		  	  ccy = Math.floor(voxel*ccy+0.5)/voxel;
		  	}		  	
		  	
		  	if ( Math.abs(ccx)>=1 || Math.abs(ccy)>=0.5 ) { 
		  	  iter = null;
		  	} else {		

			
			  // THIS IS JUST TO DEFINE ITER
			  var ijk = Math.pow(2,Math.max(0,resolution-data.z));
			  var nPoints = Math.sqrt( gridLength/2 );
			  var pi = Math.floor( (ccx+1)*nPoints/ijk )*ijk;
			  var pj = Math.floor( (ccy+0.5)*nPoints/ijk )*ijk;
			  var pID = (pi + pj*2*nPoints);
			  pID = Math.max(0,Math.min( pID, gridLength-1 )); // In case
			  
/*			  var gridIn = [];
			  // if weighted
			  for(var ii = -ijk; ii<=ijk; ii+=ijk){
			  for(var jj = -ijk; jj<=ijk; jj+=ijk){
			    if(grid[pID + ii + jj*2*nPoints]) gridIn.push(grid[pID + ii + jj*2*nPoints]);
			  }}  
		  	  iter = weightedFunction(ccx, ccy, maxIter, gridIn,0.5*ijk/nPoints);
*//*
			  //if linear-square
			  gridIn.push(grid[pID]);
			  gridIn.push(grid[pID + ijk ]);
			  gridIn.push(grid[pID + ijk*2*nPoints]);
			  gridIn.push(grid[pID + ijk*(1+2*nPoints)]);
		  	  iter = linearPixelFunction(ccx, ccy, maxIter, gridIn, ijk/nPoints);
*/			  
			  //if linear
              iter = 0;
			  for(var ii = -ijk; ii<=ijk; ii+=ijk){
			  for(var jj = -ijk; jj<=ijk; jj+=ijk){
				var shift = (ii + jj*2*nPoints);
			    var gridIn = [];
			    gridIn.push(grid[pID + shift]);
			    gridIn.push(grid[pID + ijk + shift ]);
			    gridIn.push(grid[pID + ijk*(1+2*nPoints) + shift]);
			    gridIn.push(grid[pID + ijk*2*nPoints + shift]);
			    if( gridIn[0] && gridIn[1] && gridIn[2] && gridIn[3] ){
				var poly = gridIn.map(function(r) {return [r.x,r.y]});
			    if( inside(poly, [ccx,ccy]) ){	  
                  iter = linearFunction(ccx, ccy, maxIter, gridIn, ijk/nPoints);
				  break;
			    }}
			  }}
			  
			  var iterH = iter/maxIter;
		  	  var iimax = Math.floor( Math.floor(iterH*maxIterAltura)/maxIterAltura*nivel8*scale );
			  
		  	  if(iter>0 && type == "perlin3"){
		  	  	iter = Math.min(maxIter,Math.abs(Math.round( iter*(1+0.1*noise.perlin2( ccx*Math.pow(2,13), ccy*Math.pow(2,13))) ) ));
		  	  } else if(iter>0 && type == "perlin") {
		  	  	iter = Math.min(maxIter,Math.abs(Math.round( iter+1.5*noise.perlin2( cx*Math.pow(2,13), cy*Math.pow(2,13)) ) ));
		  	  }
			  
		  	  if( iimax < 1 && i >= 0 && i < 65536 ) {
		  	  	pixels[i] = palette[iter];
		  	  } else {
		  	  	var ii = iimax;
		  	  	while( ii>=0 ) {
		  	  	  if( i-ii*256 >= 0 && i-ii*256 < 65536 ) { 
		  	  	    pixels[i-ii*256] = palette[Math.round( (iter - (iimax-ii)*maxIterAltura/(nivel8*scale)))]; 
		  	  	  }
		  	  	ii--;
		  	  	}
		  	  }
		  	}
		  	i++;
		  }

		} else if(type == "perlin2" || type == "perlin4") {
		  i = pixels.length-1;
		  while (i >= 0) {
		  	var px = i%256;
		  	var py = (i-px)>>8;
		  	var cx = (x0 + px*d);
		  	var cy = (y0 + py*d);
		  	var ccx = type == "perlin2" ? Math.floor(voxel*cx+0.5)/voxel : cx;
		  	var ccy = type == "perlin2" ? Math.floor(voxel*cy+0.5)/voxel : cy;
          
		  	if ( Math.abs(ccx)>=1 || Math.abs(ccy)>=0.5 ) { 
		  	  iter = null;
		  	} else {
				
			  // THIS IS JUST TO DEFINE ITER
			  var ijk = Math.pow(2,Math.max(0,resolution-data.z));
			  var nPoints = Math.sqrt( gridLength/2 );
			  var pi = Math.floor( (ccx+1)*nPoints/ijk )*ijk;
			  var pj = Math.floor( (ccy+0.5)*nPoints/ijk )*ijk;
			  var pID = (pi + pj*2*nPoints);
			  pID = Math.max(0,Math.min( pID, gridLength-1 )); // In case

/*			  var gridIn = [];
			  // if weighted
			  for(var ii = -ijk; ii<=ijk; ii+=ijk){
			  for(var jj = -ijk; jj<=ijk; jj+=ijk){
			    if(grid[pID + ii + jj*2*nPoints]) gridIn.push(grid[pID + ii + jj*2*nPoints]);
			  }}  
		  	  iter = weightedFunction(ccx, ccy, maxIter, gridIn,0.5*ijk/nPoints);
*//*
			  //if linear-square
			  gridIn.push(grid[pID]);
			  gridIn.push(grid[pID + ijk ]);
			  gridIn.push(grid[pID + ijk*2*nPoints]);
			  gridIn.push(grid[pID + ijk*(1+2*nPoints)]);
		  	  iter = linearPixelFunction(ccx, ccy, maxIter, gridIn, ijk/nPoints);
*/			  
			  //if linear
              iter = 0;
			  for(var ii = -ijk; ii<=ijk; ii+=ijk){
			  for(var jj = -ijk; jj<=ijk; jj+=ijk){
				var shift = (ii + jj*2*nPoints);
			    var gridIn = [];
			    gridIn.push(grid[pID + shift]);
			    gridIn.push(grid[pID + ijk + shift ]);
			    gridIn.push(grid[pID + ijk*(1+2*nPoints) + shift]);
			    gridIn.push(grid[pID + ijk*2*nPoints + shift]);
			    if( gridIn[0] && gridIn[1] && gridIn[2] && gridIn[3] ){
				var poly = gridIn.map(function(r) {return [r.x,r.y]});
			    if( inside(poly, [ccx,ccy]) ){	  
                  iter = linearFunction(ccx, ccy, maxIter, gridIn, ijk/nPoints);
				  break;
			    }}
			  }}
			  
		  	  iter = Math.min(maxIter,Math.abs(Math.round( 
			         iter*(0.8+0.2*noise.perlin2(ccx*Math.pow(2,11),ccy*Math.pow(2,11))) 
					 )));
			  
		  	}
		  	pixels[i--] = palette[iter];
		  }			
		}
		
        var array = new Uint32Array(pixels);
        data.pixels = array.buffer;
        cb(data,[data.pixels]);
    }
}

function inside(vs, point) {
    // ray-casting algorithm based on
    // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html

    var x = point[0], y = point[1];

    var inside = false;
    for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        var xi = vs[i][0], yi = vs[i][1];
        var xj = vs[j][0], yj = vs[j][1];

        var intersect = ((yi > y) != (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }

    return inside;
};

function callBack(a,b){
    self.postMessage(a,b);
}

self.onmessage=function(e){
    var commandName = e.data.command;
    
    if (commandName in commands) {
        commands[commandName](e.data, callBack);
    }
};

importScripts('perlin.js');
importScripts('WorldCreator.js');