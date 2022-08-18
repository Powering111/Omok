class Board {
    constructor(gameObj, boardElement, rowCount, columnCount) {
        this.board = []; // data. 0 : empty, 1 : Black, 2 : White
        // count starts from 0.
        this.rowCount = rowCount;
        this.columnCount = columnCount;

        this.gameObj = gameObj;
        this.boardElement = boardElement; // element.
        this.boardElement.innerHTML = ''; // clear the board.
        this.boardElement.dataset.turn = 1;
        this.putbutton = document.getElementById('put-button');

        this.banned_list = []; // temporary list of banned cells

        this.rowElements = []; // element. HTML elements of the rows
        this.cellElements = []; // element. HTML elements of the cells (2D Array)
        for (let i = 0; i < this.rowCount; i++) {
            this.board.push([]);
            this.rowElements.push(document.createElement("div"));
            this.rowElements[i].classList.add('board-row');
            this.cellElements.push([]);
            for (let j = 0; j < this.columnCount; j++) {
                this.board[i].push(0); // set data to empty
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
        for (let i = 0; i < this.rowCount; i++) {
            for (let j = 0; j < this.columnCount; j++) {
                if (this.board[i][j] == 1) { // black cell
                    this.cellElements[i][j].className = 'board-cell cell-black';
                } else if (this.board[i][j] == 2) { // white cell
                    this.cellElements[i][j].className = 'board-cell cell-white';
                } else if (this.board[i][j] == 3) {
                    this.cellElements[i][j].className = 'board-cell cell-black cell-lastselected';
                } else {
                    this.cellElements[i][j].className = 'board-cell cell-empty';
                }
            }
        }

        if ('selected' in this && this.selected != null) {
            this.cellElements[this.selected.row][this.selected.column].classList.add('cell-selected');
        }
        if ('lastSelected' in this && this.lastSelected != null) {
            this.cellElements[this.lastSelected.row][this.lastSelected.column].classList.add('cell-lastselected');
        }
    }

    getCell(row, column) {
        return this.board[row][column];
    }

    setCell(row, column, value) {
        if (this.board[row][column] == 0) {
            this.lastSelected = { row: row, column: column };

            this.board[row][column] = value;

            this.animatePut(this.cellElements[row][column]);

            this.draw();
        }
    }

    select(row, column) {
        if (this.board[row][column] == 0) {
            this.selected = { row: row, column: column };
            this.draw();
        }
    }

    put(row, column) {
        this.selected = null;
        this.setCell(row, column, this.gameObj.turn);
        this.gameObj.put_list.push({ row: row, column: column });
        this.gameObj.check(row, column);
        this.gameObj.count++;

        this.banned_list = [];
    }

    putbuttonclickListener() {
        if ('selected' in this) {
            this.put(this.selected.row, this.selected.column);
        }
    }

    boardclickListener(event) {
        if (!event.target.classList.contains('board-cell')) {
            return;
        }
        let row = Number(event.target.dataset.row);
        let column = Number(event.target.dataset.column);

        if (row != null && column != null && this.board[row][column] == 0) {
            this.select(row, column);
        }
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

    check_five(row, column, turn, allow_6) {
        console.log('checking five of ', row, column, turn, allow_6);
    }

    ban_cells(ban_3_3, ban_4_3, ban_4_4) {
        console.log(ban_3_3, ban_4_3, ban_4_4)
    }
}

class Game {
    constructor(boardElement) {
        this.board = new Board(this, boardElement, 15, 15);
        this.turn = 1; // 1 : black, 2 : white
        this.gameOver = false;
        this.put_list = []; // list of put positions.
        this.count = 0;
        this.rule = {
            black_3_3: false,
            black_4_3: true,
            black_4_4: false,
            black_6: false,
            white_3_3: true,
            white_4_3: true,
            white_4_4: true,
            white_6: true
        };
    }

    undo(count = 1) {
        for (let i = 0; i < count; i++) {
            this.put_list.pop();
            this.count--;
        }
        this.board.setWholeBoard(this.put_list);
        this.turn = this.count % 2 + 1;
        this.board.boardElement.dataset.turn = this.turn;
    }

    check(row, column) {

        // TODO : check some stuffs

        // check five
        if (this.turn == 1) {
            const fiveCount = this.board.check_five(row, column, this.turn, this.rule.black_6);
            if (fiveCount) {
                this.gameOver = true;
                this.winner = this.turn;
            }

            this.board.ban_cells(!this.rule.white_3_3, !this.rule.white_4_3, !this.rule.white_4_4);
        } else if (this.turn == 2) {
            const fiveCount = this.board.check_five(row, column, this.turn, this.rule.white_6);
            if (fiveCount) {
                this.gameOver = true;
                this.winner = this.turn;
            }


            this.board.ban_cells(!this.rule.black_3_3, !this.rule.black_4_3, !this.rule.black_4_4);

        }


        this.changeTurn();
        return true;
    }

    changeTurn() {
        if (this.turn == 1) {
            this.turn = 2;
        } else {
            this.turn = 1;
        }
        this.board.boardElement.dataset.turn = this.turn;
    }


}

const game = new Game(document.getElementById('board'));