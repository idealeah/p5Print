function drawCircle(array, numPoints, x, y, diameter) {
    let a = 0;
    let b = diameter;
    let offsetx = x - diameter / 2;
    let offsety = y - diameter / 2;

    for (i = 0; i < numPoints; i++) {
        let angle = PI * 2 / numPoints * i;
        //console.log("i= " + i);
        //console.log("angle= " + degrees(angle));
        let dotx = map(cos(angle), -1, 1, a, b);
        let doty = map(sin(angle), -1, 1, a, b);
        dotx += offsetx;
        doty += offsety;
        array[i].x = dotx;
        array[i].y = doty;
        //console.log(points[i]);
    }
}