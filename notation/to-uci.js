import {isCastling, promotionPiece} from "../variants/chess.js"

let pieceNames = {knight: "n", bishop: "b", rook: "r", queen: "q"}

let isChess960 = move =>
{
	if (!isCastling(move)) return false
	if (move.before.storage.geometry.info.width !== 8) return true
	if (move.before.storage.geometry.info.height !== 8) return true
	if (move.movements[0].from.x !== 4) return true
	if (move.movements[1].from.y === 0) return false
	if (move.movements[1].from.y === 7) return false
	return true
}

export let fromMove = (move, chess960 = false) =>
{
	chess960 = Boolean(chess960) || isChess960(move)
	
	let from = move.movements[0].from.name
	let to = move.movements[0].to.name
	
	if (chess960 && isCastling(move))
		to = move.movements[1].from.name
	
	let promotion = ""
	let piece = promotionPiece(move)
	if (piece) promotion = pieceNames[piece.type]
	
	return from + to + promotion
}
