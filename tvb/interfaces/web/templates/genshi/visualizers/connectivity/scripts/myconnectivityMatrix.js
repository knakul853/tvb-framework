/**
 * TheVirtualBrain-Framework Package. This package holds all Data Management, and
 * Web-UI helpful to run brain-simulations. To use it, you also need do download
 * TheVirtualBrain-Scientific Package (for simulators). See content of the
 * documentation-folder for more details. See also http://www.thevirtualbrain.org
 *
 * (c) 2012-2017, Baycrest Centre for Geriatric Care ("Baycrest") and others
 *
 * This program is free software: you can redistribute it and/or modify it under the
 * terms of the GNU General Public License as published by the Free Software Foundation,
 * either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY
 * WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A
 * PARTICULAR PURPOSE.  See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this
 * program.  If not, see <http://www.gnu.org/licenses/>.
 *
 **/



var CONNECTIVITY_MATRIX_ID = "GLcanvas_MATRIX" // canvas id for the matrix

var myfullMatrixColors = null;        // Colors for the full connectivity matrix
var myoutlineVerticeBuffer = null;    // Vertices for the full matrix outline square
var myoutlineNormalsBuffer = null;    // Normals for the full matrix outline square
var myoutlineLinesBuffer = null;        // The line indices for thr full matrix outline square
var myplotColorBuffers = [];            // A list of color buffers for the various space-time connectivity matrices
var myverticesBuffer = [];            // A list of vertex buffers for the various space-time connectivity matrices
var mynormalsBuffer = [];                // A list of normal buffers for the various space-time connecitivty matrices
var myindexBuffer = [];                // A list of triangles index buffers for the various space-time connectivity matrices
var mylinesIndexBuffer = [];            // A list of line index buffers for the various space-time connectivity matrices

var myplotSize = 250;                    // Default plot size of 250 pixels
var mydefaultZ = -2.0;                // Default plot Z position of -2.0
var mydoPick = false;                    // No picking by default
var mynrOfSteps = 1;                    // Number of space-time plots we will draw in scene
var mycolorsForPicking = [];            // The colors which are used for the picking scheme

var myplotTranslations = [];            // Keep track of the translation for each plot.
var myplotRotations = [];                // Keep track of the rotations for each plot
var myzoomedInMatrix = -1;            // The matrix witch is currently zoomed in on
var myclickedMatrix = -1;
var mybackupTranslations = [];
var mybackupRotations = [];
var myanimationStarted = false;
var myalphaValueMatrix = 1.0;                // original alpha value for default plot        
var mybackupAlphaValue = myalphaValueMatrix;    // backup used in animations
var minSelectedDelayValue = -1;
var maxSelectedDelayValue = -1;
var myanimationTimeout = 33; // 30Hz
var myanimationGranularity = 20;
/*
 * Custom shader initializations specific for the space-time connectivity plot
 */
function initShaders_MATRIX() {
    createAndUseShader("shader-mymatrix-fs", "shader-mymatrix-vs");
    SHADING_Context.basic_program_init(GL_shaderProgram);

    GL_shaderProgram.drawLines = gl.getUniformLocation(GL_shaderProgram, "uDrawLines");
    GL_shaderProgram.alphaValue = gl.getUniformLocation(GL_shaderProgram, "uAlpha");
    GL_shaderProgram.lineColor = gl.getUniformLocation(GL_shaderProgram, "uLineColor");
    GL_shaderProgram.isPicking = gl.getUniformLocation(GL_shaderProgram, "isPicking");
    GL_shaderProgram.pickingColor = gl.getUniformLocation(GL_shaderProgram, "pickingColor");
    
    GL_shaderProgram.vertexColorAttribute = gl.getAttribLocation(GL_shaderProgram, "aVertexColor");
    gl.enableVertexAttribArray(GL_shaderProgram.vertexColorAttribute);
}


function connectivityMatrix_startGL() {
    conectivityMatrix_initCanvas();
    //Do the required initializations for the connectivity space-time visualizer
   initShaders_MATRIX();

    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

}

function _GL_createBuffer(data, type){
    type = type || gl.ARRAY_BUFFER;
    var buff = gl.createBuffer();
    gl.bindBuffer(type, buff);
    gl.bufferData(type, data, gl.STATIC_DRAW);
    buff.numItems = data.length;
    return buff;
}

/*
 * Create the required buffers for the space-time plot.
 */
function createMatrix() {
    var nrElems = GVAR_interestAreaVariables[GVAR_selectedAreaType].values.length;
    // starting 'x' and 'y' axis values for the plot in order to center around (0, 0)
    var startX = - myplotSize / 2;
    var startY = - myplotSize / 2;
    // The size of a matrix element
    var elementSize = myplotSize / nrElems;
    // Create arrays from start for performance reasons 
    var vertices = new Float32Array(nrElems * nrElems * 4 * 3);
    var normals = new Float32Array(nrElems * nrElems * 4 * 3);
    var indices = new Uint16Array(nrElems * nrElems * 2 * 3);
    var linesIndices = new Uint16Array(nrElems * nrElems * 2 * 4);

    var linearIndex = -1;

    for (var i = 0; i < nrElems; i++) {
        for (var j = 0; j < nrElems; j++) {
            linearIndex += 1;
            // For each separate element, compute the position of the 4 required vertices
            // depending on the position from the connectivity matrix
            var upperLeftX = startX + j * elementSize;
            var upperLeftY = startY + i * elementSize;

            // Since the vertex array is flatten, and there are 4 vertices per one element,
            // in order to fill the position in the vertice array we need to fill all 12 elements
            var elemVertices = [
                upperLeftX, upperLeftY, mydefaultZ,
                upperLeftX + elementSize, upperLeftY, mydefaultZ, //upper right
                upperLeftX, upperLeftY + elementSize, mydefaultZ, //lower left
                upperLeftX + elementSize, upperLeftY + elementSize, mydefaultZ // lower right
            ];

            var indexBase = 4 * linearIndex;

            // For the normals it's easier since we only need one normal for each vertex
            var elemNormals = [
                0, 0, -1,
                0, 0, -1,
                0, 0, -1,
                0, 0, -1
            ];

            // We have 2 triangles, which again are flatten so we need to fill 6 index elements
            var elemIndices = [
                indexBase + 0, indexBase + 1, indexBase + 2,
                indexBase + 1, indexBase + 2, indexBase + 3
            ];

            // For the lines we have 4 lines per element, flatten again, so 8 index elements to fill
            var elemLines = [
                indexBase + 0, indexBase + 1,
                indexBase + 1, indexBase + 3,
                indexBase + 2, indexBase + 3,
                indexBase + 2, indexBase + 0
            ];

            vertices.set(elemVertices, 3 * 4 * linearIndex);
            normals.set(elemNormals, 3 * 4 * linearIndex);
            indices.set(elemIndices, 3 * 2 * linearIndex);
            linesIndices.set(elemLines, 4 * 2 * linearIndex);
        }
    }
    // Now create all the required buffers having the computed data.
    myverticesBuffer = _GL_createBuffer(vertices);
    mynormalsBuffer = _GL_createBuffer(normals);
    myindexBuffer = _GL_createBuffer(indices, gl.ELEMENT_ARRAY_BUFFER);
    mylinesIndexBuffer = _GL_createBuffer(linesIndices, gl.ELEMENT_ARRAY_BUFFER);
    mycreateOutlineSquare(startX, startY, elementSize, nrElems);
}

/*
 * Compute the required vertex and idex for the square outline of the full connectivity matrix
 */
function mycreateOutlineSquare(startX, startY, elementSize, nrElems) {
    var width = nrElems * elementSize;
    var outlineVertices = [
        startX, startY, mydefaultZ,
        startX + width, startY, mydefaultZ,
        startX, startY + width, mydefaultZ,
        startX + width, startY + width, mydefaultZ
    ];
    var outlineNormals = [0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1];
    var outlineLines = [0, 1, 0, 2, 1, 3, 2, 3];
    myoutlineVerticeBuffer = _GL_createBuffer(new Float32Array(outlineVertices));
    myoutlineNormalsBuffer = _GL_createBuffer(new Float32Array(outlineNormals));
    myoutlineLinesBuffer = _GL_createBuffer(new Uint16Array(outlineLines), gl.ELEMENT_ARRAY_BUFFER);
}


/*
 * Generate a color buffer which represents the state of the weights for 
 * a given 'interval' centered around a given tract value
 * 
 * @param tractValue: the center of the interval
 * @param intervalLength: the length of the interval
 * 
 * @returns: a color buffer, where for the connections that fall in the defined interval,
 *              a gradient color is assigned based on the weights strenght, and for the 
 *              rest the color black is used.
 */
function mygenerateColors(tractValue, intervalLength) {
    var theme = ColSchGetTheme().connectivityStepPlot;
    var matrixWeightsValues = GVAR_interestAreaVariables[1].values;
    var matrixTractsValues = GVAR_interestAreaVariables[2].values;
    var minWeightsValue = GVAR_interestAreaVariables[1].min_val;
    var maxWeightsValue = GVAR_interestAreaVariables[1].max_val;
    var nrElems = matrixWeightsValues.length;
    var colors = new Float32Array(nrElems * nrElems * 3 * 4);
    var linearIndex = -1;

    for (var i = 0; i < nrElems; i++) {
        for (var j = 0; j < nrElems; j++) {
            linearIndex += 1;
            // For each element generate 4 identical colors corresponding to the 4 vertices used for the element
            var delayValue = matrixTractsValues[i][nrElems - j - 1] / conductionSpeed;
            var weight = matrixWeightsValues[i][nrElems - j - 1];

            var isWithinInterval = (delayValue >= (tractValue - intervalLength / 2) &&
                                    delayValue <= (tractValue + intervalLength / 2));
            var color;

            if (isWithinInterval && weight != 0) {
                color = getGradientColor(weight, minWeightsValue, maxWeightsValue).slice(0, 3);
            }else{
                color = theme.noValueColor;
            }

            color = [].concat(color, color, color, color);
            colors.set(color, 3 * 4 * linearIndex);
        }
    }
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
    return buffer;
}



function myConnStepPlotInitColorBuffers() {
    myinitColorsForPicking();
    myplotColorBuffers = [];
    var stepValue = (mymaxSelectedDelayValue - myminSelectedDelayValue) / mynrOfSteps;
    myplotColorBuffers.push(mygenerateColors((mymaxSelectedDelayValue + myminSelectedDelayValue) / 2, mymaxSelectedDelayValue - minSelectedDelayValue));
    // In order to avoid floating number approximations which keep the loop for one more iteration just approximate by
    // substracting 0.1
    for (var tractValue = myminSelectedDelayValue + stepValue / 2; tractValue < parseInt(mymaxSelectedDelayValue) - 0.1; tractValue = tractValue + stepValue) {
        myplotColorBuffers.push(mygenerateColors(tractValue, stepValue));
    } 
    var theme = ColSchGetTheme().connectivityStepPlot;
    gl.clearColor(theme.backgroundColor[0], theme.backgroundColor[1], theme.backgroundColor[2], theme.backgroundColor[3]);
    draw();
}





function conectivityMatrix_initCanvas() {
    var canvas = document.getElementById(CONNECTIVITY_MATRIX_ID);
   initGL(canvas);
    var theme = ColSchGetTheme().connectivityStepPlot;
           gl.clearColor(theme.backgroundColor[0], theme.backgroundColor[1], theme.backgroundColor[2], theme.backgroundColor[3]);
    plotSize = parseInt(canvas.clientWidth / 3);    // Compute the size of one connectivity plot depending on the canvas width
    createMatrix();

}



/*
 * Draw the full matrix, with the outline square.
 */
function drawMyMatrix() {
    var theme = ColSchGetTheme().connectivityStepPlot;
    mvPushMatrix();
    
    
    // Draw the actual matrix.
    gl.bindBuffer(gl.ARRAY_BUFFER, myverticesBuffer);
    gl.vertexAttribPointer(GL_shaderProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, mynormalsBuffer);
   gl.vertexAttribPointer(GL_shaderProgram.vertexNormalAttribute, 3, gl.FLOAT, false, 0, 0);
    setMatrixUniforms();
    

        gl.vertexAttribPointer(GL_shaderProgram.vertexColorAttribute, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, myindexBuffer);
        gl.drawElements(gl.TRIANGLES, myindexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
        gl.uniform3f(GL_shaderProgram.lineColor, theme.lineColor[0], theme.lineColor[1], theme.lineColor[2]);
        gl.uniform1i(GL_shaderProgram.drawLines, true);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mylinesIndexBuffer);
        gl.lineWidth(1.0);
        gl.drawElements(gl.LINES, mylinesIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
        gl.uniform1i(GL_shaderProgram.drawLines, false);
        
        // Now draw the square outline
        // if (idx == myclickedMatrix) {
            //  gl.uniform3f(GL_shaderProgram.lineColor, theme.selectedOutlineColor[0], theme.selectedOutlineColor[1], theme.selectedOutlineColor[2]);
            //  gl.lineWidth(3.0);
        // } else {
            gl.uniform3f(GL_shaderProgram.lineColor, theme.outlineColor[0], theme.outlineColor[1], theme.outlineColor[2]);
            gl.lineWidth(2.0);
        // }
        gl.bindBuffer(gl.ARRAY_BUFFER, myoutlineVerticeBuffer);
        gl.vertexAttribPointer(GL_shaderProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
         gl.bindBuffer(gl.ARRAY_BUFFER, myoutlineNormalsBuffer);
        gl.vertexAttribPointer(GL_shaderProgram.vertexNormalAttribute, 3, gl.FLOAT, false, 0, 0);
        gl.uniform1i(GL_shaderProgram.drawLines, true);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, outlineLinesBuffer);
        gl.drawElements(gl.LINES, myoutlineLinesBuffer.numItems, gl.UNSIGNED_SHORT, 0);
        gl.lineWidth(2.0);
        gl.uniform1i(GL_shaderProgram.drawLines, false);
  // }

    mvPopMatrix();
}


/*
 * Draw the entire  matrices.
 */
function draw() {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    // View angle is 45, we want to see object from 0.1 up to 800 distance from viewer
    perspective(45, gl.viewportWidth / gl.viewportHeight, near, 800.0);

    loadIdentity();
    // Translate to get a good view.
    mvTranslate([0.0, 0.0, -600]);
    

        gl.uniform1f(GL_shaderProgram.alphaValue, myalphaValueMatrix);
        gl.uniform1f(GL_shaderProgram.isPicking, 0);
        gl.uniform3f(GL_shaderProgram.pickingColor, 1, 1, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        
            drawMyMatrix();
    
}


