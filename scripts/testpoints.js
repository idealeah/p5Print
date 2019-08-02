let points = []; 
let numPoints = 3;

let ultimaker = new Printer(10, 190, 0.06, 0.2, 3);

function setup(){
    frameRate(2);
    createCanvas(500, 500);
    console.log("HELLO");

    ultimaker.initialize();
}

function draw(){
    background(0);

    for (i = 0; i < numPoints; i++){
        let x = random(0, 500);
        let y = random(0, 500);
        points.push(createVector(x,y));
    }

    console.log(points);

    ultimaker.printLayer(points)

    for (i = 0; i < points.length; i++){
         fill(255);
         ellipse(points[i].x, points[i].y, 10, 10);
         //console.log(points[i], points[i + 1]);
    }

    points = [];
}