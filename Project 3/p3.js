var canvas;
var gl;

//#region ortho parameters
var d = 3;
var near = -d;
var far = d;
var left = -d;
var right = d;
var ytop = d;
var bottom = -d;
//#endregion

//#region eye  parameters
var radius = 1.0;
var theta = 0.0;
var phi = 0.0;
var rotation_by_5_deg = 5.0 * Math.PI / 180.0;

var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);
//#endregion

//#region light
//For each light source, set RGBA and position:
//Ldr, Ldg, Ldb, Lsr, Lsg, Lsb, Lar, Lag, Lab
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 ); // white light
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );
//Position is in homogeneous coordinates
//If w =1.0, we are specifying a finite (x,y,z) location
//If w =0.0, light at infinity
var lightPosition = vec4(1.0, 1.0, 1.0, 1.0 );

//Material properties with ambient, diffuse, specular
var materialDiffuse = vec4( 0.0, 0.0, 1.0, 1.0); // blue material
var materialAmbient = vec4( 1.0, 1.0, 1.0, 1.0 );
var materialSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );
//metallic?
var materialShininess = 100.0;
//#endregion

var program1, vPosition1, vColor, projectionMatrix1Loc, modelViewMatrix1Loc;
var program2, vPosition2, projectionMatrix2Loc, modelViewMatrix2Loc, vNormal;

var projectionMatrix, modelViewMatrix;



//#region Object 1: Square
var vertices1 = [
    vec3(0.25, -0.25, 0.75),
    vec3(0.25, 0.25, 0.75),
    vec3(0.75, 0.25, 0.75),
    vec3(0.75, -0.25, 0.75),
    vec3(0.25, -0.25, 0.25),
    vec3(0.25, 0.25, 0.25),
    vec3(0.75, 0.25, 0.25),
    vec3(0.75, -0.25, 0.25),
];

var indices1 = [1, 0, 3, 1, 3, 2, 2, 3, 7, 2, 7, 6, 3, 0, 4, 3, 4, 7, 6, 5, 1, 6, 1, 2, 4, 5, 6, 4, 6, 7, 5, 4, 0, 5, 0, 1];
var normals1 = [];
var vColor1 = vec4(1.0, 0.0, 0.0, 1.0);
var vColors1 = [vColor1, vColor1, vColor1, vColor1];
var iBuffer1, vBuffer1, cBuffer1, nBuffer1;
//#endregion

//#region Object 2: sphere
//to be instantiated in method
var vertices2 = [];
var indices2 = [];
var normals2 = [];
var vColor2 = vec4(0.0, 0.0, 1.0, 1.0);
var vColors2 = [vColor2, vColor2, vColor2, vColor2];
var iBuffer2, vBuffer2, cBuffer2, nBuffer2;
//#endregion

//#region Object 3: mesh
var vertices3 = teapot.vertices[0].values;
var indices3 = teapot.connectivity[0].indices;
var normals = teapot.vertices[1].values;
var iBuffer3, vBuffer3, nBuffer;
//#endregion

window.onload = function init() {
    var canvas = document.getElementById("gl-canvas");

    gl = canvas.getContext('webgl2');
    if (!gl) alert("WebGL 2.0 isn't available");

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    calcSphere();
    sphereIndices();

    program1 = initShaders(gl, "vertex-shader1", "fragment-shader1");
    program2 = initShaders(gl, "vertex-shader2", "fragment-shader2");

    //program1 for square and triangle
    gl.useProgram(program1);
    //#region Object 1
    //array element buffer
    iBuffer1 = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer1);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices1), gl.STATIC_DRAW);

    //color array attribute buffer    
    cBuffer1 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer1);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vColors1), gl.STATIC_DRAW);

    //vertex array attribute buffer   
    vBuffer1 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer1);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices1), gl.STATIC_DRAW);
    //#endregion

    //#region Object 2:
    //array element buffer
    iBuffer2 = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer2);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices2), gl.STATIC_DRAW);

    //color array attribute buffer    
    cBuffer2 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer2);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vColors2), gl.STATIC_DRAW);

    //vertex array attribute buffer   
    vBuffer2 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer2);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices2), gl.STATIC_DRAW);

    //Change shader program for mesh
    gl.useProgram(program2);
    //#endregion

    //#region Object 3: mesh
    //array element buffer
    iBuffer3 = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer3);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices3), gl.STATIC_DRAW);

    //vertex array attribute buffer   
    vBuffer3 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer3);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices3), gl.STATIC_DRAW);
    //#endregion

    //set variables for program1
    vPosition1 = gl.getAttribLocation(program1, "vPosition");
    vColor = gl.getAttribLocation(program1, "vColor");
    projectionMatrix1Loc = gl.getUniformLocation(program1, "projectionMatrix");
    modelViewMatrix1Loc = gl.getUniformLocation(program1, "modelViewMatrix");

    //set variables for program2
    vPosition2 = gl.getAttribLocation(program2, "vPosition");
    projectionMatrix2Loc = gl.getUniformLocation(program2, "projectionMatrix");
    modelViewMatrix2Loc = gl.getUniformLocation(program2, "modelViewMatrix");

    var nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW );

    var vNormal = gl.getAttribLocation( program2, "vNormal" );
    gl.vertexAttribPointer( vNormal, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal);

    

    //buttons for moving viewer and changing size
    document.getElementById("Button1").onclick = function () {
        near *= 1.02;
        far *= 1.02;
    };
    document.getElementById("Button2").onclick = function () {
        near *= 0.98;
        far *= 0.98;
    };
    document.getElementById("Button3").onclick = function () {
        radius *= 1.1;
    };
    document.getElementById("Button4").onclick = function () {
        radius *= 0.9;
    };
    document.getElementById("Button5").onclick = function () {
        theta += rotation_by_5_deg;
    };
    document.getElementById("Button6").onclick = function () {
        theta -= rotation_by_5_deg;
    };
    document.getElementById("Button7").onclick = function () {
        phi += rotation_by_5_deg;
    };
    document.getElementById("Button8").onclick = function () {
        phi -= rotation_by_5_deg;
    };
    document.getElementById("Button9").onclick = function () {
        left *= 0.9;
        right *= 0.9;
    };
    document.getElementById("Button10").onclick = function () {
        left *= 1.1;
        right *= 1.1;
    };
    document.getElementById("Button11").onclick = function () {
        ytop *= 0.9;
        bottom *= 0.9;
    };
    document.getElementById("Button12").onclick = function () {
        ytop *= 1.1;
        bottom *= 1.1;
    };


    render();
}

function render() {

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var eye = vec3(radius * Math.sin(theta) * Math.cos(phi),
        radius * Math.sin(theta) * Math.sin(phi),
        radius * Math.cos(theta)
    );

    modelViewMatrix = lookAt(eye, at, up);
    projectionMatrix = ortho(left, right, bottom, ytop, near, far);

    //Draw square and sphere\
    gl.uniformMatrix4fv(projectionMatrix1Loc, false, flatten(projectionMatrix));
    gl.uniformMatrix4fv(modelViewMatrix1Loc, false, flatten(modelViewMatrix));

    //Draw object 1: Square
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer1);

    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer1);
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer1);
    gl.vertexAttribPointer(vPosition1, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition1);

    gl.drawElements(gl.TRIANGLES, indices1.length, gl.UNSIGNED_SHORT, 0);

    //Draw object 2:Sphere
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer2);

    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer2);
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer2);
    gl.vertexAttribPointer(vPosition1, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition1);

    gl.drawElements(gl.TRIANGLES, indices2.length, gl.UNSIGNED_SHORT, 0);

    //Draw object 3:Mesh
    //change program
    gl.useProgram(program2);
    gl.uniformMatrix4fv(projectionMatrix2Loc, false, flatten(projectionMatrix));
    gl.uniformMatrix4fv(modelViewMatrix2Loc, false, flatten(modelViewMatrix));

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer3);

    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer3);
    gl.vertexAttribPointer(vPosition2, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition2);


    gl.drawElements(gl.TRIANGLES, indices3.length, gl.UNSIGNED_SHORT, 0);

    //animate
    requestAnimationFrame(render);
}

/**
 * for every point on a sphere, add a vector to the list, fairly straightforward, though math dense
 */
function calcSphere() {
    var circleResolution = 60;
    var radius = .2;
    var object = [];
    for (var u = 0; u < Math.PI; u += (Math.PI / circleResolution)) {
        for (var v = 0; v < Math.PI * 2; v += (Math.PI * 2 / circleResolution)) {
            var x = radius * Math.sin(u) * Math.cos(v) - .5;
            var y = radius * Math.sin(u) * Math.sin(v) - .5;
            var z = radius * Math.cos(u);
            object.push(
                vec3(x, y, z)
            );
        }
    }
    vertices2 = object;
}

/**
 * adds ordered indeces to indeces2 to so the sphere can be drawn, to be completely honest
 * I dont really understand the math behind the ordering, 
 * but it is significantly better than every iterative solution i could think of
 */
function sphereIndices() {
    var resolution = 60;
    for (j = 0; j < resolution; j++) {
        for (i = 0; i < resolution; i++) {
            p1 = j * (resolution + 1) + i;
            p2 = p1 + (resolution + 1);
            indices2.push(p1);
            indices2.push(p2);
            indices2.push(p1 + 1);
            indices2.push(p1 + 1);
            indices2.push(p2);
            indices2.push(p2 + 1);
        }
    }
}