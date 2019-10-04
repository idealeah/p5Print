let points = [];
let vectors = [];
let numPoints = 25;
let ultimaker = new Printer(10, 190, 0.06, 0.2, 3);
let windVector;
let faceAngle;
let faceVector;

function preload() {
    checkWeather();
}

function setup() {
    frameRate(3);
    createCanvas(500, 500);
    background(0);
    ultimaker.initialize();

    for (i = 0; i <= numPoints; i++) {
        n = createVector(1, 1);
        v = createVector(0, 0);
        points.push(n);
        vectors.push(v);
    }
    if (numPoints > 0) {
        drawCircle(numPoints, 250, 250, 200);
    }
}

function draw() {
    //background(0);
    stroke(255);
    strokeWeight(2);
    let lineVec = p5.Vector.mult(windVector, 5);
    line(width / 2, height / 2, lineVec.x + width / 2, lineVec.y + height / 2);
    let lineVec2 = p5.Vector.mult(faceVector, 5);
    stroke(0, 0, 255);
    line(width / 2, height / 2, lineVec2.x + width / 2, lineVec2.y + height / 2);
    //console.log(lineVec);

    facePoints();

    if (ultimaker.position.newLayer == true) {
        for (i = 0; i <= numPoints; i++) {
            let offset = createVector;
            offset = p5.Vector.div(vectors[i], 5);
            points[i] = p5.Vector.add(points[i], offset);
        }
        console.log(points);
        ultimaker.printLayer(points);
    }

    noStroke();
    for (i = 0; i < points.length; i++) {
        if (vectors[i].x > 0 || vectors[i].x < 0) {
            console.log("yes");
            fill(map(abs(vectors[i].x), 0, 1, 0, 255), 0, 0);
        } else {
            fill(255 / points.length * i, 255 / points.length * i, 255);
        }
        ellipse(points[i].x, points[i].y, 10, 10);
    }
}

function checkWeather() {
    let url = 'http://api.openweathermap.org/data/2.5/weather?zip=11216,us&APPID=1b067cf07d577b3a8c9b080d1b786ffb';
    loadJSON(url, gotWeather);
    setTimeout(checkWeather, 600000);
}

function gotWeather(weather) {
    console.log(weather.wind);
    let windDeg = weather.wind.deg;
    let windSpeed = weather.wind.speed;
    windVector = p5.Vector.fromAngle(radians(windDeg), windSpeed);
    console.log(windVector);

    faceAngle = opAngle(windDeg);
    faceVector = p5.Vector.fromAngle(radians(faceAngle), windSpeed);
    console.log(faceAngle);
}

function opAngle(angle) {
    let opposite = (angle - 180) % 360;
    while (opposite < 0) {
        opposite += 360;
    }
    while (opposite > 360) {
        opposite -= 360;
    }
    return opposite;
}

function facePoints() {
    for (i = 0; i <= numPoints; i++) {
        let deg = (360 / numPoints + 1) * i;
        //console.log(deg);
        let mult;
        let low = (faceAngle - 180);
        let high = (faceAngle + 180);
        console.log(i, low, high, deg);
        if (deg > low && deg < high) {
            if (deg <= faceAngle) {
                mult = map(deg, low, faceAngle, 0, 1);
            } else if (deg >= faceAngle) {
                mult = map(deg, faceAngle, high, 1, 0);
            }
        } else {
            mult = 0;
        }
        vectors[i] = p5.Vector.mult(windVector, mult);
    }
    console.log(vectors);
}