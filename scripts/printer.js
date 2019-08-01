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
      "G1 Z0.15 F9000 \n", //start z position
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
    ]
  }
  this.location = {
    prev: 0,
    curr: 0,
    prevLayer: {
      vid: [],
      cam: []
    },
    currLayer: []
  };

  this.control = {
    printZ: 0.15,
    printE: 0,
    eRate: filamentRate,
    distance: 0,
    zIncrease: stepSize,
    wallWidth: filamentWidth
  };
  this.initializeGCode = function() {
    //ultimaker
    /*  text.push("M82 ;absolute extrusion mode \n");
    text.push("G92 E0 \n");
    text.push("G10 \n");
    text.push(";TYPE:SKIN \n");
    text.push("G11 \n"); */

    //text.push("G1 Z" + this.control.printZ + " F9000 ;start z position \n");

    //prusa i3
    for (let i = 0; i < this.data.printSetup.length; i++){
      text.push(this.data.printSetup[i]);
    }
  };

  this.printPosition = function(whichPose, point, scale, centerX, centerY) {
    //console.log("currPoint " + point);
    let printX;
    let printY;
    let bedScale = 1;
    let centerDiff;
    let printScale = 1.8;
    let diffScale = 1;

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
      //console.log(printX, printY);
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
    printX -= 70;
    printY -= 20;

    this.location.curr.set(printX, printY);

    //find distance printer head will move
    this.control.distance = p5.Vector.dist(
      this.location.curr,
      this.location.prev
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
      text.push("G1 F2100 X" + cleanX + " Y" + cleanY + " E" + cleanE + " \n");
      this.location.currLayer.push("G1 F2100 X" + cleanX + " Y" + cleanY + " E" + cleanE + " \n");
    }
    //set old x and y coordinates
    this.location.prev.set(printX, printY);
  };

  //increase z absolute
  this.newLine = function() {
    this.control.printZ += this.control.zIncrease;
    if (this.control.printZ > 177){
      this.control.printZ = 0.15;
      this.control.printE = 0;
      text.push("NEW FILE!!!!!!!!!!!!!! \n");
    }
    let cleanZ = this.control.printZ.toFixed(2);
    text.push("G1 Z" + cleanZ + " F1200 \n");
    this.location.currLayer.push("G1 Z" + cleanZ + " F1200 \n");
    console.log("new line");
  };

  //finalize g code
  this.endGCode = function() {
    //ultimaker
    /*     text.push("G10 \n");
    text.push("M107 \n");
    text.push("M82 ;absolute extrusion mode \n");
    text.push(";End of Gcode"); */

    for (let i = 0; i < this.data.printFinish.length; i++){
      text.push(this.data.printFinish[i]);
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
