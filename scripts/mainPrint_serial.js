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
      center: {
        x: 0,
        y: 0
      }
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
let restartData = {
  cam: [],
  vid: []
}

//let globals = {};
let shapeLine;
let morphLine;
let init = true;
let inputRatio;
let begin = false;
let play = false;
let end = false;
let printReady = false;

let restart = true;
let recover = true;
let storage = window.localStorage;
let restartCam;
let restartVid;
let saveCounter = 0;
//storage.clear();

//storage.setItem("saveCam", "hello cam world");
//storage.setItem("saveVid", "hello vid world");

//how long to wait each layer when no printer connected 
let layerTime = 1500;

//threshold confidence for printing
//run
let minScore = .50;
//debug
//let minScore = .30;

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
    dist: 0
  }
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
let printerConnect = false;

// min, max, filament/mm, z-increase, layer lerp
let ultimaker = new Printer(10, 190, 0.06, 0.2, 2.5);

/* prusa
success at 2 lerp
10, 190, 0.06, 0.2, 2

ceramic:
1.2 mm z height
max 12 in
14x16 */

let frames = 5;
let vidState = true;
//how often should we sample webcam data: as a ratio to video data
let percentVid = 2;

let serial; // variable to hold an instance of the serialport library
let portName = "COM6"; // fill in your serial port name here
let options = { baudrate: 115200 }; //set baud rate for printer

//load video
function preload() {
  //video = createVideo(["assets/Hideaway_Trim.mp4"]);
  video = createVideo(["assets/shootVid_4.mp4"]);  
  video.width = 640;
  video.height = 480;
}

function setup() {
  //scale to media ratio
  var place = document.getElementById("ml5Canvas");
  let cnv = createCanvas(windowWidth, windowHeight);
  cnv.parent(place);
  background(255);

  if (recover == true){
    var saveGcode = localStorage.getItem('Gcode');
    console.log(saveGcode);
  }

  //set colors
  //*art* lines
  shapeLine = color(255, 255, 255, 100);
  morphLine = color(255, 255, 255, 100);
  //normal lines for debugging
/*   shapeLine = color(255, 0, 0, 250);
  morphLine = color(255, 255, 255, 250); */
  //book lines
/*   shapeLine = color(0);
  morphLine = color(0); */

  //set up camera
  camera = createCapture(VIDEO);
 // camera.size(1280, 960);
  camera.size(960, 720);
  /*   let max = Math.max(camera.width, video.width);
  let min = Math.min(camera.width, video.width); */
  inputRatio = video.width / camera.width;

  if(restart == true){
    restartCam = localStorage.getItem('restartCam');
    restartVid = localStorage.getItem('restartVid');
    console.log(restartCam, restartVid);
    if (restartCam == null || restartVid == null){
      console.log("no restart data");
      restart = false;
    } else if (restartCam != null && restartVid != null){
      restartCam = restartCam.split(" ");
      restartVid = restartVid.split(" ");

      for(i = 0; i < restartCam.length; i++){
        restartCam[i] = Number(restartCam[i]);
      }

      for(i = 0; i < restartVid.length; i++){
        restartVid[i] = Number(restartVid[i]);
      }
    }
    restartData.cam = restartCam;
    restartData.vid = restartVid;
    console.log(restartCam, restartVid);
  }

  //initialize vectors
  for (let i = 0; i < circleOrder.length; i++) {
    poseData.vid.shape.push(createVector());
    poseData.cam.shape.push(createVector());
    let v = createVector(width / 2, height / 2, 0);
    let k = createVector(width / 2, height / 2, 0);
    poseData.vid.morph.push(v);
    poseData.cam.morph.push(k);
  }

  //serial stuff
  serial = new p5.SerialPort(); // make a new instance of the serialport library
  serial.on("connected", serverConnected); // callback for connecting to the server
  serial.on("list", gotList); // set a callback function for the serialport list event
  serial.on("data", gotData);
  serial.on("error", gotError);
  serial.on("open", gotOpen);
  serial.on("close", portClose); // callback for the port closing

  serial.list(); // list the serial ports
  serial.open(portName, options); // open a serial port

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
  poseNet = ml5.poseNet(video, modelLoaded, { maxPoseDetections: 1 });
  poseNet.on("pose", function(results) {
    vidResults = results;
  });

  //set up pose detection for camera
  poseNet1 = ml5.poseNet(camera, modelLoaded, { maxPoseDetections: 1 });
  poseNet1.on("pose", function(results) {
    camResults = results;
    //store raw data
    poses = { vid: vidResults, cam: camResults };
  });

  frameRate(frames);
  video.hide();
  camera.hide();
}

//draw images on screen
function draw() {

  if (playingCam == true) {
    push();
    tint(255, 10); // Display at half opacity
    //translate(-width/6, 0);
    //let scale = .8;
    scale(-1, 1);    // flip x-axis backwards
    let imgScale = 1;
    //let vidX = centers.vid.offsets.x * -imgScale;
    //let vidY = centers.vid.offsets.y * imgScale;
    //vidX -= width;
    let vidX = -width * imgScale;
    let vidY = 0;
    
    //turn this back on
    image(video, vidX, vidY, width * imgScale *.75, height * imgScale);
    
    //let scale = camera.height/video.height;
    let camX = -height * 1.33;
    let camY = 0;
    //tint(255, 90);
    //image(camera, camX, camY, height * 1.33, height);

    pop();
    push();
    fill(0);
    noStroke();
    fill(color(255, 255, 255, 100));
    console.log(centers.vid.pos.center);
    //rect(0, 0, width, height);
    pop(); 
  }
  let timeSinceSerial = millis() - serialTime;
  if (timeSinceSerial > 3000){
    console.log("time "+timeSinceSerial);
    console.log("serial timeout");
    serialTime = millis();
    if(playingVid == false){
      printData();
    }
  };
  
/*push();
  fill(0);
  textSize(32);
  text(message, 10, 10);
  pop(); */
}

//get new camera/video data and add to pose array
function changePosition(whichPose) {
  console.log("changePosition");
  playingCam = false; //turn off the camera
  poseData[whichPose].layers.length = []; //reset layers number

  //test to verify poseNet info is there
  if (typeof poses[whichPose] !== "undefined") {
    if (poses[whichPose].length >= 1) {
      let maxDist = 0; //reset maximum distance between layers
      poseData[whichPose].shape = []; //reset shape array
      poseWrite(whichPose); //write new data to shape array

      for (let i = 0; i < circleOrder.length; i++) {
        let oldX = poseData[whichPose].morph[i].x;
        let oldY = poseData[whichPose].morph[i].y;
        ultimaker.location.prevLayer[whichPose][i].set(oldX, oldY);
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

function changes() {
  console.log("changes");
  changePosition("vid");
  changePosition("cam");

  //find the max distance
  let maxDist = Math.max(poseData.vid.dist, poseData.cam.dist);

  //determine how many lerp layers
  poseData.vid.steps = maxDist / ultimaker.control.wallWidth;
  poseData.cam.steps = maxDist / ultimaker.control.wallWidth;
  console.log("Steps " + poseData.vid.steps);

  lerpLayers();
  init = false;
}

//lerp between current and previous images
function lerpLayers() {
  console.log("lerpLayers");
  //if both poses still have layers to be printed
  if (
    poseData.vid.layers.length < poseData.vid.steps &&
    poseData.cam.layers.length < poseData.vid.steps / percentVid
  ) {
    lerpPose("vid", poseData.vid.steps, poseData.vid.layers.length);
    lerpPose("cam", poseData.vid.steps / percentVid, poseData.cam.layers.length);

    ultimaker.newLine();
    console.log(
      "lerping " +
        poseData.vid.steps / percentVid +
        " layer num " +
        poseData.cam.layers.length
    );

    console.log("lerp print results " + ultimaker.location.currLayer);
    
    //let camString = poseData.cam.morph;
   // let vidString = poseData.vid.morph;    
    //console.log(camString, vidString);
    //storage.setItem("saveCam", "hello cam world");
    //storage.setItem("saveVid", "hello vid world");
    
    saveCounter += 1;
    console.log("saveCounter"+saveCounter);
    if (saveCounter == 15){
      let addText = text.join("");
      console.log("save");      
      storage.setItem("Gcode", addText);

      let camString = "";
      let vidString = ""; 

      for (i = 0; i < poseData.cam.morph.length; i++){
        camString += poseData.cam.morph[i].x+" "+poseData.cam.morph[i].y+" ";
      }
      for (i = 0; i < poseData.vid.morph.length; i++){
        vidString += poseData.vid.morph[i].x+" "+poseData.vid.morph[i].y+" ";
      }
      
      console.log(poseData.cam.morph);
      console.log(poseData.vid.morph);
      console.log("cam"+camString);
      console.log("vid"+vidString);


      storage.setItem("restartCam", camString);
      storage.setItem("restartVid", vidString);

      saveCounter = 0;
    }

    printReady = true;

    //if no printer, set up a timer to iterate layers forward
   if (printerConnect == false){
      console.log("waiting");
      const layerWait = time => new Promise(resolve => setTimeout(resolve, time));
      layerWait(layerTime).then(() => buttonInc());
    }

    //if video is halfway printed, re-sample camera data
  } else if (
    poseData.vid.layers.length < poseData.vid.steps &&
    poseData.cam.layers.length >= poseData.vid.steps / percentVid
  ) {
    playingCam = true;
    const moveWait = time => new Promise(resolve => setTimeout(resolve, time));
    moveWait(500).then(() => camUpdate());
    console.log("update");

    //if layers are fully printed, start video and camera
  } else if (
    poseData.vid.layers.length >= poseData.vid.steps &&
    poseData.cam.layers.length >= (poseData.cam.steps / percentVid)
  ) {
    playVideo();
    console.log("playing");
  } else { 
    console.log("hanging");
    playVideo();
/*     console.log(poseData.vid.layers.length, poseData.vid.steps);
    console.log(poseData.cam.layers.length, poseData.cam.steps/ percentVid);
    if (poseData.vid.layers.length >= poseData.vid.steps){
      console.log("yes");
    }
    if (poseData.cam.layers.length >= (poseData.cam.steps / percentVid)){
      console.log("yes 2");
    } */
  }
}

//sample new camera data
function camUpdate() {
  console.log("camUpdate");
  changePosition("cam"); //play the camera

  let maxChange = poseData.cam.dist / (poseData.vid.steps / percentVid);
  poseDraw(poseData.vid.shape, shapeLine);
  lerpLayers();
}

//calculate lerp steps and positions
function lerpPose(whichPose, whichSteps, whichNum) {
  console.log("lerpPose");
  console.log(poses);
  let stepNum = poseData[whichPose].layers.length;
  let steps = whichSteps;

  let percent = 1 / steps;
  let lerpPoint = stepNum * percent;

  console.log("stepNum " + whichPose + stepNum);
  console.log("percent lerp  " + whichPose + stepNum * percent);

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
    ultimaker.printPosition(
      whichPose,
      v,
      inputRatio,
      torsoBox.pos.center.x,
      torsoBox.pos.center.y
    );
  });
}

//add pose data to circle array, draw
function poseWrite(whichPose) {
  console.log("poseWrite");
  //center and draw video poses to screen
  centerPoses(whichPose);

  //add points according to circle order
  for (let i = 0; i < circleOrder.length; i++) {
    let x = poses[whichPose][0].pose.keypoints[circleOrder[i]].position.x;
    let y = poses[whichPose][0].pose.keypoints[circleOrder[i]].position.y;
    let v = createVector(x, y);
    poseData[whichPose].shape[i] = v;

    //initialize morph shape near first capture
    if (init == true) {
      if (restart == true){
       let x = restartData[whichPose][i*2];
       let y = restartData[whichPose][(i*2) + 1];
       poseData[whichPose].morph[i].x = x;
       poseData[whichPose].morph[i].y = y;
       console.log(x, y);
      }else{
        let x = v.x;
        let y = v.y;
        poseData[whichPose].morph[i].x = x - 2;
        poseData[whichPose].morph[i].y = y - 2;
      }
    }
    console.log(poseData[whichPose].morph);
  }

  //draw to screen
  //rect(centers[whichPose].pos.left, centers[whichPose].pos.top, centers[whichPose].dimensions.width, centers[whichPose].dimensions.height);
  poseDraw(poseData[whichPose].shape, shapeLine);
}

function poseDraw(whichShape, color) {
  console.log("poseDraw");
  push();

  //book image
/*   translate(width - 100, -650);  
  rotate(1.5708);
  let resize = 1.5;
  scale(resize, resize); */

  //video image
  translate(width+520, -250);
  let resize = 1.5;
  scale(-resize, resize);

  //debug image
/*   let resize = .9;
  translate(width/4 + 100, 15);
  scale(resize, resize); */

  beginShape();
  noFill();
  stroke(color);
  //strokeWeight(.5);
  whichShape.forEach(v => {
    vertex(v.x, v.y);
  });
  endShape(CLOSE);
  pop();
}

//play the video briefly
function playVideo() {
  console.log("playVideo");
  video.play();
  video.speed(0.1);
  time = millis();
  playingVid = true;
  playingCam = true;
  const playWait = time => new Promise(resolve => setTimeout(resolve, time));
  playWait(2500).then(() => pauseVideo());
}

//pause the video
function pauseVideo() {
  console.log("pauseVideo");
  video.pause();
  console.log(poses);

  //see if there are any people in the images, forward if not
  if (poses.vid.length <= 0 || poses.cam.length <= 0){
    playVideo();
  }
  //if there is pose data
  if (poses.vid.length > 0 && poses.cam.length > 0){
    console.log(poses.vid[0].pose.score);
    console.log(poses.cam[0].pose.score);
    //if the pose data is high confidence, print
    if (poses.vid[0].pose.score >= minScore && poses.cam[0].pose.score >= minScore){
      playingVid = false;
      playingCam = true;
      const moveWait = time => new Promise(resolve => setTimeout(resolve, time));
      moveWait(1500).then(() => changes());
  
    //if the pose data is not high confidence, keep playing the video
    } else if (poses.vid[0].pose.score < minScore || poses.cam[0].pose.score < minScore){
      playVideo();
    }
  }
}

//move forward in the print lerping 
function buttonInc() {
  ultimaker.location.currLayer = [];
  console.log("buttonInc");
  poseData.vid.layers.push(0);
  poseData.cam.layers.push(0);
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
  let d = mouseX;
  let h = mouseY;
  if (test === 2) {
    if (h > height / 2) {
      if (d < width / 3) {
        begin = true;
        //printData();
      }
      if (d >= width / 3 && d <= (width / 3) * 2) {
        //ultimaker.location.currLayer = [];
        buttonInc();
      }
      if (d >= (width / 3) * 2) {
        end = true;
        state = 3;
        gCodeGet();
      }
    }
  }
}
