// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js"
import { getDatabase, ref, set, get, update, child, onDisconnect, onValue, onChildAdded, onChildRemoved } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBGe6-_HJ3HSZFCd6VGxBzPjOqWFyNANHQ",
    authDomain: "chess3d-f382c.firebaseapp.com",
    projectId: "chess3d-f382c",
    storageBucket: "chess3d-f382c.appspot.com",
    messagingSenderId: "213282093127",
    appId: "1:213282093127:web:a9d4390914f67b00685962"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const database = getDatabase(app);

var c = document.getElementById("gameCanvas");
var ctx = c.getContext("2d");

var keys = [];
var keyDown = false;
var recentKey;

window.addEventListener("keydown", function(event) {
    keys[event.key] = true;
    recentKey = event.key;
    keyDown = true;
}, false);
window.addEventListener("keyup", function(event) {
    keys[event.key] = false;
    keyDown = false;
}, false);

var mouseX, mouseY;

c.addEventListener('contextmenu', function(event) {
    event.preventDefault();
});

window.addEventListener("mousemove", function(event) {
    mouseX = event.clientX - c.getBoundingClientRect().left;
    mouseY = event.clientY - c.getBoundingClientRect().top;
});

var mouseDown, mouseButton;

window.addEventListener("mousedown", function(event) {
    mouseDown = true;
    mouseButton = event.buttons;
});

window.addEventListener("mouseup", function(event) {
    mouseDown = false;
});

const CLICK = {
    LEFT: 1,
    RIGHT: 2
};

const SCREENTYPE = {
    TITLE: 1,
    TITLE_TO_EDITLOCAL: 1.2,
    TITLE_TO_LOCALGAME: 1.3, // deprecated
    TITLE_TO_ONLINESETTINGS: 1.4,
    TITLE_TO_SETTINGS: 1.9,
    EDITLOCAL: 2,
    EDITLOCAL_TO_LOCALGAME: 2.3,
    LOCALGAME: 3,
    ONLINESETTINGS: 4,
    ONLINESETTINGS_TO_EDITONLINE: 4.5,
    ONLINESETTINGS_TO_JOINONLINE: 4.6,
    EDITONLINE: 5,
    EDITONLINE_TO_WAITONLINE: 5.7,
    JOINONLINE: 6,
    JOINONLINE_TO_ONLINEGAME: 6.8,
    WAITONLINE: 7,
    WAITONLINE_TO_ONLINEGAME: 7.8,
    ONLINEGAME: 8,
    SETTINGS: 9,
    SETTINGS_TO_TITLE: 9.1
}

var gameScreen = SCREENTYPE.TITLE;

var spritesheet = document.getElementById("spritesheet");

const PIECE = {
    BLANK: -1,
    KING: 0,
    QUEEN: 1,
    BISHOP: 2,
    KNIGHT: 3,
    ROOK: 4,
    PAWN: 5,
};

const COLOUR = {
    WHITE: 0,
    BLACK: 1
};

var turn = COLOUR.WHITE;

class BoardPos {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    set(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
}

var moveToList = [];

var boardLength = 8;
var typeBoard = Array(boardLength).fill().map(() => Array(boardLength).fill().map(() => Array(boardLength).fill(-1)));
var colourBoard = Array(boardLength).fill().map(() => Array(boardLength).fill().map(() => Array(boardLength).fill(-1)));
var countBoard = Array(boardLength).fill().map(() => Array(boardLength).fill().map(() => Array(boardLength).fill(0)));
var passantBoard = Array(boardLength).fill().map(() => Array(boardLength).fill().map(() => Array(boardLength).fill(0)));
var checkBoard = Array(boardLength).fill().map(() => Array(boardLength).fill().map(() => Array(boardLength).fill(0)));

var selected = new BoardPos(-1, -1, -1);

var showLabels = true;

var moveList = "";

var bluebird = document.getElementById("bluebird");
var badapple = document.getElementById("badapple");
var kawaki = document.getElementById("kawaki");
var bakamitai = document.getElementById("bakamitai");
var never = document.getElementById("never");
bluebird.loop = true;
badapple.loop = true;
kawaki.loop = true;
bakamitai.loop = true;
never.loop = true;

const SONG = {
    BLUEBIRD: 0,
    BADAPPLE: 1,
    KAWAKI: 2,
    BAKAMITAI: 3,
    NEVER: 4,

    LAST: 5
};

var songPlaying = SONG.BLUEBIRD;

var icon = document.getElementById("icon");

var capturedCounts = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

function drawBackground() {
    // background
    ctx.beginPath();
    // right background
    ctx.fillStyle = "#663300";
    ctx.fillRect(512, 0, 512, 4096);
    // left background
    ctx.fillStyle = "#442200";
    ctx.fillRect(0, 0, 512, 4096);
    // move list background
    ctx.fillStyle = "#442200";
    ctx.fillRect(520, 50, 220, 4030);

    // move list label
    ctx.beginPath();
    ctx.fillStyle = "#ffffff";
    ctx.font = "30px Arial";
    ctx.fillText("Move List", 565, 36);
    ctx.font = "15px Arial";
    for (var ii = 0; ii < moveList.split("\n").length; ii++) {
        for (var jj = 0; jj < moveList.split("\n")[ii].split("\\").length; jj++) {
            ctx.fillText(moveList.split("\n")[ii].split("\\")[jj], 522 + (jj * 115), 67 + (ii * 20));
        }
    }
    // ctx.fillText(moveList, 524, 67);

    // pieces background
    ctx.fillStyle = "#442200";
    ctx.fillRect(760, 50, 240, 200);
    // move list label
    ctx.beginPath();
    ctx.fillStyle = "#ffffff";
    ctx.font = "30px Arial";
    ctx.fillText("Capture List", 800, 36);
    // white labels
    ctx.beginPath();
    ctx.drawImage(spritesheet, 5 * (640 / 3), 0 * (427 / 2), (640 / 3), (640 / 3), 758, 50, 40, 40);
    ctx.drawImage(spritesheet, 3 * (640 / 3), 0 * (427 / 2), (640 / 3), (640 / 3), 808, 50, 40, 40);
    ctx.drawImage(spritesheet, 2 * (640 / 3), 0 * (427 / 2), (640 / 3), (640 / 3), 858, 50, 40, 40);
    ctx.drawImage(spritesheet, 4 * (640 / 3), 0 * (427 / 2), (640 / 3), (640 / 3), 908, 50, 40, 40);
    ctx.drawImage(spritesheet, 1 * (640 / 3), 0 * (427 / 2), (640 / 3), (640 / 3), 958, 50, 40, 40);
    // black labels
    ctx.beginPath();
    ctx.drawImage(spritesheet, 5 * (640 / 3), 1 * (427 / 2), (640 / 3), (640 / 3), 758, 150, 40, 40);
    ctx.drawImage(spritesheet, 3 * (640 / 3), 1 * (427 / 2), (640 / 3), (640 / 3), 808, 150, 40, 40);
    ctx.drawImage(spritesheet, 2 * (640 / 3), 1 * (427 / 2), (640 / 3), (640 / 3), 858, 150, 40, 40);
    ctx.drawImage(spritesheet, 4 * (640 / 3), 1 * (427 / 2), (640 / 3), (640 / 3), 908, 150, 40, 40);
    ctx.drawImage(spritesheet, 1 * (640 / 3), 1 * (427 / 2), (640 / 3), (640 / 3), 958, 150, 40, 40);
    // white values
    ctx.beginPath();
    ctx.fillStyle = "#ffffff";
    ctx.font = "30px Arial";
    ctx.fillText(capturedCounts[0], 770, 133);
    ctx.fillText(capturedCounts[1], 820, 133);
    ctx.fillText(capturedCounts[2], 870, 133);
    ctx.fillText(capturedCounts[3], 920, 133);
    ctx.fillText(capturedCounts[4], 970, 133);
    // black values
    ctx.beginPath();
    ctx.fillStyle = "#ffffff";
    ctx.font = "30px Arial";
    ctx.fillText(capturedCounts[5], 770, 236);
    ctx.fillText(capturedCounts[6], 820, 236);
    ctx.fillText(capturedCounts[7], 870, 236);
    ctx.fillText(capturedCounts[8], 920, 236);
    ctx.fillText(capturedCounts[9], 970, 236);

    // promotion background
    ctx.fillStyle = "#442200";
    ctx.fillRect(760, 300, 240, 70);
    // promotion label
    ctx.beginPath();
    ctx.fillStyle = "#ffffff";
    ctx.font = "30px Arial";
    ctx.fillText("Promotion", 810, 286);
    if (promoting) {
        // pieces
        if (mouseX > 763 && mouseX < 803 && mouseY > 312 && mouseY < 352) {
            ctx.drawImage(spritesheet, 3 * (640 / 3), promotingCol * (427 / 2), (640 / 3), (640 / 3), 758, 307, 50, 50);
            if (mouseDown) {
                typeBoard[promotingPos.x][promotingPos.y][promotingPos.z] = PIECE.KNIGHT;
                promoting = false;
            }
        } else {
            ctx.drawImage(spritesheet, 3 * (640 / 3), promotingCol * (427 / 2), (640 / 3), (640 / 3), 763, 312, 40, 40);
        }
        if (mouseX > 824 && mouseX < 864 && mouseY > 312 && mouseY < 352) {
            ctx.drawImage(spritesheet, 2 * (640 / 3), promotingCol * (427 / 2), (640 / 3), (640 / 3), 819, 307, 50, 50);
            if (mouseDown) {
                typeBoard[promotingPos.x][promotingPos.y][promotingPos.z] = PIECE.BISHOP;
                promoting = false;
            }
        } else {
            ctx.drawImage(spritesheet, 2 * (640 / 3), promotingCol * (427 / 2), (640 / 3), (640 / 3), 824, 312, 40, 40);
        }
        if (mouseX > 890 && mouseX < 930 && mouseY > 312 && mouseY < 352) {
            ctx.drawImage(spritesheet, 4 * (640 / 3), promotingCol * (427 / 2), (640 / 3), (640 / 3), 885, 307, 50, 50);
            if (mouseDown) {
                typeBoard[promotingPos.x][promotingPos.y][promotingPos.z] = PIECE.ROOK;
                promoting = false;
            }
        } else {
            ctx.drawImage(spritesheet, 4 * (640 / 3), promotingCol * (427 / 2), (640 / 3), (640 / 3), 890, 312, 40, 40);
        }
        if (mouseX > 958 && mouseX < 998 && mouseY > 312 && mouseY < 352) {
            ctx.drawImage(spritesheet, 1 * (640 / 3), promotingCol * (427 / 2), (640 / 3), (640 / 3), 953, 307, 50, 50);
            if (mouseDown) {
                typeBoard[promotingPos.x][promotingPos.y][promotingPos.z] = PIECE.QUEEN;
                promoting = false;
            }
        } else {
            ctx.drawImage(spritesheet, 1 * (640 / 3), promotingCol * (427 / 2), (640 / 3), (640 / 3), 958, 312, 40, 40);
        }
    }

    // boards
    for (var i = 0; i < boardLength; i++) {
        // begin board background
        ctx.beginPath();
        ctx.fillStyle = "#884400";
        ctx.fillRect(20, 20 + (512 * i), 472, 472);

        // turn colour
        if (turn == COLOUR.WHITE) {
            ctx.fillStyle = "#ffffff";
        } else {
            ctx.fillStyle = "#000000";
        }
        ctx.fillRect(27, 27 + (512 * i), 458, 458);

        // finish board background
        ctx.fillStyle = "#884400";
        ctx.fillRect(33, 33 + (512 * i), 446, 446);

        // white spaces
        ctx.beginPath();
        ctx.fillStyle = "#ffddaa";
        ctx.fillRect(40, 40 + (512 * i), 432, 432);

        // black spaces
        for (var j = 0; j < boardLength; j++) {
            for (var k = 0; k < boardLength; k++) {
                if ((i + j + k) % 2 == 1) {
                    // white spaces
                    ctx.beginPath();
                    ctx.fillStyle = "#662200";
                    ctx.fillRect(40 + (54 * j), 40 + (54 * k) + (512 * i), 54, 54);
                }
            }
        }

        // labels
        if (showLabels) {
            ctx.beginPath();
            ctx.fillStyle = "#ffffff";
            ctx.font = "20px Arial";
            for (var j = 0; j < boardLength; j++) {
                ctx.fillText("abcdefgh"[j], 61 + (54 * j), 15 + (512 * i));
            }
            for (var j = 0; j < boardLength; j++) {
                ctx.fillText("87654321"[j], 5, 69 + (54 * j) + (512 * i));
            }
            ctx.fillText("αβγδεζηθ"[i], 497, 260 + (512 * i));
        }
    }

    // icon
    if (turn == COLOUR.WHITE) {
        icon.href = "images/whitepawn.png";
    } else if (turn == COLOUR.BLACK) {
        icon.href = "images/blackpawn.png";
    }
}

var editSelected = 0;
function drawBackgroundEdit() {
    // background
    ctx.beginPath();
    // right background
    ctx.fillStyle = "#663300";
    ctx.fillRect(512, 0, 512, 4096);
    // left background
    ctx.fillStyle = "#442200";
    ctx.fillRect(0, 0, 512, 4096);

    // select background
    ctx.fillStyle = "#442200";
    ctx.fillRect(525, 60, 240, 90);
    // select label
    ctx.beginPath();
    ctx.fillStyle = "#ffffff";
    ctx.font = "30px Arial";
    ctx.fillText("Select", 605, 46);

    // editing label
    ctx.beginPath();
    ctx.fillStyle = "#ffffff";
    ctx.font = "40px Arial";
    ctx.fillText("Editing", 890, 46);
    ctx.font = "20px Arial";
    ctx.fillText("(Initial Board Layout)", 830, 76);

    // pieces
    for (var m = 0; m < 12; m++) {
        if ((mouseX > (525 + ((m % 6) * 40))) && (mouseX < (565 + ((m % 6) * 40))) && (mouseY > (62 + (Math.floor(m / 6) * 40))) && (mouseY < (102 + (Math.floor(m / 6) * 40)))) {
            if (mouseDown) {
                editSelected = m;
            }
            ctx.drawImage(spritesheet, (m % 6) * (640 / 3), Math.floor(m / 6) * (427 / 2), (640 / 3), (640 / 3), 520 + ((m % 6) * 40), 57 + (Math.floor(m / 6) * 40), 50, 50);
        } else {
            ctx.drawImage(spritesheet, (m % 6) * (640 / 3), Math.floor(m / 6) * (427 / 2), (640 / 3), (640 / 3), 525 + ((m % 6) * 40), 62 + (Math.floor(m / 6) * 40), 40, 40);
        }
    }

    // continue button
    ctx.beginPath();
    if (mouseX > 525 && mouseX < 645 && mouseY > 196 && mouseY < 226) {
        ctx.fillStyle = "#cc8800";
        if (mouseDown) {
            if (gameScreen == SCREENTYPE.EDITLOCAL) {
                gameScreen = SCREENTYPE.EDITLOCAL_TO_LOCALGAME;
            } else if (gameScreen == SCREENTYPE.EDITONLINE) {
                gameScreen = SCREENTYPE.EDITONLINE_TO_WAITONLINE;
            }
        }
    } else {
        ctx.fillStyle = "#442200";
    }
    ctx.fillRect(525, 196, 120, 30);
    ctx.beginPath();
    ctx.fillStyle = "#ffffff";
    ctx.font = "25px Arial";
    ctx.fillText("Continue", 535, 220);

    // boards
    for (var i = 0; i < boardLength; i++) {
        // begin board background
        ctx.beginPath();
        ctx.fillStyle = "#884400";
        ctx.fillRect(20, 20 + (512 * i), 472, 472);

        // turn colour
        if (turn == COLOUR.WHITE) {
            ctx.fillStyle = "#ffffff";
        } else {
            ctx.fillStyle = "#000000";
        }
        ctx.fillRect(27, 27 + (512 * i), 458, 458);

        // finish board background
        ctx.fillStyle = "#884400";
        ctx.fillRect(33, 33 + (512 * i), 446, 446);

        // white spaces
        ctx.beginPath();
        ctx.fillStyle = "#ffddaa";
        ctx.fillRect(40, 40 + (512 * i), 432, 432);

        // black spaces
        for (var j = 0; j < boardLength; j++) {
            for (var k = 0; k < boardLength; k++) {
                if ((i + j + k) % 2 == 1) {
                    // white spaces
                    ctx.beginPath();
                    ctx.fillStyle = "#662200";
                    ctx.fillRect(40 + (54 * j), 40 + (54 * k) + (512 * i), 54, 54);
                }
            }
        }

        // labels
        if (showLabels) {
            ctx.beginPath();
            ctx.fillStyle = "#ffffff";
            ctx.font = "20px Arial";
            for (var j = 0; j < boardLength; j++) {
                ctx.fillText("abcdefgh"[j], 61 + (54 * j), 15 + (512 * i));
            }
            for (var j = 0; j < boardLength; j++) {
                ctx.fillText("87654321"[j], 5, 69 + (54 * j) + (512 * i));
            }
            ctx.fillText("αβγδεζηθ"[i], 497, 260 + (512 * i));
        }
    }

    // draw pieces
    for (var i = 0; i < boardLength; i++) {
        for (var j = 0; j < boardLength; j++) {
            for (var k = 0; k < boardLength; k++) {
                // ctx.drawImage(spritesheet, (typeBoard[i][j][k] % 6) * (640 / 3), Math.floor(typeBoard[i][j][k] / 6) * (427 / 2), (640 / 3), (640 / 3), (i * 54) + 40, (j * 54) + (k * 512) + 40, 54, 54);
                ctx.drawImage(spritesheet, typeBoard[i][j][k] * (640 / 3), colourBoard[i][j][k] * (427 / 2), (640 / 3), (640 / 3), (i * 54) + 40, (j * 54) + (k * 512) + 40, 54, 54);
            }
        }
    }

    // draw pink select
    for (var i = 0; i < boardLength; i++) {
        for (var j = 0; j < boardLength; j++) {
            for (var k = 0; k < boardLength; k++) {
                if (mouseX > 40 + (54 * i) && mouseX < 94 + (54 * i) && mouseY > 40 + (54 * j) + (512 * k) && mouseY < 94 + (54 * j) + (512 * k)) {
                    if (mouseDown && mouseButton == CLICK.LEFT) {
                        typeBoard[i][j][k] = (editSelected % 6);
                        colourBoard[i][j][k] = Math.floor(editSelected / 6)
                    }
                    
                    if (mouseDown && mouseButton == CLICK.RIGHT) {
                        typeBoard[i][j][k] = PIECE.BLANK;
                    }
                    ctx.beginPath();
                    ctx.fillStyle = "#ff00ff88";
                    ctx.fillRect(40 + (54 * i), 40 + (54 * j) + (512 * k), 54, 54);
                }
            }
        }
    }
}

function drawBoard() {
    for (var i = 0; i < boardLength; i++) {
        for (var j = 0; j < boardLength; j++) {
            for (var k = 0; k < boardLength; k++) {
                if (typeBoard[i][j][k] != -1) {
                    drawPiece(typeBoard[i][j][k], colourBoard[i][j][k], i, j, k);
                }
            }
        }
    }
}

function initBoard() {
    for (var i = 0; i < boardLength; i++) {
        for (var j = 0; j < boardLength; j++) {
            // white rook corners
            if ((i == 0 || i == 7) && (j == 0 || j == 7)) {
                typeBoard[i][j][0] = PIECE.ROOK;
                colourBoard[i][j][0] = COLOUR.WHITE;
            }

            // white bishop corners
            if ((i == 2 || i == 5) && (j == 2 || j == 5)) {
                typeBoard[i][j][0] = PIECE.BISHOP;
                colourBoard[i][j][0] = COLOUR.WHITE;
            }

            // white knight corners
            if ((i == 1 || i == 6) && (j == 1 || j == 6)) {
                typeBoard[i][j][0] = PIECE.KNIGHT;
                colourBoard[i][j][0] = COLOUR.WHITE;
            }

            // white pawn diagonals
            if (i == j || i == (7 - j)) {
                typeBoard[i][j][1] = PIECE.PAWN;
                colourBoard[i][j][1] = COLOUR.WHITE;
            }

            // white pawn sidepairs
            if ((i == 3 || i == 4) && (j == 0 || j == 7)) {
                typeBoard[i][j][1] = PIECE.PAWN;
                colourBoard[i][j][1] = COLOUR.WHITE;
            }
            if ((i == 0 || i == 7) && (j == 3 || j == 4)) {
                typeBoard[i][j][1] = PIECE.PAWN;
                colourBoard[i][j][1] = COLOUR.WHITE;
            }

            // white pawn squares
            if ((i == 1 || i == 2 || i == 5 || i == 6) && (j == 3 || j == 4)) {
                typeBoard[i][j][2] = PIECE.PAWN;
                colourBoard[i][j][2] = COLOUR.WHITE;
            }
            if ((i == 3 || i == 4) && (j == 1 || j == 2 || j == 5 || j == 6)) {
                typeBoard[i][j][2] = PIECE.PAWN;
                colourBoard[i][j][2] = COLOUR.WHITE;
            }

            // black rook corners
            if ((i == 0 || i == 7) && (j == 0 || j == 7)) {
                typeBoard[i][j][7] = PIECE.ROOK;
                colourBoard[i][j][7] = COLOUR.BLACK;
            }

            // black bishop corners
            if ((i == 2 || i == 5) && (j == 2 || j == 5)) {
                typeBoard[i][j][7] = PIECE.BISHOP;
                colourBoard[i][j][7] = COLOUR.BLACK;
            }

            // black knight corners
            if ((i == 1 || i == 6) && (j == 1 || j == 6)) {
                typeBoard[i][j][7] = PIECE.KNIGHT;
                colourBoard[i][j][7] = COLOUR.BLACK;
            }

            // black pawn diagonals
            if (i == j || i == (7 - j)) {
                typeBoard[i][j][6] = PIECE.PAWN;
                colourBoard[i][j][6] = COLOUR.BLACK;
            }

            // black pawn sidepairs
            if ((i == 3 || i == 4) && (j == 0 || j == 7)) {
                typeBoard[i][j][6] = PIECE.PAWN;
                colourBoard[i][j][6] = COLOUR.BLACK;
            }
            if ((i == 0 || i == 7) && (j == 3 || j == 4)) {
                typeBoard[i][j][6] = PIECE.PAWN;
                colourBoard[i][j][6] = COLOUR.BLACK;
            }

            // black pawn squares
            if ((i == 1 || i == 2 || i == 5 || i == 6) && (j == 3 || j == 4)) {
                typeBoard[i][j][5] = PIECE.PAWN;
                colourBoard[i][j][5] = COLOUR.BLACK;
            }
            if ((i == 3 || i == 4) && (j == 1 || j == 2 || j == 5 || j == 6)) {
                typeBoard[i][j][5] = PIECE.PAWN;
                colourBoard[i][j][5] = COLOUR.BLACK;
            }
        }
    }

    // white kings
    typeBoard[3][3][0] = PIECE.KING;
    colourBoard[3][3][0] = COLOUR.WHITE;

    typeBoard[4][4][0] = PIECE.KING;
    colourBoard[4][4][0] = COLOUR.WHITE;

    // white queens
    typeBoard[3][4][0] = PIECE.QUEEN;
    colourBoard[3][4][0] = COLOUR.WHITE;

    typeBoard[4][3][0] = PIECE.QUEEN;
    colourBoard[4][3][0] = COLOUR.WHITE;

    // black kings
    typeBoard[3][3][7] = PIECE.KING;
    colourBoard[3][3][7] = COLOUR.BLACK;

    typeBoard[4][4][7] = PIECE.KING;
    colourBoard[4][4][7] = COLOUR.BLACK;

    // black queens
    typeBoard[3][4][7] = PIECE.QUEEN;
    colourBoard[3][4][7] = COLOUR.BLACK;

    typeBoard[4][3][7] = PIECE.QUEEN;
    colourBoard[4][3][7] = COLOUR.BLACK;
}

function drawPiece(type, colour, x, y, z) {
    ctx.beginPath();
    if (gameScreen == SCREENTYPE.ONLINEGAME) {
        if (colour == oSelfCol && mouseX > (x * 54) + 40 && mouseX < (x * 54) + 94 && mouseY > (y * 54) + (z * 512) + 40 && mouseY < (y * 54) + (z * 512) + 94) {
            ctx.drawImage(spritesheet, type * (640 / 3), colour * (427 / 2), (640 / 3), (640 / 3), (x * 54) + 36, (y * 54) + (z * 512) + 36, 62, 62);
            if (turn == oSelfCol) {
                if (mouseDown && mouseButton == CLICK.LEFT && !promoting) {
                    selected.set(x, y, z);
                    calculateMoveToList();
                }
            }
        } else {
            if (colour != oSelfCol && mouseX > (x * 54) + 40 && mouseX < (x * 54) + 94 && mouseY > (y * 54) + (z * 512) + 40 && mouseY < (y * 54) + (z * 512) + 94) {
                if (mouseDown && mouseButton == CLICK.RIGHT && !promoting) {
                    turn = (turn + 1) % 2;
                    selected.set(x, y, z);
                    calculateMoveToList();
                    moveToListToThreatList();
                    turn = (turn + 1) % 2;
                }
                ctx.drawImage(spritesheet, type * (640 / 3), colour * (427 / 2), (640 / 3), (640 / 3), (x * 54) + 36, (y * 54) + (z * 512) + 36, 62, 62);
            } else {
                ctx.drawImage(spritesheet, type * (640 / 3), colour * (427 / 2), (640 / 3), (640 / 3), (x * 54) + 40, (y * 54) + (z * 512) + 40, 54, 54);
            }
        }
    } else {
        if (colour == turn && mouseX > (x * 54) + 40 && mouseX < (x * 54) + 94 && mouseY > (y * 54) + (z * 512) + 40 && mouseY < (y * 54) + (z * 512) + 94) {
            ctx.drawImage(spritesheet, type * (640 / 3), colour * (427 / 2), (640 / 3), (640 / 3), (x * 54) + 36, (y * 54) + (z * 512) + 36, 62, 62);
            if (mouseDown && mouseButton == CLICK.LEFT && !promoting) {
                selected.set(x, y, z);
                calculateMoveToList();
            }
        } else {
            if (colour != turn && mouseX > (x * 54) + 40 && mouseX < (x * 54) + 94 && mouseY > (y * 54) + (z * 512) + 40 && mouseY < (y * 54) + (z * 512) + 94) {
                if (mouseDown && mouseButton == CLICK.RIGHT && !promoting) {
                    turn = (turn + 1) % 2;
                    selected.set(x, y, z);
                    calculateMoveToList();
                    moveToListToThreatList();
                    turn = (turn + 1) % 2;
                }
                ctx.drawImage(spritesheet, type * (640 / 3), colour * (427 / 2), (640 / 3), (640 / 3), (x * 54) + 36, (y * 54) + (z * 512) + 36, 62, 62);
            } else {
                ctx.drawImage(spritesheet, type * (640 / 3), colour * (427 / 2), (640 / 3), (640 / 3), (x * 54) + 40, (y * 54) + (z * 512) + 40, 54, 54);
            }
        }
    }
}

function calculateMoveToList() {
    moveToList = [];
    threatList = [];
    switch (typeBoard[selected.x][selected.y][selected.z]) {
        case (PIECE.PAWN): {
            calculatePawnMove();
            break;
        }
        case (PIECE.KNIGHT): {
            calculateKnightMove();
            break;
        }
        case (PIECE.ROOK): {
            calculateRookMove();
            break;
        }
        case (PIECE.BISHOP): {
            calculateBishopMove();
            break;
        }
        case (PIECE.QUEEN): {
            calculateQueenMove();
            break;
        }
        case (PIECE.KING): {
            calculateKingMove();
            break;
        }
        default: {
            break;
        }
    }
}

var checkList = [];
function checkCheck() {
    checkList = [];
    checkBoard = Array(boardLength).fill().map(() => Array(boardLength).fill().map(() => Array(boardLength).fill(0)));
    turn = (turn + 1) % 2;
    findAllThreatened();
    turn = (turn + 1) % 2;
    findAllThreatened();
}

function findAllThreatened() {
    for (var p = 0; p < boardLength; p++) {
        for (var q = 0; q < boardLength; q++) {
            for (var r = 0; r < boardLength; r++) {
                if (colourBoard[p][q][r] == turn) {
                    selected.set(p, q, r);
                    switch (typeBoard[selected.x][selected.y][selected.z]) {
                        case (PIECE.PAWN): {
                            calculatePawnMove();
                            break;
                        }
                        case (PIECE.KNIGHT): {
                            calculateKnightMove();
                            break;
                        }
                        case (PIECE.ROOK): {
                            calculateRookMove();
                            break;
                        }
                        case (PIECE.BISHOP): {
                            calculateBishopMove();
                            break;
                        }
                        case (PIECE.QUEEN): {
                            calculateQueenMove();
                            break;
                        }
                        case (PIECE.KING): {
                            calculateKingMove();
                            break;
                        }
                        default: {
                            break;
                        }
                    }
                }
            }
        }
    }
    for (var p = 0; p < moveToList.length; p++) {
        if (typeBoard[moveToList[p].x][moveToList[p].y][moveToList[p].z] == PIECE.KING && colourBoard[moveToList[p].x][moveToList[p].y][moveToList[p].z] != turn) {
            checkBoard[moveToList[p].x][moveToList[p].y][moveToList[p].z] = 1;
        }
    }
    moveToList = [];
}

function calculatePawnMove() {
    if (colourBoard[selected.x][selected.y][selected.z] == COLOUR.WHITE) {
        // pawn forward
        if (typeBoard[selected.x][selected.y][selected.z + 1] == PIECE.BLANK) {
            moveToList.push(new BoardPos(selected.x, selected.y, selected.z + 1));
            if (selected.z == 1 && typeBoard[selected.x][selected.y][selected.z + 2] == PIECE.BLANK) {
                moveToList.push(new BoardPos(selected.x, selected.y, selected.z + 2));
            }
        }
        // pawn capture
        if (!(selected.x == 7 || selected.z == 7)) {
            if ((typeBoard[selected.x + 1][selected.y][selected.z + 1] != PIECE.BLANK) && (colourBoard[selected.x + 1][selected.y][selected.z + 1] == COLOUR.BLACK)) {
                moveToList.push(new BoardPos(selected.x + 1, selected.y, selected.z + 1));
            }
        }
        if (!(selected.x == 0 || selected.z == 7)) {
            if ((typeBoard[selected.x - 1][selected.y][selected.z + 1] != PIECE.BLANK) && (colourBoard[selected.x - 1][selected.y][selected.z + 1] == COLOUR.BLACK)) {
                moveToList.push(new BoardPos(selected.x - 1, selected.y, selected.z + 1));
            }
        }
        if (!(selected.y == 7 || selected.z == 7)) {
            if ((typeBoard[selected.x][selected.y + 1][selected.z + 1] != PIECE.BLANK) && (colourBoard[selected.x][selected.y + 1][selected.z + 1] == COLOUR.BLACK)) {
                moveToList.push(new BoardPos(selected.x, selected.y + 1, selected.z + 1));
            }
        }
        if (!(selected.y == 0 || selected.z == 7)) {
            if ((typeBoard[selected.x][selected.y - 1][selected.z + 1] != PIECE.BLANK) && (colourBoard[selected.x][selected.y - 1][selected.z + 1] == COLOUR.BLACK)) {
                moveToList.push(new BoardPos(selected.x, selected.y - 1, selected.z + 1));
            }
        }
        if (passantBoard[selected.x][selected.y][selected.z] == 1) {
            for (var u2 = 0; u2 < boardLength; u2++) {
                for (var v2 = 0; v2 < boardLength; v2++) {
                    for (var w2 = 0; w2 < boardLength; w2++) {
                        if (passantBoard[u2][v2][w2] == 3) {
                            moveToList.push(new BoardPos(u2, v2, w2));
                        }
                    }
                }
            }
        }
    } else {
        // pawn forward
        if (typeBoard[selected.x][selected.y][selected.z - 1] == PIECE.BLANK) {
            moveToList.push(new BoardPos(selected.x, selected.y, selected.z - 1));
            if (selected.z == 6 && typeBoard[selected.x][selected.y][selected.z - 2] == PIECE.BLANK) {
                moveToList.push(new BoardPos(selected.x, selected.y, selected.z - 2));
            }
        }
        // pawn capture
        if (!(selected.x == 7 || selected.z == 0)) {
            if ((typeBoard[selected.x + 1][selected.y][selected.z - 1] != PIECE.BLANK) && (colourBoard[selected.x + 1][selected.y][selected.z - 1] == COLOUR.WHITE)) {
                moveToList.push(new BoardPos(selected.x + 1, selected.y, selected.z - 1));
            }
        }
        if (!(selected.x == 0 || selected.z == 0)) {
            if ((typeBoard[selected.x - 1][selected.y][selected.z - 1] != PIECE.BLANK) && (colourBoard[selected.x - 1][selected.y][selected.z - 1] == COLOUR.WHITE)) {
                moveToList.push(new BoardPos(selected.x - 1, selected.y, selected.z - 1));
            }
        }
        if (!(selected.y == 7 || selected.z == 0)) {
            if ((typeBoard[selected.x][selected.y + 1][selected.z - 1] != PIECE.BLANK) && (colourBoard[selected.x][selected.y + 1][selected.z - 1] == COLOUR.WHITE)) {
                moveToList.push(new BoardPos(selected.x, selected.y + 1, selected.z - 1));
            }
        }
        if (!(selected.y == 0 || selected.z == 0)) {
            if ((typeBoard[selected.x][selected.y - 1][selected.z - 1] != PIECE.BLANK) && (colourBoard[selected.x][selected.y - 1][selected.z - 1] == COLOUR.WHITE)) {
                moveToList.push(new BoardPos(selected.x, selected.y - 1, selected.z - 1));
            }
        }
    }
}

function calculateKnightMove() {
    // xy shift 1 z shift 2
    if (selected.x + 1 <= 7 && selected.y + 1 <= 7 && selected.z + 2 <= 7) {
        if (typeBoard[selected.x + 1][selected.y + 1][selected.z + 2] == PIECE.BLANK || colourBoard[selected.x + 1][selected.y + 1][selected.z + 2] != turn) {
            moveToList.push(new BoardPos(selected.x + 1, selected.y + 1, selected.z + 2));
        }
    }
    if (selected.x - 1 >= 0 && selected.y + 1 <= 7 && selected.z + 2 <= 7) {
        if (typeBoard[selected.x - 1][selected.y + 1][selected.z + 2] == PIECE.BLANK || colourBoard[selected.x - 1][selected.y + 1][selected.z + 2] != turn) {
            moveToList.push(new BoardPos(selected.x - 1, selected.y + 1, selected.z + 2));
        }
    }
    if (selected.x + 1 <= 7 && selected.y - 1 >= 0 && selected.z + 2 <= 7) {
        if (typeBoard[selected.x + 1][selected.y - 1][selected.z + 2] == PIECE.BLANK || colourBoard[selected.x + 1][selected.y - 1][selected.z + 2] != turn) {
            moveToList.push(new BoardPos(selected.x + 1, selected.y - 1, selected.z + 2));
        }
    }
    if (selected.x - 1 >= 0 && selected.y - 1 >= 0 && selected.z + 2 <= 7) {
        if (typeBoard[selected.x - 1][selected.y - 1][selected.z + 2] == PIECE.BLANK || colourBoard[selected.x - 1][selected.y - 1][selected.z + 2] != turn) {
            moveToList.push(new BoardPos(selected.x - 1, selected.y - 1, selected.z + 2));
        }
    }
    if (selected.x + 1 <= 7 && selected.y + 1 <= 7 && selected.z - 2 >= 0) {
        if (typeBoard[selected.x + 1][selected.y + 1][selected.z - 2] == PIECE.BLANK || colourBoard[selected.x + 1][selected.y + 1][selected.z - 2] != turn) {
            moveToList.push(new BoardPos(selected.x + 1, selected.y + 1, selected.z - 2));
        }
    }
    if (selected.x - 1 >= 0 && selected.y + 1 <= 7 && selected.z - 2 >= 0) {
        if (typeBoard[selected.x - 1][selected.y + 1][selected.z - 2] == PIECE.BLANK || colourBoard[selected.x - 1][selected.y + 1][selected.z - 2] != turn) {
            moveToList.push(new BoardPos(selected.x - 1, selected.y + 1, selected.z - 2));
        }
    }
    if (selected.x + 1 <= 7 && selected.y - 1 >= 0 && selected.z - 2 >= 0) {
        if (typeBoard[selected.x + 1][selected.y - 1][selected.z - 2] == PIECE.BLANK || colourBoard[selected.x + 1][selected.y - 1][selected.z - 2] != turn) {
            moveToList.push(new BoardPos(selected.x + 1, selected.y - 1, selected.z - 2));
        }
    }
    if (selected.x - 1 >= 0 && selected.y - 1 >= 0 && selected.z - 2 >= 0) {
        if (typeBoard[selected.x - 1][selected.y - 1][selected.z - 2] == PIECE.BLANK || colourBoard[selected.x - 1][selected.y - 1][selected.z - 2] != turn) {
            moveToList.push(new BoardPos(selected.x - 1, selected.y - 1, selected.z - 2));
        }
    }
    // yz shift 1 x shift 2
    if (selected.x + 2 <= 7 && selected.y + 1 <= 7 && selected.z + 1 <= 7) {
        if (typeBoard[selected.x + 2][selected.y + 1][selected.z + 1] == PIECE.BLANK || colourBoard[selected.x + 2][selected.y + 1][selected.z + 1] != turn) {
            moveToList.push(new BoardPos(selected.x + 2, selected.y + 1, selected.z + 1));
        }
    }
    if (selected.x + 2 <= 7 && selected.y - 1 >= 0 && selected.z + 1 <= 7) {
        if (typeBoard[selected.x + 2][selected.y - 1][selected.z + 1] == PIECE.BLANK || colourBoard[selected.x + 2][selected.y - 1][selected.z + 1] != turn) {
            moveToList.push(new BoardPos(selected.x + 2, selected.y - 1, selected.z + 1));
        }
    }
    if (selected.x + 2 <= 7 && selected.y + 1 <= 7 && selected.z - 1 >= 0) {
        if (typeBoard[selected.x + 2][selected.y + 1][selected.z - 1] == PIECE.BLANK || colourBoard[selected.x + 2][selected.y + 1][selected.z - 1] != turn) {
            moveToList.push(new BoardPos(selected.x + 2, selected.y + 1, selected.z - 1));
        }
    }
    if (selected.x + 2 <= 7 && selected.y - 1 >= 0 && selected.z - 1 >= 0) {
        if (typeBoard[selected.x + 2][selected.y - 1][selected.z - 1] == PIECE.BLANK || colourBoard[selected.x + 2][selected.y - 1][selected.z - 1] != turn) {
            moveToList.push(new BoardPos(selected.x + 2, selected.y - 1, selected.z - 1));
        }
    }
    if (selected.x - 2 >= 0 && selected.y + 1 <= 7 && selected.z + 1 <= 7) {
        if (typeBoard[selected.x - 2][selected.y + 1][selected.z + 1] == PIECE.BLANK || colourBoard[selected.x - 2][selected.y + 1][selected.z + 1] != turn) {
            moveToList.push(new BoardPos(selected.x - 2, selected.y + 1, selected.z + 1));
        }
    }
    if (selected.x - 2 >= 0 && selected.y - 1 >= 0 && selected.z + 1 <= 7) {
        if (typeBoard[selected.x - 2][selected.y - 1][selected.z + 1] == PIECE.BLANK || colourBoard[selected.x - 2][selected.y - 1][selected.z + 1] != turn) {
            moveToList.push(new BoardPos(selected.x - 2, selected.y - 1, selected.z + 1));
        }
    }
    if (selected.x - 2 >= 0 && selected.y + 1 <= 7 && selected.z - 1 >= 0) {
        if (typeBoard[selected.x - 2][selected.y + 1][selected.z - 1] == PIECE.BLANK || colourBoard[selected.x - 2][selected.y + 1][selected.z - 1] != turn) {
            moveToList.push(new BoardPos(selected.x - 2, selected.y + 1, selected.z - 1));
        }
    }
    if (selected.x - 2 >= 0 && selected.y - 1 >= 0 && selected.z - 1 >= 0) {
        if (typeBoard[selected.x - 2][selected.y - 1][selected.z - 1] == PIECE.BLANK || colourBoard[selected.x - 2][selected.y - 1][selected.z - 1] != turn) {
            moveToList.push(new BoardPos(selected.x - 2, selected.y - 1, selected.z - 1));
        }
    }
    // xz shift 1 y shift 2
    if (selected.x + 1 <= 7 && selected.y + 2 <= 7 && selected.z + 1 <= 7) {
        if (typeBoard[selected.x + 1][selected.y + 2][selected.z + 1] == PIECE.BLANK || colourBoard[selected.x + 1][selected.y + 2][selected.z + 1] != turn) {
            moveToList.push(new BoardPos(selected.x + 1, selected.y + 2, selected.z + 1));
        }
    }
    if (selected.x - 1 >= 0 && selected.y + 2 <= 7 && selected.z + 1 <= 7) {
        if (typeBoard[selected.x - 1][selected.y + 2][selected.z + 1] == PIECE.BLANK || colourBoard[selected.x - 1][selected.y + 2][selected.z + 1] != turn) {
            moveToList.push(new BoardPos(selected.x - 1, selected.y + 2, selected.z + 1));
        }
    }
    if (selected.x + 1 <= 7 && selected.y + 2 <= 7 && selected.z - 1 >= 0) {
        if (typeBoard[selected.x + 1][selected.y + 2][selected.z - 1] == PIECE.BLANK || colourBoard[selected.x + 1][selected.y + 2][selected.z - 1] != turn) {
            moveToList.push(new BoardPos(selected.x + 1, selected.y + 2, selected.z - 1));
        }
    }
    if (selected.x - 1 >= 0 && selected.y + 2 <= 7 && selected.z - 1 >= 0) {
        if (typeBoard[selected.x - 1][selected.y + 2][selected.z - 1] == PIECE.BLANK || colourBoard[selected.x - 1][selected.y + 2][selected.z - 1] != turn) {
            moveToList.push(new BoardPos(selected.x - 1, selected.y + 2, selected.z - 1));
        }
    }
    if (selected.x + 1 <= 7 && selected.y - 2 >= 0 && selected.z + 1 <= 7) {
        if (typeBoard[selected.x + 1][selected.y - 2][selected.z + 1] == PIECE.BLANK || colourBoard[selected.x + 1][selected.y - 2][selected.z + 1] != turn) {
            moveToList.push(new BoardPos(selected.x + 1, selected.y - 2, selected.z + 1));
        }
    }
    if (selected.x - 1 >= 0 && selected.y - 2 >= 0 && selected.z + 1 <= 7) {
        if (typeBoard[selected.x - 1][selected.y - 2][selected.z + 1] == PIECE.BLANK || colourBoard[selected.x - 1][selected.y - 2][selected.z + 1] != turn) {
            moveToList.push(new BoardPos(selected.x - 1, selected.y - 2, selected.z + 1));
        }
    }
    if (selected.x + 1 <= 7 && selected.y - 2 >= 0 && selected.z - 1 >= 0) {
        if (typeBoard[selected.x + 1][selected.y - 2][selected.z - 1] == PIECE.BLANK || colourBoard[selected.x + 1][selected.y - 2][selected.z - 1] != turn) {
            moveToList.push(new BoardPos(selected.x + 1, selected.y - 2, selected.z - 1));
        }
    }
    if (selected.x - 1 >= 0 && selected.y - 2 >= 0 && selected.z - 1 >= 0) {
        if (typeBoard[selected.x - 1][selected.y - 2][selected.z - 1] == PIECE.BLANK || colourBoard[selected.x - 1][selected.y - 2][selected.z - 1] != turn) {
            moveToList.push(new BoardPos(selected.x - 1, selected.y - 2, selected.z - 1));
        }
    }
}

function calculateRookMove() {
    // x+
    for (var l = 1; l < boardLength; l++) {
        if ((selected.x + l) <= 7) {
            if (typeBoard[selected.x + l][selected.y][selected.z] == PIECE.BLANK) {
                moveToList.push(new BoardPos(selected.x + l, selected.y, selected.z));
            } else {
                if (colourBoard[selected.x + l][selected.y][selected.z] != turn) {
                    moveToList.push(new BoardPos(selected.x + l, selected.y, selected.z));
                } else {
                    // nothing
                }
                break;
            }
        }
    }
    // x-
    for (var l = -1; l > -boardLength; l--) {
        if ((selected.x + l) >= 0) {
            if (typeBoard[selected.x + l][selected.y][selected.z] == PIECE.BLANK) {
                moveToList.push(new BoardPos(selected.x + l, selected.y, selected.z));
            } else {
                if (colourBoard[selected.x + l][selected.y][selected.z] != turn) {
                    moveToList.push(new BoardPos(selected.x + l, selected.y, selected.z));
                } else {
                    // nothing
                }
                break;
            }
        }
    }
    // y+
    for (var l = 1; l < boardLength; l++) {
        if ((selected.y + l) <= 7) {
            if (typeBoard[selected.x][selected.y + l][selected.z] == PIECE.BLANK) {
                moveToList.push(new BoardPos(selected.x, selected.y + l, selected.z));
            } else {
                if (colourBoard[selected.x][selected.y + l][selected.z] != turn) {
                    moveToList.push(new BoardPos(selected.x, selected.y + l, selected.z));
                } else {
                    // nothing
                }
                break;
            }
        }
    }
    // y-
    for (var l = -1; l > -boardLength; l--) {
        if ((selected.y + l) >= 0) {
            if (typeBoard[selected.x][selected.y + l][selected.z] == PIECE.BLANK) {
                moveToList.push(new BoardPos(selected.x, selected.y + l, selected.z));
            } else {
                if (colourBoard[selected.x][selected.y + l][selected.z] != turn) {
                    moveToList.push(new BoardPos(selected.x, selected.y + l, selected.z));
                } else {
                    // nothing
                }
                break;
            }
        }
    }
    // z+
    for (var l = 1; l < boardLength; l++) {
        if ((selected.z + l) <= 7) {
            if (typeBoard[selected.x][selected.y][selected.z + l] == PIECE.BLANK) {
                moveToList.push(new BoardPos(selected.x, selected.y, selected.z + l));
            } else {
                if (colourBoard[selected.x][selected.y][selected.z + l] != turn) {
                    moveToList.push(new BoardPos(selected.x, selected.y, selected.z + l));
                } else {
                    // nothing
                }
                break;
            }
        }
    }
    // z-
    for (var l = -1; l > -boardLength; l--) {
        if ((selected.z + l) >= 0) {
            if (typeBoard[selected.x][selected.y][selected.z + l] == PIECE.BLANK) {
                moveToList.push(new BoardPos(selected.x, selected.y, selected.z + l));
            } else {
                if (colourBoard[selected.x][selected.y][selected.z + l] != turn) {
                    moveToList.push(new BoardPos(selected.x, selected.y, selected.z + l));
                } else {
                    // nothing
                }
                break;
            }
        }
    }
}

function calculateBishopMove() {
    // xy movement
    // x+ y+
    for (var l = 1; l < boardLength; l++) {
        if (((selected.x + l) <= 7) && ((selected.y + l) <= 7)) {
            if (typeBoard[selected.x + l][selected.y + l][selected.z] == PIECE.BLANK) {
                moveToList.push(new BoardPos(selected.x + l, selected.y + l, selected.z));
            } else {
                if (colourBoard[selected.x + l][selected.y + l][selected.z] != turn) {
                    moveToList.push(new BoardPos(selected.x + l, selected.y + l, selected.z));
                } else {
                    // nothing
                }
                break;
            }
        }
    }
    // x+ y-
    for (var l = 1; l < boardLength; l++) {
        if (((selected.x + l) <= 7) && ((selected.y - l) >= 0)) {
            if (typeBoard[selected.x + l][selected.y - l][selected.z] == PIECE.BLANK) {
                moveToList.push(new BoardPos(selected.x + l, selected.y - l, selected.z));
            } else {
                if (colourBoard[selected.x + l][selected.y - l][selected.z] != turn) {
                    moveToList.push(new BoardPos(selected.x + l, selected.y - l, selected.z));
                } else {
                    // nothing
                }
                break;
            }
        }
    }
    // x- y+
    for (var l = 1; l < boardLength; l++) {
        if (((selected.x - l) >= 0) && ((selected.y + l) <= 7)) {
            if (typeBoard[selected.x - l][selected.y + l][selected.z] == PIECE.BLANK) {
                moveToList.push(new BoardPos(selected.x - l, selected.y + l, selected.z));
            } else {
                if (colourBoard[selected.x - l][selected.y + l][selected.z] != turn) {
                    moveToList.push(new BoardPos(selected.x - l, selected.y + l, selected.z));
                } else {
                    // nothing
                }
                break;
            }
        }
    }
    // x- y-
    for (var l = 1; l < boardLength; l++) {
        if (((selected.x - l) >= 0) && ((selected.y - l) >= 0)) {
            if (typeBoard[selected.x - l][selected.y - l][selected.z] == PIECE.BLANK) {
                moveToList.push(new BoardPos(selected.x - l, selected.y - l, selected.z));
            } else {
                if (colourBoard[selected.x - l][selected.y - l][selected.z] != turn) {
                    moveToList.push(new BoardPos(selected.x - l, selected.y - l, selected.z));
                } else {
                    // nothing
                }
                break;
            }
        }
    }
    // xz movement
    // x+ z+
    for (var l = 1; l < boardLength; l++) {
        if (((selected.x + l) <= 7) && ((selected.z + l) <= 7)) {
            if (typeBoard[selected.x + l][selected.y][selected.z + l] == PIECE.BLANK) {
                moveToList.push(new BoardPos(selected.x + l, selected.y, selected.z + l));
            } else {
                if (colourBoard[selected.x + l][selected.y][selected.z + l] != turn) {
                    moveToList.push(new BoardPos(selected.x + l, selected.y, selected.z + l));
                } else {
                    // nothing
                }
                break;
            }
        }
    }
    // x+ z-
    for (var l = 1; l < boardLength; l++) {
        if (((selected.x + l) <= 7) && ((selected.z - l) >= 0)) {
            if (typeBoard[selected.x + l][selected.y][selected.z - l] == PIECE.BLANK) {
                moveToList.push(new BoardPos(selected.x + l, selected.y, selected.z - l));
            } else {
                if (colourBoard[selected.x + l][selected.y][selected.z - l] != turn) {
                    moveToList.push(new BoardPos(selected.x + l, selected.y, selected.z - l));
                } else {
                    // nothing
                }
                break;
            }
        }
    }
    // x- z+
    for (var l = 1; l < boardLength; l++) {
        if (((selected.x - l) >= 0) && ((selected.z + l) <= 7)) {
            if (typeBoard[selected.x - l][selected.y][selected.z + l] == PIECE.BLANK) {
                moveToList.push(new BoardPos(selected.x - l, selected.y, selected.z + l));
            } else {
                if (colourBoard[selected.x - l][selected.y][selected.z + l] != turn) {
                    moveToList.push(new BoardPos(selected.x - l, selected.y, selected.z + l));
                } else {
                    // nothing
                }
                break;
            }
        }
    }
    // x- z-
    for (var l = 1; l < boardLength; l++) {
        if (((selected.x - l) >= 0) && ((selected.z - l) >= 0)) {
            if (typeBoard[selected.x - l][selected.y][selected.z - l] == PIECE.BLANK) {
                moveToList.push(new BoardPos(selected.x - l, selected.y, selected.z - l));
            } else {
                if (colourBoard[selected.x - l][selected.y][selected.z - l] != turn) {
                    moveToList.push(new BoardPos(selected.x - l, selected.y, selected.z - l));
                } else {
                    // nothing
                }
                break;
            }
        }
    }
    // yz movement
    // y+ z+
    for (var l = 1; l < boardLength; l++) {
        if (((selected.y + l) <= 7) && ((selected.z + l) <= 7)) {
            if (typeBoard[selected.x][selected.y + l][selected.z + l] == PIECE.BLANK) {
                moveToList.push(new BoardPos(selected.x, selected.y + l, selected.z + l));
            } else {
                if (colourBoard[selected.x][selected.y + l][selected.z + l] != turn) {
                    moveToList.push(new BoardPos(selected.x, selected.y + l, selected.z + l));
                } else {
                    // nothing
                }
                break;
            }
        }
    }
    // y+ z-
    for (var l = 1; l < boardLength; l++) {
        if (((selected.y + l) <= 7) && ((selected.z - l) >= 0)) {
            if (typeBoard[selected.x][selected.y + l][selected.z - l] == PIECE.BLANK) {
                moveToList.push(new BoardPos(selected.x, selected.y + l, selected.z - l));
            } else {
                if (colourBoard[selected.x][selected.y + l][selected.z - l] != turn) {
                    moveToList.push(new BoardPos(selected.x, selected.y + l, selected.z - l));
                } else {
                    // nothing
                }
                break;
            }
        }
    }
    // y- z+
    for (var l = 1; l < boardLength; l++) {
        if (((selected.y - l) >= 0) && ((selected.z + l) <= 7)) {
            if (typeBoard[selected.x][selected.y - l][selected.z + l] == PIECE.BLANK) {
                moveToList.push(new BoardPos(selected.x, selected.y - l, selected.z + l));
            } else {
                if (colourBoard[selected.x][selected.y - l][selected.z + l] != turn) {
                    moveToList.push(new BoardPos(selected.x, selected.y - l, selected.z + l));
                } else {
                    // nothing
                }
                break;
            }
        }
    }
    // y- z-
    for (var l = 1; l < boardLength; l++) {
        if (((selected.y - l) >= 0) && ((selected.z - l) >= 0)) {
            if (typeBoard[selected.x][selected.y - l][selected.z - l] == PIECE.BLANK) {
                moveToList.push(new BoardPos(selected.x, selected.y - l, selected.z - l));
            } else {
                if (colourBoard[selected.x][selected.y - l][selected.z - l] != turn) {
                    moveToList.push(new BoardPos(selected.x, selected.y - l, selected.z - l));
                } else {
                    // nothing
                }
                break;
            }
        }
    }
}

function calculateQueenMove() {
    if (countBoard[selected.x][selected.y][selected.z] == 0) {
        // z+
        for (var l = 1; l < boardLength; l++) {
            if (selected.z + l <= 7) {
                if (typeBoard[selected.x][selected.y][selected.z + l] == PIECE.BLANK) {
                    moveToList.push(new BoardPos(selected.x, selected.y, selected.z + l));
                } else {
                    if (colourBoard[selected.x][selected.y][selected.z + l] != turn) {
                        moveToList.push(new BoardPos(selected.x, selected.y, selected.z + l));
                    } else {
                        // nothing
                    }
                    break;
                }
            }
        }
        // z-
        for (var l = -1; l > -boardLength; l--) {
            if (selected.z + l >= 0) {
                if (typeBoard[selected.x][selected.y][selected.z + l] == PIECE.BLANK) {
                    moveToList.push(new BoardPos(selected.x, selected.y, selected.z + l));
                } else {
                    if (colourBoard[selected.x][selected.y][selected.z + l] != turn) {
                        moveToList.push(new BoardPos(selected.x, selected.y, selected.z + l));
                    } else {
                        // nothing
                    }
                    break;
                }
            }
        }
    } else {
        calculateRookMove();
        calculateBishopMove();
    }
}

function calculateKingMove() {
    for (var l = -1; l <= 1; l++) {
        for (var m = -1; m <= 1; m++) {
            for (var n = -1; n <= 1; n++) {
                if (((selected.x + l) >= 0 && (selected.x + l) <= 7) && ((selected.y + m) >= 0 && (selected.y + m) <= 7) && ((selected.z + n) >= 0 && (selected.z + n) <= 7)) {
                    if (typeBoard[selected.x + l][selected.y + m][selected.z + n] == PIECE.BLANK || colourBoard[selected.x + l][selected.y + m][selected.z + n] != turn) {
                        moveToList.push(new BoardPos(selected.x + l, selected.y + m, selected.z + n))
                    }
                }
            }
        }
    }
}

function placePiece(x, y, z, type, col, moveCount, passant) {
    typeBoard[x][y][z] = type;
    colourBoard[x][y][z] = col;
    countBoard[x][y][z] = moveCount;
    passantBoard[x][y][z] = passant;
}

var pTypeBoard;
var pColourBoard;
var pCountBoard;
var pPassantBoard;
var incheck;
var toConvert;
var rMoveToList;
var passantCapture;
var promoting;
var promotingCol;
var promotingPos;
var oMoved;
var ox1, ox2, oy1, oy2, oz1, oz2;
function drawMoveToList() {
    rMoveToList = [];
    for (var i = 0; i < moveToList.length; i++) {
        rMoveToList.push(moveToList[i]);
    }
    for (var i = 0; i < rMoveToList.length; i++) {
        ctx.beginPath();
        if (mouseX > (rMoveToList[i].x * 54) + 40 && mouseX < (rMoveToList[i].x * 54) + 94 && mouseY > (rMoveToList[i].y * 54) + (rMoveToList[i].z * 512) + 40 && mouseY < (rMoveToList[i].y * 54) + (rMoveToList[i].z * 512) + 94) {
            ctx.fillStyle = "#00ff0088";
            if (mouseDown && mouseButton == CLICK.LEFT && !promoting) {
                oMoved = true;

                var xForMoveList, yForMoveList, zForMoveList;
                xForMoveList = rMoveToList[i].x;
                yForMoveList = rMoveToList[i].y;
                zForMoveList = rMoveToList[i].z;
                ox2 = xForMoveList;
                oy2 = yForMoveList;
                oz2 = zForMoveList;
                ox1 = selected.x;
                oy1 = selected.y;
                oz1 = selected.z;
                // set p boards (in case we need to move back)
                pTypeBoard = Array(boardLength).fill().map(() => Array(boardLength).fill().map(() => Array(boardLength).fill(-1)));
                pColourBoard = Array(boardLength).fill().map(() => Array(boardLength).fill().map(() => Array(boardLength).fill(-1)));
                pCountBoard = Array(boardLength).fill().map(() => Array(boardLength).fill().map(() => Array(boardLength).fill(-1)));
                pPassantBoard = Array(boardLength).fill().map(() => Array(boardLength).fill().map(() => Array(boardLength).fill(-1)));
                for (var l = 0; l < typeBoard.length; l++) {
                    for (var m = 0; m < typeBoard.length; m++) {
                        for (var n = 0; n < typeBoard.length; n++) {
                            pTypeBoard[l][m][n] = typeBoard[l][m][n];
                            pColourBoard[l][m][n] = colourBoard[l][m][n];
                            pCountBoard[l][m][n] = countBoard[l][m][n];
                            pPassantBoard[l][m][n] = passantBoard[l][m][n];
                        }
                    }
                }

                // move
                passantCapture = false;
                typeBoard[rMoveToList[i].x][rMoveToList[i].y][rMoveToList[i].z] = typeBoard[selected.x][selected.y][selected.z];
                colourBoard[rMoveToList[i].x][rMoveToList[i].y][rMoveToList[i].z] = colourBoard[selected.x][selected.y][selected.z];
                countBoard[rMoveToList[i].x][rMoveToList[i].y][rMoveToList[i].z] = countBoard[selected.x][selected.y][selected.z] + 1;
                for (var u = 0; u < boardLength; u++) {
                    for (var v = 0; v < boardLength; v++) {
                        for (var w = 0; w < boardLength; w++) {
                            if (passantBoard[u][v][w] == 2) {
                                if (passantBoard[selected.x][selected.y][selected.z] == 1 && passantBoard[rMoveToList[i].x][rMoveToList[i].y][rMoveToList[i].z] == 3 && typeBoard[rMoveToList[i].x][rMoveToList[i].y][rMoveToList[i].z] == PIECE.PAWN) {
                                    typeBoard[u][v][w] = PIECE.BLANK;
                                    colourBoard[u][v][w] = -1;
                                    countBoard[u][v][w] = 0;
                                    if (turn == COLOUR.WHITE) {
                                        capturedCounts[5]++;
                                    } else {
                                        capturedCounts[0]++;
                                    }
                                    passantCapture = true;
                                }
                            }
                        }
                    }
                }
                for (var u = 0; u < boardLength; u++) {
                    for (var v = 0; v < boardLength; v++) {
                        for (var w = 0; w < boardLength; w++) {
                            // cannot be in above uvw loop (above loop requires knowledge of passantBoard at moving from and moving to points)
                            passantBoard[u][v][w] = 0;
                        }
                    }
                }
                if (typeBoard[rMoveToList[i].x][rMoveToList[i].y][rMoveToList[i].z] == PIECE.PAWN && Math.abs(rMoveToList[i].z - selected.z) == 2) {
                    passantBoard[rMoveToList[i].x][rMoveToList[i].y][rMoveToList[i].z] = 2;
                    if (rMoveToList[i].x > 0) {
                        passantBoard[rMoveToList[i].x - 1][rMoveToList[i].y][rMoveToList[i].z] = 1;
                    }
                    if (rMoveToList[i].x < 7) {
                        passantBoard[rMoveToList[i].x + 1][rMoveToList[i].y][rMoveToList[i].z] = 1;
                    }
                    if (rMoveToList[i].y > 0) {
                        passantBoard[rMoveToList[i].x][rMoveToList[i].y - 1][rMoveToList[i].z] = 1;
                    }
                    if (rMoveToList[i].y < 7) {
                        passantBoard[rMoveToList[i].x][rMoveToList[i].y + 1][rMoveToList[i].z] = 1;
                    }
                    passantBoard[rMoveToList[i].x][rMoveToList[i].y][Math.floor((rMoveToList[i].z + selected.z) / 2)] = 3;
                }
                if (typeBoard[rMoveToList[i].x][rMoveToList[i].y][rMoveToList[i].z] == PIECE.PAWN && (rMoveToList[i].z == 0 || rMoveToList[i].z == 7)) {
                    // pawn promote
                    promoting = true;
                    promotingCol = turn;
                    promotingPos = new BoardPos(rMoveToList[i].x, rMoveToList[i].y, rMoveToList[i].z);
                }

                typeBoard[selected.x][selected.y][selected.z] = -1;
                countBoard[selected.x][selected.y][selected.z] = 0;
                passantBoard[selected.x][selected.y][selected.z] = 0;

                // append to movelist
                if (turn == COLOUR.BLACK) {
                    moveList += "KQBNR "[pTypeBoard[selected.x][selected.y][selected.z]] + "abcdefgh"[selected.x] + "87654321"[selected.y] + "αβγδεζηθ"[selected.z] + "-";
                    moveList += "KQBNR "[typeBoard[rMoveToList[i].x][rMoveToList[i].y][rMoveToList[i].z]] + "abcdefgh"[rMoveToList[i].x] + "87654321"[rMoveToList[i].y] + "αβγδεζηθ"[rMoveToList[i].z] + "\n";
                } else {
                    moveList += "KQBNR "[pTypeBoard[selected.x][selected.y][selected.z]] + "abcdefgh"[selected.x] + "87654321"[selected.y] + "αβγδεζηθ"[selected.z] + "-";
                    moveList += "KQBNR "[typeBoard[rMoveToList[i].x][rMoveToList[i].y][rMoveToList[i].z]] + "abcdefgh"[rMoveToList[i].x] + "87654321"[rMoveToList[i].y] + "αβγδεζηθ"[rMoveToList[i].z] + "\\";
                }
                moveToList = [];

                // check if in check
                checkCheck();
                incheck = false;
                for (var l = 0; l < checkBoard.length; l++) {
                    for (var m = 0; m < checkBoard.length; m++) {
                        for (var n = 0; n < checkBoard.length; n++) {
                            if (checkBoard[l][m][n] == 1 && colourBoard[l][m][n] == turn) {
                                incheck = true;
                            }
                        }
                    }
                }
                if (incheck) {
                    // if so, reset board
                    typeBoard = pTypeBoard;
                    colourBoard = pColourBoard;
                    countBoard = pCountBoard;
                    passantBoard = pPassantBoard;
                    checkCheck();
                    oMoved = false;

                    moveList = moveList.slice(0, -10);
                } else {
                    // otherwise, advance turn
                    turn = (turn + 1) % 2;

                    if (passantCapture) {
                        moveList = moveList.slice(0, moveList.length - 4) + "x" + moveList.slice(moveList.length - 4);
                    }
                    if (pTypeBoard[xForMoveList][yForMoveList][zForMoveList] != PIECE.BLANK) {
                        moveList = moveList.slice(0, moveList.length - 4) + "x" + moveList.slice(moveList.length - 4);
                        switch (pTypeBoard[xForMoveList][yForMoveList][zForMoveList]) {
                            case (PIECE.PAWN): {
                                if (turn == COLOUR.WHITE) {
                                    capturedCounts[0]++;
                                } else {
                                    capturedCounts[5]++;
                                }
                                break;
                            }
                            case (PIECE.KNIGHT): {
                                if (turn == COLOUR.WHITE) {
                                    capturedCounts[1]++;
                                } else {
                                    capturedCounts[6]++;
                                }
                                break;
                            }
                            case (PIECE.BISHOP): {
                                if (turn == COLOUR.WHITE) {
                                    capturedCounts[2]++;
                                } else {
                                    capturedCounts[7]++;
                                }
                                break;
                            }
                            case (PIECE.ROOK): {
                                if (turn == COLOUR.WHITE) {
                                    capturedCounts[3]++;
                                } else {
                                    capturedCounts[8]++;
                                }
                                break;
                            }
                            case (PIECE.QUEEN): {
                                if (turn == COLOUR.WHITE) {
                                    capturedCounts[4]++;
                                } else {
                                    capturedCounts[9]++;
                                }
                                break;
                            }
                        }
                    }

                    // set p boards to new config
                    for (var l = 0; l < typeBoard.length; l++) {
                        for (var m = 0; m < typeBoard.length; m++) {
                            for (var n = 0; n < typeBoard.length; n++) {
                                pTypeBoard[l][m][n] = typeBoard[l][m][n];
                                pColourBoard[l][m][n] = colourBoard[l][m][n];
                                pCountBoard[l][m][n] = countBoard[l][m][n];
                                pPassantBoard[l][m][n] = passantBoard[l][m][n];
                            }
                        }
                    }

                    toConvert = [];
                    
                    // check king checkmate
                    checkList = [];
                    checkBoard = Array(boardLength).fill().map(() => Array(boardLength).fill().map(() => Array(boardLength).fill(0)));
                    turn = (turn + 1) % 2;
                    findAllThreatened();
                    turn = (turn + 1) % 2;

                    var check1Board = Array(boardLength).fill().map(() => Array(boardLength).fill().map(() => Array(boardLength).fill(0)));
                    for (var l = 0; l < checkBoard.length; l++) {
                        for (var m = 0; m < checkBoard.length; m++) {
                            for (var n = 0; n < checkBoard.length; n++) {
                                check1Board[l][m][n] = checkBoard[l][m][n];
                            }
                        }
                    }
                    for (var l = 0; l < check1Board.length; l++) {
                        for (var m = 0; m < check1Board.length; m++) {
                            for (var n = 0; n < check1Board.length; n++) {
                                if (check1Board[l][m][n] == 1 && colourBoard[l][m][n] == turn) {
                                    moveList = moveList.slice(0, moveList.length - 1) + "+" + moveList.slice(moveList.length - 1);
                                    var checkmate = true;
                                    for (var l2 = 0; l2 < check1Board.length; l2++) {
                                        for (var m2 = 0; m2 < check1Board.length; m2++) {
                                            for (var n2 = 0; n2 < check1Board.length; n2++) {
                                                if (typeBoard[l2][m2][n2] != PIECE.BLANK && colourBoard[l2][m2][n2] == turn) {
                                                    selected.set(l2, m2, n2);
                                                    calculateMoveToList();
                                                    var tMoveToList = [];
                                                    for (var r = 0; r < moveToList.length; r++) {
                                                        tMoveToList.push(moveToList[r]);
                                                    }
                                                    moveToList = [];
                                                    
                                                    for (var s = 0; s < tMoveToList.length; s++) {
                                                        // test move
                                                        typeBoard[tMoveToList[s].x][tMoveToList[s].y][tMoveToList[s].z] = typeBoard[l2][m2][n2];
                                                        colourBoard[tMoveToList[s].x][tMoveToList[s].y][tMoveToList[s].z] = colourBoard[l2][m2][n2];
                                                        countBoard[tMoveToList[s].x][tMoveToList[s].y][tMoveToList[s].z] = countBoard[l2][m2][n2] + 1;
                                                        for (var u = 0; u < boardLength; u++) {
                                                            for (var v = 0; v < boardLength; v++) {
                                                                for (var w = 0; w < boardLength; w++) {
                                                                    if (passantBoard[u][v][w] == 2) {
                                                                        if (passantBoard[l2][m2][n2] == 1 && passantBoard[tMoveToList[s].x][tMoveToList[s].y][tMoveToList[s].z] == 3 && typeBoard[tMoveToList[s].x][tMoveToList[s].y][tMoveToList[s].z] == PIECE.PAWN) {
                                                                            typeBoard[u][v][w] = PIECE.BLANK;
                                                                            countBoard[u][v][w] = 0;
                                                                        }
                                                                    }
                                                                    passantBoard[u][v][w] = 0;
                                                                }
                                                            }
                                                        }
                                                        if (typeBoard[tMoveToList[s].x][tMoveToList[s].y][tMoveToList[s].z] == PIECE.PAWN && Math.abs(tMoveToList[s].z - n2) == 2) {
                                                            passantBoard[tMoveToList[s].x][tMoveToList[s].y][tMoveToList[s].z] = 2;
                                                            if (tMoveToList[s].x > 0) {
                                                                passantBoard[tMoveToList[s].x - 1][tMoveToList[s].y][tMoveToList[s].z] = 1;
                                                            }
                                                            if (tMoveToList[s].x < 7) {
                                                                passantBoard[tMoveToList[s].x + 1][tMoveToList[s].y][tMoveToList[s].z] = 1;
                                                            }
                                                            if (tMoveToList[s].y > 0) {
                                                                passantBoard[tMoveToList[s].x][tMoveToList[s].y - 1][tMoveToList[s].z] = 1;
                                                            }
                                                            if (tMoveToList[s].y < 7) {
                                                                passantBoard[tMoveToList[s].x][tMoveToList[s].y + 1][tMoveToList[s].z] = 1;
                                                            }
                                                            passantBoard[tMoveToList[s].x][tMoveToList[s].y][Math.floor((tMoveToList[s].z + n2) / 2)] = 3;
                                                        }
                                                                                
                                                        typeBoard[l2][m2][n2] = -1;
                                                        countBoard[l2][m2][n2] = 0;
                                                        passantBoard[l2][m2][n2] = 0;

                                                        // check if in check
                                                        checkList = [];
                                                        checkBoard = Array(boardLength).fill().map(() => Array(boardLength).fill().map(() => Array(boardLength).fill(0)));
                                                        turn = (turn + 1) % 2;
                                                        findAllThreatened();
                                                        turn = (turn + 1) % 2;

                                                        incheck = false;
                                                        for (var l3 = 0; l3 < checkBoard.length; l3++) {
                                                            for (var m3 = 0; m3 < checkBoard.length; m3++) {
                                                                for (var n3 = 0; n3 < checkBoard.length; n3++) {
                                                                    if (checkBoard[l3][m3][n3] == 1 && colourBoard[l3][m3][n3] == turn) {
                                                                        incheck = true;
                                                                    }
                                                                }
                                                            }
                                                        }

                                                        if (!incheck) {
                                                            checkmate = false;
                                                            console.log(tMoveToList[s]);
                                                        }

                                                        // reset boards for next iteration
                                                        for (var ll = 0; ll < typeBoard.length; ll++) {
                                                            for (var mm = 0; mm < typeBoard.length; mm++) {
                                                                for (var nn = 0; nn < typeBoard.length; nn++) {
                                                                    typeBoard[ll][mm][nn] = pTypeBoard[ll][mm][nn];
                                                                    colourBoard[ll][mm][nn] = pColourBoard[ll][mm][nn];
                                                                    countBoard[ll][mm][nn] = pCountBoard[ll][mm][nn];
                                                                    passantBoard[ll][mm][nn] = pPassantBoard[ll][mm][nn];
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    if (checkmate == true) {
                                        // turn king to other colour
                                        console.log("e")
                                        toConvert.push(new BoardPos(l, m, n));
                                    }
                                    moveToList = [];
                                    // selected.set(l, m, n);
                                    // calculateMoveToList(); // get moves king can make
                                    // // put them in tMoveToList
                                    // var tMoveToList = [];
                                    // for (var r = 0; r < moveToList.length; r++) {
                                    //     tMoveToList.push(moveToList[r]);
                                    //     console.log(tMoveToList[r])
                                    // }
                                    // moveToList = [];
                                    // // for (var p = 0; p < boardLength; p++) {
                                    // //     for (var q = 0; q < boardLength; q++) {
                                    // //         for (var r = 0; r < boardLength; r++) {
                                    // //             if (colourBoard[p][q][r] != turn && typeBoard[p][q][r] != PIECE.BLANK) {
                                    // //                 selected.set(p, q, r);
                                    // //                 switch (typeBoard[selected.x][selected.y][selected.z]) {
                                    // //                     case (PIECE.PAWN): {
                                    // //                         calculatePawnMove();
                                    // //                         break;
                                    // //                     }
                                    // //                     case (PIECE.KNIGHT): {
                                    // //                         calculateKnightMove();
                                    // //                         break;
                                    // //                     }
                                    // //                     case (PIECE.ROOK): {
                                    // //                         calculateRookMove();
                                    // //                         break;
                                    // //                     }
                                    // //                     case (PIECE.BISHOP): {
                                    // //                         calculateBishopMove();
                                    // //                         break;
                                    // //                     }
                                    // //                     case (PIECE.QUEEN): {
                                    // //                         calculateQueenMove();
                                    // //                         break;
                                    // //                     }
                                    // //                     case (PIECE.KING): {
                                    // //                         calculateKingMove();
                                    // //                         break;
                                    // //                     }
                                    // //                     default: {
                                    // //                         break;
                                    // //                     }
                                    // //                 }
                                    // //             }
                                    // //         }
                                    // //     }
                                    // // }
                                    // // var tempBoard = Array(boardLength).fill().map(() => Array(boardLength).fill().map(() => Array(boardLength).fill(0)));
                                    // // for (var s = 0; s < moveToList.length; s++) {
                                    // //     tempBoard[moveToList[s].x][moveToList[s].y][moveToList[s].z] = 1;
                                    // // }
                                    // selected.set(l, m, n);
                                    // var checkmate = true;
                                    // for (var s = 0; s < tMoveToList.length; s++) {
                                    //     // test move
                                    //     typeBoard[tMoveToList[s].x][tMoveToList[s].y][tMoveToList[s].z] = typeBoard[selected.x][selected.y][selected.z];
                                    //     colourBoard[tMoveToList[s].x][tMoveToList[s].y][tMoveToList[s].z] = colourBoard[selected.x][selected.y][selected.z];
                                    //     countBoard[tMoveToList[s].x][tMoveToList[s].y][tMoveToList[s].z] = countBoard[selected.x][selected.y][selected.z] + 1;

                                    //     typeBoard[selected.x][selected.y][selected.z] = -1;
                                    //     countBoard[selected.x][selected.y][selected.z] = 0;

                                    //     // check if in check
                                    //     checkList = [];
                                    //     checkBoard = Array(boardLength).fill().map(() => Array(boardLength).fill().map(() => Array(boardLength).fill(0)));
                                    //     turn = (turn + 1) % 2;
                                    //     findAllThreatened();
                                    //     turn = (turn + 1) % 2;

                                    //     incheck = false;
                                    //     for (var l2 = 0; l2 < checkBoard.length; l2++) {
                                    //         for (var m2 = 0; m2 < checkBoard.length; m2++) {
                                    //             for (var n2 = 0; n2 < checkBoard.length; n2++) {
                                    //                 if (checkBoard[l2][m2][n2] == 1 && colourBoard[l2][m2][n2] == turn) {
                                    //                     console.log(l2 + "," + m2 + "," + n2);
                                    //                     incheck = true;
                                    //                 }
                                    //             }
                                    //         }
                                    //     }

                                    //     if (!incheck) {
                                    //         checkmate = false;
                                    //         console.log(tMoveToList[s]);
                                    //     }

                                    //     // reset boards for next iteration
                                    //     for (var ll = 0; ll < typeBoard.length; ll++) {
                                    //         for (var mm = 0; mm < typeBoard.length; mm++) {
                                    //             for (var nn = 0; nn < typeBoard.length; nn++) {
                                    //                 typeBoard[ll][mm][nn] = pTypeBoard[ll][mm][nn];
                                    //                 colourBoard[ll][mm][nn] = pColourBoard[ll][mm][nn];
                                    //                 countBoard[ll][mm][nn] = pCountBoard[ll][mm][nn];
                                    //             }
                                    //         }
                                    //     }
                    
                                    //     // typeBoard = pTypeBoard;
                                    //     // colourBoard = pColourBoard;
                                    //     // countBoard = pCountBoard;
                    
                                    //     // if (tempBoard[tMoveToList[s].x][tMoveToList[s].y][tMoveToList[s].z] == 0) {
                                    //     //     checkmate = false;
                                    //     // }
                                    // }
                                    // if (checkmate == true) {
                                    //     // turn king to other colour
                                    //     console.log("e")
                                    //     toConvert.push(new BoardPos(l, m, n));
                                    // }
                                    // moveToList = [];
                                }
                            }
                        }
                    }
                    // convert kings
                    for (var urmom = 0; urmom < toConvert.length; urmom++) {
                        colourBoard[toConvert[urmom].x][toConvert[urmom].y][toConvert[urmom].z] = ((turn + 1) % 2);
                        check1Board[toConvert[urmom].x][toConvert[urmom].y][toConvert[urmom].z] = 0;
                        moveList = moveList.slice(0, moveList.length - 2) + "#" + moveList.slice(moveList.length - 1);
                    }
                    // count kings
                    var whiteKingCount = 0;
                    var blackKingCount = 0;
                    for (var l = 0; l < typeBoard.length; l++) {
                        for (var m = 0; m < typeBoard.length; m++) {
                            for (var n = 0; n < typeBoard.length; n++) {
                                if (typeBoard[l][m][n] == PIECE.KING && colourBoard[l][m][n] == COLOUR.WHITE) {
                                    whiteKingCount++;
                                }
                                if (typeBoard[l][m][n] == PIECE.KING && colourBoard[l][m][n] == COLOUR.BLACK) {
                                    blackKingCount++;
                                }
                            }
                        }
                    }
                    if (whiteKingCount == 0) {
                        moveList += "0-1 Black win";
                        console.log(moveList);
                    }
                    if (blackKingCount == 0) {
                        moveList += "1-0 White win";
                        console.log(moveList);
                    }
                }
                if (gameScreen == SCREENTYPE.ONLINEGAME && oMoved) {
                    pOGameMove = (String(ox1) + String(oy1) + String(oz1) + String(ox2) + String(oy2) + String(oz2));
                    oGameMove = pOGameMove;
                    update(oGameRef, {
                        move: oGameMove
                    });
                }
            } else {
                ctx.fillRect((moveToList[i].x * 54) + 40, (moveToList[i].y * 54) + (moveToList[i].z * 512) + 40, 54, 54)
            }
        } else {
            ctx.fillStyle = "#00ff0044";
            ctx.fillRect((rMoveToList[i].x * 54) + 40, (rMoveToList[i].y * 54) + (rMoveToList[i].z * 512) + 40, 54, 54)
        }
    }
}

var threatList = [];
function moveToListToThreatList() {
    for (var l = 0; l < moveToList.length; l++) {
        threatList.push(moveToList[l]);
    }
    moveToList = [];
}

function drawThreatList() {
    for (var i = 0; i < threatList.length; i++) {
        ctx.beginPath();
        ctx.fillStyle = "#ffff0088";
        ctx.fillRect((threatList[i].x * 54) + 40, (threatList[i].y * 54) + (threatList[i].z * 512) + 40, 54, 54)
    }
}

function drawCheck() {
    for (var i = 0; i < boardLength; i++) {
        for (var j = 0; j < boardLength; j++) {
            for (var k = 0; k < boardLength; k++) {
                if (checkBoard[i][j][k] == 1) {
                    ctx.beginPath();
                    ctx.fillStyle = "#ff000088";
                    ctx.fillRect((i * 54) + 40, (j * 54) + (k * 512) + 40, 54, 54)
                }
            }
        }
    }
}

function clearBoard() {
    typeBoard = Array(boardLength).fill().map(() => Array(boardLength).fill().map(() => Array(boardLength).fill(-1)));
    colourBoard = Array(boardLength).fill().map(() => Array(boardLength).fill().map(() => Array(boardLength).fill(-1)));
    countBoard = Array(boardLength).fill().map(() => Array(boardLength).fill().map(() => Array(boardLength).fill(0)));
    passantBoard = Array(boardLength).fill().map(() => Array(boardLength).fill().map(() => Array(boardLength).fill(0)));
}

var titlePieceX = 300;
var titlePieceMoveDir;
function drawTitleBackground() {
    // black background
    ctx.beginPath();
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, 1024, 4096);
    ctx.beginPath();
    // dark brown
    ctx.fillStyle = "#442200";
    ctx.fillRect(256, 0, 512, 512);
    // light brown
    ctx.beginPath();
    ctx.fillStyle = "#884400";
    ctx.fillRect(264, 8, 496, 496);
    // title text
    ctx.beginPath();
    ctx.fillStyle = "#000000";
    ctx.font = "75px Arial";
    ctx.fillText("Chess 3D", 345, 90);
    ctx.beginPath();
    ctx.fillStyle = "#ffffff";
    ctx.font = "75px Arial";
    ctx.fillText("Chess 3D", 340, 85);
    // local button
    ctx.beginPath();
    if (mouseX > 470 && mouseX < 570 && mouseY > 196 && mouseY < 226) {
        ctx.fillStyle = "#cc8800";
        if (mouseDown) {
            gameScreen = SCREENTYPE.TITLE_TO_EDITLOCAL;
        }
    } else {
        ctx.fillStyle = "#663300";
    }
    ctx.fillRect(470, 196, 100, 30);
    ctx.beginPath();
    ctx.fillStyle = "#ffffff";
    ctx.font = "25px Arial";
    ctx.fillText("LOCAL", 480, 220);
    // multi button
    ctx.beginPath();
    if (mouseX > 470 && mouseX < 570 && mouseY > 236 && mouseY < 266) {
        ctx.fillStyle = "#cc8800";
        if (mouseDown) {
            gameScreen = SCREENTYPE.TITLE_TO_ONLINESETTINGS;
        }
    } else {
        ctx.fillStyle = "#663300";
    }
    ctx.fillRect(470, 236, 100, 30);
    ctx.beginPath();
    ctx.fillStyle = "#ffffff";
    ctx.font = "25px Arial";
    ctx.fillText("ONLINE", 473, 260);
    // settings button
    ctx.beginPath();
    if (mouseX > 470 && mouseX < 570 && mouseY > 276 && mouseY < 306) {
        ctx.fillStyle = "#cc8800";
        if (mouseDown) {
            gameScreen = SCREENTYPE.TITLE_TO_SETTINGS;
        }
    } else {
        ctx.fillStyle = "#663300";
    }
    ctx.fillRect(470, 276, 100, 30);
    ctx.beginPath();
    ctx.fillStyle = "#ffffff";
    ctx.font = "25px Arial";
    ctx.fillText("OPTION", 472, 300);
    // moving bishop
    if (mouseX > 450 && mouseX < 600 && mouseY > 190 && mouseY < 325) {
        if (Math.abs(titlePieceX - 300) / 300 < 0.1 && mouseX > 525) {
            titlePieceMoveDir = -1;
        } else if (Math.abs(titlePieceX - 300) / 300 < 0.1 && mouseX < 525) {
            titlePieceMoveDir = 1;
        }
        titlePieceX += ((300 + (270 * titlePieceMoveDir)) - titlePieceX) / 5;
    } else {
        titlePieceX += (300 - titlePieceX) / 5;
    }
    ctx.drawImage(spritesheet, (1280/3), 0, 213, 213, titlePieceX, 70, 450, 450);
    // dark brown (when bishop moves, cover)
    ctx.beginPath();
    ctx.fillStyle = "#442200";
    ctx.fillRect(256, 0, 8, 512);
    ctx.fillRect(760, 0, 8, 512);
    // black (when bishop moves, cover)
    ctx.beginPath();
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, 256, 512);
    ctx.fillRect(768, 0, 256, 512);
}

function drawOnlineSettings() {
    // black background
    ctx.beginPath();
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, 1024, 4096);
    ctx.beginPath();
    // dark brown
    ctx.fillStyle = "#442200";
    ctx.fillRect(256, 0, 512, 512);
    // light brown
    ctx.beginPath();
    ctx.fillStyle = "#884400";
    ctx.fillRect(264, 8, 496, 496);
    // create game button
    ctx.beginPath();
    if (mouseX > 280 && mouseX < 435 && mouseY > 26 && mouseY < 56) {
        ctx.fillStyle = "#cc8800";
        if (mouseDown) {
            gameScreen = SCREENTYPE.ONLINESETTINGS_TO_EDITONLINE;
        }
    } else {
        ctx.fillStyle = "#663300";
    }
    ctx.fillRect(280, 26, 155, 30);
    ctx.beginPath();
    ctx.fillStyle = "#ffffff";
    ctx.font = "25px Arial";
    ctx.fillText("Create Game", 282, 50);
    // join game button
    ctx.beginPath();
    if (mouseX > 280 && mouseX < 405 && mouseY > 76 && mouseY < 106) {
        ctx.fillStyle = "#cc8800";
        if (mouseDown) {
            gameScreen = SCREENTYPE.ONLINESETTINGS_TO_JOINONLINE;
        }
    } else {
        ctx.fillStyle = "#663300";
    }
    ctx.fillRect(280, 76, 125, 30);
    ctx.beginPath();
    ctx.fillStyle = "#ffffff";
    ctx.font = "25px Arial";
    ctx.fillText("Join Game", 282, 100);
}

var onlineCode = ""; // 6 letters
function drawWaitOnline() {
    // black background
    ctx.beginPath();
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, 1024, 4096);
    ctx.beginPath();
    // dark brown
    ctx.fillStyle = "#442200";
    ctx.fillRect(256, 0, 512, 512);
    // light brown
    ctx.beginPath();
    ctx.fillStyle = "#884400";
    ctx.fillRect(264, 8, 496, 496);
    // code
    ctx.beginPath();
    ctx.font = "75px Arial";
    ctx.fillStyle = "#000000";
    ctx.fillText("Code: " + onlineCode, 275, 105);
    ctx.fillStyle = "#ffffff";
    ctx.fillText("Code: " + onlineCode, 270, 100);
    ctx.beginPath();
    ctx.font = "30px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("Waiting for connection...", 300, 175);
}

var movingRookX;
var joinOnlineKeyInputDelay;
function drawJoinOnline() {
    joinOnlineKeyInputDelay++;

    // black background
    ctx.beginPath();
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, 1024, 4096);
    // dark brown
    ctx.beginPath();
    ctx.fillStyle = "#442200";
    ctx.fillRect(256, 0, 512, 512);
    // light brown
    ctx.beginPath();
    ctx.fillStyle = "#884400";
    ctx.fillRect(264, 8, 496, 496);
    // enter label
    ctx.beginPath();
    ctx.font = "30px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("Enter Code", 280, 55);
    // enter input background
    ctx.beginPath();
    ctx.fillStyle = "#442200";
    ctx.fillRect(280, 80, 120, 30);
    // enter input text
    ctx.beginPath();
    ctx.font = "25px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(onlineCode, 285, 104);
    // moving rook
    ctx.beginPath();
    ctx.fillStyle = "#884400";
    ctx.fillRect(280 + movingRookX, 80, 120, 30);
    ctx.drawImage(spritesheet, (2560/3), (427 / 2), 213, 213, 260 + movingRookX, 68, 50, 50);
    if (mouseX > 280 && mouseX < 400 && mouseY > 80 && mouseY < 110) {
        movingRookX += (120 - movingRookX) / 10;
        if (keyDown && joinOnlineKeyInputDelay > 5 && letters.includes(recentKey) && onlineCode.length < 6) {
            onlineCode += recentKey;
            joinOnlineKeyInputDelay = 0;
        }
    } else {
        movingRookX += (0 - movingRookX) / 5;
    }
    if (onlineCode.length == 6) {
        get(child(ref(database), `games/${onlineCode}`)).then((snapshot) => {
            if (snapshot.exists()) {
                joinOnline();
            } else {
                onlineCode = "";
            }
        }).catch((error) => {
            console.error(error);
        })
        // console.log(query(ref(database, `games/${onlineCode}`)));
    }
}

function joinOnline() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // logged in

            oSelfID = user.uid;

            oGameRef = ref(database, `games/${onlineCode}`);

            update(oGameRef, {
                p2: oSelfID
            });

            onValue(oGameRef, (snapshot) => {
                pOGameMove = oGameMove;
                oGameMove = snapshot.val().move;
                if (pOGameMove != oGameMove) {
                    onlineMove();
                }
                console.log(oGameMove);
            });

            onChildAdded(oGameRef, (snapshot) => {
                if (snapshot.val() == oSelfID) {
                    get(child(ref(database), `games/${onlineCode}/initialTypeBoard`)).then((snapshot2) => {
                        get(child(ref(database), `games/${onlineCode}/initialColBoard`)).then((snapshot3) => {
                            if (snapshot2.exists()) {
                                console.log(snapshot2.val());
                                for (var lo = 0; lo < boardLength; lo++) {
                                    for (var mo = 0; mo < boardLength; mo++) {
                                        for (var no = 0; no < boardLength; no++) {
                                            typeBoard[lo][mo][no] = (snapshot2.val()[(lo * boardLength * boardLength) + (mo * boardLength) + no] - 1);
                                            colourBoard[lo][mo][no] = (snapshot3.val()[(lo * boardLength * boardLength) + (mo * boardLength) + no] - 1);
                                        }
                                    }
                                }
                                console.log(typeBoard);
                                oSelfCol = COLOUR.BLACK;
                                gameScreen = SCREENTYPE.JOINONLINE_TO_ONLINEGAME;
                            }
                        });
                    });
                }
            });

            onChildRemoved(oGameRef, (snapshot) => {
                // something like below:
                // oGameMove = "disconnect"
            });
        } else {
            // not logged in
        }
    });

    signInAnonymously(auth).catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;

        console.log(errorCode, errorMessage);
    });
}

var oGameRef;
var oSelfID;
var oGameMove = "";
var pOGameMove = "";
var oBoardTypeString;
var oBoardColString;
var oSelfCol;
const letters = "abcdehijklmnopqrstuvwxyz0123456789";
function createOnline() {
    // generate code
    onlineCode = "";
    for (var ml = 0; ml < 6; ml++) {
        onlineCode += letters[Math.floor(Math.random() * letters.length)];
    }

    onAuthStateChanged(auth, (user) => {
        if (user) {
            // logged in

            oSelfID = user.uid;

            oGameRef = ref(database, `games/${onlineCode}`);
            
            set(oGameRef, {
                move: "",
                initialTypeBoard: oBoardTypeString,
                initialColBoard: oBoardColString,
                p1: oSelfID
            });

            onDisconnect(oGameRef).remove();

            onValue(oGameRef, (snapshot) => {
                pOGameMove = oGameMove;
                oGameMove = snapshot.val().move;
                if (pOGameMove != oGameMove) {
                    onlineMove();
                }
                console.log(oGameMove);
            });

            onChildAdded(oGameRef, (snapshot) => {
                if (snapshot.val() != "" && snapshot.val() != oSelfID && snapshot.val() != oBoardTypeString && snapshot.val() != oBoardColString) {
                    oSelfCol = COLOUR.WHITE;
                    gameScreen = SCREENTYPE.WAITONLINE_TO_ONLINEGAME;
                }
            });

            onChildRemoved(oGameRef, (snapshot) => {
                // something like below:
                // oGameMove = "disconnect"
            });
        } else {
            // not logged in
        }
    });

    signInAnonymously(auth).catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;

        console.log(errorCode, errorMessage);
    });
}

function onlineMove() {
    if (pOGameMove != oGameMove) {
        var xForMoveList, yForMoveList, zForMoveList;
        xForMoveList = oGameMove[3];
        yForMoveList = oGameMove[4];
        zForMoveList = oGameMove[5];
        // set p boards (in case we need to move back)
        pTypeBoard = Array(boardLength).fill().map(() => Array(boardLength).fill().map(() => Array(boardLength).fill(-1)));
        pColourBoard = Array(boardLength).fill().map(() => Array(boardLength).fill().map(() => Array(boardLength).fill(-1)));
        pCountBoard = Array(boardLength).fill().map(() => Array(boardLength).fill().map(() => Array(boardLength).fill(-1)));
        pPassantBoard = Array(boardLength).fill().map(() => Array(boardLength).fill().map(() => Array(boardLength).fill(-1)));
        for (var l = 0; l < typeBoard.length; l++) {
            for (var m = 0; m < typeBoard.length; m++) {
                for (var n = 0; n < typeBoard.length; n++) {
                    pTypeBoard[l][m][n] = typeBoard[l][m][n];
                    pColourBoard[l][m][n] = colourBoard[l][m][n];
                    pCountBoard[l][m][n] = countBoard[l][m][n];
                    pPassantBoard[l][m][n] = passantBoard[l][m][n];
                }
            }
        }

        // move
        passantCapture = false;
        typeBoard[oGameMove[3]][oGameMove[4]][oGameMove[5]] = typeBoard[oGameMove[0]][oGameMove[1]][oGameMove[2]];
        colourBoard[oGameMove[3]][oGameMove[4]][oGameMove[5]] = colourBoard[oGameMove[0]][oGameMove[1]][oGameMove[2]];
        countBoard[oGameMove[3]][oGameMove[4]][oGameMove[5]] = colourBoard[oGameMove[0]][oGameMove[1]][oGameMove[2]] + 1;
        for (var u = 0; u < boardLength; u++) {
            for (var v = 0; v < boardLength; v++) {
                for (var w = 0; w < boardLength; w++) {
                    if (passantBoard[u][v][w] == 2) {
                        if (passantBoard[oGameMove[0]][oGameMove[1]][oGameMove[2]] == 1 && passantBoard[oGameMove[3]][oGameMove[4]][oGameMove[5]] == 3 && typeBoard[oGameMove[3]][oGameMove[4]][oGameMove[5]] == PIECE.PAWN) {
                            typeBoard[u][v][w] = PIECE.BLANK;
                            colourBoard[u][v][w] = -1;
                            countBoard[u][v][w] = 0;
                            if (turn == COLOUR.WHITE) {
                                capturedCounts[5]++;
                            } else {
                                capturedCounts[0]++;
                            }
                            passantCapture = true;
                        }
                    }
                }
            }
        }
        for (var u = 0; u < boardLength; u++) {
            for (var v = 0; v < boardLength; v++) {
                for (var w = 0; w < boardLength; w++) {
                    // cannot be in above uvw loop (above loop requires knowledge of passantBoard at moving from and moving to points)
                    passantBoard[u][v][w] = 0;
                }
            }
        }
        if (typeBoard[oGameMove[3]][oGameMove[4]][oGameMove[5]] == PIECE.PAWN && Math.abs(oGameMove[5] - oGameMove[2]) == 2) {
            passantBoard[oGameMove[3]][oGameMove[4]][oGameMove[5]] = 2;
            console.log(passantBoard);
            console.log(oGameMove[0]);
            console.log(oGameMove[1]);
            console.log(oGameMove[2]);
            console.log(oGameMove[3]);
            console.log(oGameMove[4]);
            console.log(oGameMove[5]);
            if (oGameMove[3] > 0) {
                passantBoard[parseInt(oGameMove[3]) - 1][oGameMove[4]][oGameMove[5]] = 1;
            }
            if (oGameMove[3] < 7) {
                passantBoard[parseInt(oGameMove[3]) + 1][oGameMove[4]][oGameMove[5]] = 1;
            }
            if (oGameMove[4] > 0) {
                passantBoard[oGameMove[3]][parseInt(oGameMove[4]) - 1][oGameMove[5]] = 1;
            }
            if (oGameMove[4] < 7) {
                passantBoard[oGameMove[3]][parseInt(oGameMove[4]) + 1][oGameMove[5]] = 1;
            }
            passantBoard[oGameMove[3]][oGameMove[4]][Math.floor((parseInt(oGameMove[5]) + parseInt(oGameMove[2])) / 2)] = 3;
        }
        if (typeBoard[oGameMove[3]][oGameMove[4]][oGameMove[5]] == PIECE.PAWN && (oGameMove[5] == 0 || oGameMove[5] == 7)) {
            // pawn promote
            promoting = true;
            promotingCol = turn;
            promotingPos = new BoardPos(oGameMove[3], oGameMove[4], oGameMove[5]);
        }

        typeBoard[oGameMove[0]][oGameMove[1]][oGameMove[2]] = -1;
        countBoard[oGameMove[0]][oGameMove[1]][oGameMove[2]] = 0;
        passantBoard[oGameMove[0]][oGameMove[1]][oGameMove[2]] = 0;

        // append to movelist
        if (turn == COLOUR.BLACK) {
            moveList += "KQBNR "[pTypeBoard[oGameMove[0]][oGameMove[1]][oGameMove[2]]] + "abcdefgh"[oGameMove[0]] + "87654321"[oGameMove[1]] + "αβγδεζηθ"[oGameMove[2]] + "-";
            moveList += "KQBNR "[typeBoard[oGameMove[3]][oGameMove[4]][oGameMove[5]]] + "abcdefgh"[oGameMove[3]] + "87654321"[oGameMove[4]] + "αβγδεζηθ"[oGameMove[5]] + "\n";
        } else {
            moveList += "KQBNR "[pTypeBoard[oGameMove[0]][oGameMove[1]][oGameMove[2]]] + "abcdefgh"[oGameMove[0]] + "87654321"[oGameMove[1]] + "αβγδεζηθ"[oGameMove[2]] + "-";
            moveList += "KQBNR "[typeBoard[oGameMove[3]][oGameMove[4]][oGameMove[5]]] + "abcdefgh"[oGameMove[3]] + "87654321"[oGameMove[4]] + "αβγδεζηθ"[oGameMove[5]] + "\\";
        }
        moveToList = [];

        turn = (turn + 1) % 2;

        if (passantCapture) {
            moveList = moveList.slice(0, moveList.length - 4) + "x" + moveList.slice(moveList.length - 4);
        }
        if (pTypeBoard[xForMoveList][yForMoveList][zForMoveList] != PIECE.BLANK) {
            moveList = moveList.slice(0, moveList.length - 4) + "x" + moveList.slice(moveList.length - 4);
            switch (pTypeBoard[xForMoveList][yForMoveList][zForMoveList]) {
                case (PIECE.PAWN): {
                    if (turn == COLOUR.WHITE) {
                        capturedCounts[0]++;
                    } else {
                        capturedCounts[5]++;
                    }
                    break;
                }
                case (PIECE.KNIGHT): {
                    if (turn == COLOUR.WHITE) {
                        capturedCounts[1]++;
                    } else {
                        capturedCounts[6]++;
                    }
                    break;
                }
                case (PIECE.BISHOP): {
                    if (turn == COLOUR.WHITE) {
                        capturedCounts[2]++;
                    } else {
                        capturedCounts[7]++;
                    }
                    break;
                }
                case (PIECE.ROOK): {
                    if (turn == COLOUR.WHITE) {
                        capturedCounts[3]++;
                    } else {
                        capturedCounts[8]++;
                    }
                    break;
                }
                case (PIECE.QUEEN): {
                    if (turn == COLOUR.WHITE) {
                        capturedCounts[4]++;
                    } else {
                        capturedCounts[9]++;
                    }
                    break;
                }
            }
        }

        // set p boards to new config
        for (var l = 0; l < typeBoard.length; l++) {
            for (var m = 0; m < typeBoard.length; m++) {
                for (var n = 0; n < typeBoard.length; n++) {
                    pTypeBoard[l][m][n] = typeBoard[l][m][n];
                    pColourBoard[l][m][n] = colourBoard[l][m][n];
                    pCountBoard[l][m][n] = countBoard[l][m][n];
                    pPassantBoard[l][m][n] = passantBoard[l][m][n];
                }
            }
        }

        toConvert = [];
        
        // check king checkmate
        checkList = [];
        checkBoard = Array(boardLength).fill().map(() => Array(boardLength).fill().map(() => Array(boardLength).fill(0)));
        turn = (turn + 1) % 2;
        findAllThreatened();
        turn = (turn + 1) % 2;

        var check1Board = Array(boardLength).fill().map(() => Array(boardLength).fill().map(() => Array(boardLength).fill(0)));
        for (var l = 0; l < checkBoard.length; l++) {
            for (var m = 0; m < checkBoard.length; m++) {
                for (var n = 0; n < checkBoard.length; n++) {
                    check1Board[l][m][n] = checkBoard[l][m][n];
                }
            }
        }
        for (var l = 0; l < check1Board.length; l++) {
            for (var m = 0; m < check1Board.length; m++) {
                for (var n = 0; n < check1Board.length; n++) {
                    if (check1Board[l][m][n] == 1 && colourBoard[l][m][n] == turn) {
                        moveList = moveList.slice(0, moveList.length - 1) + "+" + moveList.slice(moveList.length - 1);
                        var checkmate = true;
                        for (var l2 = 0; l2 < check1Board.length; l2++) {
                            for (var m2 = 0; m2 < check1Board.length; m2++) {
                                for (var n2 = 0; n2 < check1Board.length; n2++) {
                                    if (typeBoard[l2][m2][n2] != PIECE.BLANK && colourBoard[l2][m2][n2] == turn) {
                                        selected.set(l2, m2, n2);
                                        calculateMoveToList();
                                        var tMoveToList = [];
                                        for (var r = 0; r < moveToList.length; r++) {
                                            tMoveToList.push(moveToList[r]);
                                        }
                                        moveToList = [];
                                        
                                        for (var s = 0; s < tMoveToList.length; s++) {
                                            // test move
                                            typeBoard[tMoveToList[s].x][tMoveToList[s].y][tMoveToList[s].z] = typeBoard[l2][m2][n2];
                                            colourBoard[tMoveToList[s].x][tMoveToList[s].y][tMoveToList[s].z] = colourBoard[l2][m2][n2];
                                            countBoard[tMoveToList[s].x][tMoveToList[s].y][tMoveToList[s].z] = countBoard[l2][m2][n2] + 1;
                                            for (var u = 0; u < boardLength; u++) {
                                                for (var v = 0; v < boardLength; v++) {
                                                    for (var w = 0; w < boardLength; w++) {
                                                        if (passantBoard[u][v][w] == 2) {
                                                            if (passantBoard[l2][m2][n2] == 1 && passantBoard[tMoveToList[s].x][tMoveToList[s].y][tMoveToList[s].z] == 3 && typeBoard[tMoveToList[s].x][tMoveToList[s].y][tMoveToList[s].z] == PIECE.PAWN) {
                                                                typeBoard[u][v][w] = PIECE.BLANK;
                                                                countBoard[u][v][w] = 0;
                                                            }
                                                        }
                                                        passantBoard[u][v][w] = 0;
                                                    }
                                                }
                                            }
                                            if (typeBoard[tMoveToList[s].x][tMoveToList[s].y][tMoveToList[s].z] == PIECE.PAWN && Math.abs(tMoveToList[s].z - n2) == 2) {
                                                passantBoard[tMoveToList[s].x][tMoveToList[s].y][tMoveToList[s].z] = 2;
                                                if (tMoveToList[s].x > 0) {
                                                    passantBoard[tMoveToList[s].x - 1][tMoveToList[s].y][tMoveToList[s].z] = 1;
                                                }
                                                if (tMoveToList[s].x < 7) {
                                                    passantBoard[tMoveToList[s].x + 1][tMoveToList[s].y][tMoveToList[s].z] = 1;
                                                }
                                                if (tMoveToList[s].y > 0) {
                                                    passantBoard[tMoveToList[s].x][tMoveToList[s].y - 1][tMoveToList[s].z] = 1;
                                                }
                                                if (tMoveToList[s].y < 7) {
                                                    passantBoard[tMoveToList[s].x][tMoveToList[s].y + 1][tMoveToList[s].z] = 1;
                                                }
                                                passantBoard[tMoveToList[s].x][tMoveToList[s].y][Math.floor((tMoveToList[s].z + n2) / 2)] = 3;
                                            }
                                                                    
                                            typeBoard[l2][m2][n2] = -1;
                                            countBoard[l2][m2][n2] = 0;
                                            passantBoard[l2][m2][n2] = 0;

                                            // check if in check
                                            checkList = [];
                                            checkBoard = Array(boardLength).fill().map(() => Array(boardLength).fill().map(() => Array(boardLength).fill(0)));
                                            turn = (turn + 1) % 2;
                                            findAllThreatened();
                                            turn = (turn + 1) % 2;

                                            incheck = false;
                                            for (var l3 = 0; l3 < checkBoard.length; l3++) {
                                                for (var m3 = 0; m3 < checkBoard.length; m3++) {
                                                    for (var n3 = 0; n3 < checkBoard.length; n3++) {
                                                        if (checkBoard[l3][m3][n3] == 1 && colourBoard[l3][m3][n3] == turn) {
                                                            incheck = true;
                                                        }
                                                    }
                                                }
                                            }

                                            if (!incheck) {
                                                checkmate = false;
                                                console.log(tMoveToList[s]);
                                            }

                                            // reset boards for next iteration
                                            for (var ll = 0; ll < typeBoard.length; ll++) {
                                                for (var mm = 0; mm < typeBoard.length; mm++) {
                                                    for (var nn = 0; nn < typeBoard.length; nn++) {
                                                        typeBoard[ll][mm][nn] = pTypeBoard[ll][mm][nn];
                                                        colourBoard[ll][mm][nn] = pColourBoard[ll][mm][nn];
                                                        countBoard[ll][mm][nn] = pCountBoard[ll][mm][nn];
                                                        passantBoard[ll][mm][nn] = pPassantBoard[ll][mm][nn];
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        if (checkmate == true) {
                            // turn king to other colour
                            console.log("e")
                            toConvert.push(new BoardPos(l, m, n));
                        }
                        moveToList = [];
                        // selected.set(l, m, n);
                        // calculateMoveToList(); // get moves king can make
                        // // put them in tMoveToList
                        // var tMoveToList = [];
                        // for (var r = 0; r < moveToList.length; r++) {
                        //     tMoveToList.push(moveToList[r]);
                        //     console.log(tMoveToList[r])
                        // }
                        // moveToList = [];
                        // // for (var p = 0; p < boardLength; p++) {
                        // //     for (var q = 0; q < boardLength; q++) {
                        // //         for (var r = 0; r < boardLength; r++) {
                        // //             if (colourBoard[p][q][r] != turn && typeBoard[p][q][r] != PIECE.BLANK) {
                        // //                 selected.set(p, q, r);
                        // //                 switch (typeBoard[selected.x][selected.y][selected.z]) {
                        // //                     case (PIECE.PAWN): {
                        // //                         calculatePawnMove();
                        // //                         break;
                        // //                     }
                        // //                     case (PIECE.KNIGHT): {
                        // //                         calculateKnightMove();
                        // //                         break;
                        // //                     }
                        // //                     case (PIECE.ROOK): {
                        // //                         calculateRookMove();
                        // //                         break;
                        // //                     }
                        // //                     case (PIECE.BISHOP): {
                        // //                         calculateBishopMove();
                        // //                         break;
                        // //                     }
                        // //                     case (PIECE.QUEEN): {
                        // //                         calculateQueenMove();
                        // //                         break;
                        // //                     }
                        // //                     case (PIECE.KING): {
                        // //                         calculateKingMove();
                        // //                         break;
                        // //                     }
                        // //                     default: {
                        // //                         break;
                        // //                     }
                        // //                 }
                        // //             }
                        // //         }
                        // //     }
                        // // }
                        // // var tempBoard = Array(boardLength).fill().map(() => Array(boardLength).fill().map(() => Array(boardLength).fill(0)));
                        // // for (var s = 0; s < moveToList.length; s++) {
                        // //     tempBoard[moveToList[s].x][moveToList[s].y][moveToList[s].z] = 1;
                        // // }
                        // selected.set(l, m, n);
                        // var checkmate = true;
                        // for (var s = 0; s < tMoveToList.length; s++) {
                        //     // test move
                        //     typeBoard[tMoveToList[s].x][tMoveToList[s].y][tMoveToList[s].z] = typeBoard[selected.x][selected.y][selected.z];
                        //     colourBoard[tMoveToList[s].x][tMoveToList[s].y][tMoveToList[s].z] = colourBoard[selected.x][selected.y][selected.z];
                        //     countBoard[tMoveToList[s].x][tMoveToList[s].y][tMoveToList[s].z] = countBoard[selected.x][selected.y][selected.z] + 1;

                        //     typeBoard[selected.x][selected.y][selected.z] = -1;
                        //     countBoard[selected.x][selected.y][selected.z] = 0;

                        //     // check if in check
                        //     checkList = [];
                        //     checkBoard = Array(boardLength).fill().map(() => Array(boardLength).fill().map(() => Array(boardLength).fill(0)));
                        //     turn = (turn + 1) % 2;
                        //     findAllThreatened();
                        //     turn = (turn + 1) % 2;

                        //     incheck = false;
                        //     for (var l2 = 0; l2 < checkBoard.length; l2++) {
                        //         for (var m2 = 0; m2 < checkBoard.length; m2++) {
                        //             for (var n2 = 0; n2 < checkBoard.length; n2++) {
                        //                 if (checkBoard[l2][m2][n2] == 1 && colourBoard[l2][m2][n2] == turn) {
                        //                     console.log(l2 + "," + m2 + "," + n2);
                        //                     incheck = true;
                        //                 }
                        //             }
                        //         }
                        //     }

                        //     if (!incheck) {
                        //         checkmate = false;
                        //         console.log(tMoveToList[s]);
                        //     }

                        //     // reset boards for next iteration
                        //     for (var ll = 0; ll < typeBoard.length; ll++) {
                        //         for (var mm = 0; mm < typeBoard.length; mm++) {
                        //             for (var nn = 0; nn < typeBoard.length; nn++) {
                        //                 typeBoard[ll][mm][nn] = pTypeBoard[ll][mm][nn];
                        //                 colourBoard[ll][mm][nn] = pColourBoard[ll][mm][nn];
                        //                 countBoard[ll][mm][nn] = pCountBoard[ll][mm][nn];
                        //             }
                        //         }
                        //     }
        
                        //     // typeBoard = pTypeBoard;
                        //     // colourBoard = pColourBoard;
                        //     // countBoard = pCountBoard;
        
                        //     // if (tempBoard[tMoveToList[s].x][tMoveToList[s].y][tMoveToList[s].z] == 0) {
                        //     //     checkmate = false;
                        //     // }
                        // }
                        // if (checkmate == true) {
                        //     // turn king to other colour
                        //     console.log("e")
                        //     toConvert.push(new BoardPos(l, m, n));
                        // }
                        // moveToList = [];
                    }
                }
            }
        }
        // convert kings
        for (var urmom = 0; urmom < toConvert.length; urmom++) {
            colourBoard[toConvert[urmom].x][toConvert[urmom].y][toConvert[urmom].z] = ((turn + 1) % 2);
            check1Board[toConvert[urmom].x][toConvert[urmom].y][toConvert[urmom].z] = 0;
            moveList = moveList.slice(0, moveList.length - 2) + "#" + moveList.slice(moveList.length - 1);
        }
        // count kings
        var whiteKingCount = 0;
        var blackKingCount = 0;
        for (var l = 0; l < typeBoard.length; l++) {
            for (var m = 0; m < typeBoard.length; m++) {
                for (var n = 0; n < typeBoard.length; n++) {
                    if (typeBoard[l][m][n] == PIECE.KING && colourBoard[l][m][n] == COLOUR.WHITE) {
                        whiteKingCount++;
                    }
                    if (typeBoard[l][m][n] == PIECE.KING && colourBoard[l][m][n] == COLOUR.BLACK) {
                        blackKingCount++;
                    }
                }
            }
        }
        if (whiteKingCount == 0) {
            moveList += "0-1 Black win";
            console.log(moveList);
        }
        if (blackKingCount == 0) {
            moveList += "1-0 White win";
            console.log(moveList);
        }
    }
}

var musicToggle = false;
var musicSelectWidth = 100;
var settingsDelay;
function drawSettingsBackground() {
    settingsDelay++;

    // black background
    ctx.beginPath();
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, 1024, 4096);
    ctx.beginPath();
    // dark brown
    ctx.fillStyle = "#442200";
    ctx.fillRect(256, 0, 512, 512);
    // light brown
    ctx.beginPath();
    ctx.fillStyle = "#884400";
    ctx.fillRect(264, 8, 496, 496);
    // settings title
    ctx.beginPath();
    ctx.fillStyle = "#ffffff";
    ctx.font = "25px Arial";
    ctx.fillText("Settings", 270, 35);
    // music toggle
    ctx.beginPath();
    if (mouseX > 270 && mouseX < 370 && mouseY > 50 && mouseY < 80) {
        if (musicToggle) {
            ctx.fillStyle = "#00ff00";
        } else {
            ctx.fillStyle = "#ff0000";
        }
        if (mouseDown && settingsDelay > 15) {
            if (musicToggle) {
                musicToggle = false;
                switch (songPlaying) {
                    case SONG.BLUEBIRD: {
                        bluebird.pause();
                        bluebird.currentTime = 0;
                        break;
                    }
                    case SONG.NEVER: {
                        never.pause();
                        never.currentTime = 0;
                        break;
                    }
                    case SONG.BADAPPLE: {
                        badapple.pause();
                        badapple.currentTime = 0;
                        break;
                    }
                    case SONG.KAWAKI: {
                        kawaki.pause();
                        kawaki.currentTime = 0;
                        break;
                    }
                    case SONG.BAKAMITAI: {
                        bakamitai.pause();
                        bakamitai.currentTime = 0;
                        break;
                    }
                    default: {
                        break;
                    }
                }
            } else {
                musicToggle = true;
                switch (songPlaying) {
                    case SONG.BLUEBIRD: {
                        bluebird.play();
                        break;
                    }
                    case SONG.NEVER: {
                        never.play();
                        break;
                    }
                    case SONG.BADAPPLE: {
                        badapple.play();
                        break;
                    }
                    case SONG.KAWAKI: {
                        kawaki.play();
                        break;
                    }
                    case SONG.BAKAMITAI: {
                        bakamitai.play();
                        break;
                    }
                    default: {
                        break;
                    }
                }
            }
            settingsDelay = 0;
        }
    } else {
        if (musicToggle) {
            ctx.fillStyle = "#008800";
        } else {
            ctx.fillStyle = "#880000";
        }
    }
    ctx.fillRect(270, 50, 100, 30);
    ctx.beginPath();
    ctx.fillStyle = "#ffffff";
    ctx.font = "25px Arial";
    ctx.fillText("Music", 284, 74);
    // music select
    ctx.beginPath();
    if (mouseX > 270 && mouseX < (270 + musicSelectWidth) && mouseY > 90 && mouseY < 120) {
        if (musicToggle) {
            ctx.fillStyle = "#00ff00";
        } else {
            ctx.fillStyle = "#ff0000";
        }
        if (mouseDown && settingsDelay > 15) {
            musicToggle = true;

            songPlaying = (songPlaying + 1) % SONG.LAST;
            bluebird.pause();
            bluebird.currentTime = 0;
            never.pause();
            never.currentTime = 0;
            bakamitai.pause();
            bakamitai.currentTime = 0;
            badapple.pause();
            badapple.currentTime = 0;
            kawaki.pause();
            kawaki.currentTime = 0;
            switch (songPlaying) {
                case SONG.BLUEBIRD: {
                    bluebird.play();
                    break;
                }
                case SONG.NEVER: {
                    never.play();
                    break;
                }
                case SONG.BADAPPLE: {
                    badapple.play();
                    break;
                }
                case SONG.KAWAKI: {
                    kawaki.play();
                    break;
                }
                case SONG.BAKAMITAI: {
                    bakamitai.play();
                    break;
                }
                default: {
                    break;
                }
            }
            settingsDelay = 0;
        }
    } else {
        if (musicToggle) {
            ctx.fillStyle = "#008800";
        } else {
            ctx.fillStyle = "#880000";
        }
    }
    switch (songPlaying) {
        case SONG.BLUEBIRD: {
            ctx.fillRect(270, 90, 110, 30);
            ctx.beginPath();
            ctx.fillStyle = "#ffffff";
            ctx.font = "25px Arial";
            ctx.fillText("Blue Bird", 274, 114);
            musicSelectWidth = 110;
            break;
        }
        case SONG.BADAPPLE: {
            ctx.fillRect(270, 90, 125, 30);
            ctx.beginPath();
            ctx.fillStyle = "#ffffff";
            ctx.font = "25px Arial";
            ctx.fillText("Bad Apple", 274, 114);
            musicSelectWidth = 125;
            break;
        }
        case SONG.KAWAKI: {
            ctx.fillRect(270, 90, 215, 30);
            ctx.beginPath();
            ctx.fillStyle = "#ffffff";
            ctx.font = "25px Arial";
            ctx.fillText("Kawaki wo Ameku", 274, 114);
            musicSelectWidth = 215;
            break;
        }
        case SONG.BAKAMITAI: {
            ctx.fillRect(270, 90, 125, 30);
            ctx.beginPath();
            ctx.fillStyle = "#ffffff";
            ctx.font = "25px Arial";
            ctx.fillText("Baka Mitai", 274, 114);
            musicSelectWidth = 125;
            break;
        }
        case SONG.NEVER: {
            ctx.fillRect(270, 90, 310, 30);
            ctx.beginPath();
            ctx.fillStyle = "#ffffff";
            ctx.font = "25px Arial";
            ctx.fillText("Never Gonna Give You Up", 277, 114);
            musicSelectWidth = 310;
            break;
        }
        default: {
            ctx.fillText("???", 284, 114);
            break;
        }
    }
    // back button
    ctx.beginPath();
    if (mouseX > 670 && mouseX < 750 && mouseY > 460 && mouseY < 490) {
        ctx.fillStyle = "#cc8800";
        if (mouseDown) {
            gameScreen = SCREENTYPE.SETTINGS_TO_TITLE;
        }
    } else {
        ctx.fillStyle = "#663300";
    }
    ctx.fillRect(670, 460, 80, 30);
    ctx.beginPath();
    ctx.fillStyle = "#ffffff";
    ctx.font = "25px Arial";
    ctx.fillText("Back", 681, 484);
}

function main() {
    switch (gameScreen) {
        case (SCREENTYPE.TITLE): {
            drawTitleBackground();
            break;
        }
        // deprecated
        case (SCREENTYPE.TITLE_TO_LOCALGAME): {
            initBoard();
            promoting = false;
            promotingCol = COLOUR.BLACK;
            gameScreen = SCREENTYPE.LOCALGAME;
            break;
        }
        case (SCREENTYPE.TITLE_TO_SETTINGS): {
            settingsDelay = 15;
            gameScreen = SCREENTYPE.SETTINGS;
            break;
        }
        case (SCREENTYPE.TITLE_TO_EDITLOCAL): {
            initBoard();
            gameScreen = SCREENTYPE.EDITLOCAL;
            break;
        }
        case (SCREENTYPE.TITLE_TO_ONLINESETTINGS): {
            gameScreen = SCREENTYPE.ONLINESETTINGS;
            break;
        }
        case (SCREENTYPE.ONLINESETTINGS): {
            drawOnlineSettings();
            break;
        }
        case (SCREENTYPE.ONLINESETTINGS_TO_EDITONLINE): {
            initBoard();
            gameScreen = SCREENTYPE.EDITONLINE;
            break;
        }
        case (SCREENTYPE.ONLINESETTINGS_TO_JOINONLINE): {
            movingRookX = 0;
            joinOnlineKeyInputDelay = 20;
            gameScreen = SCREENTYPE.JOINONLINE;
            break;
        }
        case (SCREENTYPE.JOINONLINE): {
            drawJoinOnline();
            break;
        }
        case (SCREENTYPE.EDITONLINE): {
            drawBackgroundEdit();
            break;
        }
        case (SCREENTYPE.EDITONLINE_TO_WAITONLINE): {
            oBoardTypeString = "";
            oBoardColString = "";
            for (var lo = 0; lo < boardLength; lo++) {
                for (var mo = 0; mo < boardLength; mo++) {
                    for (var no = 0; no < boardLength; no++) {
                        oBoardTypeString += String(typeBoard[lo][mo][no] + 1);
                        oBoardColString += String(colourBoard[lo][mo][no] + 1);
                    }
                }
            }
            createOnline();
            gameScreen = SCREENTYPE.WAITONLINE;
            break;
        }
        case (SCREENTYPE.WAITONLINE): {
            drawWaitOnline();
            break;
        }
        case (SCREENTYPE.WAITONLINE_TO_ONLINEGAME): {
            promoting = false;
            promotingCol = COLOUR.BLACK;
            gameScreen = SCREENTYPE.ONLINEGAME;
            break;
        }
        case (SCREENTYPE.JOINONLINE_TO_ONLINEGAME): {
            promoting = false;
            promotingCol = COLOUR.BLACK;
            gameScreen = SCREENTYPE.ONLINEGAME;
            break;
        }
        case (SCREENTYPE.ONLINEGAME): {
            drawBackground();
            drawBoard();
            drawMoveToList();
            drawThreatList();
            drawCheck();
            break;
        }
        case (SCREENTYPE.EDITLOCAL): {
            drawBackgroundEdit();
            break;
        }
        case (SCREENTYPE.EDITLOCAL_TO_LOCALGAME): {
            promoting = false;
            promotingCol = COLOUR.BLACK;
            gameScreen = SCREENTYPE.LOCALGAME;
            break;
        }
        case (SCREENTYPE.SETTINGS): {
            drawSettingsBackground();
            break;
        }
        case (SCREENTYPE.SETTINGS_TO_TITLE): {
            titlePieceX = 300;
            gameScreen = SCREENTYPE.TITLE;
            break;
        }
        case (SCREENTYPE.LOCALGAME): {
            drawBackground();
            drawBoard();
            drawMoveToList();
            drawThreatList();
            drawCheck();
            break;
        }
        default: {
            break;
        }
    }
    window.requestAnimationFrame(main);
}
window.requestAnimationFrame(main);
