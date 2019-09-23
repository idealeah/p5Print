//printer object, assumes square bed
function Printer(bedMin, bedMax, filamentRate, stepSize, filamentWidth) {
  this.bounds = {
    min: {
      x: bedMin,
      y: bedMin
    },
    max: {
      x: bedMax,
      y: bedMax
    }
  };
  this.data = {
    printSetup: [
      "M140 S60 \n",
      "M190 S60 \n",
      "M104 S200 \n",
      "M109 S200 \n",
      "G21 \n", // metric values
      "G90 \n", //absolute positioning
      "M82 \n", //set extruder to absolute mode
      "M107 \n", //start with the fan off
      "G28 X0 Y0 \n", //move X/Y to min endstops
      "G28 Z0 \n", //move Z to min endstops
      "G1 Z15.0 F9000 \n", //move the platform down 15mm
      "G92 E0 \n", //zero the extruded length
      "G1 F200 E3 \n", //extrude 3mm of feed stock
      "G92 E0 \n", //zero the extruded length again
      "G1 F9000 \n",
      "M117 Printing... \n",
      "G92 E0 \n",
      "G1 F1500 E-6.5 \n",
      "M140 S60 \n",
      "M106 S255 \n",
      "G1 Z0.15 F9000 \n" //start z position
    ],
    printFinish: [
      "M107 \n",
      "M104 S0 \n", //extruder heater off
      "M140 S0 \n", //heated bed heater off (if you have it)
      "G91 \n", //relative positioning
      "G1 E-1 F300 \n", //retract filament to release pressure
      "G1 Z+0.5 E-5 F9000 \n", //move Z up and retract filament more
      "G28 X0 Y0 \n", //move X/Y to min endstops
      "M84 \n", //steppers off
      "G90 \n" //absolute positioning
    ],
    text: []
  };
  this.position = {
    prevPoint: 0,
    currPoint: 0,
    prevLayer: [],
    currLayerGcode: [],
    shape: [],
    morph: [],
    layers: [],
    steps: 0,
    dist: 0,
    newLayer: true
  };

  this.control = {
    printZ: 0.15,
    printE: 0,
    eRate: filamentRate,
    distance: 0,
    zIncrease: stepSize,
    wallWidth: filamentWidth
  };

  this.initialize = function() {
    //prusa i3
    for (let i = 0; i < this.data.printSetup.length; i++) {
      this.data.text.push(this.data.printSetup[i]);
    }

    this.position.currPoint = createVector();
    this.position.prevPoint = createVector();

    morphLine = color(255, 255, 255, 100); 

  };

  //user call to print an array
  this.printLayer = function(frameArray) {
    console.log("printLayer");
    //if this is the first layer, initialize previous array data
    if (
      typeof this.position.prevLayer == "undefined" ||
      this.position.prevLayer.length < 1
    ) {
      //this.position.currLayer = frameArray;
      //this.position.prevLayer = frameArray;

      for (let i = 0; i < frameArray.length; i++) {
        //this.position.shape.push(createVector());
        this.position.prevLayer.push(createVector());
        let v = createVector(frameArray[i].x, frameArray[i].y, 0);
        let k = createVector(frameArray[i].x, frameArray[i].y, 0);
        this.position.morph.push(v);     
        this.position.shape.push(v); 
      }
      console.log(this.position);
    } else {
      //add layer data to current layer array
      this.position.shape = frameArray;
    }

    console.log(this.position);

    this.updateLayer(frameArray);
    //print = false;
  };

  //clamp values and add data to Gcode
  this.printPosition = function(point, scale) {
    console.log("currPoint " + point);
    let printX;
    let printY;
    let centerDiff;
    let bedScale = 1;
    let printScale = scale;

    //map coordinates to print bed
    if (height > width) {
      bedScale = width / height;
      printX = map(
        point.x,
        0,
        width,
        this.bounds.min.x,
        this.bounds.max.x * bedScale
      );
      printY = map(point.y, 0, height, this.bounds.min.y, this.bounds.max.y);
    } else {
      bedScale = height / width;
      printX = map(point.x, 0, width, this.bounds.min.x, this.bounds.max.x);
      printY = map(
        point.y,
        0,
        height,
        this.bounds.min.y,
        this.bounds.max.y * bedScale
      );
      console.log(printX, printY);
    }

    //scale size
    finalScale = printScale;
    printX = printX * finalScale;
    printY = printY * finalScale;
    //console.log(printX, printY);

    //rotate
    //let newTurn = rotatePrint(100, 100, printX, printY, 45);
    //console.log(newTurn);

    //printX = newTurn[0];
    //printY = newTurn[1];

    /*     centerDiff = (this.bounds.max.x -  this.bounds.max.x*scale)/2;
    printX = (eval(printX) - eval(centerDiff)).toFixed(2);  */
    
    //printX -= 70;
    //printY -= 20;

    this.position.currPoint.set(printX, printY);

    //find distance printer head will move
    this.control.distance = p5.Vector.dist(
      this.position.currPoint,
      this.position.prevPoint
    );

    //add to absolute value of filament extruded
    if (isNaN(this.control.distance) === false) {
      this.control.printE += this.control.distance * this.control.eRate;
    }

    //add all to gCode array
    if (isNaN(printX) === false && isNaN(printX) === false) {
      //make sure values are rounded and within safe bounds
      let cleanX = clamp(printX, this.bounds.min.x, this.bounds.max.x).toFixed(
        2
      );
      let cleanY = clamp(printY, this.bounds.min.y, this.bounds.max.y).toFixed(
        2
      );

      let cleanE = this.control.printE.toFixed(5);
      //add to Gcode file
      this.data.text.push("G1 F2100 X" + cleanX + " Y" + cleanY + " E" + cleanE + " \n");
      this.position.currLayerGcode.push(
        "G1 F2100 X" + cleanX + " Y" + cleanY + " E" + cleanE + " \n"
      );
    }
    //set old x and y coordinates
    this.position.prevPoint.set(printX, printY);
  };

  //get new camera/video data and add to pose array
  this.updateLayer = function(frameArray) {
    let maxDist = 0;
   // this.position.shape = [];

    for (let i = 0; i < frameArray.length; i++) {
      let oldX = this.position.morph[i].x;
      let oldY = this.position.morph[i].y;
      this.position.prevLayer[i].set(oldX, oldY);
      let dist = p5.Vector.dist(
        this.position.shape[i],
        this.position.prevLayer[i]
      );
      
      maxDist = Math.max(maxDist, dist);
    }
    console.log( this.position.shape, this.position.prevLayer);
    this.position.dist = maxDist;
    this.position.steps = maxDist / this.control.wallWidth;
    console.log(this.position.dist, this.position.steps)

    //do we need to lerp layers
    this.lerpTest();
  };

  //check to see if lerping is needed
  this.lerpTest = function() {
    console.log("lerpTest");
    if (this.position.layers.length < this.position.steps) {
      console.log(this.position.layers.length, this.position.steps);
      console.log("lerping layer: " + this.position.layers.length);
      this.lerpPose(this.position.steps, this.position.layers.length);
      //ultimaker.newLine();
    } else if (this.position.layers.length >= this.position.steps) {
      this.position.newLayer = true;
      this.position.layers.length = 0;
      this.position.steps = 0;
      console.log(this.position.layers.length, this.position.steps);
      console.log("ready for new layer " + this.position.newLayer);
    } else{
      console.log("nopppe");
    }
  };

  //calculate lerp steps and positions
  this.lerpPose = function(whichSteps, whichNum) {
    let stepNum = this.position.layers.length;
    let steps = whichSteps;

    let percent = 1 / steps;
    let lerpPoint = stepNum * percent;

    console.log("step number " +  stepNum);
    console.log("percent lerp " +  stepNum * percent);

    console.log(this.position.morph, this.position.shape, this.position.prevLayer);
    
    for (let i = 0; i < this.position.shape.length; i++) {
      let v1 = this.position.shape[i]; //position to move to
      let v2 = this.position.prevLayer[i]; //position to move from
      let v3 = createVector(); //make a point to map
      v3.set(v2.x, v2.y);
      pointX = map(lerpPoint, 0, 1, v2.x, v1.x);
      pointY = map(lerpPoint, 0, 1, v2.y, v1.y);
      this.position.morph[i].set(pointX, pointY);
    }

    //draw to screen
    this.poseDraw(this.position.morph, morphLine);

    //send to printer
    this.position.morph.forEach(v => {
      this.printPosition(v, 1);
    }); 

    this.position.layers.length += 1;
    this.newLine();
    this.lerpTest();
  };

  //increase z absolute
  this.newLine = function() {
    this.control.printZ += this.control.zIncrease;
    if (this.control.printZ > 177) {
      this.control.printZ = 0.15;
      this.control.printE = 0;
      this.data.text.push("NEW FILE!!!!!!!!!!!!!! \n");
    }
    let cleanZ = this.control.printZ.toFixed(2);
    this.data.text.push("G1 Z" + cleanZ + " F1200 \n");
    this.position.currLayerGcode.push("G1 Z" + cleanZ + " F1200 \n");
    console.log("new line");
  };

  //finalize g code
  this.endGCode = function(){
    //ultimaker
    /*     text.push("G10 \n");
    text.push("M107 \n");
    text.push("M82 ;absolute extrusion mode \n");
    text.push(";End of Gcode"); */
    console.log("endGcode");
    console.log(this.data.text);
    for (let i = 0; i < this.data.printFinish.length; i++) {
      this.data.text.push(this.data.printFinish[i]);
    }
    /*     if (printerConnect == true) {
      serial.write("M107 \n");
      serial.write("M104 S0 ;extruder heater off \n");
      serial.write("M140 S0 ;heated bed heater off (if you have it) \n");
      serial.write("G91 ;relative positioning \n");
      serial.write("G1 E-1 F300  ;retract filament to release pressure \n");
      serial.write("G1 Z+0.5 E-5 F9000 ;move Z up, retract filament more \n");
      serial.write("G28 X0 Y0 ;move X/Y to min endstops \n");
      serial.write("M84 ;steppers off \n");
      serial.write("G90 ;absolute positioning \n");
    } */
  };

  this.poseDraw = function(whichShape, color){
    push();
    //translate(0, 0);
    //let resize = 1;
    beginShape();
    noFill();
    stroke(color);
    whichShape.forEach(v => {
        vertex(v.x, v.y);
    });
    endShape(CLOSE);
    pop();
  }

    //when gCode is downloaded
  this.gCodeGet = function() {
    this.endGCode();
    //assemble text array as string
    let addText = this.data.text.join("");
    console.log(addText);

    //see if there is anything to download
    if (this.data.text === undefined || this.data.text.length == 0) {
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
}


this.mousePressed = function() {
  let d = mouseX;
  let h = mouseY;

  if (d <= width/2 && h <= height/2) {
    ultimaker.gCodeGet();

  }
}

function clamp(val, min, max) {
  return Math.min(Math.max(min, val), max);
}

function rotatePrint(cx, cy, x, y, angle) {
  console.log("yes");
  var radians = (Math.PI / 180) * angle,
    cos = Math.cos(radians),
    sin = Math.sin(radians),
    nx = cos * (x - cx) + sin * (y - cy) + cx,
    ny = cos * (y - cy) - sin * (x - cx) + cy;
  return [nx, ny];
}