var c = document.getElementById("gameCanvas");
var ctx = c.getContext("2d");

var keys = [];

window.addEventListener("keydown", function(event) {
    keys[event.key] = true;
}, false);
window.addEventListener("keyup", function(event) {
    keys[event.key] = false;
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
    TITLE_TO_LOCALGAME: 1.2,
    TITLE_TO_ONLINEGAME: 1.3,
    TITLE_TO_SETTINGS: 1.4,
    LOCALGAME: 2,
    ONLINEGAME: 3,
    SETTINGS: 4,
    SETTINGS_TO_TITLE: 4.1
}

var gameScreen;

var spritesheet = document.getElementById("spritesheet");

const PIECE = {
    BLANK: -1,
    KING: 0,
    QUEEN: 1,
    BISHOP: 2,
    KNIGHT: 3,
    ROOK: 4,
    PAWN: 5
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
var checkBoard = Array(boardLength).fill().map(() => Array(boardLength).fill().map(() => Array(boardLength).fill(0)));

var selected = new BoardPos(-1, -1, -1);

var showLabels = true;

var moveList = "";

var bluebird = document.getElementById("bluebird");
bluebird.loop = true;

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
    if (colour == turn && mouseX > (x * 54) + 40 && mouseX < (x * 54) + 94 && mouseY > (y * 54) + (z * 512) + 40 && mouseY < (y * 54) + (z * 512) + 94) {
        ctx.drawImage(spritesheet, type * (640 / 3), colour * (427 / 2), (640 / 3), (640 / 3), (x * 54) + 36, (y * 54) + (z * 512) + 36, 62, 62);
        if (mouseDown && mouseButton == CLICK.LEFT) {
            selected.set(x, y, z);
            calculateMoveToList();
        }
    } else {
        if (colour != turn && mouseX > (x * 54) + 40 && mouseX < (x * 54) + 94 && mouseY > (y * 54) + (z * 512) + 40 && mouseY < (y * 54) + (z * 512) + 94) {
            if (mouseDown && mouseButton == CLICK.RIGHT) {
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

function placePiece(x, y, z, type, col, moveCount) {
    typeBoard[x][y][z] = type;
    colourBoard[x][y][z] = col;
    countBoard[x][y][z] = moveCount;
}

var pTypeBoard;
var pColourBoard;
var pCountBoard;
var incheck;
var toConvert;
var rMoveToList;
function drawMoveToList() {
    rMoveToList = [];
    for (var i = 0; i < moveToList.length; i++) {
        rMoveToList.push(moveToList[i]);
    }
    for (var i = 0; i < rMoveToList.length; i++) {
        ctx.beginPath();
        if (mouseX > (rMoveToList[i].x * 54) + 40 && mouseX < (rMoveToList[i].x * 54) + 94 && mouseY > (rMoveToList[i].y * 54) + (rMoveToList[i].z * 512) + 40 && mouseY < (rMoveToList[i].y * 54) + (rMoveToList[i].z * 512) + 94) {
            ctx.fillStyle = "#00ff0088";
            if (mouseDown && mouseButton == CLICK.LEFT) {
                var xForMoveList, yForMoveList, zForMoveList;
                xForMoveList = rMoveToList[i].x;
                yForMoveList = rMoveToList[i].y;
                zForMoveList = rMoveToList[i].z;
                // set p boards (in case we need to move back)
                pTypeBoard = Array(boardLength).fill().map(() => Array(boardLength).fill().map(() => Array(boardLength).fill(-1)));
                pColourBoard = Array(boardLength).fill().map(() => Array(boardLength).fill().map(() => Array(boardLength).fill(-1)));
                pCountBoard = Array(boardLength).fill().map(() => Array(boardLength).fill().map(() => Array(boardLength).fill(-1)));
                for (var l = 0; l < typeBoard.length; l++) {
                    for (var m = 0; m < typeBoard.length; m++) {
                        for (var n = 0; n < typeBoard.length; n++) {
                            pTypeBoard[l][m][n] = typeBoard[l][m][n];
                            pColourBoard[l][m][n] = colourBoard[l][m][n];
                            pCountBoard[l][m][n] = countBoard[l][m][n];
                        }
                    }
                }

                // move
                typeBoard[rMoveToList[i].x][rMoveToList[i].y][rMoveToList[i].z] = typeBoard[selected.x][selected.y][selected.z];
                colourBoard[rMoveToList[i].x][rMoveToList[i].y][rMoveToList[i].z] = colourBoard[selected.x][selected.y][selected.z];
                countBoard[rMoveToList[i].x][rMoveToList[i].y][rMoveToList[i].z] = countBoard[selected.x][selected.y][selected.z] + 1;

                typeBoard[selected.x][selected.y][selected.z] = -1;
                countBoard[selected.x][selected.y][selected.z] = 0;

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
                    checkCheck();

                    moveList = moveList.slice(0, -10);
                } else {
                    // otherwise, advance turn
                    turn = (turn + 1) % 2;

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
                                                        typeBoard[tMoveToList[s].x][tMoveToList[s].y][tMoveToList[s].z] = typeBoard[selected.x][selected.y][selected.z];
                                                        colourBoard[tMoveToList[s].x][tMoveToList[s].y][tMoveToList[s].z] = colourBoard[selected.x][selected.y][selected.z];
                                                        countBoard[tMoveToList[s].x][tMoveToList[s].y][tMoveToList[s].z] = countBoard[selected.x][selected.y][selected.z] + 1;

                                                        typeBoard[selected.x][selected.y][selected.z] = -1;
                                                        countBoard[selected.x][selected.y][selected.z] = 0;

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
                                                                        console.log(l3 + "," + m3 + "," + n3);
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
}

var titlePieceX = 300;
var titlePieceMoveDir = 2 * (Math.round(Math.random()) - 0.5);
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
            gameScreen = SCREENTYPE.TITLE_TO_LOCALGAME;
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
            gameScreen = SCREENTYPE.TITLE_TO_ONLINEGAME;
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
        titlePieceX += ((300 + (270 * titlePieceMoveDir)) - titlePieceX) / 5;
    } else {
        titlePieceX += (300 - titlePieceX) / 5;
    }
    if (Math.abs(titlePieceX - 300) / 300 < 0.1) {
        titlePieceMoveDir = 2 * (Math.round(Math.random()) - 0.5);
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

var musicToggle = false;
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
                bluebird.pause();
            } else {
                musicToggle = true;
                bluebird.play();
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

gameScreen = SCREENTYPE.TITLE;

function main() {
    switch (gameScreen) {
        case (SCREENTYPE.TITLE): {
            drawTitleBackground();
            break;
        }
        case (SCREENTYPE.TITLE_TO_LOCALGAME): {
            initBoard();
            gameScreen = SCREENTYPE.LOCALGAME;
            break;
        }
        case (SCREENTYPE.TITLE_TO_SETTINGS): {
            settingsDelay = 15;
            gameScreen = SCREENTYPE.SETTINGS;
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
