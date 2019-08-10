const socket = io("http://93.103.87.217:3000");
var color = "white";
var roomName = "";
var start = false;
socket.on("move", (data)=> app.movePiece(...data, false));
socket.on("start", (data)=> start=data.start);
socket.on("setColor", (data)=>{
	color = data.color;
	document.getElementById("color").innerHTML = color;
});
socket.open();
// Constants are here so there is no hardcoded values in the code
const pieceNames = {
	PAWN: "pawn",
	ROOK: "rook", 
	KNIGHT: "knight", 
	BISHOP: "bishop", 
	QUEEN: "queen",
	KING: "king"
};
const fieldColors = {
	BLACK: "black",
	WHITE: "white",
	GREEN: "green",
	SELECTED: "yellow"
}
const magicFieldNumbers = {
	BLACK: 0,
	WHITE: 1,
	GREEN: 2,
	SELECTED: 3
}
const pieceOrder = [	
	pieceNames.ROOK,
	pieceNames.KNIGHT,
	pieceNames.BISHOP,
	pieceNames.QUEEN,
	pieceNames.KING,
	pieceNames.BISHOP,
	pieceNames.KNIGHT,
	pieceNames.ROOK
]
class Piece{
	constructor(type, color, position){
		this.type = type;
		this.color = color;
		this.position = position;
	}
	getClass(small){
		return `fas fa-chess-${this.type} ${this.color} ` + (small ?  "" : "fa-2x");
	}
	isEmpty(){
		return this.type.length == 0;
	}
	newPosition(pos){
		this.position = pos;
		return this;
	}
	check(tmpPos){
		return tmpPos[0]>=0 && tmpPos[0]<8 && tmpPos[1]>=0 && tmpPos[1]<8;
	}
	horizontalVertical(pieces){
		// This just goes in every direction and checks for available tiles
		let tmp = [];
		let positions = [0,1,2,3]
				.map(e=>e.toString(2).padStart(2, "0").split("").map(e=>parseInt(e)))
				.map(e=>{return {dir:e[0], rev:e[1]}});
		// dir represents direction, rev represents reversed and both of them are used
		// to go over all the tiles. This piece of code may look a bit odd but that's
		// what I came up with during refactoring to cut redundant, repeating code
		// and number of lines
		// {dir: true, rev: false}
		// {dir: false, rev: false}
		// {dir: true, rev: true}
		// {dir: false, rev: true}
		for(let a of positions){
			for(let i = (a.rev ? this.position[0] : this.position[1]); a.dir ? i < 8 : i >= 0; a.dir ? i++ : i--){
				if(i != (a.rev ? this.position[0] : this.position[1])){
					if((a.rev ? pieces[i][this.position[1]] : pieces[this.position[0]][i]).color != this.color)
						tmp.push(a.rev ? [i, this.position[1]] : [this.position[0], i]);
					if(! (a.rev ? pieces[i][this.position[1]] : pieces[this.position[0]][i]).isEmpty()) break;
				}
			}
		}
		return tmp;
	}
	diagonal(pieces){
		let tmp = [];
		let moveVectors = [[1,1], [1,-1], [-1,-1], [-1,1]];
		for(let a of moveVectors){
			let tempPosition = this.position.slice();
			tempPosition = tempPosition.map((e,i)=>e + a[i]);
			while(this.check(tempPosition) && pieces[tempPosition[0]][tempPosition[1]].isEmpty()){
				tmp.push(tempPosition.slice());
				tempPosition = tempPosition.map((e,i)=>e+a[i]);
			}
			if(this.check(tempPosition) && pieces[tempPosition[0]][tempPosition[1]].color != this.color)
					tmp.push(tempPosition.slice());
		}
		return tmp.filter(e=> this.check(e) && pieces[e[0]][e[1]].color!=this.color);
	}
	getAvailable(pieces){
		// Direction of the piece, which depends on the color. It is later used as a multiplier by 1 or -1 
		// to determine up and down in the field matrix
		let d = this.color == fieldColors.WHITE ? 1 : -1;
		let tmp = [];
		switch(this.type){
			case pieceNames.PAWN:
				// Pawns can always move only forward and eat diagonally, thats why by default available tile is one forward
				// or in case someone is there the array with available tiles is empty. Then it checks if the pawn is in the 
				// starting position and grants it the ability to move 2 tiles.
				// tmp is array of available tiles to move to
				if(pieces[this.position[0]+d][this.position[1]].isEmpty()) 
					tmp = [[this.position[0]+d, this.position[1]]];
				if(this.position[0] == (this.color == fieldColors.WHITE ? 1 : 6) && 
					pieces[tmp[0][0]][tmp[0][1]].isEmpty() && 
					pieces[this.position[0]+(2*d)][this.position[1]].isEmpty())
						tmp.push([this.position[0]+(2*d), this.position[1]]);
				// This is setting up the two possible eating positions of a pawn
				let eatTmp = [
					[this.position[0]+d, this.position[1]+1], 
					[this.position[0]+d, this.position[1]-1]
				]
				// Here I filter out the edge cases
				.filter(e=> this.check(e) && pieces[e[0]][e[1]].color!=this.color)
				// And go through both tiles and check if there are any enemy pieces
				for(let a of eatTmp)
					if(!pieces[a[0]][a[1]].isEmpty())
						// If there are those are pushed to the list of available tiles
						tmp.push(a);
				return tmp;
			case pieceNames.ROOK:
				return this.horizontalVertical(pieces);
			case pieceNames.KNIGHT:
				// First I took an array of position vectors to which knight can jump
				// then I mapped those vectors to the actual position relative to the
				// current position of the piece and then filtered out the edge cases.
				tmp = [[-2,1],[2,1],[-2,-1],[2,-1],[1,-2],[1,2],[-1,-2],[-1,2]]
					.map(e=>[this.position[0]+e[0], this.position[1]+e[1]])
					.filter(e=> this.check(e) && pieces[e[0]][e[1]].color!=this.color);
				return tmp;
			case pieceNames.BISHOP:
				return this.diagonal(pieces);
			case pieceNames.QUEEN:
				// Queen uses the functions for rook and bishop ( horizontalVertical() and diagonal() ) combined
				return [...this.diagonal(pieces), ...this.horizontalVertical(pieces)];
			case pieceNames.KING:
				for(let i = this.position[0]-1; i <= this.position[0]+1; i++)
					for(let j = this.position[1]-1; j <= this.position[1]+1; j++)
						tmp.push([i,j])
				return tmp.filter(e=>this.check(e) && pieces[e[0]][e[1]].color!=this.color)
		}
	}
}
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
			if(sendToServer) socket.emit("receive", {
				move:[x1,y1,x2,y2],
				room:roomName
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
			if(!this.pieces[x][y].isEmpty() && this.pieces[x][y].color == color && start){
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
		roomName = document.getElementById("inputText").value;
		document.getElementById("roomName").innerHTML = roomName;
		
		socket.emit("join", {room:roomName});
		document.getElementById("ui").classList.add("hidden");
	});
});