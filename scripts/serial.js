let inData;
let num = 0;
let state = 0;
let latestData = "waiting for data"; // you'll use this to write incoming data to the canvas
//let print = 0;
let key = false;
let ready = false;
let serialTime;
//let timeSinceSerial;

// get the list of ports:
function printList(portList) {
  // portList is an array of serial port names
  for (let i = 0; i < portList.length; i++) {
    // Display the list the console:
    //console.log(i + " " + portList[i]);
  }
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
  printerConnect = true;
}

// Uh oh, here is an error, let's log it
function gotError(theerror) {
  console.log(theerror);
}

// There is data available to work with from the serial port
function gotData() {
  //var currentString = serial.readLine(); // read the incoming string
  var currentString = serial.readStringUntil("\n"); // read the incoming string
  trim(currentString); // remove any trailing whitespace
  if (!currentString) return; // if the string is empty, do no more
  //console.log(currentString); // println the string
  latestData = currentString; // save it for the draw method
  console.log("Serial Data: " + currentString);
  
  printData();

  serialTime = millis();
}

// We got raw from the serial port
function gotRawData(thedata) {
  console.log("gotRawData" + thedata);
}

/* function serialEvent() {
  inData = Number(serial.read());
  console.log("Serial Data: " + inData);
  
  if (inData == "wait" || inData == "Resend:1"){
    console.log("printer ready");
    num += 1;
    console.log(num);
    if (test === 2 && state === 0){
      playVideo();
      serial.write("M117 Beginning... \n");
      state += 1;
    }else if (state === 1){
      serial.write("M117 Lerping... \n");
      //buttonInc();
    }else if (end == "true"){
      gCodeGet();
    }
  }
} */

function portClose() {
  console.log("The serial port closed.");
}

function printData(){
  //if (latestData == "wait" || latestData == "Resend:1"){
  if (latestData == "ok" || latestData == "echo:SD card ok"){
    console.log("printer ok");
    console.log("number is "+num);
    console.log("state is "+state);
    console.log("printReady is "+printReady);
    console.log("array length "+ultimaker.location.currLayer.length);

    //if posenet loaded and we're initializing
    if (test == 2 && state == 0){
      if (num < ultimaker.data.printSetup.length){
        sendToPrinter(ultimaker.data.printSetup[num]);
        num += 1;
      }else if (num >= ultimaker.data.printSetup.length){
        console.log("setup finished");
        num = 0;
        state += 1;
      }

    //start the video for the first time
    } else if (state == 1){
      playVideo();
      state += 1;

    //print a layer
    }else if (state == 2 && printReady == true){
      console.log("print state");
      //console.log(ultimaker.location.currLayer.length);
      if (num < ultimaker.location.currLayer.length){
        console.log("printing");
        sendToPrinter(ultimaker.location.currLayer[num]);
        num += 1;
      }else if (num >= ultimaker.location.currLayer.length){
        num = 0;
        console.log("layer done");
        let lastPoint = ultimaker.location.currLayer[ultimaker.location.currLayer.length-1];
        console.log("last point "+lastPoint);
        ultimaker.location.currLayer = [];
        //ultimaker.location.currLayer.push(lastPoint);
        printReady = false;
      }else{
        console.log("fail");
      }

    //keep lerping
    } else if (state == 2 && printReady == false){
      buttonInc();
    
    //end when ready 
    }else if (state == 3){
      if (num < ultimaker.data.printFinish.length){
        sendToPrinter(ultimaker.data.printFinish[num]);
        num += 1;
      }else if (num >= ultimaker.data.printFinish.length){
        num = 0;
        state += 1;
        console.log("done");
      }
    }else if (state == 4){
      return;
    }
  }
}

function sendToPrinter(input){
  console.log("sending " +input);
  serial.write(input);
}