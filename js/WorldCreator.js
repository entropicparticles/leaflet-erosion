//functions return number from 0 to (maxIter-1)
function worldCreator(cx, cy, perlinSeed, rands) {
  var iter,mount,continental;
  var ccx = cx;
  var ccy = cy;
		
  // Mountains
  mount = (noise.perlin2(ccx*3,ccy*3)+1)/12 + (noise.perlin2(ccx*32,ccy*32)+1)/16/16;
  mount = Math.pow(Math.abs((1-Math.abs((mount-0.1)/(0.23-0.1)))),4);
  
  var sum = 0;
  for(kk=0; kk < rands[0]; kk++ ) {
  	sum += Math.exp( -( Math.pow(ccx-0.8*rands[kk+1],2)+Math.pow(ccy-0.7*rands[kk+7],2) )/(2*0.03*rands[kk+13]) );
  }
  continental = Math.pow(Math.min( 0.95, sum )/0.95,1);
  
  sum = 0;
  noise.seed(perlinSeed);
  for(kk=2; kk <= 6; kk+=2 ) {
  	q = Math.pow(2,kk);
  	sum +=  2*(noise.perlin2( ccx*q, ccy*q)+1)/2/q;
  }
  // Perlin plus some extra elevation for making an island (arbitrary)
  boundary = Math.abs(1.05*ccx) >=1 || Math.abs(1.1*ccy*2) >=1 ? 0 : Math.pow(Math.abs(Math.cos(1.05*ccx*Math.PI/2)*Math.cos(1.1*ccy*Math.PI)),0.5);
  iter = sum;	
  basic = (mount*continental+2*continental+mount*0.75 + Math.max(continental,mount));
  iter = basic + 12*iter + 2*basic*iter;
  iter = iter*(1+boundary);
  return iter;
}

function elevationRescaling(iter, sea, max) {
  var iter0 = Math.max(0,iter-sea)/(max-sea);
  iter0 = Math.pow(iter0,2);
  return iter0;
 }
 
// Weighted interpolation
var weightedFunction = function(cx, cy, maxIter, grid, correlationDistance) {
 
  var zAverage = 0;
  var module   = 0;	
  for(var k=0;k<grid.length;k++){
    var distance = (Math.pow(cx-grid[k].x,2) + Math.pow(cy-grid[k].y,2));
    var weightFactor = Math.exp(-distance/correlationDistance);
    zAverage += weightFactor*grid[k].z;
    module += weightFactor;	  
  }
  var iter = Math.max(0,zAverage/module);

  iter = Math.round(maxIter*Math.min(0.95,iter));
  return iter;
}
 
// Linear interpolation for random quadrilaterals
var linearFunction = function(cx, cy, maxIter, grid, dx) {

  if( grid[0] && grid[1] && grid[2] && grid[3] ) {
// linear interpolation 

    var z00 = grid[0].z;
    var z10 = grid[1].z;
    var z11 = grid[2].z;
    var z01 = grid[3].z;
	
    var x   = cx - grid[0].x;
    var y   = cy - grid[0].y;
    var x10 = grid[1].x - grid[0].x;
    var y10 = grid[1].y - grid[0].y;
    var x11 = grid[2].x - grid[0].x;
    var y11 = grid[2].y - grid[0].y;
    var x01 = grid[3].x - grid[0].x;
    var y01 = grid[3].y - grid[0].y;	
	var points = [[x,y],[x10,y10],[x11,y11],[x01,y01]];
	
	// Mapping to a unit square
	points = reline4(rescaling3(shearing2(rotation1(points))));
    var r = points[0][0];
    var s = points[0][1];
    
    var iter = z00 + r*(-z00+z10) + s*(-z00+z01) + r*s*(z00-z10-z01+z11);
	//iter = Math.min( Math.sqrt(Math.pow(r,2)+Math.pow(s,2)), Math.sqrt(Math.pow(r-1,2)+Math.pow(s,2)), Math.sqrt(Math.pow(r-1,2)+Math.pow(s-1,2)), Math.sqrt(Math.pow(r,2)+Math.pow(s-1,2)) )*Math.sqrt(2); // Check mapping with this function in case
    iter = Math.round(maxIter*Math.min(0.95,iter));
	
  } else {
    var iter = 0;
  }
  return iter;
}

function rotation1(points){
	
	var a  = -Math.atan2(points[3][0],points[3][1]);
	var ca = Math.cos(a);
	var sa = Math.sin(a);
	var points0 = [];
	for(var i=0;i<points.length;i++){
	  var px =  ca*points[i][0] + sa*points[i][1];
	  var py = -sa*points[i][0] + ca*points[i][1];
	  points0.push([px,py]);
	}	
	return points0;
	
}
function shearing2(points){
	
	var a = -points[1][1]/points[1][0];
	var points0 = [];
	for(var i=0;i<points.length;i++){
	  var px =   points[i][0];
	  var py = a*points[i][0] + points[i][1];
	  points0.push([px,py]);
	}	
	return points0;
	
}
function rescaling3(points){
	
	var a = points[1][0];
	var b = points[3][1];
	var points0 = [];
	for(var i=0;i<points.length;i++){
	  var px = points[i][0]/a;
	  var py = points[i][1]/b;
	  points0.push([px,py]);
	}	
	return points0;
	
}
function reline4(points){
	
	var x110 = points[2][0];
	var y110 = points[2][1];
	var points0 = [];
	for(var i=0;i<points.length;i++){
	  if(points[i][1]/points[i][0]>y110/x110) { 
	    var px = points[i][0]/x110;
	    var py = (x110*points[i][1] + points[i][0]*(1-y110))/x110;
	  } else {
	    var py = points[i][1]/y110;
	    var px = (y110*points[i][0] + points[i][1]*(1-x110))/y110;		  
	  }
	  points0.push([px,py]);
	}	
	return points0;
	
}


// Linear interpolation for squares
var linearPixelFunction = function(cx, cy, maxIter, grid, dx) {

  if( grid[0] && grid[1] && grid[2] && grid[3] ) {
// linear interpolation 
	
    var z00 = grid[0].z;
    var z10 = grid[1].z;
    var z01 = grid[2].z;
    var z11 = grid[3].z;
	
    var r = (cx+1)/dx;
    r = r - Math.floor(r);
    var s = (cy+0.5)/dx;
    s = s - Math.floor(s);
    
    var iter = z00 + r*(-z00+z10) + s*(-z00+z01) + r*s*(z00-z10-z01+z11);
    iter = Math.round(maxIter*Math.min(0.95,iter));
	
  } else {
    var iter = 0;
  }
  return iter;
}

// Erosion function
function rivers(grid) {
	
  var le = grid.length;
  var gridS = Math.sqrt(le/2);
  var ffsea=0;
  for(var tyu=2;tyu>0;tyu--) {
    for(k = le - 1;k>=0;k--) {
      if( grid[k].type == 0 ) {
        var kn = k;
        var count = 1;
        var path = [];
        path.push(kn);
        kk = Math.floor(Math.random()*3)+1;
        grid[kn].flux += kk;
        grid[kn].type = 1; 
        end = 0;
        while(end == 0){
          var ng = [ grid[Math.max(0,Math.min( (kn+2*gridS), le-1 ))], 
		             grid[Math.max(0,Math.min( (kn+1)      , le-1 ))],
					 grid[Math.max(0,Math.min( (kn-2*gridS), le-1 ))], 
					 grid[Math.max(0,Math.min( (kn-1)      , le-1 ))] 
				    ];
          ng.sort(function(a, b){return a.z - b.z;});
          var kb=0;
          var check=1;
          while( check==1 && kb<ng.length ){
          	check=0;
          	for(var t=0;t<path.length;t++){
          	  if( path[t] == ng[kb].id ){
          	    kb++;
          	    check=1;
          	    break;
          	  }
          	}
          }
          if( kb==ng.length ){ 
          	kb = Math.floor(Math.random()*4); 
          	count++;
          	if(count==2) end=1;
          }
          var h = grid[kn].z - ng[kb].z;
          if( h==0 ){
		    var zeros = 0;
		    while( grid[kn].z - ng[Math.min(zeros,3)].z == 0 && zeros < 4 ) zeros++;
			kb = Math.floor(Math.random()*(zeros-kb))+kb;
		  }
          grid[kn].nb = ng[kb].id;
          kn = ng[kb].id;
          if( h < 0 ){
          	grid[kn].h = Math.min(h,grid[kn].h);
          }
          if( grid[kn].type == -1){
          	grid[kn].flux += kk;
          	grid[kn].nb = kn;
          	end=1; 
          } else {  
          	grid[kn].type = 1;
          	grid[kn].flux += kk; 
          }
          path.push(kn);
          kk+=Math.random()*5+1;
        }
      }
    }
    var veces0=1;
    if(tyu==1) veces0=0;  
    for(var veces = 0;veces<veces0;veces++) {
      for(k = 0;k<le;k++) {
        if( grid[k].z > ffsea ) {
          var ngg = [ (k+1)%le,(k-1)%le,(k-2*gridS)%le,(k+2*gridS)%le ];
          var dd = grid[k].flux;
          for(i=0;i<4;i++){
      	    var k2 = Math.max(0,Math.min(ngg[i], le-1 ))
      	    dd += grid[k2].flux/16;
          }
        grid[k].flux2 = dd;
        }
	  }
      for(k = 0;k<le;k++) { 
        grid[k].flux = grid[k].flux2;
      }
    }	
	var hmaxmin = grid.map(function(g){return g.h})
	                  .filter(function(g){return g != 0;})
					  .sort(function(a, b) {return a - b;})[0];
    //console.log(hmaxmin);
    for(k = 0;k<le;k++) {
	  var a=1;
	  var f = grid[k].flux;//*(a+(1-a)*(1-grid[k].h/hmaxmin));
      if(f!=0) { 
	    grid[k].z = grid[k].z*Math.pow( f ,-0.05)/Math.pow( Math.log( f+1 ),0.5); 
	  }
    }		
  
  }
  var newmax = 0;
  for(k = 0;k<le;k++) {
  	grid[k].z = Math.max(0,grid[k].z-0.0001);
  	newmax = Math.max( grid[k].z, newmax);
  }
  
  for(k = 0;k<le;k++) { 
  	grid[k].z = Math.pow(grid[k].z*0.999/newmax,0.75*(1-grid[k].z));
  }
	
  return grid;
}