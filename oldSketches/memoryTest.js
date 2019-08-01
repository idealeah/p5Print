let r;
let g;
let b;

let colors;

myStorage = window.localStorage;

function setup(){
    createCanvas(500, 500);
    background(255);

    r = random(255);
    g = random(255);
    b = random(255);

    //let randomColor= new Color(r, g, b);
    colorMode(HSB);

    let string = r+" "+g+" "+b;
    console.log(string);

    //myStorage.clear();

    var colorLocal = localStorage.getItem('myColor');

    if(colorLocal == null || colorLocal == undefined){
        myStorage.setItem("myColor", string);
        colorLocal = string;
        console.log("no");
    }else{
        colors = colorLocal.split(" ");
        for(i = 0; i < colors.length; i++){
            colors[i] = Number(colors[i]);
        }
        console.log("yes");
        //console.log(colors);
        
    }
}

function draw(){

   // var colorLocal = localStorage.getItem('myColor');
    console.log(colors);

    noStroke();
    fill(colors[0], colors[1], colors[2]);
    rect(width/2, height/2, 100, 100);
}