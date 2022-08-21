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

        this.temp_board = JSON.parse(JSON.stringify(this.board));
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
        this.board[row][column] = this.gameObj.turn;
        this.temp_board[row][column] = this.gameObj.turn;
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
        this.temp_board = JSON.parse(JSON.stringify(this.board));
    }

    // checks if the cell is in the board
    inBoard(row, column) {
        return row >= 0 && row < this.rowCount && column >= 0 && column < this.columnCount;
    }

    check_6(row, column, turn) {
        if (!this.inBoard(row, column) || this.temp_board[row][column] != 0) {
            return false;
        }
        for (let direction of directions) {
            if (this.check_six_onedir(row, column, turn, direction)) {
                return true;
            }
        }
    }
    check_six_onedir(row, column, turn, direction) {
        if (!this.inBoard(row, column) || this.temp_board[row][column] != 0) {
            return false;
        }

        this.temp_board[row][column] = turn;
        let cnt = -1;
        let r = row;
        let c = column;
        while (this.inBoard(r, c) && this.temp_board[r][c] == turn) {
            r += direction.row;
            c += direction.column;
            cnt++;
        }

        r = row;
        c = column;
        while (this.inBoard(r, c) && this.temp_board[r][c] == turn) {
            r -= direction.row;
            c -= direction.column;
            cnt++;
        }
        this.temp_board[row][column] = 0;

        if (cnt >= 6) return true;
    }

    // check five if you put a stone on the board
    check_five(row, column, turn, allow) {
        if (!this.inBoard(row, column) || this.temp_board[row][column] != 0) {
            return false;
        }

        for (let direction of directions) {
            if (this.check_five_onedir(row, column, turn, allow, direction)) {
                return true;
            }
        }
        return false;
    }
    check_five_onedir(row, column, turn, allow, direction) {
        if (!this.inBoard(row, column) || this.temp_board[row][column] != 0) {
            return false;
        }

        this.temp_board[row][column] = turn;
        let cnt = -1;
        let r = row;
        let c = column;
        while (this.inBoard(r, c) && this.temp_board[r][c] == turn) {
            r += direction.row;
            c += direction.column;
            cnt++;
        }

        r = row;
        c = column;
        while (this.inBoard(r, c) && this.temp_board[r][c] == turn) {
            r -= direction.row;
            c -= direction.column;
            cnt++;
        }
        this.temp_board[row][column] = 0;

        if (cnt == 5) return true;
        if (allow.allow_6 && cnt >= 6) return true;
        return false;
    }

    // check four if you put a stone on the board
    check_four(row, column, turn, allow) {

        if (!this.inBoard(row, column) || this.temp_board[row][column] != 0) {
            return false;
        }
        let cnt = 0;
        for (let direction of directions) {
            if (this.check_four_onedir(row, column, turn, allow, direction)) {
                cnt++;
            }
        }
        return cnt;
    }
    check_four_onedir(row, column, turn, allow, direction) {
        if (!this.inBoard(row, column) || this.temp_board[row][column] != 0) {
            return false;
        }
        this.temp_board[row][column] = turn;

        let blank1, blank2; // position of blank cells

        let cnt = -1;
        let r = row;
        let c = column;
        while (this.inBoard(r, c) && this.temp_board[r][c] == turn) {
            r += direction.row;
            c += direction.column;
            cnt++;
        }
        blank1 = { row: r, column: c };

        r = row;
        c = column;
        while (this.inBoard(r, c) && this.temp_board[r][c] == turn) {
            r -= direction.row;
            c -= direction.column;
            cnt++;
        }
        blank2 = { row: r, column: c };


        if (this.check_five_onedir(blank1.row, blank1.column, turn, allow, direction)) {
            this.temp_board[row][column] = 0;
            return true;
        }
        if (this.check_five_onedir(blank2.row, blank2.column, turn, allow, direction)) {
            this.temp_board[row][column] = 0;
            return true;
        }
        this.temp_board[row][column] = 0;
        return false;

    }

    check_open_four_onedir(row, column, turn, allow, direction) {
        if (!this.inBoard(row, column) || this.temp_board[row][column] != 0) {
            return false;
        }
        this.temp_board[row][column] = turn;

        let blank1, blank2; // position of blank cells

        let cnt = -1;
        let r = row;
        let c = column;
        while (this.inBoard(r, c) && this.temp_board[r][c] == turn) {
            r += direction.row;
            c += direction.column;
            cnt++;
        }
        blank1 = { row: r, column: c };

        r = row;
        c = column;
        while (this.inBoard(r, c) && this.temp_board[r][c] == turn) {
            r -= direction.row;
            c -= direction.column;
            cnt++;
        }
        blank2 = { row: r, column: c };

        if (cnt == 4 &&
            this.check_five_onedir(blank1.row, blank1.column, turn, allow, direction) &&
            this.check_five_onedir(blank2.row, blank2.column, turn, allow, direction)) {
            this.temp_board[row][column] = 0;
            return true;
        } else {
            this.temp_board[row][column] = 0;
            return false;
        }
    }


    check_three(row, column, turn, allow) {
        if (!this.inBoard(row, column) || this.temp_board[row][column] != 0) {
            return false;
        }
        let cnt = 0;
        for (let direction of directions) {
            if (this.check_three_onedir(row, column, turn, allow, direction)) {
                cnt++;
            }
        }
        return cnt;
    }
    check_three_onedir(row, column, turn, allow, direction) {
        if (!this.inBoard(row, column) || this.temp_board[row][column] != 0) {
            return false;
        }
        this.temp_board[row][column] = turn;
        let blank1, blank2; // position of blank cells

        let cnt = -1;
        let r = row;
        let c = column;
        while (this.inBoard(r, c) && this.temp_board[r][c] == turn) {
            r += direction.row;
            c += direction.column;
            cnt++;
        }
        blank1 = { row: r, column: c };

        r = row;
        c = column;
        while (this.inBoard(r, c) && this.temp_board[r][c] == turn) {
            r -= direction.row;
            c -= direction.column;
            cnt++;
        }
        blank2 = { row: r, column: c };
        if (this.check_open_four_onedir(blank1.row, blank1.column, turn, allow, direction) &&
            !this.check_banned(blank1.row, blank1.column, turn, allow)) {
            this.temp_board[row][column] = 0;
            return true;
        }
        if (this.check_open_four_onedir(blank2.row, blank2.column, turn, allow, direction) &&
            !this.check_banned(blank1.row, blank1.column, turn, allow)) {
            this.temp_board[row][column] = 0;
            return true;
        }

        this.temp_board[row][column] = 0;

        return false;
    }

    check_3_3(row, column, turn, allow) {
        if (this.check_three(row, column, turn, allow) >= 2) {
            return true;
        } else {
            return false;
        }
    }
    check_4_4(row, column, turn, allow) {
        if (this.check_four(row, column, turn, allow) >= 2) {
            return true;
        } else {
            return false;
        }
    }
    check_4_3(row, column, turn, allow) {
        if (this.check_four(row, column, turn, allow) >= 1 &&
            this.check_three(row, column, turn, allow)) {
            return true;
        } else {
            return false;
        }
    }

    check_banned(row, column, turn, allow) {
        for (let banned_cell of this.banned_list) {
            if (banned_cell.row == row && banned_cell.column == column) {
                return true;
            }
        }
        if ((!allow.allow_3_3 && this.check_3_3(row, column, turn, allow)) ||
            (!allow.allow_4_3 && this.check_4_3(row, column, turn, allow)) ||
            (!allow.allow_4_4 && this.check_4_4(row, column, turn, allow)) ||
            (!allow.allow_6 && this.check_6(row, column, turn, allow))) {
            return true;
        }
        return false;
    }
    ban_cells(allow, turn) {

        this.banned_list = [];
        for (let i = 0; i < this.rowCount; i++) {
            for (let j = 0; j < this.columnCount; j++) {
                if (this.board[i][j] == 0) {
                    if (this.check_banned(i, j, turn, allow)) {
                        this.banned_list.push({ row: i, column: j });
                    }
                }
            }
        }
        //this.banned_list.push({ row: 0, column: 0 });
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
        this.UI.draw();
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
        if (this.board.check_five(row, column, this.turn, this.rule[this.turn])) {
            this.board.put(row, column);
            this.count++;

            this.put_list.push({ row: row, column: column });
            this.lastPut = { row: row, column: column };

            // this.board.ban_cells(this.rule[this.turn], this.turn);
            //this.changeTurn();
            this.UI.put(row, column);

            this.finishGame(this.turn);
        } else if (this.board.board[row][column] == 0 && !this.board.isBanned(row, column)) {

            this.board.put(row, column);
            this.count++;

            this.put_list.push({ row: row, column: column });
            this.lastPut = { row: row, column: column };

            this.changeTurn();
            this.board.ban_cells(this.rule[this.turn], this.turn);
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
    1: {
        allow_3_3: false,
        allow_4_3: true,
        allow_4_4: false,
        allow_6: false
    },
    2: {
        allow_3_3: true,
        allow_4_3: true,
        allow_4_4: true,
        allow_6: true
    }
});