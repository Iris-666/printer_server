// var voice = new p5.Speech("Google 國語（臺灣）");
let img;
//Variable for faces
let imgTiles = [];
//Process Machine learning
let faceapi;
let detections = [];
let Mode;
//canvas and camra
let capture;
let canvas;
//Variable to run the facial expression or not
let recog;
//Variable for typeWriter
let index;
let lastMillis = 0;
//Variable for expressions
let exp;
let points;
let content;
let content_Read;
let content_write;
let p; //decide different contents to one emotion
//variables for the position of the pupils
let min_x_, max_x_;
let min_y_, max_y_;
let left_Pumin_x, left_Pup_y;
let right_Pup_x, right_Pup_y;
//position of faces
let middle_x, middle_y;
//pen plotter
let font;
let fSize;
let msg; // text to write
let pts = []; // store path data
let path = [];

let port;
let connectBtn;

let gcode = []; // array of lines
let sentLines = 0; // how many lines we sent
let ackLines = 0; // how many lines were acknowledged
let lastSent = 0; // when the last line got sent

// this for scaling the path
let max_x = 0;
let max_y = 0;
let min_x = 99999;
let min_y = 99999;
let size_x = 40; // user-defined
let size_y = 10;

let inp;

const params = new URLSearchParams(window.location.search);
const data = params.get('data'); // The user input from the first page
console.log(data)

let socket = io();

socket.on("incoming", (data) => {
  console.log("incoming data "+data)
  if(recog != 2){
    // recog = 1;
    msg = data;
  }
})

function toPlotterX(x) {
  return ((x - min_x) / (max_x - min_x)) * size_x;
}

function toPlotterY(y) {
  return ((y - min_y) / (max_y - min_y)) * size_y;
}

function preload() {

  //font
  ManFont = ("Songti")
  ChiFont = ("assets/han.otf")
  // ChiFont = ("Songti")


}

function setup() {
  recog = 0;
  angleMode(DEGREES);
  //canvas and camera
  canvas = createCanvas(1136, 726);
  canvas.parent("myContainer");

  inp = createInput('');
  inp.position(10, 10);
  inp2 = createInput('');
  inp2.position(10, 50);

  let button = createButton('submit');
  button.position(200, 10);

  button.mousePressed(() => {
    console.log(inp.value())
    console.log(inp2.value())
    if(inp.value() == "" || inp2.value == ""){
        console.log("no input")
    }else{
    msg = inp.value() + "\n"+ inp2.value();
    console.log(msg)
    recog = 1;
    Mode = !Mode;
    socket.emit('message', msg)
    }
  });

  Mode = false;
  
  content_Write ="";

  frameRate(15);
  //load facial expression detector
  const faceOptions = {
    withLandmarks: true,
    withExpressions: true,
    withDescriptions: true,
    minConfidence: 0.5,
  };

  // faceapi = ml5.faceApi(capture, faceOptions, faceReady);

  port = createSerial();
  // in setup, we can open ports we have used previously
  // without user interaction
  let usedPorts = usedSerialPorts();
  if (usedPorts.length > 0) {
    port.open(usedPorts[0], 115200);
  }
  // any other ports can be opened via a dialog after
  // user interaction (see connectBtnClick below)
  connectBtn = createButton("Connect to Arduino");
  connectBtn.position(20, 550);
  connectBtn.mousePressed(connectBtnClick);
  //close the ports if accidents happen
  //user interaction(see closeBtnClick below)
  closeBtn= createButton("Disconnect to Arduino");
  closeBtn.position(20, 580);
  closeBtn.mousePressed(closeBtnClick);
}

// function faceReady() {
//   faceapi.detect(gotFaces);
// }

// function gotFaces(error, result) {
//   if (error) {
//     // console.log(error);
//     return;
//   }

//   detections = result;
//   // console.log(detections)
//   faceapi.detect(gotFaces);
// }

function draw() {
  clear();
  push();
  scale(0.4)
  // image(AF2_1,-150,0);
  pop();
  // faces();
  // drawBoxes(detections);
  // drawLandmarks(detections);
  // drawExpressions(detections);
  rectBut(435);
  push()
  textSize(20)

  // introduce();
  pop()
  if (recog == 1) {
    // voice.speak(content);
    // voice.setRate(0.5);
    drawExpressions(detections, width / 2, height / 2, 0);
    index = 0;
    p = random([0, 1]);
    // if (exp != null) {
      opentype.load("assets/zheng.ttf", function (err, f) {
        if (err) {
          alert("Font could not be loaded: " + err);
        } else {
          font = f;
          console.log("font ready");

          fSize = 70;
        //   msg = content;
          let x = 10;
          let y = 300;
          let linebreak = msg.indexOf("\n");
          console.log("index is "+linebreak)
        let firstPath = font.getPath(msg.substring(0, linebreak), x, y, fSize);
        console.log("first path: "+msg.substring(0, linebreak))
          path.push(firstPath);

          let str = msg.substring(linebreak, 20);
          console.log("second path: "+str)
          let lineY = 400;
          let nextPath = font.getPath(str, x, lineY, fSize);
          path.push(nextPath);

          // for (let offset = 8; offset < msg.length; offset += 16) {
          //   let str = msg.substring(offset, offset + 20);
          //   //change line space here
          //   // let lineY = y + ((offset - 8) / 16 + 1) * 50 + 30;

          //   let nextPath = font.getPath(str, x, lineY, fSize);
          //   path.push(nextPath);
          // }
          console.log(path);

          gcode = ["F1000"]; // output string
          gcode.push("$120 = 400");
          gcode.push("$121 = 400");
          gcode.push("$122 = 400");
          gcode.push("G1 F1300");
          let cur_x = 0; // currently ununsed
          let cur_y = 0; // currently ununsed
          let cur_z = 0; // currently ununsed
          let z_down = 0; // Z position when pen is down
          let z_up = 1; // Z position when pen is up

          // figure out scaling
          max_x = 0;
          max_y = 0;
          min_x = 99999;
          min_y = 99999;
          for (let cur_path of path) {
            for (let cur_command of cur_path.commands) {
              if (cur_command.x > max_x) {
                max_x = cur_command.x;
              }
              if (cur_command.y > max_y) {
                max_y = cur_command.y;
              }
              if (cur_command.x < min_x) {
                min_x = cur_command.x;
              }
              if (cur_command.y < min_y) {
                min_y = cur_command.y;
              }
            }
          }

          for (let cur_path of path) {
            let last_pen_down = null;
            for (let cur_command of cur_path.commands) {
              if (cur_command.type == "M") {
                last_pen_down = gcode.length;

                // move somewhere without making a line
                gcode.push("G01 Z" + z_up);
                gcode.push(
                  "G01 X" +
                    toPlotterX(cur_command.x) +
                    " Y" +
                    toPlotterY(cur_command.y)
                );
                gcode.push("G01 Z " + z_down);
              } else if (cur_command.type == "L") {
                // make a line
                gcode.push(
                  "G01 X" +
                    toPlotterX(cur_command.x) +
                    " Y" +
                    toPlotterY(cur_command.y)
                );
              }
            }
          }
          console.log("G-Code", gcode);
          recog++;
          setTimeout(function() {
            //your code to be executed after 1 second
          }, 100);
        }
      });
    // }
  }else if (recog == 2) {
    //gohai code starts
    // console.log('recog = 2');
    let str = port.readUntil("\n");
    // console.log(str);
    if (str.length > 0) {
      if (str.includes("ok")) {
        // received an acknowledgement
        ackLines++;
      } else if (str.includes("error:")) {
        // received an error
        ackLines++;
        console.error("GRBL: " + str);
      } else {
        // received something else
        console.log("GRBL: " + str);
      }
    }
    // if we waited more than a second for an acknowledgement,
    // give up and move on to the next line
    if (ackLines < sentLines && millis() - lastSent > 10000) {
      console.log("Moving on...");
      ackLines++;
    }

    // check if we should sent the next line
    if (sentLines < gcode.length && ackLines == sentLines) {
      console.log("Sending line " + sentLines);
      port.write(gcode[sentLines] + "\n");
      sentLines++;
      lastSent = millis();
    }
    //ends

    if (sentLines >= gcode.length) {
      recog++;
      console.log("ended "+recog)
    }
  }

//   neutral();
  // if (exp == "sad") {
  //   sad();
  // }
  // if (exp == "happy") {
  //   happy();
  // }
  // if (exp == "neutral") {
  //   neutral();
  // }
  // if (exp == "angry") {
  //   angry();
  // }
  // if (exp == "surprised") {
  //   surprised();
  // }
  // if (exp == "fearful") {
  //   fearful();
  // }
  // if (exp == "disgusted") {
  //   disgusted();
  // }
  // reads in complete lines and prints them at the
  // bottom of the canvas
  let str = port.readUntil("\n");
  if (str.length > 0) {
    console.log("GRBL: " + str);
  }
  // changes button label based on connection status
  if (!port.opened()) {
    connectBtn.html("connect to arduino");
  } else {
    connectBtn.hide();
  }
}

function rectBut(x) {
  push();
  stroke(0);
  rectMode(CENTER);
  rect(735 - x, 515, 200, 30, 20);
//   rect(735 - x, 550, 200, 30, 20);
//   rect(900 - x, 535, 100, 60, 20);
  textAlign(CENTER);
  textFont(ManFont);
  push();
  textSize(60);
  // text("虚拟朋友",300, 100);
  pop();
  textSize(20);
  text("print", 735 - x, 520);
//   text("保存图片", 735 - x, 553);
//   text("重新加载", 900 - x, 537);
  pop();
}

function mouseClicked() {
  if (
    recog == 0 &&
    mouseX > 200 &&
    mouseX < 400 &&
    mouseY > 500 &&
    mouseY < 530
  ) {
    // capture.pause();
    recog = 1;
    Mode = !Mode;
  }
  // if (mouseX > 200 && mouseX < 400 && mouseY > 535 && mouseY < 565) {
  //   save(canvas, "Emotion.png");
  // }
//   if (
//     recog == 3 &&
//     mouseX > 415 &&
//     mouseX < 615 &&
//     mouseY > 505 &&
//     mouseY < 565
//   ) {
//     recog = 0;
//   }
}

function connectBtnClick() {
  if (!port.opened()) {
    port.open(115200);
  } else {
    port.close();
  }
}

function closeBtnClick(){
  port.close();
  recog=3
}


function pupils(x1, y1, x2, y2) {
  let dia = 40;
  left_Pup_x = map(x1, max_x_, min_x_, x1 - dia / 3, x1 + dia / 3, true);
  left_Pup_y = map(y1, max_y_, min_y_, y1 - dia / 10, y1 + dia / 10, true);
  Right_Pup_x = left_Pup_x + x2 - x1;
  Right_Pup_y = left_Pup_y + y2 - y1;
  push();
  fill(0);
  ellipse(left_Pup_x, left_Pup_y, 20, dia / 2);
  ellipse(Right_Pup_x, Right_Pup_y, 20, dia / 2);
  pop();
}

function drawBoxes(detections) {
  if (detections.length > 0) {
    for (f = 0; f < detections.length; f++) {
      let { _x, _y, _width, _height } = detections[0].alignedRect._box;
      middle_x = _x + _width / 2;
      middle_y = _y + _height / 2;
    }
  }
}

function drawLandmarks(detections) {
  if (detections.length > 0) {
    for (f = 0; f < detections.length; f++) {
      points = detections[f].landmarks.positions;
      //eyes
      let _x = [];
      let _y = [];
      for (let i = 36; i < 48; i++) {
        _x.push(points[i]._x);
        _y.push(points[i]._y);
      }
      min_x_ = min(_x);
      max_x_ = max(_x);
      min_y_ = min(_y);
      max_y_ = max(_y);
    }
  }
}

function drawExpressions(detections) {
  if (detections.length > 0) {
    let {
      neutral,
      happy,
      angry,
      sad,
      disgusted,
      surpirsed,
      fearful,
    } = detections[0].expressions;
    exp = detections[0].expressions.asSortedArray()[0].expression;
  }
}

//Jane's reaction
//sad
// function sad() {
//   textSize(40);
//   content = "钟齐志莽行书，\n每逢佳节倍思亲";
//   typeWriter();
// }
// //happy()
// function happy() {
//   textSize(40);
//   content = "春风得意马蹄疾，\n一日看尽长安花"
//   typeWriter();
// }
// //Surprised
// function surprised() {
//   textSize(40);
//   content =
//     "儿童见说深惊讶，\n却问何方是故乡";
//   typeWriter();
// }
// //Angry
// function angry() {
//   textSize(40);
//   content = "三十功名尘与土，\n八千里路云和月";
//   typeWriter();
// }
// //disgusted
// function disgusted() {
//   textSize(40);
//   content =
//     "天长地久有时尽，\n此恨绵绵无绝期";
//   typeWriter();
// }
// //neutral
// function neutral() {
//   textSize(40);
//   // content =
//   //   "上海纽约大学  \n哈哈哈哈哈哈  ";
//   // content = "魏老师 \n善行实践，广传爱心"
//   content="博尔赫斯 \n时间是无法分割"
//   typeWriter();
// }
// //fear
// function fearful() {
//   textSize(40);
//   content =
//     "不敢高声语， \n恐惊天上人  ";
//   typeWriter()
// }



// function typeWriter(){
//   push()
//   content_Write = "";
//   if (content!=null ){
//       content_Write = content
//       }
//   textFont("Songti")
//   textAlign(CENTER)
//   textSize(20);
//   text(content_Write.substring(0, index),65,240,390,390)
//   // stroke(0,random([0,255]))
// 	if (millis() > lastMillis + 100) {
// 		index = index + 1;
// 		//ONE WORD AT A TIME }
// 		lastMillis = millis();
// 	}
//   pop()
// }


