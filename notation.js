/// <reference path="./types/notation.d.ts" />
/// <reference types="./types/notation.d.ts" />

import {pieces, Position, EmptyBoard} from "./chess.js"

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
	
	if (move.rook)
	{
		if (move.rook.from.x < move.from.x)
			return "O-O-O" + checkmark
		else
			return "O-O" + checkmark
	}
	
	let fileAmbiguity
	let rankAmbiguity
	if (!move.promotion)
	{
		for (let other of board.moves)
		{
			if (other !== move)
			if (other.to.name === move.to.name)
			if (other.piece === piece)
			{
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
	else if (fileAmbiguity)
	{
		if (rankAmbiguity)
			name += move.from.name
		else
			name += move.from.rank
	}
	else if (rankAmbiguity)
	{
		name += move.from.file
	}
	
	if (captured) name += "x"
	
	name += move.to.name
	
	if (move.promotion)
		name += "=" + shortNames[move.promotion.type]
	
	return name + checkmark
}

let fromShortNames =
{
	P: pieces.whitePawn, N: pieces.whiteKnight, B: pieces.whiteBishop, R: pieces.whiteRook, Q: pieces.whiteQueen, K: pieces.whiteKing,
	p: pieces.blackPawn, n: pieces.blackKnight, b: pieces.blackBishop, r: pieces.blackRook, q: pieces.blackQueen, k: pieces.blackKing,
}

export let fromFEN = string =>
{
	string = String(string)
	string = [...string]
	
	let rank = []
	let ranks = [rank]
	
	let width = 0
	let height = 1
	
	let i = 0
	
	while (true)
	{
		let ch = string[i++]
		if (i > string.length) return
		
		let cp = ch.codePointAt()
		let skip = 0
		while (cp >= 0x30 && cp <= 0x39)
		{
			skip *= 10
			skip += cp - 0x30
			
			ch = string[i++]
			if (i > string.length) return
			cp = ch.codePointAt()
		}
		rank.length += skip
		
		if (ch === "/")
		{
			if (rank.length > width) width = rank.length
			
			rank = []
			ranks.push(rank)
			height++
			continue
		}
		
		if (ch === " ") break
		
		if (!(ch in fromShortNames)) return
		let piece = fromShortNames[ch]
		
		rank.push(piece)
	}
	
	if (rank.length > width) width = rank.length
	
	for (let rank of ranks)
		rank.length = width
	
	ranks.reverse()
	
	let turn
	switch (string[i++])
	{
		default: return
		case "w": turn = "white" ; break
		case "b": turn = "black" ; break
	}
	
	let castling = new Set()
	
	if (string[i++] !== " ") return
	
	if (string[i] === "-")
	{
		i++
	}
	else
	{
		while (string[i] !== " ")
		{
			let ch = string[i++]
			if (i > string.length) return
			if (ch !== "K" && ch !== "Q" && ch !== "k" && ch !== "q") return
			if (castling.has(ch)) return
			castling.add(ch)
		}
	}
	
	let enPassant
	
	if (string[i++] !== " ") return
	
	if (string[i] === "-")
	{
		i++
	}
	else
	{
		let position = ""
		while (string[i] !== " ")
		{
			position += string[i++]
			if (i > string.length) return
		}
		
		enPassant = Position(position)
		if (enPassant.rank === 2) enPassant = Position(enPassant.x, enPassant.y + 1)
		if (enPassant.rank === 5) enPassant = Position(enPassant.x, enPassant.y - 1)
	}
	
	let board = EmptyBoard(width, height)
	board = board.flip(turn)
	
	for (let [y, rank] of ranks.entries())
	for (let [x, piece] of rank.entries())
		board = board.put(x, y, piece)
	
	if (enPassant) board = board.set(enPassant, "passing")
	
	for (let x = 0 ; x < board.width ; x++)
	{
		if (board.at(x, 1)?.type === "pawn")
			board = board.set(x, 1, "initial")
		if (board.at(x, board.height - 2)?.type === "pawn")
			board = board.set(x, board.height - 2, "initial")
	}
	
	let whiteKing = board.getKingPosition("white")
	let blackKing = board.getKingPosition("white")
	
	let possibilities =
	[
		[1, "K", pieces.whiteRook, whiteKing], [-1, "Q", pieces.whiteRook, whiteKing],
		[1, "k", pieces.blackRook, blackKing], [-1, "q", pieces.blackRook, blackKing],
	]
	
	for (let [n, side, rook, position] of possibilities)
	{
		if (!castling.has(side)) continue
		
		board = board.set(position, "initial")
		
		let {x, y} = position
		let rx = null
		while (true)
		{
			x += n
			if (x < 0) break
			if (x >= board.width) break
			if (board.at(x, y) === rook)
				rx = x
		}
		if (rx !== null) board = board.set(rx, y, "initial")
	}
	
	return board
}
