const express = require("express");
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const colors = ["white", "black"];

express.static(__dirname + "/");
app.use(express.static("public"))
app.get("/", (req, res)=> res.sendFile(__dirname + "/index.html"));

io.on('connect', (client) => { 
    client.on("receive", (data)=> client.to(data.room).emit("move", data.move) );
    client.on("join", (data)=>{
        if(io.sockets.adapter.rooms[data.room]){
            if(io.sockets.adapter.rooms[data.room].length < 2){
                client.join(data.room);
                io.in(data.room).emit("start", {start:true});
            }
        }else 
            client.join(data.room);
        console.log(`Player ${io.sockets.adapter.rooms[data.room].length} joined room ${data.room}!`);
        client.emit("setColor", {color:colors[io.sockets.adapter.rooms[data.room].length-1]});
    });
});

app.listen(4200);
server.listen(3000);