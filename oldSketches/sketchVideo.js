
// Create a new poseNet method
let poseNet;
let poseNet1;
let poses = [];
let centers = [];
let torsoBox = [];
let limbs = {
  leftArmIndex: [5, 7, 9], 
  rightArmIndex: [6, 8, 10], 
  leftLegIndex : [11, 13, 15], 
  rightLegIndex: [12, 14, 16], 
  torsoIndex : [5, 6, 12, 11]
};

let diffs = [];

//gCode data
let text = [];

let video;
let camera;

let printerOn = true;
let gCodeButton;

let ultimaker = new Printer(30, 160, .06, .2, 3);

let frames = 5;

//load video
function preload(){
  video = createVideo(['assets/hipHands.mp4']);
}

function setup() {
  createCanvas(1200, 675);
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
      vidResults = results;
      //console.log(results);
  });
  
  //set up pose detection for camera
  poseNet1 = ml5.poseNet(camera, modelLoaded, {maxPoseDetections: 1});
  poseNet1.on('pose', function (results) {
      camResults = results;
      //console.log(results);

      //store raw data
      poses = ({vid: vidResults, cam: camResults});
      console.log(poses);

  });

  frameRate(frames);
  camera.hide();
  video.hide();
  
}

//draw images on screen
function draw(){
  tint(255, 127); // Display at half opacity
  image(video, 0, 0, width, height);
  image(camera, 0, 0, width, height);

  //test to verify poseNet info is there
  if (typeof poses.cam !== "undefined" && typeof poses.vid !== "undefined"){
    if (poses.cam.length >= 1 && poses.vid.length >= 1){

      //center and draw video poses to screen
      centerPoses("vid");
     //drawKeypoints("vid");
      //drawSkeleton("vid"); 

      //center and draw camera poses to screen
      centerPoses("cam");
     // drawKeypoints("cam");
      //drawSkeleton("cam");

      //test to ensure both poses are detected 
      if (typeof poses.cam[0].skeleton.length !== "undefined" && typeof poses.vid[0].skeleton.length !== "undefined"){
        if (poses.cam[0].skeleton.length >= 1 && poses.vid[0].skeleton.length >= 1){
          
          //draw differences between poses
          //drawDifferences(printerOn); 

/*           drawDifferencesTest(printerOn, "leftArmIndex"); 
          drawDifferencesTest(printerOn, "rightArmIndex"); 
          drawDifferencesTest(printerOn, "leftLegIndex"); 
          drawDifferencesTest(printerOn, "rightLegIndex"); 
          drawDifferencesTest(printerOn, "torsoIndex");  */
          drawDifferencesTest(printerOn);

        }
      }
    }
  }
}

// When the poseNet model is loaded
function modelLoaded() {
  console.log('Model Loaded!');
}

// A function to draw ellipses over the detected keypoints
function drawKeypoints(whichPose)  {
  // Loop through all the poses detected
  //for (let i = 0; i < poses[whichPose].length; i++) {
    // For each pose detected, loop through all the keypoints
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
  //}
}

// A function to draw the skeletons
function drawSkeleton(whichPose) {
  // Loop through all the skeletons detected
  //for (let i = 0; i < poses[whichPose].length; i++) {
    let skeleton = poses[whichPose][0].skeleton;
    // For every skeleton, loop through all body connections
    for (let j = 0; j < skeleton.length; j++) {
      let partA = skeleton[j][0];
      let partB = skeleton[j][1];
      stroke(255 * noise(millis()), noise(millis())*30, 0);
      line(partA.position.x, partA.position.y, partB.position.x, partB.position.y);
    }
  //}
}

//when gCode is downloaded
function gCodeGet(){
  ultimaker.endGCode();
  //assemble text array as string
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

function initializeGCode(){
  //ultimaker 2
  text.push("M82 ;absolute extrusion mode \n");
  text.push("G92 E0 \n");
  text.push("G10 \n");

  text.push(";TYPE:SKIN \n");
  text.push("G11 \n");
}

//determine + apply offset so poses are spatially centered
//note that left and right are reversed in poseNet data, keeping same here
function centerPoses(whichPose){
  let newPose = [];
  calcCenter(poses[whichPose]);

  centers.push(torsoBox);
  newPose = JSON.parse(JSON.stringify(poses[whichPose][0]));
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

  poses[whichPose][0] = newPose;

  //stroke(0, 255, 0);
  //rect(torsoBox.pos.right, torsoBox.pos.top, torsoBox.dimensions.width, torsoBox.dimensions.height);

}

//find the dimensions of the torso box, 
//note that left and right are reversed in poseNet data, keeping same here
function calcCenter(whichPose){
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

  xCenter = leftBound + (rightBound-leftBound)/2;
  yCenter = topBound + (bottomBound-topBound)/2;

  xOffset = width/2 - xCenter;
  yOffset = height/2 - yCenter;

  let pos = ({left: leftBound, right: rightBound, top: topBound, bottom: bottomBound, xCenter: xCenter, yCenter: yCenter});
  let dimensions = ({width: (leftBound-rightBound), height: (bottomBound-topBound)});
  let offsets = ({x: xOffset, y: yOffset});
    
  torsoBox = ({pos, dimensions, offsets});
}

//find distance the printer will move
function pythagorean(x1, x2, y1, y2){
  sideA = Math.abs(x2-x1);
  sideB = Math.abs(y2-y1);
  return Math.sqrt(Math.pow(sideA, 2) + Math.pow(sideB, 2));
}

//printer object, assumes square bed
function Printer(bedMin, bedMax, filamentRate, stepSize, filamentWidth) {
  this.bounds = {
    min: { 
      x: bedMin, y: bedMin, 
    },
    max: { 
      x: bedMax, y: bedMax, 
    },
  };
  this.location = {
    prev: {
      x: 0, y: 0,
    },
    curr: {
      x: 0, y: 0,
    },
    prevLayer: []
  }
  this.control = {
    printZ: 0, 
    printE: 0, 
    eRate: filamentRate, 
    distance: 0, 
    zIncrease: stepSize,
    wallWidth: filamentWidth,
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
  
    //find distance printer head will move
    this.control.distance = pythagorean(this.location.prev.x, printX, this.location.prev.y, printY);
    console.log("distance moved: "+this.control.distance);
  
    //add to absolute value of filament extruded
    if (isNaN(this.control.distance) === false){
      this.control.printE += this.control.distance * this.control.eRate;
    }
    console.log(this.control.eRate);
    console.log("filament: "+this.control.printE);
  
    //add all to gCode array
    if (isNaN(printX) === false && isNaN(printX) ===false){
      text.push("G1 F1800 X"+printX+" Y"+printY+" E"+this.control.printE+" \n");
    }
  
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

//drawing the differences in the skeletons
function drawDifferencesTest(printOrNot){
    //for (let i = 0; i < poses.results.length; i++) {
    let skeletonVid = poses["vid"][0].pose.keypoints;
    let skeletonCam = poses["cam"][0].pose.keypoints;
    let skeletonVidPrev = [];
    let skeletonCamPrev = [];
    if (typeof ultimaker.location.prevLayer !== "undefined" && ultimaker.location.prevLayer.length !== 0){
      skeletonVidPrev = ultimaker.location.prevLayer["vid"][0].pose.keypoints;
      skeletonCamPrev = ultimaker.location.prevLayer["vid"][0].pose.keypoints;
    }
    let lerp = false;
    diffs = [];
          
    //increase z-axis on printer
    if(printOrNot === true){
      ultimaker.newLine();
    }
    
    let limbArray = Object.entries(limbs);

    for(let j = 0; j < limbArray.length; j++){

      //draw torso shapes
      if (limbArray[j][0] === "torsoIndex"){
        drawTorsoShapes(limbArray, skeletonVid, skeletonVidPrev, j);
        drawTorsoShapes(limbArray, skeletonCam, skeletonCamPrev, j);
      }

      //draw arms and legs
      else{
        push();
        fill(232, 240, 255, 50);
        stroke(0);
        beginShape();
        //connect video limb points
        for (let i = 0; i < limbArray[j][1].length; i++){
          if (skeletonVid[limbArray[j][1][i]].score > 0.2) {
            vertex(skeletonVid[limbArray[j][1][i]].position.x, skeletonVid[limbArray[j][1][i]].position.y);
             //calculate change to lerp
            if (typeof skeletonVidPrev !== undefined && skeletonVidPrev.length !== 0){
              diffs.push(calculateChangeToLerp(limbArray, skeletonVid, skeletonVidPrev, j, i));
            }
          //fill in lost points
          }else if (typeof skeletonVidPrev !== undefined && skeletonVidPrev.length !== 0){
            connectLostPoints(limbArray, skeletonVid, skeletonVidPrev, j, i)
          }
        }
        //connect camera limb points
        for (let i = limbArray[j][1].length-1; i > 0; i--){
          if (skeletonCam[limbArray[j][1][i]].score > 0.2) {
            vertex(skeletonCam[limbArray[j][1][i]].position.x, skeletonCam[limbArray[j][1][i]].position.y);
            //calculate change to lerp
            if (typeof skeletonCamPrev !== undefined && skeletonCamPrev.length !== 0){
              diffs.push(calculateChangeToLerp(limbArray, skeletonCam, skeletonCamPrev, j, i));
            }
          //fill in lost points
          }else if (typeof skeletonCamPrev !== undefined && skeletonCamPrev.length !== 0){
            connectLostPoints(limbArray, skeletonCam, skeletonCamPrev, j, i)
          }
        }
        endShape(CLOSE);
        pop();
      }
    }

    //write g code for shapes
    if(printOrNot === true){
      if (diffs.length !== 0){
        if (Math.max(...diffs)> ultimaker.control.wallWidth){
          text.push(";lerping \n");
          //determine how many steps are necessary
          let steps = Math.max(...diffs)/ultimaker.control.wallWidth;
          //console.log(steps);
          let lerpAmt = 1/steps;
          //console.log(lerpAmt);
          //lerp between layers to ensure workable print walls
          for (let n = 0; n < steps; n++){
            for(let j = 0; j < limbArray.length; j++){
              //check for torso drawing
              if (limbArray[j][0] === "torsoIndex"){
                console.log(limbArray[j][1]);
                for (let i = 0; i < limbArray[j][1].length; i++){
                  if (skeletonVid[limbArray[j][1][i]].score > 0.2) {
                    lerpPrint(skeletonVid[limbArray[j][1][i]].position, skeletonVid, skeletonVidPrev, limbArray, i, j, lerpAmt*n);
                  }
                  if (skeletonCam[limbArray[j][1][i]].score > 0.2) {
                    lerpPrint(skeletonCam[limbArray[j][1][i]].position, skeletonCam, skeletonCamPrev, limbArray, i, j, lerpAmt*n);
                  }
                }
              }
              //draw limbs
              else{
                //connect video limb points
                for (let i = 0; i < limbArray[j][1].length; i++){
                  if (skeletonVid[limbArray[j][1][i]].score > 0.2) {
                    lerpPrint(skeletonVid[limbArray[j][1][i]].position, skeletonVid, skeletonVidPrev, limbArray, i, j, lerpAmt*n);
                  }
                }
                //connect camera limb points
                for (let i = limbArray[j][1].length-1; i > 0; i--){
                  if (skeletonCam[limbArray[j][1][i]].score > 0.2) {
                    lerpPrint(skeletonCam[limbArray[j][1][i]].position, skeletonCam, skeletonCamPrev, limbArray, i, j, lerpAmt*n);
                  }
                }
              }
            }
          }
        }
      }
    }
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

    ultimaker.location.prevLayer = poses;
    console.log(diffs);
}
 

function drawTorsoShapes(limbArray, skeletonArray, skeletonArrayPrev, j){
    push();
    stroke(0);
    fill(232, 240, 255, 50);
    beginShape();
    //loop through video torso points
    for (let i = 0; i < limbArray[j][1].length; i++){
      if (skeletonArray[limbArray[j][1][i]].score > 0.2) {
        vertex(skeletonArray[limbArray[j][1][i]].position.x, skeletonArray[limbArray[j][1][i]].position.y);
        //calculate change to lerp
        if (typeof skeletonArrayPrev !== undefined && skeletonArrayPrev.length !== 0){
          diffs.push(calculateChangeToLerp(limbArray, skeletonArray, skeletonArrayPrev, j, i));
        }
      //fill in lost points
      }else if (typeof skeletonArrayPrev !== undefined && skeletonArrayPrev.length !== 0){
        connectLostPoints(limbArray, skeletonArray, skeletonArrayPrev, j, i);
      }
    }
    endShape(CLOSE);
    pop();
}


function calculateChangeToLerp(limbArray, skeletonArray, skeletonArrayPrev, j, i){
  let diffX = Math.abs(skeletonArray[limbArray[j][1][i]].position.x - skeletonArrayPrev[limbArray[j][1][i]].position.x);
  let diffY = Math.abs(skeletonArray[limbArray[j][1][i]].position.y - skeletonArrayPrev[limbArray[j][1][i]].position.y);
  if (isNaN(diffX) || isNaN(diffY)){
    return(0, 0);
  }else{
    return(diffX, diffY);
  }
}

function connectLostPoints(limbArray, skeletonArray, skeletonArrayPrev, j, i){
  if(skeletonArray[limbArray[j][1][i]].score < 0.2 && skeletonArrayPrev[limbArray[j][1][i]].score > 0.2){
    skeletonArray[limbArray[j][1][i]].position.x = skeletonArrayPrev[limbArray[j][1][i]].x;
    skeletonArray[limbArray[j][1][i]].position.y = skeletonArrayPrev[limbArray[j][1][i]].y;
  }
  vertex(skeletonArray[limbArray[j][1][i]].position.x, skeletonArray[limbArray[j][1][i]].position.y);
}

function lerpPrint(inputPoint, skeletonArray, skeletonArrayPrev, limbArray, i ,j, lerpAmt){
  let lerpPointX = lerp(skeletonArrayPrev[limbArray[j][1][i]].position.x, skeletonArray[limbArray[j][1][i]].position.x, lerpAmt);
  let lerpPointY = lerp(skeletonArrayPrev[limbArray[j][1][i]].position.y, skeletonArray[limbArray[j][1][i]].position.y, lerpAmt);  
  console.log(lerpAmt);
  console.log(lerpPointX, lerpPointY);
  if (isNaN(lerpPointX) || isNaN(lerpPointY)){
    ultimaker.printPosition(skeletonArrayPrev[limbArray[j][1][i]].position.x, skeletonArrayPrev[limbArray[j][1][i]].position.y);
    console.log(skeletonArrayPrev[limbArray[j][1][i]].position.x, skeletonArrayPrev[limbArray[j][1][i]].position.y);
  
  }
  else{
    ultimaker.printPosition(lerpPointX, lerpPointY);
    //console.log(lerpPointX, lerpPointY);
  }
}