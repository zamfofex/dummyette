let pieceNames = {knight: "n", bishop: "b", rook: "r", queen: "q"}

let isChess960 = move =>
{
	if (!move.rook) return false
	if (move.before.width !== 8) return true
	if (move.before.height !== 8) return true
	if (move.from.x !== 4) return true
	if (move.rook.from.y === 0) return false
	if (move.rook.from.y === 7) return false
	return true
}

export let fromMove = (move, {chess960 = false} = {}) =>
{
	chess960 = Boolean(chess960) || isChess960(move)
	
	let from = move.from.name
	let to = move.to.name
	
	if (chess960 && move.rook)
		to = move.rook.from.name
	
	let piece = move.before.at(move.from)
	let promotionPiece = move.play().at(move.to)
	
	let promotion = ""
	if (piece !== promotionPiece) promotion = pieceNames[promotionPiece.type]
	
	return from + to + promotion
}
