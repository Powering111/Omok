class Board{
    constructor(gameObj, boardElement, rowCount, columnCount) {
        this.board = [];  // data. 0 : empty, 1 : Black, 2 : White

        // count starts from 0.
        this.rowCount = rowCount;
        this.columnCount = columnCount;

        this.gameObj = gameObj;
        this.boardElement = boardElement; // element.
        this.boardElement.innerHTML = ''; // clear the board.

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

        this.boardElement.addEventListener('mousedown', (event)=>{this.clickListener(event)});
    }

    draw() {
        for (let i = 0; i < this.rowCount; i++) {
            for (let j = 0; j < this.columnCount; j++) {
                if (this.board[i][j] == 1) { // black cell
                    this.cellElements[i][j].classList.remove('cell-empty');
                    this.cellElements[i][j].classList.add('cell-black');
                    this.cellElements[i][j].classList.remove('cell-white');
                }
                else if (this.board[i][j] == 2) { // white cell
                    this.cellElements[i][j].classList.remove('cell-empty');
                    this.cellElements[i][j].classList.remove('cell-black');
                    this.cellElements[i][j].classList.add('cell-white');
                }
                else{
                    this.cellElements[i][j].classList.add('cell-empty');
                    this.cellElements[i][j].classList.remove('cell-black');
                    this.cellElements[i][j].classList.remove('cell-white');
                }
            }
        }

    }

    getCell(row, column) {
        return this.board[row][column];
    }

    setCell(row, column, value) {
        this.board[row][column] = value;
        this.draw();
    }

    clickListener(event){
        let row = event.target.getAttribute('data-row');
        let column = event.target.getAttribute('data-column');
        if (row != null && column != null && this.board[row][column] == 0) {
            this.setCell(row, column, this.gameObj.turn);
            this.gameObj.check(row,column);
        }
    }
}

class Game{
    constructor(boardElement){
        this.board = new Board(this, boardElement, 15, 15);
        this.turn = 1; // 1 : black, 2 : white
        this.gameOver = false;
    }



    check(row, column){

        // TODO : check some stuffs

        this.changeTurn();
        return true;
    }

    changeTurn(){
        if (this.turn == 1) {
            this.turn = 2;
        }
        else{
            this.turn = 1;
        }
    }

}

const game = new Game(document.getElementById('board'));