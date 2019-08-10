import {
	pieceNames, 
	fieldColors, 
	magicFieldNumbers, 
	pieceOrder} 
from "./constants.js";
export default class Piece{
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
		/*	[{dir: true, rev: false},
			{dir: false, rev: false},
			{dir: true, rev: true},
			{dir: false, rev: true}] */
		// dir represents direction, rev represents reversed and both of them are used
		// to go over all the tiles. This piece of code may look a bit odd but that's
		// what I came up with during refactoring to cut redundant, repeating code
		// and number of lines
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