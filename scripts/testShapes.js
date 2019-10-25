let points = [];
let numPoints = 5;
let ultimaker = new Printer(10, 190, 0.06, 0.2, 3);

function setup() {
    frameRate(5);
    createCanvas(500, 500);
    background(0);
    ultimaker.initialize();

    for (i = 0; i <= numPoints; i++) {
        n = createVector(1, 1);
        points.push(n);
        console.log(n);
    }
    console.log(points);
}

function draw() {
    //background(0);

    if (ultimaker.position.newLayer == true) {
        drawCircle(numPoints, 250 + random(50), 250 + random(50), 200);
        console.log(points);
        ultimaker.printLayer(points);
    }

    fill(random(255), random(255), 255);
    for (i = 0; i < points.length; i++) {
        ellipse(points[i].x, points[i].y, 10, 10);
    }

}