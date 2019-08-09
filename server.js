const express = require("express");
express.static(__dirname + "/");
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
// let players = {
//     white: null,
//     black: null
// }
app.use(express.static("public"))
app.get("/", (req, res)=>{
    res.sendFile(__dirname + "/index.html");
});
app.listen(4200);
io.on('connection', (client) => { 
    client.on("receive", (data)=>{
        client.to(data.room).emit("move", data.move);
    });
    client.on("join", (data)=>{
        if(io.sockets.adapter.rooms[data.room]){
            let len = io.sockets.adapter.rooms[data.room].length;
            if(len < 2) client.join(data.room);
            console.log(`Player ${io.sockets.adapter.rooms[data.room].length} joined!`);
        }else{
            client.join(data.room);
            console.log(`Player ${io.sockets.adapter.rooms[data.room].length} joined!`);
        }
        
    });
});
server.listen(3000);