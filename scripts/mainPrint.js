// Create a new poseNet method
let poseNet;
let poseNet1;
let poses = [];
let centers = {
  vid: {
    pos: {
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      xCenter: 0,
      yCenter: 0
    },
    dimensions: {
      width: 0,
      height: 0
    },
    offsets: {
      x: 0,
      y: 0
    }
  },
  cam: {
    pos: {
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      xCenter: 0,
      yCenter: 0
    },
    dimensions: {
      width: 0,
      height: 0
    },
    offsets: {
      x: 0,
      y: 0
    }
  }
};

//let globals = {};
let shapeLine; 
let morphLine; 
let init= true;
let inputRatio;

let canvasWidth;
let canvasHeight;

let circleOrder = [3, 4, 6, 8, 10, 12, 14, 16, 15, 13, 11, 9, 7, 5];
//3. left ear 4. right ear 5. left shoulder 6. right shoulder 7. left elbow 8. right elbow 9. left wrist
//10. right wrist 11. left hip 12. right hip 13. left knee 14. right knee 15. left ankle 16. right ankle

let poseData = {
  vid: {
    shape: [],
    morph: [],
    layers: [],
    steps: 0,
    dist: 0
  },
  cam: {
    shape: [],
    morph: [],
    layers: [],
    steps: 0,
    dist: 0,
  },
};

let interval = 20;
let time = 0;
let playingVid = false;
let playingCam = false;
let test = 0; 

//gCode data
let text = [];
let video;
let camera;
let printerOn = true;

// min, max, filament/mm, z-increase, layer lerp
let ultimaker = new Printer(10, 190, 0.06, 0.2, 3);
//prusa
//success at 2 lerp
//10, 190, 0.06, 0.2, 2

//ceramic:
//1.2 mm z height
//max 12 in
//14x16
let frames = 5;
let state = true;
let vidState = true;

let serial;          // variable to hold an instance of the serialport library
let portName = 'COM4';  // fill in your serial port name here
let options = { baudrate: 115200}; 

//load video
function preload() {
  video = createVideo(["assets/dance_Trim.mp4"]);
  video.width = 640; 
  video.height = 480;
}

function setup() {
  //scale to media ratio
  var place = document.getElementById('ml5Canvas');
  let cnv = createCanvas(windowWidth, windowHeight);
  cnv.parent(place);
  background(0);
  shapeLine = color(255, 255, 255); 
  morphLine = color(255, 0, 0); 

  camera = createCapture(VIDEO);
  camera.size(640, 480);

/*   let max = Math.max(camera.width, video.width);
  let min = Math.min(camera.width, video.width); */
  inputRatio = video.width/camera.width;

  for (let i = 0; i < circleOrder.length; i++) {
    poseData.vid.shape.push(createVector());
    poseData.cam.shape.push(createVector());
    let v = createVector(width / 2, height / 2, 0);
    let k = createVector(width / 2, height / 2, 0);
    poseData.vid.morph.push(v);
    poseData.cam.morph.push(k);
  }
  
  //serial stuff
/*   serial = new p5.SerialPort();       // make a new instance of the serialport library
  serial.on('list', printList);  // set a callback function for the serialport list event
  serial.on('connected', serverConnected); // callback for connecting to the server
  serial.on('open', portOpen);        // callback for the port opening
  serial.on('data', serialEvent);     // callback for when new data arrives
  serial.on('error', serialError);    // callback for errors
  serial.on('close', portClose);      // callback for the port closing */
 
/*   serial.list();                      // list the serial ports
  serial.open(portName, options);               // open a serial port */

  //create buttons
/*gCodeButton = createButton("gCode");
  gCodeButton.mousePressed(gCodeGet);
  forwardButton = createButton("change position");
  forwardButton.mousePressed(playVideo);
  forwardLerpButton = createButton("nextLerp");
  forwardLerpButton.mousePressed(buttonInc); */

  //set up gCode for printing
  ultimaker.initializeGCode();
  ultimaker.location.curr = createVector();
  ultimaker.location.prev = createVector();
  for (let i = 0; i < circleOrder.length; i++) {
    ultimaker.location.prevLayer.vid.push(createVector());
    ultimaker.location.prevLayer.cam.push(createVector());
  }

  //initial results storage
  let vidResults = [];
  let camResults = [];

  //set up pose detection for video
  poseNet = ml5.poseNet(video, modelLoaded, { maxPoseDetections: 1});
  poseNet.on("pose", function(results) {
    vidResults = results;
    //console.log(results);
  });

  //set up pose detection for camera
  poseNet1 = ml5.poseNet(camera, modelLoaded, { maxPoseDetections: 1});
  poseNet1.on("pose", function(results) {
    camResults = results;
    //store raw data
    poses = { vid: vidResults, cam: camResults };
    //console.log(poses);
  });

  frameRate(frames);
  video.hide();
  camera.hide();
}

//draw images on screen
function draw() {
  if (playingCam == true) {
/*     tint(255, 127); // Display at half opacity
    image(video, 0, 0, width, height);
    image(camera, 0, 0, width, height); */
    push();
    tint(255, 127); // Display at half opacity
    //translate(-width/6, 0);
    //let scale = .8;
    let scale = 1;    
    let vidX = centers.vid.offsets.x *scale;
    let vidY = centers.vid.offsets.y *scale;
    console.log(vidX, vidY);
    image(video, vidX, vidY,  video.width*scale, video.height*scale);
    //let scale = camera.height/video.height;
    let camX = 0;
    let camY = 0;
    image(camera, camX, camY, video.height*1.33, video.height);
    pop();
    push();
    fill(0);
    noStroke();
    //rect(width/2 + 100, 0, width*.75, height*1.2);
    //rect(width/2, 0, width*.75, height*1.2);
    //rect(0, 0, width/5.8, height*1.2);
    //rect(0, 0, width/4.2, height*1.2);    
    pop();
  }
}

//get new camera/video data and add to pose array
function changePosition(whichPose) {
  playingCam = false;
  poseData[whichPose].layers.length = [];
  //test to verify poseNet info is there
  if (typeof poses[whichPose] !== "undefined") {
    if (poses[whichPose].length >= 1) {
      let maxDist = 0;
      poseData[whichPose].shape = [];
      poseWrite(whichPose);

      for (let i = 0; i < circleOrder.length; i++) {
        let oldX = poseData[whichPose].morph[i].x;
        let oldY = poseData[whichPose].morph[i].y;
        ultimaker.location.prevLayer[whichPose][i].set(oldX, oldY);
        //console.log(ultimaker.location.prevLayer.vid[i]);
        let dist = p5.Vector.dist(
          poseData[whichPose].shape[i],
          ultimaker.location.prevLayer[whichPose][i]
        );

        maxDist = Math.max(maxDist, dist);
      }
      poseData[whichPose].dist = maxDist;
    }
  }
}

function changes(){
 // console.log(poses.vid);
  changePosition("vid");
  changePosition("cam");

  let maxDist = Math.max(poseData.vid.dist, poseData.cam.dist);
  //determine how many lerp layers
  poseData.vid.steps = maxDist / ultimaker.control.wallWidth;
  poseData.cam.steps = maxDist / ultimaker.control.wallWidth;
  console.log("steps " + poseData.vid.steps);

  lerpLayers();
  init = false;
}

//lerp between current and previous images
function lerpLayers() {
   if (poseData.vid.layers.length < poseData.vid.steps && poseData.cam.layers.length < poseData.vid.steps/2) {
    lerpPose("vid", poseData.vid.steps,  poseData.vid.layers.length);
    lerpPose("cam", poseData.vid.steps/2, poseData.cam.layers.length);
    ultimaker.newLine();
    console.log("lerping" + poseData.vid.steps/2 +" "+poseData.cam.layers.length);
  }else if (poseData.vid.layers.length < poseData.vid.steps && poseData.cam.layers.length >= poseData.vid.steps/2) {
    playingCam = true;
    const moveWait = time => new Promise(resolve => setTimeout(resolve, time));
    moveWait(50).then(() => camUpdate());
    console.log("update");
  }else if (poseData.vid.layers.length >= poseData.vid.steps && poseData.cam.layers.length >= poseData.cam.steps/2){
    playVideo();
    console.log("playing");
  }

/*   if (poseData.vid.layers.length < poseData.vid.steps && poseData.cam.layers.length < poseData.cam.steps) {
    lerpPose("vid");
    lerpPose("cam");
    ultimaker.newLine();
  }else{
    playVideo();
  } */
}

function camUpdate(){
/*   playingCam = true;
  const moveWait = time => new Promise(resolve => setTimeout(resolve, time));
  moveWait(1000).then(() => poseWrite("cam"));
  lerpLayers(); */
  //playingCam = false;
 // poseData.cam.layers = [];
  changePosition("cam");
  let maxChange = poseData.cam.dist/(poseData.vid.steps/2);
  poseDraw(poseData.vid.shape, shapeLine);
  lerpLayers();
}

//calculate lerp steps and positions
function lerpPose(whichPose, whichSteps, whichNum) {
/*   let stepNum = poseData[whichPose].layers.length;
  let steps = poseData[whichPose].steps; */
  let stepNum = poseData[whichPose].layers.length;
  let steps = whichSteps;

  let percent = 1 / steps;
  let lerpPoint = stepNum * percent;

  console.log("stepNum "+whichPose + stepNum);
  console.log("percent lerp "+whichPose + stepNum * percent);

  for (let i = 0; i < circleOrder.length; i++) {
    let v1 = poseData[whichPose].shape[i]; //position to move to
    let v2 = ultimaker.location.prevLayer[whichPose][i]; //position to move from
    let v3 = createVector(); //make a point to map
    v3.set(v2.x, v2.y);
    pointX = map(lerpPoint, 0, 1, v2.x, v1.x);
    pointY = map(lerpPoint, 0, 1, v2.y, v1.y);
    poseData[whichPose].morph[i].set(pointX, pointY);
  }

  //draw to screen
  poseDraw(poseData[whichPose].morph, morphLine);

  //send to printer
  poseData[whichPose].morph.forEach(v => {
    ultimaker.printPosition(v, inputRatio, torsoBox.pos.center.x, torsoBox.pos.center.y);
  });
}

//add pose data to circle array, draw
function poseWrite(whichPose) {
  //center and draw video poses to screen
  centerPoses(whichPose);

  //add points according to circle order
  for (let i = 0; i < circleOrder.length; i++) {
    let x = poses[whichPose][0].pose.keypoints[circleOrder[i]].position.x;
    let y = poses[whichPose][0].pose.keypoints[circleOrder[i]].position.y;
    let v = createVector(x, y);
    poseData[whichPose].shape[i] = v;

    //initialize morph shape near first capture
    if (init == true){
      let x = v.x;
      let y = v.y;
      poseData[whichPose].morph[i].x = x -2;
      poseData[whichPose].morph[i].y = y -2;
    }
  }
  
  //draw to screen
  //rect(centers[whichPose].pos.left, centers[whichPose].pos.top, centers[whichPose].dimensions.width, centers[whichPose].dimensions.height);  
  poseDraw(poseData[whichPose].shape, shapeLine);
  //console.log(whichPose);
  //globals.paperLine(whichPose);
}

function poseDraw(whichShape, color){
  push();
  translate(0, 0);
  let resize = 1;
 // translate(width/4 + 100, 15);  
  scale(resize, resize);
  beginShape();
  noFill();
  stroke(color);
  whichShape.forEach(v => {
      vertex(v.x, v.y);
  });
  endShape(CLOSE);
  pop();
}

//play the video briefly
function playVideo() {
  video.play();
  video.speed(0.1);
  time = millis();
  playingVid = true;
  playingCam = true;
  const playWait = time => new Promise(resolve => setTimeout(resolve, time));
  playWait(1500).then(() => pauseVideo());
}

//pause the video
function pauseVideo() {
  video.pause();
  console.log(poses.vid);
  playingVid = false;
  playingCam = true;
  const moveWait = time => new Promise(resolve => setTimeout(resolve, time));
  moveWait(1500).then(() => changes());
}

function buttonInc() {
  poseData.vid.layers.push(0);
  poseData.cam.layers.push(0);
  console.log(poseData.vid.layers.length);
  lerpLayers();
}

// When the poseNet model is loaded
function modelLoaded() {
  console.log("Model Loaded!");
  test += 1;
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
    element.setAttribute("download", "PrintData.gcode");

    element.style.display = "none";
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
    return false;
  }
}

function mousePressed() {
  // Check if mouse is inside the circle
  let d = mouseX;
  let h = mouseY;
  if(test === 2){
    if (h > height/2){
      if (d < width/3) {
        playVideo();
      }

      if (d >= width/3 && d <= (width/3)*2) {
        buttonInc();
      }

      if (d >= (width/3)*2) {
        gCodeGet();
      }
    }
  }
}
