/**
 * So basically this is based of your ortho example.
 * There was a super handy function to draw the face of any rectangle so i snatched it and treated every face as a rectangle
 * then i made scale and translation matrices and just multiplied them in the html for the movements
 * any movement can be made by just altering the matrice so thats pretty cool. ex translation[13] is number for the x coord translation
 * probably could have put that in a function instead lol
 * straightforward when you dont have to worry about the twist
 */
var canvas;
var gl;

var scaleInc = 0.1;
var transInc = 0.1;
var scaleLoc;
var scale = [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
];
var transLoc;
var translate = [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
];

var numVertices = 361;

var pointsArray = [];
var colorsArray = [];

var vertices = [
    vec4(-.9, .75, 0.1, 1.0),
    vec4(-.75, .75, 0.1, 1.0),
    vec4(-0.5, 0, 0.1, 1.0),
    vec4(0, .5, 0.1, 1.0),
    vec4(0.5, 0, 0.1, 1.0),
    vec4(.75, .75, 0.1, 1.0),
    vec4(.9, .75, 0.1, 1.0),
    vec4(0.55, -0.25, 0.1, 1.0),
    vec4(0, .25, 0.1, 1.0),
    vec4(-0.55, -0.25, 0.1, 1.0), //part1

    vec4(-.9, .75, 0, 1.0),
    vec4(-.75, .75, 0, 1.0),
    vec4(-0.5, 0, 0, 1.0),
    vec4(0, .5, 0, 1.0),
    vec4(0.5, 0, 0, 1.0),
    vec4(.75, .75, 0, 1.0),
    vec4(.9, .75, 0, 1.0),
    vec4(0.55, -0.25, 0, 1.0),
    vec4(0, .25, 0, 1.0),
    vec4(-0.55, -0.25, 0, 1.0), //part1
];

var vertexColors = [
    vec4(1.0, 0.0, 0.0, 1.0), // red
    vec4(.5, 0.0, 0.0, 1.0), // dark red
];

var near = -2.5;
var far = 2.5;
var radius = 1.0;
var theta = 0.0;
var phi = 0.0;
var dr = 5.0 * Math.PI / 180.0;

var left = -1.0;
var right = 1.0;
var ytop = 1.0;
var bottom = -1.0;


var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;
var eye;

const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);

// quad uses first index to set color for face

function quad(a, b, c, d, e) {
    pointsArray.push(vertices[a]);
    colorsArray.push(vertexColors[e]);
    pointsArray.push(vertices[b]);
    colorsArray.push(vertexColors[e]);
    pointsArray.push(vertices[c]);
    colorsArray.push(vertexColors[e]);
    pointsArray.push(vertices[a]);
    colorsArray.push(vertexColors[e]);
    pointsArray.push(vertices[c]);
    colorsArray.push(vertexColors[e]);
    pointsArray.push(vertices[d]);
    colorsArray.push(vertexColors[e]);
}



// Each face determines two triangles

function drawAndColorW() {
    quad(0, 1, 2, 9, 0);
    quad(2, 3, 8, 9, 0);
    quad(3, 4, 7, 8, 0);
    quad(4, 5, 6, 7, 0);

    quad(10, 11, 12, 19, 1);
    quad(12, 13, 18, 19, 1);
    quad(13, 14, 17, 18, 1);
    quad(14, 15, 16, 17, 1);
    for(var i = 0; i <= 9; i++){
        if(i !== 9){
            quad(i,  i + 10, i+11, i+1, 1);
        }else{
            quad(9,  19,  10, 0, 1);
        }
    }       
    
}


window.onload = function init() {
    canvas = document.getElementById("gl-canvas");

    gl = canvas.getContext('webgl2');
    if (!gl) {
        alert("WebGL 2.0 isn't available");
    }
    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    drawAndColorW();

    var cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW);

    var vColor = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");
    transLoc = gl.getUniformLocation(program, "translate");
    scaleLoc = gl.getUniformLocation(program, "scale");
    gl.uniformMatrix4fv(transLoc, false, translate);
    gl.uniformMatrix4fv(scaleLoc, false, scale);
    render();
};


var render = function () {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);



    theta += 0.006;
    phi += 0.005;
    translate[12] += transInc; 
    scale[0] += scaleInc;

    if(scale[0] > 2){
        scaleInc = -.1;
    }else if(scale[0] < 0.5){
        scaleInc = .1;
    }

    if(translate[12] > 2){
        transInc = -.1;
    }else if(translate[12] < -2){
        transInc = .1;
    }

    eye = vec3(radius * Math.sin(theta) * Math.cos(phi),
        radius * Math.sin(theta) * Math.sin(phi), radius * Math.cos(theta));


    modelViewMatrix = lookAt(eye, at, up);
    projectionMatrix = ortho(left, right, bottom, ytop, near, far);

    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
    gl.uniformMatrix4fv(scaleLoc, false, scale);
    gl.uniformMatrix4fv(transLoc, false, translate);
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);
    requestAnimationFrame(render);
};