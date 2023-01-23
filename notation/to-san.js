/// <reference path="../types/notation/to-san.d.ts" />
/// <reference types="../types/notation/to-san.d.ts" />

import {isLowCastling, isHighCastling, capturedPiece, isCheck, isCheckmate, promotionPiece} from "../variants/chess.js"

let shortNames = {pawn: "", knight: "N", bishop: "B", rook: "R", queen: "Q", king: "K"}

export let fromMove = move =>
{
	let board = move.before
	
	if (board.storage.geometry.info.width > 26) return
	
	let resultingBoard = move.play()
	
	let checkmark = ""
	if (isCheck(resultingBoard))
		checkmark = "+"
	if (isCheckmate(resultingBoard))
		checkmark = "#"
	
	if (isLowCastling(move))
		return "O-O-O" + checkmark
	if (isHighCastling(move))
		return "O-O" + checkmark
	
	let promotion = promotionPiece(move)
	let movement = move.movements[0]
	
	let piece = movement.piece
	let captured = capturedPiece(move)
	
	let fileAmbiguity
	let rankAmbiguity
	let ambiguity
	
	if (!promotion)
	{
		for (let other of board.moves)
		{
			if (other !== move)
			if (other.movements[0].to === movement.to)
			if (other.movements[0].piece === piece)
			{
				ambiguity = true
				if (other.movements[0].from.file === movement.from.file)
					fileAmbiguity = true
				if (other.movements[0].from.rank === movement.from.rank)
					rankAmbiguity = true
			}
		}
	}
	
	let name = shortNames[piece.type]
	
	if (piece.type === "pawn" && captured)
	{
		name += movement.from.file
	}
	else if (ambiguity)
	{
		if (!fileAmbiguity)
			name += movement.from.file
		else if (!rankAmbiguity)
			name += movement.from.rank
		else
			name += movement.from.name
	}
	
	if (captured) name += "x"
	
	name += movement.to.name
	
	if (promotion) name += "=" + shortNames[promotion.type]
	
	return name + checkmark
}
