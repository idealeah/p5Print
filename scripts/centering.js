//determine + apply offset so poses are spatially centered
//note that left and right are reversed in poseNet data, keeping same here
let torsoBox = {
  pos: {
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    center: 0
  },
  dimensions: {
    width: 0,
    height: 0
  },
  offsets: {
    x: 0,
    y: 0
  }
};

function centerPoses(whichPose) {
  let newPose = [];
  calcCenter(poses[whichPose]);
  centers[whichPose] = torsoBox;
  newPose = JSON.parse(JSON.stringify(poses[whichPose][0]));

  for (i = 0; i < newPose.pose.keypoints.length; i++) {
    newPose.pose.keypoints[i].position.x += torsoBox.offsets.x;
    newPose.pose.keypoints[i].position.y += torsoBox.offsets.y;
  }

  /*     for (i = 0; i < newPose.skeleton.length; i++) {
      newPose.skeleton[i][0].position.x += torsoBox.offsets.x;
      newPose.skeleton[i][0].position.y += torsoBox.offsets.y;
      newPose.skeleton[i][1].position.x += torsoBox.offsets.x;
      newPose.skeleton[i][1].position.y += torsoBox.offsets.y;
    } */
    
  poses[whichPose][0] = newPose;
}

//find the dimensions of the torso box,
//note that left and right are reversed in poseNet data, keeping same here
function calcCenter(whichPose) {
  let sLeft = whichPose[0].pose.keypoints[5].position;
  let hLeft = whichPose[0].pose.keypoints[11].position;
  let sRight = whichPose[0].pose.keypoints[6].position;
  let hRight = whichPose[0].pose.keypoints[12].position;

  //hip or shoulder furthest left
  let leftBound = Math.max(sLeft.x, hLeft.x);
  //hip or shoulder furthest right
  let rightBound = Math.min(sRight.x, hRight.x);
  //highest shoulder point
  let topBound = Math.min(sRight.y, sLeft.y);
  //lowest hip point
  let bottomBound = Math.max(hLeft.y, hRight.y);

  let xCenter = leftBound + (rightBound - leftBound) / 2;
  let yCenter = topBound + (bottomBound - topBound) / 2;

  let xOffset = width / 2 - xCenter;
  let yOffset = height / 2 - yCenter;

/*   push();
  fill(255, 0, 0);
  rect(rightBound, topBound, 10, 10);
  fill(0, 255, 0);
  rect(leftBound, bottomBound, 10, 10);
  pop(); */

  let pos = {
    left: leftBound,
    right: rightBound,
    top: topBound,
    bottom: bottomBound,
    center: createVector(xCenter, yCenter)
  };

  let dimensions = {
    width: leftBound - rightBound,
    height: bottomBound - topBound
  };

  let offsets = createVector(xOffset, yOffset);

  torsoBox = { pos, dimensions, offsets };

/*   push();
  fill(255, 0, 0);
  console.log(rightBound, topBound, dimensions.width, dimensions.height);
  rect(rightBound, topBound, dimensions.width, dimensions.height);
  stroke(0, 255, 0);
  console.log(xCenter, yCenter);
  line(xCenter, yCenter, xCenter + xOffset, yCenter + yOffset);
  fill(255, 0, 0);
  rect(xCenter, yCenter, 5, 5);
  fill(0, 255, 0);
  rect( xCenter + xOffset,  yCenter + yOffset, 5, 5);  
  pop();  */

}
