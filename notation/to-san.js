/// <reference path="../types/notation/to-san.d.ts" />
/// <reference types="../types/notation/to-san.d.ts" />

import {getFile, getRank, toName} from "../variants/chess.js"

let shortNames = {pawn: "", knight: "N", bishop: "B", rook: "R", queen: "Q", king: "K"}

export let fromMove = move =>
{
	let board = move.before
	
	if (board.width > 26) return
	if (board.height > 9) return
	
	let piece = board.at(move.from)
	let captured = move.passing || board.at(move.to)
	
	let after = move.play()
	
	let checkmark = ""
	if (after.check)
		checkmark = "+"
	if (after.checkmate)
		checkmark = "#"
	
	if (move.rook)
	{
		if (move.rook.from.x < move.from.x)
			return "O-O-O" + checkmark
		else
			return "O-O" + checkmark
	}
	
	let fileAmbiguity
	let rankAmbiguity
	let ambiguity
	if (!move.promotion)
	{
		for (let other of board.moves)
		{
			if (other !== move)
			if (other.to.x === move.to.x)
			if (other.to.y === move.to.y)
			if (other.piece === piece)
			{
				ambiguity = true
				if (other.from.x === move.from.x)
					fileAmbiguity = true
				if (other.from.y === move.from.y)
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
		if (!fileAmbiguity)
			name += getFile(move.from)
		else if (!rankAmbiguity)
			name += getRank(move.from)
		else
			name += toName(move.from)
	}
	
	if (captured) name += "x"
	
	name += toName(move.to)
	
	if (move.promotion)
		name += "=" + shortNames[move.promotion.type]
	
	return name + checkmark
}
