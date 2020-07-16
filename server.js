const express = require("express");
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const port = process.env.PORT || 3000;

express.static(__dirname + "/");
app.use(express.static("public"))
app.get("/", (req, res)=> res.sendFile(__dirname + "/index.html"));
const colors = ["white", "black"]
io.on('connect', (client) => {
    client.on("move", (data)=> {
        client.to(data.room).emit("move", data.move)
        io.in(data.room).emit("turn", {color:colors.filter(e=>e!=data.color)[0]})
    });
    client.on("status", (data) => io.in(data.room).emit("status", data));
    client.on("message", (data) => io.in(data.room).emit("message", data));
    client.on("join", (data)=>{
        if(!io.sockets.adapter.rooms[data.room] || io.sockets.adapter.rooms[data.room].length < 2)
            client.join(data.room);
        client.emit("setColor", {
            color: colors[io.sockets.adapter.rooms[data.room].length-1]
        });
        console.log(`Player ${io.sockets.adapter.rooms[data.room].length} joined room ${data.room}!`);
    });
});


server.listen(port, ()=>console.log(`~ server running on port: ${port}`));