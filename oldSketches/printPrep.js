
var center = [];

var allPaths = new Path({
    strokeColor: 'black',
})

var path = new Path({
    //position: view.center,
    strokeColor: 'black',
});

var path1 = new CompoundPath({
    //position: view.center,
    strokeColor: 'red',
});

var path2 = new CompoundPath({
    //position: view.center,
    strokeColor: 'red',
});

console.log(poses)

function onMouseDown(event){
    drawSkeletonLine(0, path1);
    drawSkeletonLine(1, path2);
    //drawPointsLine(0, path);
    //drawPointsLine(1, path);
    console.log(path);

    //path.unite(path1);
    //path.closed = true;

}

function onMouseUp(event){
    //path.removeChildren(2,3);
    //path1.unite(path2);
    console.log(path1);

    path1.fullySelected = true;
    allPaths = path1.unite();

    //path1.remove();

}

function drawSkeletonLine(whichPose, whichPath) {
    // Loop through all the skeletons detected
    for (var i = 0; i < poses[whichPose].results.length; i++) {
        var skeleton = poses[whichPose].results[i].skeleton;
        // For every skeleton, loop through all body connections
        for (var j = 0; j < skeleton.length; j++) {
            var partA = skeleton[j][0];
            var partB = skeleton[j][1];
            var from = new Point(partA.position.x, partA.position.y);
            var to = new Point(partB.position.x, partB.position.y);

            whichPath.addChild(new Path.Line(from, to));
            //whichPath.add(new Point(partB.position.x, partB.position.y));
        }
    }
}

function connectLine(whichPath) {
    
}


function drawPointsLine(whichPose, whichPath) {
    // Loop through all the skeletons detected
    for (var i = 0; i < poses[whichPose].results.length; i++) {
        var points = poses[whichPose].results[i].pose.keypoints;
        // For every skeleton, loop through all body connections
        for (var j = 3; j < points.length; j+=2) {
            var point = new Point(points[j].position.x, points[j].position.y);
            whichPath.add(point);
            console.log(point);
            //whichPath.add(new Point(partB.position.x, partB.position.y));
        }
    }

    for (var i = 0; i < poses[whichPose].results.length; i++) {
        var points = poses[whichPose].results[i].pose.keypoints;
        // For every skeleton, loop through all body connections
        for (var j = 16; j > 0; j-=2) {
            var point = new Point(points[j].position.x, points[j].position.y);
            whichPath.add(point);
            console.log(point);
            //whichPath.add(new Point(partB.position.x, partB.position.y));
        }
    }
}

//3. left ear
//4 .right ear
//5. left shoulder
//6. right shoulder
//7. left elbow
//8. right elbow
//9. left wrist
//10. right wrist
//11. left hip
//12. right hip
//13. left knee
//14. right knee
//15. left ankle
//16. right ankle
