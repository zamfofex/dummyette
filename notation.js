/// <reference path="./types/notation.d.ts" />
/// <reference types="./types/notation.d.ts" />

let shortNames = {pawn: "", knight: "N", bishop: "B", rook: "R", queen: "Q", king: "K"}

export let toSAN = move =>
{
	let board = move.before
	
	if (board.width > 26) return
	if (board.height > 9) return
	
	let piece = move.piece
	let captured = move.captured
	
	let resultingBoard = move.play()
	
	let checkmark = ""
	if (resultingBoard.check)
		checkmark = "+"
	if (resultingBoard.checkmate)
		checkmark = "#"
	
	if (piece.type === "king")
	{
		if (move.to.x - move.from.x === -2)
			return "O-O-O" + checkmark
		if (move.to.x - move.from.x === 2)
			return "O-O" + checkmark
	}
	
	let ambiguity
	let fileAmbiguity
	let rankAmbiguity
	if (!move.promotion)
	{
		for (let other of board.moves)
		{
			if (other !== move)
			if (other.to.name === move.to.name)
			if (other.from.piece === piece)
			{
				ambiguity = true
				if (other.from.file === move.from.file)
					fileAmbiguity = true
				if (other.from.rank === move.from.rank)
					rankAmbiguity = true
			}
		}
	}
	
	let name = shortNames[piece.type]
	
	if (piece.type === "pawn" && captured)
	{
		name += move.from.file
	}
	else if (ambiguity)
	{
		if (fileAmbiguity)
		{
			if (rankAmbiguity)
				name += move.from.name
			else
				name += move.from.rank
		}
		else
		{
			name += move.from.file
		}
	}
	
	if (captured) name += "x"
	
	name += move.to.name
	
	if (move.promotion)
		name += "=" + shortNames[move.promotion.type]
	
	return name + checkmark
}
