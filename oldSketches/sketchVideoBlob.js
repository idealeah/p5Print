// Create a new poseNet method
let poseNet;
let poseNet1;
let poses = [];
let centers = [];
let torsoBox = [];
let limbs = {
  leftArmIndex: [5, 7, 9],
  rightArmIndex: [6, 8, 10],
  leftLegIndex: [11, 13, 15],
  rightLegIndex: [12, 14, 16],
  torsoIndex: [5, 6, 12, 11]
};

let steps = 0;

let circleOrder = [3, 4, 6, 8, 10, 12, 14, 16, 15, 13, 11, 9, 7, 5];

//3. left ear 4. right ear 5. left shoulder 6. right shoulder 7. left elbow 8. right elbow 9. left wrist
//10. right wrist 11. left hip 12. right hip 13. left knee 14. right knee 15. left ankle 16. right ankle

let poseShapeVid = [];
let poseShapeCam = [];
let morphVid = [];
let morphCam = [];
let diffs = [];
let interval = 50;
let time = 0;

//gCode data
let text = [];

let video;
let camera;

let printerOn = true;
let gCodeButton;

let ultimaker = new Printer(30, 160, 0.06, 0.2, 1);
//1.2 mm z height
//max 12 in
//14x16

let frames = 5;

let state = true;
let vidState = true;

//load video
function preload() {
  video = createVideo(["assets/hipHands.mp4"]);
}

function setup() {
  createCanvas(1200, 675);
  background(220);

  //begin webcam, using logitech external camera--easier to set chrome default
  //camera = createCapture({ video: { deviceId: '95f817e763b17bfa94168ef4af7d341f858a8dd4071f20b41a629a77299eaec3' } });
  //begin webcam, using chrome default camera
  camera = createCapture(VIDEO);
  camera.size(640, 480);

  //create button to download gCode
  gCodeButton = createButton("gCode");
  gCodeButton.mousePressed(gCodeGet);

  //set up gCode for printing
  ultimaker.initializeGCode();
  ultimaker.location.curr = createVector();
  ultimaker.location.prev = createVector();
  for (let i = 0; i < circleOrder.length; i++){
    ultimaker.location.prevLayer.push(createVector())
  }

  //initial results storage
  let vidResults = []; 
  let camResults = [];

  //set up pose detection for video
  poseNet = ml5.poseNet(video, modelLoaded, { maxPoseDetections: 1 });
  poseNet.on("pose", function(results) {
    vidResults = results;
    //console.log(results);
  });

  //set up pose detection for camera
  poseNet1 = ml5.poseNet(camera, modelLoaded, { maxPoseDetections: 1 });
  poseNet1.on("pose", function(results) {
    camResults = results;
    //console.log(results);

    //store raw data
    poses = { vid: vidResults, cam: camResults };
    //console.log(poses);
  });

  frameRate(frames);
  camera.hide();
  video.hide();

  for (let i = 0; i < circleOrder.length; i++) {
    poseShapeVid.push(createVector());
    poseShapeCam.push(createVector());
    let v = createVector(width / 2, height / 2, 0);
    let k = createVector(width / 2, height / 2, 0);
    morphVid.push(v);
    morphCam.push(k);
    //console.log(morphVid[i]);
  }
}

//draw images on screen
function draw() {

  //draw image to screen
  tint(255, 127); // Display at half opacity
  image(video, 0, 0, width, height);
  image(camera, 0, 0, width, height);

  //test to verify poseNet info is there
  if (typeof poses.cam !== "undefined" && typeof poses.vid !== "undefined") {
    if (poses.cam.length >= 1 && poses.vid.length >= 1) {
      if (state) {
        let maxDist = 0;

        //increment forward
        playVideo();
        //pause video
        if (millis() - time >= interval) {
          pauseVideo();
        }

        poseShapeVid = [];
        poseShapeCam = [];

        poseDraw("vid", poseShapeVid);
        poseDraw("cam", poseShapeCam);

        for (let i = 0; i < circleOrder.length; i++) {
          //console.log(poseShapeVid[i]);
          //console.log(morphVid[i]);
          let distVid = p5.Vector.dist(poseShapeVid[i], morphVid[i]);
          let distCam = p5.Vector.dist(poseShapeCam[i], morphCam[i]);
          maxDist = Math.max(maxDist, distVid, distCam);
          console.log(maxDist);
        }

        //determine how many lerp layers
        steps = maxDist / ultimaker.control.wallWidth;
        console.log("steps " + steps);

        state = false;
      }

      //lerp
      if (!state) {
        for (let i = 0; i < steps; i++) {
          vidDistance = lerpPose(poseShapeVid, morphVid, i);
          camDistance = lerpPose(poseShapeCam, morphCam, i);
          ultimaker.newLine();
        }
        // If all the vertices are close, switch shape
        //if (camDistance < 1 && vidDistance < 1) {
        state = true;
        console.log(state);
        //}
      }
    }
  }
}

// When the poseNet model is loaded
function modelLoaded() {
  console.log("Model Loaded!");
}

//when gCode is downloaded
function gCodeGet() {
  ultimaker.endGCode();
  //assemble text array as string
  let addText = text.join("");
  console.log(addText);

  //see if there is anything to download
  if (text === undefined || text.length == 0) {
    alert("no data");
    return false;
    //download gCode as text file
  } else {
    var element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:text/plain;charset=utf-8," + encodeURIComponent(addText)
    );
    element.setAttribute("download", "PrintData.txt");

    element.style.display = "none";
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
    return false;
  }
}

//determine + apply offset so poses are spatially centered
//note that left and right are reversed in poseNet data, keeping same here
function centerPoses(whichPose) {
  let newPose = [];
  calcCenter(poses[whichPose]);
  centers.push(torsoBox);
  newPose = JSON.parse(JSON.stringify(poses[whichPose][0]));

  for (i = 0; i < newPose.pose.keypoints.length; i++) {
    newPose.pose.keypoints[i].position.x += torsoBox.offsets.x;
    newPose.pose.keypoints[i].position.y += torsoBox.offsets.y;
  }

  for (i = 0; i < newPose.skeleton.length; i++) {
    newPose.skeleton[i][0].position.x += torsoBox.offsets.x;
    newPose.skeleton[i][0].position.y += torsoBox.offsets.y;
    newPose.skeleton[i][1].position.x += torsoBox.offsets.x;
    newPose.skeleton[i][1].position.y += torsoBox.offsets.y;
  }
  //console.log(newPose);
  poses[whichPose][0] = newPose;
  //stroke(0, 255, 0);
  //rect(torsoBox.pos.right, torsoBox.pos.top, torsoBox.dimensions.width, torsoBox.dimensions.height);
}

//find the dimensions of the torso box,
//note that left and right are reversed in poseNet data, keeping same here
function calcCenter(whichPose) {
  let leftBound;
  let rightBound;
  let topBound;
  let bottomBound;

  let sLeft = whichPose[0].pose.keypoints[5].position;
  let hLeft = whichPose[0].pose.keypoints[11].position;
  let sRight = whichPose[0].pose.keypoints[6].position;
  let hRight = whichPose[0].pose.keypoints[12].position;

  let xOffset;
  let yOffset;

  //hip or shoulder furthest left
  leftBound = Math.max(sLeft.x, hLeft.x);
  //hip or shoulder furthest right
  rightBound = Math.min(sRight.x, hRight.x);
  //highest shoulder point
  topBound = Math.min(sRight.y, sLeft.y);
  //lowest hip point
  bottomBound = Math.max(hLeft.y, hRight.y);

  xCenter = leftBound + (rightBound - leftBound) / 2;
  yCenter = topBound + (bottomBound - topBound) / 2;

  xOffset = width / 2 - xCenter;
  yOffset = height / 2 - yCenter;

  let pos = {
    left: leftBound,
    right: rightBound,
    top: topBound,
    bottom: bottomBound,
    xCenter: xCenter,
    yCenter: yCenter
  };
  let dimensions = {
    width: leftBound - rightBound,
    height: bottomBound - topBound
  };
  let offsets = { x: xOffset, y: yOffset };

  torsoBox = { pos, dimensions, offsets };
}

function poseDraw(whichPose, whichArray) {
  //center and draw video poses to screen
  centerPoses(whichPose);

  //add points according to circle order
  for (let i = 0; i < circleOrder.length; i++) {
    let x = poses[whichPose][0].pose.keypoints[circleOrder[i]].position.x;
    let y = poses[whichPose][0].pose.keypoints[circleOrder[i]].position.y;
    let v = createVector(
      [x],
      [y],
    );
    whichArray[i] = v;
    //console.log(whichArray[i]);
  }

  push();
  beginShape();
  noFill();
  stroke(255);
  whichArray.forEach(v => {
    vertex(v.x, v.y);
  });
  endShape(CLOSE);
  pop();
}

function lerpPose(whichArray, whichMorph, stepNum) {
  let totalDistance = 0;
  let percent = 1 / steps;

  for (let i = 0; i < circleOrder.length; i++) {
    let v1;
    v1 = whichArray[i];
    //console.log(whichArray[i]);
    // Get the vertex we will draw
    let v2 = whichMorph[i];
    //console.log(whichMorph[i]);
    // Lerp to the target
    v2.lerp(v1, stepNum * percent);
  }

  push();
  beginShape();
  noFill();
  stroke(255, 0, 0);
  whichMorph.forEach(v => {
    vertex(v.x, v.y);
    ultimaker.printPosition(v);
  });
  endShape(CLOSE);
  pop();
}

function playVideo() {
  video.loop();
  time = millis();
}

function pauseVideo() {
  video.pause();
}
