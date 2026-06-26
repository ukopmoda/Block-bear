let board = [];

function createBoard() {

    board = [];

    for (let y = 0; y < 9; y++) {

        board[y] = [];

        for (let x = 0; x < 9; x++) {

            board[y][x] = 0;
        }
    }

    // center void

    for (let y = 3; y <= 5; y++) {

        for (let x = 3; x <= 5; x++) {

            board[y][x] = -1;
        }
    }
}