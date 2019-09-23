let points = [];
let numPoints = 15;

let ultimaker = new Printer(10, 190, 0.06, 0.2, 3);

//let print = true;

function setup() {
  frameRate(.25);
  createCanvas(500, 500);
  background(0);
  console.log("HELLO");

  ultimaker.initialize();
}

function draw() {
  //background(0);

  //console.log(ultimaker.position.newLayer);
  //console.log(ultimaker.data.text);

  if (ultimaker.position.newLayer == true){
    for (i = 0; i < numPoints; i++) {
      let x = random(0, 500);
      let y = random(0, 500);
      points.push(createVector(x, y));
    }
    //console.log(points);

    //if (print == true){
    //console.log("printCall");
    ultimaker.printLayer(points);
      //console.log(points);
    //}

    //ultimaker.position.newLayer = false;
  }

  fill(random(255),random(255), 255);
  for (i = 0; i < points.length; i++) {
    ellipse(points[i].x, points[i].y, 10, 10);
    //console.log(points[i], points[i + 1]);
  }

 // console.log(points);

  points = [];
}
