const express = require('express');
const app = express();
const SocketIO = require('socket.io');

const path = require('path');

const port = 80;
app.set('view engine', 'pug');
app.use('/static',express.static(path.join(__dirname, 'static')));

app.get('/',(req,res)=>{
    res.render('lobby');
});
app.get('/match', (req, res) => {
    res.render('match');
});

const server = app.listen(port, ()=>{
    console.log(`Server is running on port ${port}`);
});
const io = SocketIO(server, {path: '/socket.io'});


let room_num = 1;
let match_queue = [];
let match_room = {};
let intervals = {};
const rules = {
    renju: {
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
    }
};

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
    constructor(rowCount, columnCount, rule) {
        this.rowCount = rowCount;
        this.columnCount = columnCount;

        this.board = new Board(this, 15, 15);

        this.turn = 1; // 1 : black, 2 : white
        this.gameOver = false;
        this.gameOverReason = {
            omok: 0,
            draw: 1,
            banned: 2
        }
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
    }

    changeTurn() {
        if (this.turn == 1) {
            this.turn = 2;
        } else {
            this.turn = 1;
        }
    }

    finishGame() {
        this.gameOver = true;
        this.winner = this.turn;
    }
    put(row, column) {
        if (this.board.check_five(row, column, this.turn, this.rule[this.turn])) {
            this.board.put(row, column);
            this.count++;

            this.put_list.push({ row: row, column: column });
            this.lastPut = { row: row, column: column };


            this.finishGame(this.turn, this.gameOverReason.omok);
        } else if (this.board.board[row][column] == 0) {

            this.board.put(row, column);
            this.count++;

            this.put_list.push({ row: row, column: column });
            this.lastPut = { row: row, column: column };
            this.changeTurn();
            if(this.board.isBanned(row, column)){
                this.finishGame(this.turn, this.gameOverReason.banned);
            }
            this.board.ban_cells(this.rule[this.turn], this.turn);


            if(this.count>=this.columnCount*this.rowCount){
                this.finishGame(this.turn, this.gameOverReason.draw);
            }
        }
    }
}



io.on('connection', (socket)=>{
    console.log('New user connected');
    socket.emit('message','Hello!');
    socket.on('disconnecting',()=>{
    });
    socket.on('disconnect',()=>{
        console.log('user disconnected');
        if(socket.opponent){
            socket.opponent.emit('leave');
            socket.opponent.opponent=null;
            socket.opponent = null;
            delete match_room[socket.room_num];
        }
    
        match_queue = match_queue.filter((elem)=>{
            return elem!=socket;
        });
        console.log(match_queue.length);
    });
    socket.on('reconnection',()=>{
        if(socket.room_num in intervals){
            clearInterval(intervals[socket.room_num]);
        }
        socket.emit('board-sync',match_room[socket.room_num].put_list);
    });

    socket.on('message',(data)=>{
        console.log(data);
    })

    socket.on('match',(data)=>{
        if(data && data.name){
            console.log(data);
            socket.userinfo = {
                name: data.name
            };
            // add socket to match queue
            match_queue.push(socket);
            // if there is another user in the queue, match them
            if(match_queue.length>1){
                const player1 = match_queue.shift();
                const player2 = match_queue.shift();

                player1.opponent = player2;
                player2.opponent = player1;
                player1.room_num = room_num;
                player2.room_num = room_num;
                match_room[room_num]= new Game(15, 15, rules.renju);
                room_num++;
                if(Math.random()>=0.5){
                    player1.turn = 1;
                    player2.turn = 2;
                }
                else{
                    player1.turn = 2;
                    player2.turn = 1;
                }
                player1.emit('match',{
                    opponent:player2.userinfo,
                    rule: rules.renju,
                    turn: player1.turn
                });
                player2.emit('match',{
                    opponent:player1.userinfo,
                    rule: rules.renju,
                    turn: player2.turn
                });
            }
        }
    });

    socket.on('put',(data)=>{

        if('opponent' in socket && 'room_num' in socket && socket.opponent && socket.room_num){

            if(match_room[socket.room_num]){
                if(data && data.row && data.column){
                    if(match_room[socket.room_num].turn == socket.turn){
                        const put_data = {
                            row: data.row, 
                            column: data.column
                        };
                        match_room[socket.room_num].put(data.row, data.column);
                        socket.opponent.emit('put',put_data);
                    }
                }
            }
        }
    })

})
