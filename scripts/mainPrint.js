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
let init = true;
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
};

let interval = 20;
let time = 0;
let test = 0;

//gCode data
let text = [];
let video;
let camera;
let printerOn = true;

// min, max, filament/mm, z-increase, layer lerp
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

let serial; // variable to hold an instance of the serialport library
let portName = 'COM4'; // fill in your serial port name here
let options = {
  baudrate: 115200
};

function setup() {
  //scale to media ratio
  var place = document.getElementById('ml5Canvas');
  let cnv = createCanvas(windowWidth, windowHeight);
  cnv.parent(place);
  background(0);
  shapeLine = color(255, 255, 255);
  morphLine = color(255, 0, 0);

  for (let i = 0; i < circleOrder.length; i++) {
    poseData.vid.shape.push(createVector());
    let v = createVector(width / 2, height / 2, 0);
    poseData.vid.morph.push(v);
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
  }

  frameRate(frames);
}

function camUpdate() {
  changePosition("cam");
  let maxChange = poseData.cam.dist / (poseData.vid.steps / 2);
  poseDraw(poseData.vid.shape, shapeLine);
  lerpLayers();
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
    if (init == true) {
      let x = v.x;
      let y = v.y;
      poseData[whichPose].morph[i].x = x - 2;
      poseData[whichPose].morph[i].y = y - 2;
    }
  }

  //draw to screen
  poseDraw(poseData[whichPose].shape, shapeLine);
}

function poseDraw(whichShape, color) {
  push();
  translate(0, 0);
  let resize = 1;
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

function buttonInc() {
  poseData.vid.layers.push(0);
  poseData.cam.layers.push(0);
  console.log(poseData.vid.layers.length);
  lerpLayers();
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
  if (test === 2) {
    if (h > height / 2) {
      if (d < width / 3) {
        playVideo();
      }

      if (d >= width / 3 && d <= (width / 3) * 2) {
        buttonInc();
      }

      if (d >= (width / 3) * 2) {
        gCodeGet();
      }
    }
  }
}