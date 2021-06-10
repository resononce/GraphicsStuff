/**
 * couldnt figure out how to get only the teacup translated in the end.
 * otherwise basically I saved the buffers for each iteam and the applied the appropriate textures
 * not entirely sure if it worked on the teacup to be honest
 */
"use strict";

var canvas;
var gl;

var program;
var flag = true;

var colorsArray = [];
var colorsArray2 = [];

var texCoordsArray = [];
var texCoordsArray2 = [];

var texture;
var texture2;

var texCoord = [
    vec2(0, 0),
    vec2(0, 1),
    vec2(1, 1),
    vec2(1, 0)
];

//Square
var vertices = myMesh.vertices[0].values;
var indices = myMesh.connectivity[0].indices;
var normals = myMesh.vertices[1].values;
//Teacup
var vertices2 = teapot.vertices[0].values ;
var indices2 = teapot.connectivity[0].indices;
var normals2 = teapot.vertices[1].values;

var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc, vPosition;
var tBuffer, iBuffer, cBuffer, vBuffer, nBuffer, vNormal, colorLoc, texCoordLoc;
var tBuffer2, iBuffer2, cBuffer2, vBuffer2, nBuffer2, vNormal2, colorLoc2, texCoordLoc2;

var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0);
var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);
var lightPosition = vec4(1.0, 1.0, 1.0, 1.0);

//Material properties
var materialDiffuse = vec4(1.0, 1.0, 1.0, .1);
var materialAmbient = vec4(1.0, 1.0, 1.0, 1.0);
var materialSpecular = vec4(1.0, 1.0, 1.0, 1.0);
var materialShininess = 100.0;

var transLoc;
var translate = [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
];

var near = -2.5;
var far = 2.5;
var left = -2.5;
var right = 2.5;
var ytop = 2.5;
var bottom = -2.5;
var radius = 1.0;
var theta = 0.0;
var phi = 0.0;
var rotation_by_5_deg = 5.0 * Math.PI / 180.0;
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);

var texSize = 128;

// Create a checkerboard pattern using floats
var image1 = new Array();
for (var i = 0; i < texSize; i++) {
    image1[i] = new Array();
}
for (var i = 0; i < texSize; i++) {
    for (var j = 0; j < texSize; j++) {
        image1[i][j] = new Float32Array(4);
    }
}
for (var i = 0; i < texSize; i++) {
    for (var j = 0; j < texSize; j++) {
        var c = (((i & 0x8) == 0) ^ ((j & 0x8) == 0));
        image1[i][j] = [c, c, c, 1];
    }
}
// Convert floats to ubytes for texture
var image2 = new Uint8Array(4 * texSize * texSize);
for (var i = 0; i < texSize; i++) {
    for (var j = 0; j < texSize; j++) {
        for (var k = 0; k < 4; k++) {
            image2[4 * texSize * i + 4 * j + k] = 255 * image1[i][j][k];
        }
    }
}

function configureTexture(image) {
    texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    //Flip the Y values to match the WebGL coordinates
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    //Specify the image as a texture array:
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB,
        gl.RGB, gl.UNSIGNED_BYTE, image);

    //Set filters and parameters
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
        gl.NEAREST_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    //Link texture to a sampler in fragment shader
    gl.uniform1i(gl.getUniformLocation(program, "uTextureMap"), 0);
}

function configureCustomTexture(image) {
    var texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0,
        gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
        gl.NEAREST_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
}

window.onload = function init() {
    canvas = document.getElementById("gl-canvas");

    gl = canvas.getContext('webgl2');
    if (!gl) alert("WebGL 2.0 isn't available");

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    gl.enable(gl.DEPTH_TEST);

    textCoordinates(6, texCoordsArray);
    textCoordinates(indices2.length / 6, texCoordsArray2);

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    initBuffer1();
    initBuffer2();

    var image = document.getElementById("texImage");

    configureTexture(image);
    configureCustomTexture(image2)

    establishUniforms(program);

    initButtons();

    render();

}

var render = function () {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    var eye = vec3(radius * Math.sin(theta) * Math.cos(phi),
        radius * Math.sin(theta) * Math.sin(phi),
        radius * Math.cos(theta));

    modelViewMatrix = lookAt(eye, at, up);
    projectionMatrix = ortho(left, right, bottom, ytop, near, far);

    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
   // translate[1] = 1; 
    gl.uniformMatrix4fv(transLoc, false, translate);
    drawshape(tBuffer, iBuffer, cBuffer, vBuffer, nBuffer, vNormal, colorLoc, texCoordLoc, texCoordsArray);
    
    
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
   // translate[1] = 4;
    gl.uniformMatrix4fv(transLoc, false, translate);
    drawshape(tBuffer2, iBuffer2, cBuffer2, vBuffer2, nBuffer2, vNormal2, colorLoc2, texCoordLoc2, texCoordsArray2);
    
    gl.drawElements(gl.TRIANGLES, indices2.length, gl.UNSIGNED_SHORT, 0);
    requestAnimationFrame(render);
}

function initBuffer1() {
    iBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    
    cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW);
    
    colorLoc = gl.getAttribLocation(program, "aColor");
    gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colorLoc);

    vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
    nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

    vNormal = gl.getAttribLocation(program, "vNormal");
    gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);

    tBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW);

    texCoordLoc = gl.getAttribLocation(program, "aTexCoord");
    gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(texCoordLoc);
}

function initBuffer2() {
    iBuffer2 = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer2);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices2), gl.STATIC_DRAW);
    
    cBuffer2 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer2);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colorsArray2), gl.STATIC_DRAW);
    
    colorLoc2 = gl.getAttribLocation(program, "aColor");
    gl.vertexAttribPointer(colorLoc2, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colorLoc2);

    vBuffer2 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer2);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices2), gl.STATIC_DRAW);


    
    nBuffer2 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer2);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals2), gl.STATIC_DRAW);

    vNormal2 = gl.getAttribLocation(program, "vNormal");
    gl.vertexAttribPointer(vNormal2, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal2);

    tBuffer2 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer2);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoordsArray2), gl.STATIC_DRAW);

    texCoordLoc2 = gl.getAttribLocation(program, "aTexCoord");
    gl.vertexAttribPointer(texCoordLoc2, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(texCoordLoc2);
}


function drawshape(
    tBufferp,
    iBufferp,
    cBufferp,
    vBufferp,
    nBufferp,
    vNormalp,
    colorLocp,
    texCoordLocp,
    texCoordsArrayp,
) {
    gl.bindBuffer(gl.ARRAY_BUFFER, cBufferp);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBufferp);
    gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colorLocp);
    gl.bindBuffer(gl.ARRAY_BUFFER, vBufferp);

    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray( vPosition);

    gl.bindBuffer(gl.ARRAY_BUFFER, nBufferp);
    gl.vertexAttribPointer(vNormalp, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormalp);
    gl.bindBuffer(gl.ARRAY_BUFFER, tBufferp);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoordsArrayp), gl.STATIC_DRAW);
    gl.vertexAttribPointer(texCoordLocp, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(texCoordLocp);
}

function establishUniforms(program) {
    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");

    var ambientProduct = mult(lightAmbient, materialAmbient);
    var diffuseProduct = mult(lightDiffuse, materialDiffuse);
    var specularProduct = mult(lightSpecular, materialSpecular);
    gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"),
        flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"),
        flatten(diffuseProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"),
        flatten(specularProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"),
        flatten(lightPosition));
    gl.uniform1f(gl.getUniformLocation(program, "shininess"),
        materialShininess);
    
    transLoc = gl.getUniformLocation(program, "translate");
    gl.uniformMatrix4fv(transLoc, false, translate);
    
}

function initButtons() {
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
}

function textCoordinates(faces, pointer) {
    for (var i = 0; i < faces; i++) {
        pointer.push(texCoord[0]);
        pointer.push(texCoord[1]);
        pointer.push(texCoord[2]);
        pointer.push(texCoord[0]);
        pointer.push(texCoord[2]);
        pointer.push(texCoord[3]);
    }
}