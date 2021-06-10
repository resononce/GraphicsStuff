// Assumes vertices for patches and indices of patch pointers into
// those vertices exists in separate files that are loaded in your
// HTML file.

var numDivisions = 10;		// Points computed along each cubic bezier

var points = [];		// Array of points sent to the vertex buffer

var modelView = [];		// MV matrix
var projection = [];		// Projection matrix

var theta = new Array(3);	// Rotation angle around each axis
theta = [0, 0, 0];

var axis =0;			// Current axis of rotation

var xAxis = 0;
var yAxis = 1;
var zAxis = 2;

var program;

var flag = true;		// flag to toggle rotation

// Return an array with the Bernstein polys of degree three evaluated
// at u
bezier = function(u) {
    var b =new Array(4);
    var a = 1-u;
    b[3] = a*a*a;
    b[2] = 3*a*a*u;
    b[1] = 3*a*u*u;
    b[0] = u*u*u;
    return b;
}

// The data array contains the Bezier mesh points for one patch.  The
// number of points in each direction on the mesh is given by the
// global variable numDivisions.  put_data_to_vb must push the points
// onto the vertex buffer array in the way appropriate for rendering
// each quad.  In its current version, it pushes the points
// corresponding to a quad.
put_data_to_vb = function (data) {

    for(var i=0; i<numDivisions; i++)
	for(var j =0; j<numDivisions; j++) {
	    points.push(data[i][j]);
	    points.push(data[i+1][j]);
	    points.push(data[i+1][j+1]);
	    points.push(data[i][j+1]);
        }
}    

// Compute all 3-D coordinates on the Bezier mesh
compute_patch_points = function () {

    var h = 1.0/numDivisions;

    patch = new Array(numPatches);
    for(var i=0; i<numPatches; i++)
	patch[i] = new Array(16);
    for(var i=0; i<numPatches; i++) 
	// 16 vertices for one cubic Bezier patch
        for(j=0; j<16; j++) {
            patch[i][j] = vec4([vertices[indices[i][j]][0],
				vertices[indices[i][j]][2], 
				vertices[indices[i][j]][1], 1.0]);
	}

    for ( var n = 0; n < numPatches; n++ ) {
        // Compute all data points on one patch
        var data = new Array(numDivisions+1);
        for(var j = 0; j<= numDivisions; j++)
            data[j] = new Array(numDivisions+1);
        for(var i=0; i<=numDivisions; i++)
            for(var j=0; j<= numDivisions; j++) { 
            data[i][j] = vec4(0,0,0,1);
            var u = i*h;
            var v = j*h;
            var t = new Array(4);
            for(var ii=0; ii<4; ii++)
                t[ii]=new Array(4);
            for(var ii=0; ii<4; ii++)
                for(var jj=0; jj<4; jj++) 
                t[ii][jj] = bezier(u)[ii]*bezier(v)[jj];
                
            for(var ii=0; ii<4; ii++)
                for(var jj=0; jj<4; jj++) {
                // MV's scale operation will actually do the
                // matrix operation we need to evaluate the 3-D
                // analogue of the Bezier matrix
                temp = vec4(patch[n][4*ii+jj]);            
                temp = scale( t[ii][jj], temp);
                // Use MV's add function to add the vec4's
                // data[i][j], which is [0,0,0,1] and temp,
                // which has the first three coordinates we
                // want
                data[i][j] = add(data[i][j], temp);
                }
            }
        // Then push the data points for this patch to the vertex
        // buffer array
        put_data_to_vb(data);
    }
}


onload = function init()  {
    
    canvas = document.getElementById( "gl-canvas" );
    
 	gl = canvas.getContext('webgl2');
    if (!gl) alert("WebGL 2.0 isn't available");

    gl.viewport( 0, 0, canvas.width, canvas.height );
    
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    compute_patch_points();	// Call this to fill the points array
				// with all vertex coordinates on the
				// Bezier mesh
    
    document.getElementById("ButtonX").onclick = function(){axis = xAxis;};
    document.getElementById("ButtonY").onclick = function(){axis = yAxis;};
    document.getElementById("ButtonZ").onclick = function(){axis = zAxis;};
    document.getElementById("ButtonT").onclick = function(){flag = !flag;};

    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    var vBufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBufferId );
    
    
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
    
    projection = ortho(-2.5, 2.5, -2.5, 2.5, -20, 20);
    
    gl.uniformMatrix4fv( gl.getUniformLocation(program, "Projection"), false, flatten(projection));

    render();
}

var render = function(){
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    if(flag) theta[axis] += 0.5;
    
    modelView = mat4();
    
    modelView = mult(modelView, rotate(theta[xAxis], [1, 0, 0]));
    modelView = mult(modelView, rotate(theta[yAxis], [0, 1, 0]));
    modelView = mult(modelView, rotate(theta[zAxis], [0, 0, 1]));


    gl.uniformMatrix4fv( gl.getUniformLocation(program, "ModelView"), false, flatten(modelView) );
    
    for(var i=0; i<points.length; i+=4)
        gl.drawArrays( gl.LINE_LOOP, i, 4 );

    requestAnimationFrame(render);
}
