/* //drawing the differences in the skeletons
function drawDifferences(printOrNot){
  //for (let i = 0; i < poses.results.length; i++) {
   let skeletonVid = poses["vid"][0].skeleton;
   let skeletonCam = poses["cam"][0].skeleton;

   //console.log(skeletonVid);
   //console.log(skeletonCam);

   //test to see which pose has less info
   let shorterArray = [];
   let longerArray = [];

   if (skeletonVid.length <= skeletonCam.length){
     shorterArray = skeletonVid;
     longerArray = skeletonCam;
   }else{
     shorterArray = skeletonCam;
     longerArray = skeletonVid;
   }

   //increase z-axis on printer
   if(printOrNot === true){
     ultimaker.newLine();
   }
   
   // For every skeleton, loop through all body connections
   for (let j = 0; j < shorterArray.length; j++) {
     let vidJoint1 = skeletonVid[j][0].position;
     let vidJoint2 = skeletonVid[j][1].position;
     let camJoint1 = skeletonCam[j][0].position;
     let camJoint2 = skeletonCam[j][1].position;

     let joints = [vidJoint1, vidJoint2, camJoint1, camJoint2];
     //console.log(joints);
   
     //add fill to see difference
     fill(232, 240, 255, 250);
     push();
     //translate(noise(frameCount), noise(frameCount));
     beginShape();
       vertex(joints[0].x, joints[0].y);
       vertex(joints[1].x, joints[1].y);
       vertex(joints[2].x, joints[2].y);
       vertex(joints[3].x, joints[3].y);
     endShape(CLOSE);
     pop();

     //write g code for shapes
     if(printOrNot === true){
      if (ultimaker.location.prevJoints[0].x > 0){
        console.log("yes!");
        let diffs = [Math.abs(joints[0].x - ultimaker.location.prevJoints[0].x), Math.abs(joints[1].x - ultimaker.location.prevJoints[1].x), 
          Math.abs(joints[2].y - ultimaker.location.prevJoints[2].y), Math.abs(joints[3].y - ultimaker.location.prevJoints[3].y)]; */
          //console.log(diffs);

        //see if any of the differences are larger than printer filament permits
/*         if (Math.max(...diffs)> ultimaker.control.wallWidth){

          text.push(";lerping \n");
          //determine how many steps are necessary
          let steps = Math.max(...diffs)/ultimaker.control.wallWidth;
          //lerp between layers to ensure workable print walls
          for (let i = 0; i < steps; i++){
            console.log(Math.max(...diffs));
            console.log(steps);
            let lerpAmt = 1/steps;
            console.log(lerpAmt);
            lerpPrint(0);
            lerpPrint(1);
            lerpPrint(2);
            lerpPrint(3);

            function lerpPrint(inputPoint){
              let pointX = lerp(ultimaker.location.prevJoints[inputPoint].x, joints[inputPoint].x, lerpAmt*i);
              let pointY = lerp(ultimaker.location.prevJoints[inputPoint].y, joints[inputPoint].y, lerpAmt*i);
              console.log(lerpAmt*i);
              console.log(pointX, pointY);
              ultimaker.printPosition(pointX, pointY);
            }
          }
          text.push(";end lerping \n")
        } */
      //}

/*       ultimaker.printPosition(joints[0].x, joints[0].y);
      ultimaker.printPosition(joints[1].x, joints[1].y);
      ultimaker.printPosition(joints[2].x, joints[2].y);
      ultimaker.printPosition(joints[3].x, joints[3].y);

      ultimaker.location.prevJoints = joints;
      console.log(ultimaker.location.prevJoints);
    }
   }
 } */


 /*   //get camera info (https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/enumerateDevices)
  if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
    console.log("enumerateDevices() not supported.");
    return;
  }
  // List cameras and microphones.
  navigator.mediaDevices.enumerateDevices()
  .then(function(devices) {
    devices.forEach(function(device) {
      console.log(device.kind + ": " + device.label +
                  " id = " + device.deviceId);
    });
  })
  .catch(function(err) {
    console.log(err.name + ": " + err.message);
  }); */




  /* 
// A function to draw ellipses over the detected keypoints
function drawKeypoints(whichPose) {
  let pose = poses[whichPose][0].pose;
  for (let j = 0; j < pose.keypoints.length; j++) {
    // A keypoint is an object describing a body part (like rightArm or leftShoulder)
    let keypoint = pose.keypoints[j];
    // Only draw an ellipse is the pose probability is bigger than 0.2
    if (keypoint.score > 0.2) {
      fill(255, 0, 0);
      noStroke();
      ellipse(keypoint.position.x, keypoint.position.y, 10, 10);
    }
  }
}

// A function to draw the skeletons
function drawSkeleton(whichPose) {
  let skeleton = poses[whichPose][0].skeleton;
  // For every skeleton, loop through all body connections
  for (let j = 0; j < skeleton.length; j++) {
    let partA = skeleton[j][0];
    let partB = skeleton[j][1];
    stroke(255 * noise(millis()), noise(millis()) * 30, 0);
    line(
      partA.position.x,
      partA.position.y,
      partB.position.x,
      partB.position.y
    );
  }
} */

let capture;

function setup() {
  //background(200);
  createCanvas(640, 480);
  capture = createCapture(VIDEO);
  //capture.size(320, 240);
  capture.hide();
}

function draw() {
  background(50);
  image(capture, 0, 0);
  //filter('INVERT');
}
