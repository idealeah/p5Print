// Declare a "SerialPort" object
let serial; // variable to hold an instance of the serialport library

//small printer: com4
let portName = "COM6"; // fill in your serial port name here
let options = { baudrate: 115200 };
let latestData = "waiting for data"; // you'll use this to write incoming data to the canvas
//let print = 0;
let key = false;
let ready = false;
let num = 0;
let state = 0;

let printSetup = [
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
  "G1 Z0.5 F9000 \n" //start z position
];

let printFinish = [
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

let print = [
  "G1 F1800 X20 Y20 \n",
  "G1 F1800 X40 Y20 \n",
  "G1 F1800 X40 Y40 \n",
  "G1 F1800 X20 Y40 \n",
  "G1 F1800 X20 Y20 \n"
]

function setup() {
  createCanvas(windowWidth, windowHeight);
 // frameRate(5);
  // Instantiate our SerialPort object
  serial = new p5.SerialPort();

  // Get a list the ports available
  // You should have a callback defined to see the results
  serial.list();

  // Assuming our Arduino is connected, let's open the connection to it
  // Change this to the name of your arduino's serial port
  serial.open(portName, options);

  // Here are the callbacks that you can register
  
  // When we connect to the underlying server
  serial.on("connected", serverConnected);

  // When we get a list of serial ports that are available
  serial.on("list", gotList);
  // OR
  //serial.onList(gotList);

  // When we some data from the serial port
  serial.on("data", gotData);
  // OR
  //serial.onData(gotData);

  // When or if we get an error
  serial.on("error", gotError);
  // OR
  //serial.onError(gotError);

  // When our serial port is opened and ready for read/write
  serial.on("open", gotOpen);
  // OR
  //serial.onOpen(gotOpen);

  // Callback to get the raw data, as it comes in for handling yourself
  serial.on('rawdata', gotRawData);
  // OR
  //serial.onRawData(gotRawData);
}

// We are connected and ready to go
function serverConnected() {
  console.log("Connected to Server");
}

// Got the list of ports
function gotList(thelist) {
  console.log("List of Serial Ports:");
  // theList is an array of their names
  for (var i = 0; i < thelist.length; i++) {
    // Display in the console
    console.log(i + " " + thelist[i]);
  }
}

// Connected to our serial device
function gotOpen() {
  console.log("Serial Port is Open");
}

// Ut oh, here is an error, let's log it
function gotError(theerror) {
  console.log(theerror);
}

// There is data available to work with from the serial port
function gotData() {
  var currentString = serial.readStringUntil("\n"); // read the incoming string
  trim(currentString); // remove any trailing whitespace
  if (!currentString) return; // if the string is empty, do no more
  console.log(currentString); // println the string
  latestData = currentString; // save it for the draw method

  chooseAction();
}

// We got raw from the serial port
function gotRawData(thedata) {
  //console.log("gotRawData " + thedata);
}

// Methods available
// serial.read() returns a single byte of data (first in the buffer)
// serial.readChar() returns a single char 'A', 'a'
// serial.readBytes() returns all of the data available as an array of bytes
// serial.readBytesUntil('\n') returns all of the data available until a '\n' (line break) is encountered
// serial.readString() retunrs all of the data available as a string
// serial.readStringUntil('\n') returns all of the data available as a string until a specific string is encountered
// serial.readLine() calls readStringUntil with "\r\n" typical linebreak carriage return combination
// serial.last() returns the last byte of data from the buffer
// serial.lastChar() returns the last byte of data from the buffer as a char
// serial.clear() clears the underlying serial buffer
// serial.available() returns the number of bytes available in the buffer
// serial.write(somevar) writes out the value of somevar to the serial device

function draw() {
  background(255, 255, 255);
  fill(0, 0, 0);
  text(latestData, 10, 10);

  console.log(key, state, num);
}

function keyPressed() {
  key = true;
  state+= 1;
  printerWrite(printSetup);
}

function chooseAction(){
  if (key == true){
    if(latestData == "ok" || latestData == "echo:SD card ok"){
      if (state == 1){
        printerWrite(print);
        //num += 1;
      } else if (state == 2){
        printerWrite(print);
        //num += 1;
      } else if (state == 3){
        printerWrite(printFinish);
        //num += 1;
      }
      //serial.write("G28 X0 Y0 ;move X/Y to min endstops \n");
    }else {
      return;
    }
  }
}

function printerWrite(array){
  if (num < array.length){
    serial.write(array[num]);
    console.log(array[num]);
    num += 1;
  }else if (num >= array.length){
    num = 0;
    state += 1;
  }
}

