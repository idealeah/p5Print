
var shapes = [];

var point = new Point(0, 0);
var size = new Size(700, 1000);
var test = new Path.Rectangle(point, size);
test.fillColor = 'black';
test.sendToBack();
console.log(test);

var path = new paper.Path();
path.strokeColor = 'red';

function paperLine(whichPose){
    console.log(whichPose)
    console.log(poseData[whichPose]);
    for (var i = 0; i < poseData[whichPose].shape.length; i++){
        path.add(new paper.Point(poseData[whichPose].shape[i].x, poseData[whichPose].shape[i].y));
    }
    path.closed = true;
    shapes.push(path);
}

globals.paperLine = paperLine;

