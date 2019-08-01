/* 
// Create a new poseNet method
let poseNet;
let poses = [];

let playing = false;
let video;
let button;
let time = 0;
let interval = 50;

let vidResults = [];

//load video
function preload(){
  video = createVideo(['assets/hipHands.mp4']);
}

function setup() {
  createCanvas(1200, 675);
  background(220);
  button = createButton('play');
  button.mousePressed(playVideo); // attach button listener

  //set up pose detection for video
  poseNet = ml5.poseNet(video, modelLoaded, {maxPoseDetections: 1});
  poseNet.on('pose', function (results) {
    vidResults = results;
    //console.log(results);
  });

  video.hide();
}

function draw(){
  //console.log(millis() - time)
  if (millis()-time >= interval){
    pauseVideo();
  }
  if (vidResults.length > 0){
    console.log(vidResults);
    drawKeypoints("vid");
  }
}

function playVideo(){
  video.loop(); 
  time = millis();
}

function pauseVideo(){
  video.pause(); 
}

// A function to draw ellipses over the detected keypoints
function drawKeypoints()  {
  let pose = vidResults[0].pose;
  for (let j = 0; j < pose.keypoints.length; j++) {
    // A keypoint is an object describing a body part (like rightArm or leftShoulder)
    let keypoint = pose.keypoints[j];
    // Only draw an ellipse is the pose probability is bigger than 0.2
    if (keypoint.score > 0.2) {
      fill(255, 0, 0);
      noStroke();
      ellipse(keypoint.position.x, keypoint.position.y, 10, 10);
      console.log("yes");
    }
  }
}

// When the poseNet model is loaded
function modelLoaded() {
  console.log('Model Loaded!');
} */

// Two ArrayLists to store the vertices for two shapes
// This example assumes that each shape will have the same
// number of vertices, i.e. the size of each ArrayList will be the same
let circle = [];
let square = [];

// An ArrayList for a third set of vertices, the ones we will be drawing
// in the window
let morph = [];

// This boolean variable will control if we are morphing to a circle or square
let state = false;
let percent;
let stepSize = 1;
let steps;

function setup() {
  createCanvas(720, 400);
  background(51);
  noLoop();

  // Create a circle using vectors pointing from center
  for (let angle = 0; angle < 360; angle += 9) {
    // Note we are not starting from 0 in order to match the
    // path of a circle.
    let v = p5.Vector.fromAngle(radians(angle - 135));
    v.mult(100);
    circle.push(v);
    // Let's fill out morph ArrayList with blank PVectors while we are at it
    morph.push(createVector());
  }

  // A square is a bunch of vertices along straight lines
  // Top of square
  for (let x = -50; x < 50; x += 10) {
    square.push(createVector(x, -50));
  }
  // Right side
  for (let y = -50; y < 50; y += 10) {
    square.push(createVector(50, y));
  }
  // Bottom
  for (let x = 50; x > -50; x -= 10) {
    square.push(createVector(x, 50));
  }
  // Left side
  for (let y = 50; y > -50; y -= 10) {
    square.push(createVector(-50, y));
  }

  let totalDistance = p5.Vector.dist(circle[0], square[0]);
  steps = totalDistance / stepSize;
  console.log(steps);
}

function draw() {
  for (let j = 0; j <= steps; j++) {
    percent = 1 / steps;
    console.log(percent);
    let lerpPoint = j * percent;
    // Look at each vertex
    for (let i = 0; i < circle.length; i++) {
      let v1 = circle[i];
      //v3 = square[i];
      let v2 = square[i];

      console.log(v1, v2);
      // Lerp to the target
      //let v3 = v2.copy();
      let v3 = Object.assign({}, v2);
      //v3 = v2.lerp(v1, lerpPoint);
      v3.x = map(lerpPoint, 0, 1, v1.x, v2.x);
      v3.y = map(lerpPoint, 0, 1, v1.y, v2.y);
      console.log(v3);
      morph[i] = v3;
      //v2 = v3.lerp(v1, lerpPoint);
      console.log(lerpPoint);
      //console.log(v1, v2);
    }

    console.log("new");

    push();
    // Draw relative to center
    translate(width / 2, height / 2);
    strokeWeight(1);
    // Draw a polygon that makes up all the vertices
    beginShape();
    noFill();
    stroke(255, 80);

    morph.forEach(v => {
      vertex(v.x, v.y);
    });
    endShape(CLOSE);
    pop();

    push();
    // Draw relative to center
    translate(width / 2, height / 2);
    strokeWeight(1);
    // Draw a polygon that makes up all the vertices
    beginShape();
    noFill();
    stroke(255, 0, 0, 50);

    circle.forEach(v => {
      vertex(v.x, v.y);
    });
    endShape(CLOSE);
    pop();

    push();
    // Draw relative to center
    translate(width / 2, height / 2);
    strokeWeight(1);
    // Draw a polygon that makes up all the vertices
    beginShape();
    noFill();
    stroke(0, 255, 0, 50);

    square.forEach(v => {
      vertex(v.x, v.y);
    });
    endShape(CLOSE);
    pop();
  }

  /*  push();

  // Draw relative to center
  translate(width / 2, height / 2);
  strokeWeight(1);
  // Draw a polygon that makes up all the vertices
  beginShape();
  noFill();
  stroke(255);

  circle.forEach(v => {
    vertex(v.x, v.y);
  });
  endShape(CLOSE);

  // Draw relative to center
  //translate(width / 2, height / 2);
  strokeWeight(1);
  // Draw a polygon that makes up all the vertices
  beginShape();
  noFill();
  stroke(255);

  square.forEach(v => {
    vertex(v.x, v.y);
  });
  endShape(CLOSE);

  pop(); */
}
