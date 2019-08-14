var canvas = document.getElementById('canvas');

var l = 10;
var sz = 1000/l;



var c = canvas.getContext('2d');

function draw(){

for(var i=0;i<l;i++){
    for(var j=0;j<l;j++){

       
        var x = i*sz;
        var y = j*sz;
        var arg1 = (Math.floor(Math.random()*255));
        var arg2 = (Math.floor(Math.random()*255));
        var arg3 = (Math.floor(Math.random()*255));

        var temp = "rgb(" + arg1 + "," +  arg2 +"," + arg3 + ")";
        var s1 = "#";

        c.fillStyle = temp;
        c.fillRect(x,y,sz,sz);
        c.stroke();
        
        
    }
}

}
draw();
















/*
/*
for(var i = 0; i < l; i++){
    color_line = [];
    for(var j=0;j<l;j++)
    {
    color_line.push("rgb(" + (Math.floor(Math.random()*255)) + "," +  (Math.floor(Math.random()*255)) +"," + (Math.floor(Math.random()*255)) + ")")
    //rgb.push(x);
    colors.push(color_line);

    }
}
/*
for(var i=0;i<l;i++){

    for(var j=0;j<l;j++){
       // console.log(colors[i][j]);
    }

}*/
