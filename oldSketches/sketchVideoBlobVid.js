// Create a new poseNet method
let poseNet;
let poseNet1;
let poses = [];
let centers = [];
let torsoBox = [];
let steps = 0;
let init= false;

let circleOrder = [3, 4, 6, 8, 10, 12, 14, 16, 15, 13, 11, 9, 7, 5];
//3. left ear 4. right ear 5. left shoulder 6. right shoulder 7. left elbow 8. right elbow 9. left wrist
//10. right wrist 11. left hip 12. right hip 13. left knee 14. right knee 15. left ankle 16. right ankle

let poseShapeVid = [];
let poseShapeCam = [];
let morphVid = [];
let morphCam = [];
let diffs = [];
let interval = 5;
let time = 0;
let layers = [];
let playing = false;

//gCode data
let text = [];
let video;
//let camera;
let printerOn = true;
let gCodeButton;
let forwardButton;
let forwardLerpButton;
let ultimaker = new Printer(30, 160, 0.06, 0.2, 5);
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

  for (let i = 0; i < circleOrder.length; i++) {
    poseShapeVid.push(createVector());
    let v = createVector(width / 2, height / 2);
    morphVid.push(v);
  }

  console.log(morphVid);

  //create button to download gCode
  gCodeButton = createButton("gCode");
  gCodeButton.mousePressed(gCodeGet);

  forwardButton = createButton("change position");
  forwardButton.mousePressed(playVideo);

  forwardLerpButton = createButton("nextLerp");
  forwardLerpButton.mousePressed(buttonInc);

  //set up gCode for printing
  ultimaker.initializeGCode();
  ultimaker.location.curr = createVector();
  ultimaker.location.prev = createVector();
  for (let i = 0; i < circleOrder.length; i++) {
    ultimaker.location.prevLayer.push(createVector());
  }

  //initial results storage
  let vidResults = [];

  //set up pose detection for video
  poseNet = ml5.poseNet(video, modelLoaded, { maxPoseDetections: 1 });
  poseNet.on("pose", function(results) {
    vidResults = results;
    //console.log(results);
    poses = { vid: vidResults, cam: 0 };
  });

  frameRate(frames);
  video.hide();
}

//draw images on screen
function draw() {
  if (playing == true) {
    image(video, 0, 0, width, height);
  }
}

function changePosition() {
  layers.length = [];
  //test to verify poseNet info is there
  if (typeof poses.vid !== "undefined") {
    if (poses.vid.length >= 1) {
      let maxDist = 0;
      poseShapeVid = [];
      poseDraw("vid", poseShapeVid, morphVid);

      for (let i = 0; i < circleOrder.length; i++) {
        let oldX = morphVid[i].x;
        let oldY = morphVid[i].y;
        ultimaker.location.prevLayer[i].set(oldX, oldY);
        console.log(ultimaker.location.prevLayer[i]);
        let distVid = p5.Vector.dist(
          poseShapeVid[i],
          ultimaker.location.prevLayer[i]
        );
        maxDist = Math.max(maxDist, distVid);
        console.log(maxDist);
      }

      //determine how many lerp layers
      steps = maxDist / ultimaker.control.wallWidth;
      console.log("steps " + steps);
    }
  }
  lerpLayers();
}

function poseDraw(whichPose, whichArray, whichMorph) {
  //center and draw video poses to screen
  centerPoses(whichPose);

  //add points according to circle order
  for (let i = 0; i < circleOrder.length; i++) {
    let x = poses[whichPose][0].pose.keypoints[circleOrder[i]].position.x;
    let y = poses[whichPose][0].pose.keypoints[circleOrder[i]].position.y;
    let v = createVector(x, y);
    whichArray[i] = v;
    //initialize morph shape
    if (init == true){
      let x = v.x;
      let y = v.y;
      whichMorph[i].x = x -2;
      whichMorph[i].y = y -2;
    }
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

function lerpLayers() {
  //for (let i = 0; i < steps; i++) {
  if (layers.length < steps) {
    console.log("yes");
    lerpPose(poseShapeVid, morphVid, layers.length);
    //camDistance = lerpPose(poseShapeCam, morphCam, i);
    ultimaker.newLine();
  } else {
    playVideo();
  }
}

function lerpPose(whichArray, whichMorph, stepNum) {
  let percent = 1 / steps;
  let lerpPoint = stepNum * percent;

  console.log("stepNum " + stepNum);
  console.log("percent lerp " + stepNum * percent);

  for (let i = 0; i < circleOrder.length; i++) {
    let v1 = whichArray[i]; //position to move to
    let v2 = ultimaker.location.prevLayer[i]; //position to move from
    console.log(v1);
    console.log(v2);
    let v3 = createVector(); //make a point to map
    v3.set(v2.x, v2.y);
    console.log(v3);
    //v3 = v2.lerp(v1, lerpPoint);
    pointX = map(lerpPoint, 0, 1, v2.x, v1.x);
    pointY = map(lerpPoint, 0, 1, v2.y, v1.y);
    whichMorph[i].set(pointX, pointY);
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
  video.play();
  video.speed(0.1);
  time = millis();
  playing = true;
  const wait = time => new Promise(resolve => setTimeout(resolve, time));
  wait(150).then(() => pauseVideo());
}

function pauseVideo() {
  video.pause();
  console.log("yes");
  playing = false;
  changePosition();
}

function buttonInc() {
  layers.push(0);
  console.log(layers.length);
  lerpLayers();
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
