/*
Project 3 Hints: Cleaning up an external mesh file
To transform a mesh to your desired size, orientation and position, in Meshlab:
	-import an external mesh as an obj file (or some other format, but not json!)
		-File->import mesh
	-scale and orient mesh to size you want:
		-Filters->Normals,Curvatures and orientation ->Transform: ... (6 options)
	-when done:
		-File->export mesh as-> choose json extension and save file
*/

//Project 3 Hints: Multiple objects example file, based off of mesh-viewer.js

var canvas;
var gl;

//ortho parameters
var d = 1.5;
var near = -d;
var far = d;
var left = -d;
var right = d;
var ytop = d;
var bottom = -d;

//eye  parameters
var radius = 1.0;
var theta  = 0.0;
var phi    = 0.0;
var rotation_by_5_deg = 5.0 * Math.PI/180.0;

var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);

var program1, vPosition1, vColor, projectionMatrix1Loc, modelViewMatrix1Loc;
var program2, vPosition2, projectionMatrix2Loc, modelViewMatrix2Loc;
var projectionMatrix, modelViewMatrix;

//Object 1: square
var vertices1 = [
        vec3(-0.25, -0.25,0),   //0
        vec3(-0.25, 0.25,0),    //1
        vec3(0.25, 0.25,0),     //2
        vec3(0.25, -0.25,0)     //3
    ];
var indices1 = [0,1,2,0,2,3];
var vColor1 = vec4(1.0, 0.0, 0.0, 1.0);
var vColors1 = [vColor1,vColor1,vColor1,vColor1];
var iBuffer1, vBuffer1, cBuffer1;

//Object 2: triangle
var vertices2 = [
       vec3(0.5,0,0),      //0
       vec3(0.8,0,0),      //1
       vec3(0.65,0.3,0)    //2
    ];
var indices2 = [0,1,2];
var vColor2 = vec4(0.0, 0.0, 1.0, 1.0);
var vColors2 = [vColor2,vColor2,vColor2,vColor2];
var iBuffer2, vBuffer2, cBuffer2;

//Object 3: mesh
var vertices3 = myMesh.vertices[0].values;
var indices3 = myMesh.connectivity[0].indices;
var iBuffer3, vBuffer3;

window.onload = function init()
{
    var canvas = document.getElementById( "gl-canvas" );
    
	gl = canvas.getContext('webgl2');
    if (!gl) alert("WebGL 2.0 isn't available");

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.0, 0.0, 0.0, 1.0 );
    gl.enable(gl.DEPTH_TEST);

    program1 = initShaders( gl, "vertex-shader1", "fragment-shader1");
    program2 = initShaders( gl, "vertex-shader2", "fragment-shader2");
    
    //program1 for square and triangle
    gl.useProgram(program1);
    
    //Object 1:
    //array element buffer
    iBuffer1 = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer1);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices1), gl.STATIC_DRAW);
    
    //color array attribute buffer    
    cBuffer1 = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer1 );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(vColors1), gl.STATIC_DRAW );
    
    //vertex array attribute buffer   
    vBuffer1 = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer1 );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices1), gl.STATIC_DRAW );

    //Object 2:
    //array element buffer
    iBuffer2 = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer2);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices2), gl.STATIC_DRAW);

    //color array attribute buffer    
    cBuffer2 = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer2 );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(vColors2), gl.STATIC_DRAW );
    
    //vertex array attribute buffer   
    vBuffer2 = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer2 );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices2), gl.STATIC_DRAW );
 
    //Change shader program for mesh
    gl.useProgram(program2);
    
    //Object 3: mesh
    //array element buffer
    iBuffer3 = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer3);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices3), gl.STATIC_DRAW);
    
    //vertex array attribute buffer   
    vBuffer3 = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer3);
    gl.bufferData( gl.ARRAY_BUFFER, new Float32Array(vertices3), gl.STATIC_DRAW);
    
    //set variables for program1
    vPosition1 = gl.getAttribLocation(program1, "vPosition");
    vColor = gl.getAttribLocation(program1, "vColor");
    projectionMatrix1Loc = gl.getUniformLocation(program1, "projectionMatrix");   
    modelViewMatrix1Loc = gl.getUniformLocation(program1, "modelViewMatrix");  
    
    //set variables for program2
    vPosition2 = gl.getAttribLocation(program2, "vPosition");
    projectionMatrix2Loc = gl.getUniformLocation(program2, "projectionMatrix");
    modelViewMatrix2Loc = gl.getUniformLocation(program2, "modelViewMatrix");
 
    //buttons for moving viewer and changing size
    document.getElementById("Button1").onclick = function(){near  *= 1.02; far *= 1.02;};
    document.getElementById("Button2").onclick = function(){near *= 0.98; far *= 0.98;};
    document.getElementById("Button3").onclick = function(){radius *= 1.1;};
    document.getElementById("Button4").onclick = function(){radius *= 0.9;};
    document.getElementById("Button5").onclick = function(){theta += rotation_by_5_deg;};
    document.getElementById("Button6").onclick = function(){theta -= rotation_by_5_deg;};
    document.getElementById("Button7").onclick = function(){phi += rotation_by_5_deg;};
    document.getElementById("Button8").onclick = function(){phi -= rotation_by_5_deg;};
    document.getElementById("Button9").onclick = function(){left  *= 0.9; right *= 0.9;};
    document.getElementById("Button10").onclick = function(){left *= 1.1; right *= 1.1;};
    document.getElementById("Button11").onclick = function(){ytop  *= 0.9; bottom *= 0.9;};
    document.getElementById("Button12").onclick = function(){ytop *= 1.1; bottom *= 1.1;}; 
    
    render();
}

function render()
{
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
 
    var eye = vec3( radius*Math.sin(theta)*Math.cos(phi), 
                    radius*Math.sin(theta)*Math.sin(phi),
                    radius*Math.cos(theta)
                   );

    modelViewMatrix = lookAt(eye, at, up); 
    projectionMatrix = ortho(left, right, bottom, ytop, near, far);

    //Draw square and triangle
    gl.useProgram(program1);
    gl.uniformMatrix4fv( projectionMatrix1Loc, false, flatten(projectionMatrix));
    gl.uniformMatrix4fv( modelViewMatrix1Loc, false, flatten(modelViewMatrix));
    
    //Draw object 1: Square
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer1);

    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer1);
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor); 
    
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer1);
    gl.vertexAttribPointer(vPosition1, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition1);
    
    gl.drawElements(gl.TRIANGLES, indices1.length, gl.UNSIGNED_SHORT, 0); 
    
    //Draw object 2:Triangle
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer2);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer2);
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor); 

    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer2);
    gl.vertexAttribPointer(vPosition1, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray( vPosition1);
    
    gl.drawElements(gl.TRIANGLES, indices2.length, gl.UNSIGNED_SHORT, 0); 
     
    //Draw object 3:Mesh
    //change program
    gl.useProgram(program2); 
    gl.uniformMatrix4fv( projectionMatrix2Loc, false, flatten(projectionMatrix));
    gl.uniformMatrix4fv( modelViewMatrix2Loc, false, flatten(modelViewMatrix));
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer3);
 
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer3);
    gl.vertexAttribPointer(vPosition2, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition2);
    
    gl.drawElements(gl.LINES, indices3.length, gl.UNSIGNED_SHORT, 0);   
    
    //animate
    requestAnimationFrame(render);
}

