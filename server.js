const express = require("express");
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const axios = require("axios");
const port = process.env.port || 3000;
let ip;
axios.get("https://api.ipify.org").then((response)=>{
    ip = response.data;
    console.log(`~ server ip: ${ip}`);
}).catch(err=>console.error(err));

express.static(__dirname + "/");
app.use(express.static("public"))
app.get("/", (req, res)=> res.sendFile(__dirname + "/index.html"));
app.get("/ip", (req, res)=>{
    res.send(JSON.stringify({
        ip: ip,
        port: port
    }));
});

io.on('connect', (client) => { 
    client.on("receive", (data)=> client.to(data.room).emit("move", data.move) );
    client.on("status", (data)=> io.in(data.room).emit("status", data));
    client.on("message", (data)=> io.in(data.room).emit("message", data));
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
server.listen(port, ()=>console.log(`~ socket server running on port: ${port}`));