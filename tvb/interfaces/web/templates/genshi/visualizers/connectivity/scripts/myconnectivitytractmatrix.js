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

/*

* This js code let you draw the connectivity matrix with weight and tract components.
  This aims to measure the performance with respect to the older one ...

   work in progress................

*/


var CONNECTIVITY_TRACTMATRIX_ID = "GLcanvas_tractMATRIX" // canvas id for the matrix
var mytractplotColorBuffers;            // A list of color buffers for the  connectivity matrices

var mytractoutlineNormalsBuffer = null;    // Normals for the full matrix outline square
var mytractoutlineLinesBuffer = null;        // The line indices for thr full matrix outline square
var mytractverticesBuffer = [];            // A list of vertex buffers for the various space-time connectivity matrices
var mytractnormalsBuffer = [];                // A list of normal buffers for the various space-time connecitivty matrices
var mytractindexBuffer = [];                // A list of triangles index buffers for the various space-time connectivity matrices
var mytractlinesIndexBuffer = [];            // A list of line index buffers for the various space-time connectivity matrices
var tractcolorBuffer //mywork.....
var mytractplotSize = 480;                    // Default plot size of 250 pixels
var mytractdefaultZ = -2.0;                // Default plot Z position of -2.0
var mytractalphaValueMatrix = 1.0;                // original alpha value for default plot        
var mytractbackupAlphaValue = mytractalphaValueMatrix;    // backup used in animations


/*

Generating the color for the connectivity matrices .......

*/

function mytractgenerateColors(tractValue, intervalLength) {
    var theme = ColSchGetTheme().connectivityStepPlot;   // this is the theme of the matrix,same is space time plot.
    var matrixWeightsValues = GVAR_interestAreaVariables[1].values; //An 2D array with all weight data.
    var matrixTractsValues = GVAR_interestAreaVariables[2].values;
    var minWeightsValue = GVAR_interestAreaVariables[1].min_val; // Minimum weights value in range(0,>0);
    var maxWeightsValue = GVAR_interestAreaVariables[1].max_val; // Maximum weights value in range(>0);
    var nrElems = matrixWeightsValues.length;                     // Dimensions of matrix....let N X N.
    var colors = new Float32Array(nrElems * nrElems * 3 * 4);     // Array for the colors...
    var minTractValue = GVAR_interestAreaVariables[2].min_val;
    var maxTractValue = GVAR_interestAreaVariables[2].max_val;
    var linearIndex = -1;

    for (var i = 0; i < nrElems; i++) {
        for (var j = 0; j < nrElems; j++) {
            linearIndex += 1;

            var weight = (matrixTractsValues[i][nrElems - j - 1]);

            var color;
            


            color = weight!=0?getGradientColor(weight, minTractValue, maxTractValue).slice(0, 3): theme.noValueColor;


            color = [].concat(color, color, color, color);
            colors.set(color, 3 * 4 * linearIndex);
        }
    }
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
    return buffer;
}



function mytractConnStepPlotInitColorBuffers() {
    mytractinitColorsForPicking();
    mytractplotColorBuffers
    mynrOfSteps  = 1;
    mytractplotColorBuffers=(mytractgenerateColors((maxSelectedDelayValue + minSelectedDelayValue) / 2, maxSelectedDelayValue - minSelectedDelayValue));
    // In order to avoid floating number approximations which keep the loop for one more iteration just approximate by
    // substracting 0.1    
    var theme = ColSchGetTheme().connectivityStepPlot;
    gl.clearColor(theme.backgroundColor[0], theme.backgroundColor[1], theme.backgroundColor[2], theme.backgroundColor[3]);
}


function mytractinitColorsForPicking() {
    colorsForPicking = [];
    mynrOfSteps = 1;
    for (var i=0; i <= mynrOfSteps; i++) {
        // Go up to nrOfSteps since for 0 we will consider the full matrix as being clicked
        var r = parseInt(1.0 / (i + 1) * 255);
        var g = parseInt(i / mynrOfSteps * 255);
        var b = 0.0;
        colorsForPicking.push([r / 255, g / 255, b / 255]);
        var colorKey = r + '' + g + '0';
        GL_colorPickerMappingDict[colorKey] = i;
    }
    GL_initColorPickFrameBuffer();
}


/*
 * Custom shader initializations specific for the  weight connectivity matrix
 */
function initShaders_tractMATRIX() {
    createAndUseShader("shader-mytractmatrix-fs", "shader-mytractmatrix-vs");
    SHADING_Context.basic_program_init(GL_shaderProgram);

    GL_shaderProgram.drawLines = gl.getUniformLocation(GL_shaderProgram, "uDrawLines");
    GL_shaderProgram.alphaValue = gl.getUniformLocation(GL_shaderProgram, "uAlpha");
    GL_shaderProgram.lineColor = gl.getUniformLocation(GL_shaderProgram, "uLineColor");
    GL_shaderProgram.isPicking = gl.getUniformLocation(GL_shaderProgram, "isPicking");
    GL_shaderProgram.pickingColor = gl.getUniformLocation(GL_shaderProgram, "pickingColor");
    
    GL_shaderProgram.vertexColorAttribute = gl.getAttribLocation(GL_shaderProgram, "aVertexColor");
    gl.enableVertexAttribArray(GL_shaderProgram.vertexColorAttribute);
}

/*

*  Initializing the connectivity matrix webgl part..

*/
function connectivitytractMatrix_startGL() {
    conectivitytractMatrix_initCanvas();
    //Do the required initializations for the connectivity weighted matrix 
   initShaders_tractMATRIX();

    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    mytractConnStepPlotInitColorBuffers();

 }

 /*

 *  Create the buffer for the requirements by all Functions in General.

 */

function _GL_createBuffer(data, type){
    type = type || gl.ARRAY_BUFFER;
    var buff = gl.createBuffer();
    gl.bindBuffer(type, buff);
    gl.bufferData(type, data, gl.STATIC_DRAW);
    buff.numItems = data.length;
    return buff;
}

/*
 * Create the required buffers for the weight matrix.
 */
function createtractMatrix() {
    var nrElems = GVAR_interestAreaVariables[GVAR_selectedAreaType].values.length;
    // starting 'x' and 'y' axis values for the plot in order to center around (0, 0)
    var startX = - mytractplotSize / 2;
    var startY = - mytractplotSize / 2;
    // The size of a matrix element
    var elementSize = mytractplotSize / nrElems;
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
                upperLeftX, upperLeftY, mytractdefaultZ,
                upperLeftX + elementSize, upperLeftY, mytractdefaultZ, //upper right
                upperLeftX, upperLeftY + elementSize, mytractdefaultZ, //lower left
                upperLeftX + elementSize, upperLeftY + elementSize, mytractdefaultZ // lower right
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
    mytractverticesBuffer = _GL_createBuffer(vertices);
    mytractnormalsBuffer = _GL_createBuffer(normals);
    mytractindexBuffer = _GL_createBuffer(indices, gl.ELEMENT_ARRAY_BUFFER);
    mytractlinesIndexBuffer = _GL_createBuffer(linesIndices, gl.ELEMENT_ARRAY_BUFFER);
    mytractcreateOutlineSquare(startX, startY, elementSize, nrElems);

   /*
   * the standard color scheme
   */

    var colors = [
        1.0,  1.0,  1.0,  1.0,    // white
        1.0,  0.0,  0.0,  1.0,    // red
        0.0,  1.0,  0.0,  1.0,    // green
        0.0,  0.0,  1.0,  1.0,    // blue
      ];
    
       tractcolorBuffer = _GL_createBuffer(new Float32Array(colors));
    
}

/*
 * Compute the required vertex and idex for the square outline of the full connectivity matrix
 */
function mytractcreateOutlineSquare(startX, startY, elementSize, nrElems) {
    var width = nrElems * elementSize;
    var outlineVertices = [
        startX, startY, mytractdefaultZ,
        startX + width, startY, mytractdefaultZ,
        startX, startY + width, mytractdefaultZ,
        startX + width, startY + width, mytractdefaultZ
    ];
    var outlineNormals = [0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1];
    var outlineLines = [0, 1, 0, 2, 1, 3, 2, 3];
    myoutlineVerticeBuffer = _GL_createBuffer(new Float32Array(outlineVertices));
    mytractoutlineNormalsBuffer = _GL_createBuffer(new Float32Array(outlineNormals));
    mytractoutlineLinesBuffer = _GL_createBuffer(new Uint16Array(outlineLines), gl.ELEMENT_ARRAY_BUFFER);
}


/*
 * Generate a color buffer which represents the weights for 
 * a given edges between two vertex
 * 
 * 
 * @returns: a color buffer
 *     a gradient color is assigned based on the weights strenght, and for the 
 *              rest the color black is used.
 */

function conectivitytractMatrix_initCanvas() {

    var canvas = document.getElementById(CONNECTIVITY_TRACTMATRIX_ID);
    initGL(canvas);
    var theme = ColSchGetTheme().connectivityStepPlot;
    gl.clearColor(theme.backgroundColor[0], theme.backgroundColor[1], theme.backgroundColor[2], theme.backgroundColor[3]);
    plotSize = parseInt(canvas.clientWidth / 3);    // Compute the size of one connectivity plot depending on the canvas width
    createtractMatrix();

}



/*
 * Draw the full matrix, with the outline square.
 */
function drawMytractMatrix() {

    var theme = ColSchGetTheme().connectivityStepPlot;
    mvPushMatrix();
 
    // Draw the actual matrix.
    gl.bindBuffer(gl.ARRAY_BUFFER, mytractverticesBuffer);
    gl.vertexAttribPointer(GL_shaderProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, mytractnormalsBuffer);
    gl.vertexAttribPointer(GL_shaderProgram.vertexNormalAttribute, 3, gl.FLOAT, false, 0, 0);
    setMatrixUniforms();
         
        gl.bindBuffer(gl.ARRAY_BUFFER, mytractplotColorBuffers);
        gl.vertexAttribPointer(GL_shaderProgram.vertexColorAttribute, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mytractindexBuffer);
        gl.drawElements(gl.TRIANGLES, mytractindexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
        gl.uniform3f(GL_shaderProgram.lineColor, theme.lineColor[0], theme.lineColor[1], theme.lineColor[2]);

        gl.uniform1i(GL_shaderProgram.drawLines, true);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mytractlinesIndexBuffer);
        gl.lineWidth(1.0);

        gl.drawElements(gl.LINES, mytractlinesIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
        gl.uniform1i(GL_shaderProgram.drawLines, false);
        
        
        gl.uniform3f(GL_shaderProgram.lineColor, theme.outlineColor[0], theme.outlineColor[1], theme.outlineColor[2]);
        gl.lineWidth(2.0);
        gl.bindBuffer(gl.ARRAY_BUFFER, myoutlineVerticeBuffer);

        gl.vertexAttribPointer(GL_shaderProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, mytractoutlineNormalsBuffer);

        gl.vertexAttribPointer(GL_shaderProgram.vertexNormalAttribute, 3, gl.FLOAT, false, 0, 0);
        gl.uniform1i(GL_shaderProgram.drawLines, true);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, outlineLinesBuffer);
        gl.drawElements(gl.LINES, mytractoutlineLinesBuffer.numItems, gl.UNSIGNED_SHORT, 0);
        gl.lineWidth(2.0);

        gl.uniform1i(GL_shaderProgram.drawLines, false);

    mvPopMatrix();
}

function drawtract()
{

    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    // View angle is 45, we want to see object from 0.1 up to 800 distance from viewer
    perspective(45, gl.viewportWidth / gl.viewportHeight, near, 800.0);

    loadIdentity();
    // Translate to get a good view.
    mvTranslate([0.0, 0.0, -600]);
    
        gl.uniform1f(GL_shaderProgram.alphaValue, mytractalphaValueMatrix);
        gl.uniform1f(GL_shaderProgram.isPicking, 0);
        gl.uniform3f(GL_shaderProgram.pickingColor, 1, 1, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
            drawMytractMatrix();
     
    
}


