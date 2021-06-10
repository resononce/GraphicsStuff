/**
 * The basis of the method used are the use of multiple viewports to establish relative coordinates
 * the curve of any given circle can be describe with the equation 
 * x = r*cos(t) and y = r*sin(t)
 * in combination with the fact that every curve was drawn with the same angle (90 degrees)
 * I knew a single method could find every vertex on the curve of circle, as the only variable was the radius
 * however, the equation only works on the center, and many curves have different origins
 * so it was simply a case of translating a circle to each corner of the tile by adding the coordinates, 
 * so x= centerX + r*cos(t) and y= centerY + r*sin(t)
 * hence the addition of 'centerpoint' variables in the method as a more generic solution, adjusted for each corner
 * then I simply needed to define the initial angle to be traced in radians.
 * x= centerX + r*cos(t + theta) and y= centerY + r*sin(t + theta)
 * once I had these pieces, I could easily generate a 90 degree curve from anywhere within a square using the calcParametricQuarterCircle() method
 * for convenience I created vertice arrays for each tile and simply pushed the vectors of the calculated curve to them
 * there was no need to adjust them afterwards, because each viewport automatically translate the coordinates relative to itself
 * rendering was simple, using the VIEWPORT_SQUARES constant, I divide the canvas into a series of equal length squares
 * and then simply calling a draw method, the tile is painlessly drawn before redefining the viewport to the next square in sequence
 * the only catch was randomly generating the truchet pattern.
 * I simply created a random array of boolean values of equal size to the number of tiles, and choose from the cooresponding tile
 * the exact index doesnt matter, only that new random values weren't generated on each render() call
 * and that was pretty it.
 * the number of squares, canvas dimensions, and the circle resolution can be freely adjusted btw
 **/

/**
 * this number squared is the number of squares on the canves, perhaps more accurately should be called 'square root of viewport squares'
 */
const VIEWPORT_SQUARES = 20;

/**
 * the number of vertecis generated for each curve, higher number are smoother, though there are diminshing returns
 */
const CIRCLE_RESOLUTION = 300;
var gl;
var vertices = [];
var quarterCircle = [];
var truchet1 = [];
var truchet2 = [];
var isQC = true;
var random = [];
window.onload = function init() {
    canvas = document.getElementById("gl-canvas");

    gl = canvas.getContext("webgl2");
    if (!gl) {
        alert("WebGL 2.0 isn't available");
    }
    //  Configure WebGL
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    //  Load shaders and initialize attribute buffers
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // configure tile's vertices
    setupTruchet();
    setupQC();

    // Adds the vertices of each tile to the vertices
    vertices = vertices.concat(truchet1);
    vertices = vertices.concat(truchet2);
    vertices = vertices.concat(quarterCircle);


    // Load the data into the GPU

    var bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    // Associate our shader variables with our data buffer

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    document.getElementById("quarterCircle").onclick = function () {
        isQC = true;
    };
    document.getElementById("truchet").onclick = function () {
        isQC = false;
    };

    /**
     * randomly creates an array of 0's and 1's for persistent rng
     */
    for (i = 0; i < VIEWPORT_SQUARES * VIEWPORT_SQUARES; i++) {
        random.push(Math.floor(Math.random() * 2));
    }

    render();
};

/**
 * maps out each circle in both tuchet types and stores them in truchet1 and truchet2
 */
function setupTruchet() {
    var radius = 1;
    var length = 1;
    var height = 1;
    //plot 1st truchet tile circle starting at top right from 180 => 270
    calcParametricQuarterCircle(
        truchet1,
        radius,
        Math.PI,
        length,
        height
    );
    //plot 1st truchet tile circle starting at bottom left from 0 -> 90
    calcParametricQuarterCircle(
        truchet1,
        radius,
        0,
        -length,
        -height
    );
    //plot 2nd truchet tile circle starting at top left 270 -> 360
    calcParametricQuarterCircle(
        truchet2,
        radius,
        3 * Math.PI / 2,
        -length, height
    );
    //map 2nd truchet tile circle starting at bottom right 90 -> 180
    calcParametricQuarterCircle(
        truchet2,
        radius,
        Math.PI / 2,
        length,
        -height
    );
}

/**
 * Maps out the border and each circle in a single Quarter Circle tile and stores it in quarterCircle
 */
function setupQC() {
    var radius = 2;
    var length = 1;
    var height = 1;

    //maps a square around the tile
    quarterCircle.push(
        vec2(1, -1),
        vec2(1, 1),
        vec2(-1, 1),
        vec2(-1, -1)
    )

    //top right circle from 180 => 270
    calcParametricQuarterCircle(
        quarterCircle,
        radius,
        Math.PI,
        length,
        height
    );
    //top left circle from 270 -> 360
    calcParametricQuarterCircle(
        quarterCircle,
        radius,
        Math.PI * 3 / 2,
        -length,
        height
    );
    //bottom left circle from 0 -> 90
    calcParametricQuarterCircle(
        quarterCircle,
        radius,
        0,
        -length,
        -height
    );
    //bottom right circle from 90 -> 180
    calcParametricQuarterCircle(
        quarterCircle,
        radius,
        Math.PI / 2,
        length,
        -height
    );
}

/**
 * draws a Quarter Circle Tile in the viewport
 */
function drawQCTile() {
    var pointer = truchet1.length + truchet2.length;
    gl.drawArrays(gl.LINE_LOOP, pointer, 4);
    for (i = 0; i < 4; i++) {
        pointer = truchet1.length + truchet2.length + 4 + CIRCLE_RESOLUTION * i;
        gl.drawArrays(gl.LINE_STRIP, pointer + 1, CIRCLE_RESOLUTION);
    }
}

/**
 * draws the 1st type of truchet tile in the viewport
 */
function drawTruchet1() {
    var pointer;
    for (i = 0; i < 2; i++) {
        pointer = CIRCLE_RESOLUTION * i;
        gl.drawArrays(gl.LINE_STRIP, pointer + 1, CIRCLE_RESOLUTION);
    }
}

/**
 * draws the 2nd type of truchet tile in the viewport
 */
function drawTruchet2() {
    var pointer;
    for (i = 0; i < 2; i++) {
        pointer = truchet1.length + CIRCLE_RESOLUTION * i;
        gl.drawArrays(gl.LINE_STRIP, pointer + 1, CIRCLE_RESOLUTION);
    }
}

/**
 * Establishes each viewport, and calls the drawTile method for each
 */
function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    viewLength = Math.floor(canvas.width / VIEWPORT_SQUARES);
    viewHeight = Math.floor(canvas.height / VIEWPORT_SQUARES);
    var tileNumber = 0;
    for (var i = 0; i < VIEWPORT_SQUARES; i++) {
        for (var j = 0; j < VIEWPORT_SQUARES; j++) {
            var x = viewLength * j;
            var y = viewHeight * i;

            gl.viewport(x, y, viewLength, viewHeight);
            drawTile(tileNumber);
            tileNumber++;
        }
    }
    requestAnimationFrame(render);
}

/**
 * draws a single tile based on the current state, mostly exists for 'seperation of concerns' reasons
 * @param {number} tilenumber a meaningless number chosen to represent this tile
 */
function drawTile(tilenumber) {
    switch (isQC) {
        case true:
            drawQCTile();
            break;
        case false:
            if (random[tilenumber]) {
                drawTruchet1();
            } else {
                drawTruchet2();
            }
            break;
        default:
            console.error('Wow something REALLY broke');
            //Draw Nothing
    }
}

/**
 * plots 90 degrees of any circle in vertices and adds them to an array
 * @param {array} object an array of vertices
 * @param {number} radius the radius of the quarter circle
 * @param {number} startingAngle the angle it will begin tracing from
 * @param {number} centerpointX the center of the circle's X coordinate
 * @param {number} centerpointY the center of the circle's Y coordinate
 */
function calcParametricQuarterCircle(
    object,
    radius,
    startingAngle,
    centerpointX,
    centerpointY
) {
    var t = (Math.PI / 2) / CIRCLE_RESOLUTION;
    for (i = 0; i <= CIRCLE_RESOLUTION; i++) {
        var angle = startingAngle + (t * i);
        var x = centerpointX + (radius * Math.cos(angle));
        var y = centerpointY + (radius * Math.sin(angle))
        object.push(
            vec2(x, y)
        );
    }
}