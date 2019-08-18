const express = require("express");
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

express.static(__dirname + "/");
app.use(express.static("public"))
app.get("/", (req, res)=> res.sendFile(__dirname + "/index.html"));

io.on('connect', (client) => { 
    client.on("receive", (data)=> client.to(data.room).emit("move", data.move) );
    client.on("status", (data)=> io.in(data.room).emit("status", data));
    client.on("join", (data)=>{
        if(!io.sockets.adapter.rooms[data.room] || io.sockets.adapter.rooms[data.room].length < 2)
            client.join(data.room);
        client.emit("setColor", {
            color:["white", "black"][io.sockets.adapter.rooms[data.room].length-1]
        });
        console.log(`Player ${io.sockets.adapter.rooms[data.room].length} joined room ${data.room}!`);
    });
    
});

app.listen(80);
server.listen(3000);