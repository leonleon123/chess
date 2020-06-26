export const pieceNames = {
    PAWN: "pawn",
    ROOK: "rook", 
    KNIGHT: "knight", 
    BISHOP: "bishop", 
    QUEEN: "queen",
    KING: "king"
}
export const fieldColors = {
    BLACK: "black",
    WHITE: "white",
    GREEN: "green",
    SELECTED: "yellow"
}
export const magicFieldNumbers = {
    BLACK: 0,
    WHITE: 1,
    GREEN: 2,
    SELECTED: 3
}
export const pieceOrder = [    
    pieceNames.ROOK,
    pieceNames.KNIGHT,
    pieceNames.BISHOP,
    pieceNames.KING,
    pieceNames.QUEEN,
    pieceNames.BISHOP,
    pieceNames.KNIGHT,
    pieceNames.ROOK
]
export const status = {
    DISCONNECTED: "red",
    CONNECTED: "orange",
    READY: "limegreen"
}
export const rotation = ["forward", "backward"]