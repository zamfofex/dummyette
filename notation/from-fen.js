/// <reference path="../types/notation/from-fen.d.ts" />
/// <reference types="../types/notation/from-fen.d.ts" />

import {pieces, Position, Board} from "../chess.js"

let fromShortNames =
{
	P: pieces.whitePawn, N: pieces.whiteKnight, B: pieces.whiteBishop, R: pieces.whiteRook, Q: pieces.whiteQueen, K: pieces.whiteKing,
	p: pieces.blackPawn, n: pieces.blackKnight, b: pieces.blackBishop, r: pieces.blackRook, q: pieces.blackQueen, k: pieces.blackKing,
}

export let toBoard = string =>
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
			if (!/^[a-zA-Z]$/.test(ch)) return
			if (castling.has(ch)) return
			castling.add(ch)
		}
	}
	
	let passing
	
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
			if (i >= string.length) break
		}
		
		passing = Position(position)
		if (!passing) return
		if (passing.y === height - 3) passing = Position(passing.x, passing.y - 1)
		else if (passing.y === 2) passing = Position(passing.x, passing.y + 1)
	}
	
	let storage = Array(width * height).fill()
	let index = (x, y) => x + y * width
	
	for (let [y, rank] of ranks.entries())
	for (let [x, piece] of rank.entries())
		storage[index(x, y)] = piece
	
	let findKing = color =>
	{
		for (let y = 0 ; y < height ; y++)
		for (let x = 0 ; x < width ; x++)
		{
			let piece = storage[index(x, y)]
			if (!piece) continue
			if (piece.type === "king" && piece.color === color)
				return {x, y}
		}
	}
	
	let whiteKing = findKing("white")
	let blackKing = findKing("black")
	
	if (!whiteKing) return
	if (!blackKing) return
	
	let possibilities =
	[
		[1, "K", pieces.whiteRook, whiteKing], [-1, "Q", pieces.whiteRook, whiteKing],
		[1, "k", pieces.blackRook, blackKing], [-1, "q", pieces.blackRook, blackKing],
	]
	
	let boardCastling = {white: [], black: []}
	
	for (let [n, side, rook, position] of possibilities)
	{
		if (!castling.has(side)) continue
		if (width > 8) continue
		
		let {x, y} = position
		let rx
		while (true)
		{
			x += n
			if (x < 0) break
			if (x >= width) break
			if (storage[index(x, y)] === rook)
				rx = x
		}
		if (rx === undefined) return
		if (rook.color === "white") boardCastling.white.push({x: rx, y})
		else boardCastling.black.push({x: rx, y})
	}
	
	for (let file of castling)
	{
		if (width <= 8)
		{
			if (file === "K") continue
			if (file === "Q") continue
			if (file === "k") continue
			if (file === "q") continue
		}
		
		let king
		let rook
		
		let white = file === file.toUpperCase()
		if (white)
			file = file.toLowerCase(),
			king = whiteKing,
			rook = pieces.whiteRook
		else
			king = blackKing,
			rook = pieces.blackRook
		
		let position = Position(file.codePointAt() - 0x61, king.y)
		if (white) boardCastling.white.push(position)
		else boardCastling.black.push(position)
	}
	
	return Board(storage, {turn, width, height, passing, castling: boardCastling})
}
