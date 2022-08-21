const socket = io.connect('/',{
    path:'/socket.io'
});

socket.on('connect',()=>{
    console.log('connected');

    socket.emit('match', {
        name:localStorage.getItem('name')
    });
});

socket.on('message',(data)=>{
    console.log(data);
});

let game;
// when matched to another user
socket.on('match',(data)=>{
    console.log(data);
    const opponent = data.opponent;
    game = new Game(document.getElementById('board'), 15, 15, data.rule, data.turn);
    document.getElementById('loading-container').hidden=true;
    document.getElementById('container').hidden=false;
    document.getElementById('opponent-name').innerText=opponent.name;

});

socket.on('put',(data)=>{
    console.log(data);
    if(game.turn!=game.myTurn){
        game.put(data.row, data.column);
    }
});

function send_put(row, column){
    socket.emit('put',{
        row: row,
        column: column
    });
}
