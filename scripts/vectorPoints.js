let points = [];
let vectors = [];
let bounce = [];
let lineVecs = [];
let originalPoints = [];
let numPoints = 25;
let ultimaker = new Printer(10, 190, 0.06, 0.2, 3);
let windVector;
let faceAngle;
let faceVector;
let storage = window.localStorage;
let recover = true;
let saveCounter = 0;

function preload() {
    checkWeather();
}

function setup() {
    if (recover == true) {
        let saveGcode = localStorage.getItem("Gcode");
        console.log(saveGcode);
    }

    frameRate(.2);
    createCanvas(500, 500);
    background(0);
    ultimaker.initialize();

    for (i = 0; i < numPoints; i++) {
        n = createVector(1, 1);
        v = createVector(0, 0);
        c = createVector(0, 0);
        b = createVector(1, 1);
        points.push(n);
        vectors.push(v);
        lineVecs.push(c);
        bounce.push(b);
    }
    if (numPoints > 0) {
        let dia = random(150, 250);
        //drawCircle(originalPoints, numPoints, 250, 250, dia);
        drawCircle(points, numPoints, 250, 250, dia);
        console.log(dia);
    }
}

function draw() {
    //background(0);

    //save Gcode in case of refresh
    saveCounter += 1;
    console.log("saveCounter" + saveCounter);
    if (saveCounter == 15) {
        let addText = ultimaker.data.text.join("");
        console.log("save");
        storage.setItem("Gcode", addText);
        saveCounter = 0;
    }

    //draw line
    stroke(255);
    strokeWeight(2);
    let drawVec = p5.Vector.mult(windVector, 5);
    line(width / 2, height / 2, drawVec.x + width / 2, drawVec.y + height / 2);
    let drawVec2 = p5.Vector.mult(faceVector, 5);
    stroke(0, 0, 255);
    line(width / 2, height / 2, drawVec2.x + width / 2, drawVec2.y + height / 2);
    //console.log(lineVec);

    //get new vectors from wind data
    facePoints();

    if (ultimaker.position.newLayer == true) {
        for (i = 0; i < numPoints; i++) {
            //let randomVal = 
            let offset = createVector();
            //get the wind offset and make it smaller
            offset = p5.Vector.div(lineVecs[i], -10);
            //add wind offset to circle data
            points[i].add(offset);
            //points[i] = p5.Vector.sub(points[i], offset);
        }
        //console.log(points);
        ultimaker.printLayer(points);
    }

    noStroke();
    for (i = 0; i < points.length; i++) {
        //if (vectors[i].x > 0 || vectors[i].x < 0) {
        //fill(map(abs(vectors[i].x), 0, 1, 0, 255), 0, 0);
        //} else {
        fill((255 / points.length) * i, (255 / points.length) * i, 255);
        //}
        ellipse(points[i].x, points[i].y, 5, 5);
        //console.log(lineVecs[i]);
    }
}

function checkWeather() {
    let url =
        "http://api.openweathermap.org/data/2.5/weather?zip=55437,us&APPID=1b067cf07d577b3a8c9b080d1b786ffb";
    loadJSON(url, gotWeather);
    setTimeout(checkWeather, 300000);
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
    opposite = fixAngle(opposite);
    return opposite;
}

function facePoints() {
    for (i = 0; i < numPoints; i++) {
        let thisPoint = points[i];
        let nextNum = (i + 1) % numPoints;
        let prevNum = i - 1;
        if (prevNum < 0) {
            prevNum = numPoints + prevNum;
        }
        let nextPoint = points[nextNum];
        let prevPoint = points[prevNum];

        let v1 = createVector(nextPoint.x - thisPoint.x, nextPoint.y - thisPoint.y);
        let v2 = createVector(prevPoint.x - thisPoint.x, prevPoint.y - thisPoint.y);
        angle1 = getAngle(v1);
        angle2 = getAngle(v2);
        let angleBetween = degrees(v1.angleBetween(v2));
        let newAngle = fixAngle(angleBetween / 2 + angle1);
        newAngle = opAngle(newAngle);
        //console.log(i, angle1, angle2, newAngle);
        let v3 = p5.Vector.fromAngle(radians(newAngle), 10);
        angle4 = getAngle(v3);
        //console.log(i, angle1, angle2, newAngle, angle4);

        v3 = calcMag(v3, faceAngle);

        lineVecs[i] = v3;

        drawArrow(points[i], lineVecs[i], "green");
        //drawArrow(points[i], v2, 'red');
        //drawArrow(points[i], v3, 'blue');
    }
}

function calcMag(vector, refAngle) {
    let mult;
    let low = fixAngle(refAngle - 90);
    let high = fixAngle(refAngle + 90);
    let deg = getAngle(vector);
    //console.log(i, low, high, deg);
    if (deg > low && deg < high) {
        if (deg <= refAngle) {
            mult = map(deg, low, refAngle, 0, 20);
        } else if (deg >= refAngle) {
            mult = map(deg, refAngle, high, 20, 0);
        }
    } else {
        mult = 1;
    }
    mult = Math.round(mult);
    //console.log(mult);
    vector.setMag(mult);
    return vector;
}

// draw an arrow for a vector at a given base position
function drawArrow(base, vec, myColor) {
    push();
    stroke(myColor);
    strokeWeight(1);
    fill(myColor);
    translate(base.x, base.y);
    line(0, 0, vec.x, vec.y);
    rotate(vec.heading());
    let arrowSize = 7;
    translate(vec.mag() - arrowSize, 0);
    triangle(0, arrowSize / 3, 0, -arrowSize / 3, arrowSize, 0);
    pop();
}

function getAngle(vec) {
    var angle = Math.atan2(vec.y, vec.x);
    var degrees = (180 * angle) / Math.PI;
    return (360 + Math.round(degrees)) % 360;
}

function fixAngle(angle) {
    while (angle < 0) {
        angle += 360;
    }
    while (angle > 360) {
        angle -= 360;
    }
    return angle;
}