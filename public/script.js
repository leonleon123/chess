import Piece from "./piece.js";
import {
	pieceNames, 
	fieldColors, 
	magicFieldNumbers, 
	pieceOrder,
	status
} 
from "./constants.js";
let socket;
axios.get("/ip").then((res)=>{
	socket = io(`http://${res.data.ip}:${res.data.port}`);
	socket.on("move", (data)=> app.movePiece(...data, false));
	socket.on("setColor", (data)=> {
		app.color = data.color;
		socket.emit("status", {
			room: app.roomName,
			color: app.color,
			status: status.CONNECTED
		});
	});
	socket.on("status", (data)=>{
		app.status[data.color] = (data.status == status.READY);
		document.getElementById(data.color).style.backgroundColor = data.status;
		if(data.color == fieldColors.BLACK && data.status == status.CONNECTED) 
			document.getElementById(fieldColors.WHITE).style.backgroundColor = data.status;
	});
	socket.open();
});
let app = new Vue({
	el: "#board",
	data: {
		// Just so we have a playing field rendered in checker pattern, probably not most elegant but whatever
		field: new Array(8).fill([]).map((elm,idx)=>new Array(8).fill().map((e, i) => ((idx%2)+i)%2)),
		// Possible colors of tiles
		tileColors: Object.entries(fieldColors).map(e=>e[1]),
		// Starting positions of all pieces at the beginning of the round
		pieces: [
			pieceOrder.map(			(e,i)=>  new Piece(e, fieldColors.WHITE, [0, i])),
			new Array(8).fill().map((e,i)=>	new Piece(pieceNames.PAWN, fieldColors.WHITE, [1, i])),
			new Array(8).fill().map((e,i)=>	new Piece("", "", [2, i])),
			new Array(8).fill().map((e,i)=>	new Piece("", "", [3, i])),
			new Array(8).fill().map((e,i)=>	new Piece("", "", [4, i])),
			new Array(8).fill().map((e,i)=>	new Piece("", "", [5, i])),
			new Array(8).fill().map((e,i)=>	new Piece(pieceNames.PAWN, fieldColors.BLACK, [6, i])),
			pieceOrder.map(			(e,i)=>  new Piece(e, fieldColors.BLACK, [7, i]))
		],
		selectedLocation: [0,0],
		eatenPieces:{
			white: new Array(16).fill(new Piece("", "", [0,0])),
			black: new Array(16).fill(new Piece("", "", [0,0])),
			count: 0
		},
		color: "",
		roomName:"",
		status: {
			white: false,
			black: false
		}
	},
	methods:{
		// Redraws the whole field like it was in the beginning; removes all available or selected tiles
		redrawField: function(){
			this.field = new Array(8).fill([]).map((elm,idx)=>new Array(8).fill().map((e, i) => ((idx%2)+i)%2));
		},
		movePiece: function(x1, y1, x2, y2, sendToServer){
			// x1, y1 are the coordinates of the origin and x2, y2 are the coordinates of the destination
			// This replaces the new position with the piece in the old one and updates the old position
			// with and empty piece.
			// TODO: what happens when a piece eats an enemy piece
			if(!this.pieces[x2][y2].isEmpty()){
				if(this.pieces[x2][y2].color == fieldColors.WHITE)
					this.$set(this.eatenPieces.white, this.eatenPieces.count, this.pieces[x2][y2]);
				else if(this.pieces[x2][y2].color == fieldColors.BLACK)
					this.$set(this.eatenPieces.black, this.eatenPieces.count, this.pieces[x2][y2]);
				this.eatenPieces.count++;
			}
			this.$set(this.pieces, x2, 
						 [...this.pieces[x2].slice(0,y2), this.pieces[x1][y1].newPosition([x2, y2]), ...this.pieces[x2].slice(y2+1,8)]);
			this.$set(this.pieces, x1, 
						 [...this.pieces[x1].slice(0,y1), new Piece("", "", [x1, y1]), ...this.pieces[x1].slice(y1+1,8)]);
			if(sendToServer) 
				socket.emit("receive", {
					move:[x1,y1,x2,y2],
					room:this.roomName
				});
		},
		handleClick: function(x, y) {
			// Checks if the clicked field is available to move the piece to
			if(this.field[x][y] == magicFieldNumbers.GREEN){
				this.movePiece(...this.selectedLocation, x, y, true);
				this.redrawField();
				return;
			}
			// Otherwise if the clicked tile has piece on it, it gets the available tiles to move to,
			// if there is no piece on selected tile it does nothing
			this.redrawField();
			if(!this.pieces[x][y].isEmpty() && 
				this.pieces[x][y].color == this.color &&
				app.status.white && app.status.black){
				// Have to do it this way otherwise Vue doesn't detect the change and doest update the DOM
				this.$set(this.field, x, [...this.field[x].slice(0,y), magicFieldNumbers.SELECTED , ...this.field[x].slice(y+1,8)]);
				// This gets the available tiles to move to calculated for the selected piece
				var available = this.pieces[x][y].getAvailable(this.pieces);
				// And goes through them and colors them green
				for(var a of available)
					this.$set(this.field, a[0], 
								 [...this.field[a[0]].slice(0,a[1]), magicFieldNumbers.GREEN , ...this.field[a[0]].slice(a[1]+1,8)])
			}
			// Updates the last selected location, used later in the movePiece() method
			this.selectedLocation = [x,y];
		}
	}
});

window.addEventListener("load", ()=>{
	document.getElementById("play").addEventListener("click", function(){
		app.roomName = document.getElementById("inputText").value;
		if(!socket) return alert("we are having some problems, try again later!")
		if(app.roomName.length == 0) return alert("room name has to be at least one letter long");
		socket.emit("join", { room:app.roomName });
		document.getElementById("ui").classList.add("hidden");
	});
	document.getElementById("ready").addEventListener("click", function(){
		socket.emit("status", {
			room: app.roomName,
			color: app.color,
			status: status.READY
		});
	});
});