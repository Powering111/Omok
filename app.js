const directions = [
    { row: 1, column: 0 },
    { row: 0, column: 1 },
    { row: 1, column: 1 },
    { row: 1, column: -1 }
];


class Board {
    constructor(gameObj, rowCount, columnCount) {
        this.board = []; // data. 0 : empty, 1 : Black, 2 : White
        // count starts from 0.
        this.rowCount = rowCount;
        this.columnCount = columnCount;

        this.gameObj = gameObj;
        this.banned_list = []; // temporary list of banned cells

        for (let i = 0; i < this.rowCount; i++) {
            this.board.push([]);
            for (let j = 0; j < this.columnCount; j++) {
                this.board[i].push(0); // set data to empty
            }
        }

    }

    isBanned(row, column) {
        for (let banned_cell of this.banned_list) {
            if (banned_cell.row == row && banned_cell.column == column) {
                return true;
            }
        }
        return false;
    }

    // put a stone on the board
    put(row, column) {
        this.banned_list = [];

        this.board[row][column] = this.gameObj.turn;
    }



    setWholeBoard(put_list) {
        //initialize board
        for (let i = 0; i < this.rowCount; i++) {
            for (let j = 0; j < this.columnCount; j++) {
                this.board[i][j] = 0;
            }
        }
        //set board
        for (let i = 0; i < put_list.length; i++) {
            this.board[put_list[i].row][put_list[i].column] = i % 2 + 1;
        }
        this.selected = null;
        this.lastSelected = put_list[put_list.length - 1];

        this.draw();
    }

    inBoard(row, column) {
        return row >= 0 && row < this.rowCount && column >= 0 && column < this.columnCount;
    }

    check_five(row, column, turn, allow_6) {
        console.log('checking five of ', row, column, turn, allow_6);
        for (let direction of directions) {
            let cnt = -1;
            let r = row;
            let c = column;
            while (this.inBoard(r, c) && this.board[r][c] == turn) {
                r += direction.row;
                c += direction.column;
                cnt++;
            }

            r = row;
            c = column;
            while (this.inBoard(r, c) && this.board[r][c] == turn) {
                r -= direction.row;
                c -= direction.column;
                cnt++;
            }
            if (cnt == 5) return true;
            if (allow_6 && cnt >= 6) return true;
        }
    }

    ban_cells(ban_3_3, ban_4_3, ban_4_4) {
        console.log(ban_3_3, ban_4_3, ban_4_4)
    }
}

class Game {
    constructor(boardElement, rowCount, columnCount, rule) {
        this.rowCount = rowCount;
        this.columnCount = columnCount;

        this.board = new Board(this, 15, 15);
        this.UI = new userInterface(this, boardElement);

        this.turn = 1; // 1 : black, 2 : white
        this.gameOver = false;
        this.put_list = []; // list of put positions.
        this.count = 0;
        this.rule = rule;


    }

    undo(count = 1) {
        for (let i = 0; i < count; i++) {
            this.put_list.pop();
            this.count--;
        }
        this.board.setWholeBoard(this.put_list);
        this.turn = this.count % 2 + 1;
        this.UI.updateTurn();
    }

    check(row, column) {

        // check five
        const five = this.board.check_five(row, column, this.turn, this.rule.allow_6[this.turn]);
        if (five) {
            this.finishGame(this.turn);
            return;
        }
        this.board.ban_cells(!this.rule.allow_3_3[this.turn], !this.rule.allow_4_3[this.turn], !this.rule.allow_4_4[this.turn]);
        this.changeTurn();


    }

    changeTurn() {
        if (this.turn == 1) {
            this.turn = 2;
        } else {
            this.turn = 1;
        }
        this.UI.updateTurn(this.turn);
    }

    finishGame() {
        this.gameOver = true;
        this.winner = this.turn;
        this.UI.finishGame(this.winner);
    }
    put(row, column) {
        if (this.board.board[row][column] == 0 && !this.board.isBanned(row, column)) {
            this.board.put(row, column);
            this.count++;

            this.put_list.push({ row: row, column: column });
            this.lastPut = { row: row, column: column };

            this.check(row, column);

            this.UI.put(row, column);
        }
    }



}

class userInterface {
    constructor(gameObj, boardElement) {

        this.gameObj = gameObj;
        this.boardElement = boardElement;

        this.boardElement.innerHTML = ''; // clear the board.
        this.boardElement.dataset.turn = 1;
        this.putbutton = document.getElementById('put-button');

        this.rowElements = []; // element. HTML elements of the rows
        this.cellElements = []; // element. HTML elements of the cells (2D Array)
        for (let i = 0; i < this.gameObj.rowCount; i++) {
            this.rowElements.push(document.createElement("div"));
            this.rowElements[i].classList.add('board-row');
            this.cellElements.push([]);
            for (let j = 0; j < this.gameObj.columnCount; j++) {
                this.cellElements[i][j] = document.createElement('div'); // create element
                this.cellElements[i][j].classList.add('board-cell');
                this.cellElements[i][j].classList.add('cell-empty');
                this.cellElements[i][j].setAttribute('data-row', i);
                this.cellElements[i][j].setAttribute('data-column', j);

                const cellContentElement = document.createElement('div');
                cellContentElement.classList.add('cell-content');
                this.cellElements[i][j].appendChild(cellContentElement);
                this.rowElements[i].appendChild(this.cellElements[i][j]);

            }
            this.boardElement.appendChild(this.rowElements[i]);
        }

        this.boardElement.addEventListener('mousedown', (event) => { this.boardclickListener(event) });
        this.putbutton.addEventListener('mousedown', (event) => { this.putbuttonclickListener() })


    }

    animatePut(elem) {
        const putAnimation = [{
                transform: 'scale(1.4)',
                opacity: 0
            },
            {
                transform: 'scale(1.3)',
                opacity: 0.8
            }, {
                transform: 'scale(1)',
                opacity: 1
            }

        ]
        const putTiming = {
            duration: 300,
            iterations: 1
        }
        elem.animate(putAnimation, putTiming);
    }

    draw() {
        for (let i = 0; i < this.gameObj.rowCount; i++) {
            for (let j = 0; j < this.gameObj.columnCount; j++) {
                if (this.gameObj.board.board[i][j] == 1) { // black cell
                    this.cellElements[i][j].className = 'board-cell cell-black';
                } else if (this.gameObj.board.board[i][j] == 2) { // white cell
                    this.cellElements[i][j].className = 'board-cell cell-white';
                } else if (this.gameObj.board.board[i][j] == 3) {
                    this.cellElements[i][j].className = 'board-cell cell-black cell-lastselected';
                } else {
                    this.cellElements[i][j].className = 'board-cell cell-empty';
                }
            }
        }

        if ('selected' in this && this.selected != null) {
            this.cellElements[this.selected.row][this.selected.column].classList.add('cell-selected');
        }
        if ('lastSelected' in this && this.gameOBj.lastSelected != null) {
            this.cellElements[this.gameObj.lastSelected.row][this.gameObj.lastSelected.column].classList.add('cell-lastselected');
        }

        for (let banned_cell of this.gameObj.board.banned_list) {
            this.cellElements[banned_cell.row][banned_cell.column].classList.add('cell-banned');
        }
    }

    updateTurn(turn) {
        this.boardElement.dataset.turn = turn;
    }

    select(row, column) {
        if (this.gameObj.board.board[row][column] == 0) {
            this.selected = { row: row, column: column };
            this.draw();
        }
    }
    put(row, column) {
        this.animatePut(this.cellElements[row][column]);
        this.selected = null;
        this.draw();
    }
    putbuttonclickListener() {
        if ('selected' in this && this.selected != null) {
            this.gameObj.put(this.selected.row, this.selected.column);
        }
    }

    boardclickListener(event) {
        if (this.gameObj.gameOver) {
            return;
        }
        if (!event.target.classList.contains('board-cell')) {
            return;
        }
        let row = Number(event.target.dataset.row);
        let column = Number(event.target.dataset.column);

        if (row != null && column != null && this.gameObj.board.board[row][column] == 0) {
            this.select(row, column);
        }
    }

    finishGame(winner) {
        this.selected = null;
        this.draw();
        this.boardElement.dataset.turn = '';
        document.getElementById('winner').innerHTML = `${winner==1?'흑돌':'백돌'} 승리!`;
        document.getElementById('winner').className = `winner-${winner==1?'black':'white'}`;
    }
}

const game = new Game(document.getElementById('board'), 15, 15, {
    allow_3_3: {
        1: false,
        2: true
    },
    allow_4_3: {
        1: true,
        2: true
    },
    allow_4_4: {
        1: false,
        2: true
    },
    allow_6: {
        1: false,
        2: true
    }
});