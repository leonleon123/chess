const express = require("express");
express.static(__dirname + "/");
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const colors = ["white", "black"]
app.use(express.static("public"))
app.get("/", (req, res)=>{
    res.sendFile(__dirname + "/index.html");
});
app.listen(4200);
io.on('connect', (client) => { 
    client.on("receive", (data)=>{
        client.to(data.room).emit("move", data.move);
    });
    client.on("join", (data)=>{
        if(io.sockets.adapter.rooms[data.room]){
            let len = io.sockets.adapter.rooms[data.room].length;
            if(len < 2){
                client.join(data.room);
            }
            
            len = io.sockets.adapter.rooms[data.room].length;
            console.log(`Player ${len} joined room ${data.room}!`);
        }else{
            client.join(data.room);
            let len = io.sockets.adapter.rooms[data.room].length;
            console.log(`Player ${len} joined room ${data.room}!`);
        }
        client.emit("setColor", {color:colors[io.sockets.adapter.rooms[data.room].length-1]});
    });
});
server.listen(3000);