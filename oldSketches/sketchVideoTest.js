
// Create a new poseNet method
let poseNet;
let poseNet1;
//let poses = [];
//let centers = [];

//gCode data
let text = [];

let video;
let camera;

let test = 0;

let printerOn = true;
let gCodeButton;

let frames = 30;

let ultimaker = new Printer(30, 160, .06, .2);

let camPose;
let vidPose;

//load video
function preload(){
  video = createVideo(['assets/arms.mp4']);

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
}

function setup() {
  createCanvas(600, 1200);
  background(220);
  video.loop();

  //begin webcam, using logitech external camera--easier to set chrome default
  //camera = createCapture({ video: { deviceId: '95f817e763b17bfa94168ef4af7d341f858a8dd4071f20b41a629a77299eaec3' } });
  //begin webcam, using chrome default camera
  camera = createCapture(VIDEO);
  camera.size(640, 480);

  //create button to download gCode
  gCodeButton = createButton('gCode');
  gCodeButton.mousePressed(gCodeGet);

  //set up gCode for printing
  ultimaker.initializeGCode();

  //initial results storage
  let vidResults = [];
  let camResults = [];

  //set up pose detection for video
  poseNet = ml5.poseNet(video, modelLoaded, {maxPoseDetections: 1});
  poseNet.on('pose', function (results) {
      vidPose = new Pose(results);
      console.log(vidPose.data);
  });
  
  //set up pose detection for camera
  poseNet1 = ml5.poseNet(camera, modelLoaded, {maxPoseDetections: 1});
  poseNet1.on('pose', function (results) {
      camPose = new Pose(results);
      console.log(camPose.data);

     //store raw data
     // poses = ({vid: vidResults, cam: camResults});
     // console.log(poses);

  });

  frameRate(frames);
  camera.hide();
  video.hide();
  
}

//draw images on screen
function draw(){
  tint(255, 127); // Display at half opacity
  image(video, 0, 0, width, height);
  image(camera, 0, 0, camera.width, camera.height);

  //test to verify poseNet info is there
  if (test === 2 && typeof vidPose.data !== "undefined" && typeof camPose.data !== "undefined"){
    if (camPose.data.length >= 1 && vidPose.data.length >= 1){
  //if (test === 2 && typeof vidPose.data !== "undefined"){
    //if (vidPose.data.length >= 1){
          
      console.log(vidPose.data);
      console.log(camPose.data);

      //center and draw video poses to screen
      vidPose.centerPoses("vid");
      vidPose.drawKeypoints("vid");
      vidPose.drawSkeleton("vid"); 

      //center and draw camera poses to screen
      //camPose.centerPoses("cam");
     // camPose.drawKeypoints("cam");
      //camPose.drawSkeleton("cam");

      //test to ensure both poses are detected 
/*       if (typeof camPose.data[0].skeleton.length !== "undefined" && typeof vidPose.data[0].skeleton.length !== "undefined"){
        if (camPose.data[0].skeleton.length >= 1 && vidPose.data[0].skeleton.length >= 1){
          
          //draw differences between poses
          drawDifferences(printerOn); 
        }
      } */
    }
  }
}

// When the poseNet model is loaded
function modelLoaded() {
  console.log('Model Loaded!');
  test += 1;
}

//drawing the differences in the skeletons
function drawDifferences(printOrNot){
  //for (let i = 0; i < poses.results.length; i++) {
   let skeletonVid = vidPose.data[0].skeleton;
   let skeletonCam = camPose.data[0].skeleton;

   //console.log(skeletonVid);
   //console.log(skeletonCam);

   //test to see which pose has less info
   let shorterArray = [];
   if (skeletonVid.length <= skeletonCam.length){
     shorterArray = skeletonVid;
   }else{
     shorterArray = skeletonCam;
   }

   //increase z-axis on printer
   if(printOrNot === true){
    ultimaker.newLine();
   }

   // For every skeleton, loop through all body connections
   for (let j = 0; j < shorterArray.length; j++) {
     let partA = skeletonVid[j][0];
     let partB = skeletonVid[j][1];
     let partC = skeletonCam[j][0];
     let partD = skeletonCam[j][1];
   
     //add fill to see difference
     fill(232, 240, 255, 50);
     push();
     //translate(noise(frameCount), noise(frameCount));
     beginShape();
       vertex(partA.position.x, partA.position.y);
       vertex(partB.position.x, partB.position.y);
       vertex(partD.position.x, partD.position.y);
       vertex(partC.position.x, partC.position.y);
     endShape(CLOSE);
     pop();
    
     //write g code for shapes
     if(printOrNot === true){
      ultimaker.printPosition(partA.position.x, partA.position.y);
      ultimaker.printPosition(partB.position.x, partB.position.y);
      ultimaker.printPosition(partD.position.x, partD.position.y);
      ultimaker.printPosition(partC.position.x, partC.position.y);
    }
   }
 }


//when gCode is downloaded
function gCodeGet(){

  //assemble text array as string
  ultimaker.endGCode();
  let addText = text.join("");
  console.log(addText);

  //see if there is anything to download
  if (text === undefined || text.length == 0){
    alert("no data");
    return false;
  //download gCode as text file
  }else{
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(addText));
    element.setAttribute('download', "PrintData.txt");

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
    return false;
  }
}

//printer object, assumes square bed
function Printer(bedMin, bedMax, filamentRate, stepSize) {
  this.bounds = {
    min: { 
      x: bedMin, y: bedMin, 
    },
    max: { 
      x: bedMax, y: bedMax, 
    }
  };
  this.location = {
    prev: {
      x: 0, y: 0,
    },
    curr: {
      x: 0, y: 0,
    }
  }
  this.control = {
    printZ: 0, 
    printE: 0, 
    eRate: filamentRate, 
    distance: 0, 
    zIncrease: stepSize,
  }
  this.initializeGCode = function(){
    text.push("M82 ;absolute extrusion mode \n");
    text.push("G92 E0 \n");
    text.push("G10 \n");
  
    text.push(";TYPE:SKIN \n");
    text.push("G11 \n");
  }

  this.printPosition = function(x, y){
    //map coordinates to print bed 
    let printX = round(map(x, 0, width, this.bounds.min.x, this.bounds.max.x));
    let printY = round(map(y, 0, height, this.bounds.min.y, this.bounds.max.y));
    console.log(printX, printY);
  
    //find distance printer head will move
    this.control.distance = pythagorean(this.location.prev.x, printX, this.location.prev.y, printY);
    console.log("distance moved: "+this.control.distance);
  
    //add to absolute value of filament extruded
    this.control.printE += this.control.distance * this.control.eRate;
  
    //add all to gCode array
    text.push("G1 F1800 X"+printX+" Y"+printY+" E"+this.control.printE+" \n");
  
    //set old x and y coordinates
    this.location.prev = {x: printX, y: printY};
  }

  //increase z absolute
  this.newLine = function(){
    this.control.printZ += this.control.zIncrease;
    text.push("G1 Z"+this.control.printZ+" F1200 \n");
  }

  //finalize g code
  this.endGCode = function() {
      text.push("G10 \n");
      text.push("M107 \n");
      text.push("M82 ;absolute extrusion mode \n");
      text.push(";End of Gcode");
  };
} 

//find distance the printer will move
function pythagorean(x1, x2, y1, y2){
  sideA = Math.abs(x2-x1);
  sideB = Math.abs(y2-y1);
  return Math.sqrt(Math.pow(sideA, 2) + Math.pow(sideB, 2));
}

function Pose(data){
  this.data = data;
  this.centers = [];
  // A function to draw ellipses over the detected keypoints 
  this.drawKeypoints = function()  {
    let pose = this.data[0].pose;
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
  // A function to draw the skeleton
  this.drawSkeleton = function() {
    let skeleton = this.data[0].skeleton;
      // For every skeleton, loop through all body connections
    for (let j = 0; j < skeleton.length; j++) {
      let partA = skeleton[j][0];
      let partB = skeleton[j][1];
      stroke(255 * noise(millis()), noise(millis())*30, 0);
      line(partA.position.x, partA.position.y, partB.position.x, partB.position.y);
    }
  }

  //determine + apply offset so poses are spatially centered
  //note that left and right are reversed in poseNet data, keeping same here
  this.centerPoses = function(){
    let newPose = [];
    let torsoBox = this.calcCenter();

    newPose = JSON.parse(JSON.stringify(data[0]));
    //console.log(newPose);

    for(i = 0; i < newPose.pose.keypoints.length; i++){
      newPose.pose.keypoints[i].position.x += torsoBox.offsets.x;
      newPose.pose.keypoints[i].position.y += torsoBox.offsets.y;
    }

    for(i = 0; i < newPose.skeleton.length; i++){
      newPose.skeleton[i][0].position.x += torsoBox.offsets.x;
      newPose.skeleton[i][0].position.y += torsoBox.offsets.y;
      newPose.skeleton[i][1].position.x += torsoBox.offsets.x;
      newPose.skeleton[i][1].position.y += torsoBox.offsets.y;
    }

    //console.log(newPose); 
    data[0] = newPose;
  }

  //find the dimensions of the torso box, 
  //note that left and right are reversed in poseNet data, keeping same here
  this.calcCenter = function(){
    let cornerPoints = this.data[0].pose.keypoints;
    
    let leftBound;
    let rightBound;
    let topBound;
    let bottomBound;

    let sLeft = cornerPoints[5].position;
    let hLeft = cornerPoints[11].position;
    let sRight = cornerPoints[6].position;
    let hRight = cornerPoints[12].position;

    let xOffset;
    let yOffset;

    //hip or shoulder furthest left
    if (sLeft.x > hLeft.x){
      leftBound = sLeft.x;
    }else {leftBound = hLeft.x;}

    //hip or shoulder furthest right
    if (sRight.x < hRight.x){
      rightBound = sRight.x;
    }else {rightBound = hRight.x;}

    //highest shoulder point
    if (sLeft.y < sRight.y){
      topBound = sLeft.y;
    }else {topBound = sRight.y;}

    //lowest hip point
    if (hLeft.y > hRight.y){
      bottomBound = hLeft.y;
    }else {bottomBound = hRight.y;}
    
    xCenter = leftBound + (rightBound-leftBound)/2;
    yCenter = topBound + (bottomBound-topBound)/2;

    xOffset = width/2 - xCenter;
    yOffset = height/2 - yCenter;

    let pos = ({left: leftBound, right: rightBound, top: topBound, bottom: bottomBound, xCenter: xCenter, yCenter: yCenter});
    let dimensions = ({width: (leftBound-rightBound), height: (bottomBound-topBound)});
    let offsets = ({x: xOffset, y: yOffset});
      
    return ({pos, dimensions, offsets});
  }
}
