/// <reference path="../types/notation/from-fen.d.ts" />
/// <reference types="../types/notation/from-fen.d.ts" />

import * as chess from "../variants/chess.js"
import {Board} from "../variants/chess.js"
import {SquareStorage} from "../variants.js"

let fromShortNames =
{
	P: chess.whitePawn, N: chess.whiteKnight, B: chess.whiteBishop, R: chess.whiteRook, Q: chess.whiteQueen, K: chess.whiteKing,
	p: chess.blackPawn, n: chess.blackKnight, b: chess.blackBishop, r: chess.blackRook, q: chess.blackQueen, k: chess.blackKing,
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
	
	let storage = SquareStorage(width, height)
	let geometry = storage.geometry
	let state = {turn}
	
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
		
		let passing = geometry.Position(position)
		if (!passing) return
		if (passing.y === height - 3) passing = geometry.Position(passing.x, passing.y - 1)
		else if (passing.y === 2) passing = geometry.Position(passing.x, passing.y + 1)
		if (passing) state.passing = [passing.name]
	}
	
	for (let [y, rank] of ranks.entries())
	for (let [x, piece] of rank.entries())
		storage = storage.put(x, y, piece)
	
	let whiteKing = geometry.positions.find(position => storage.at(position) === chess.whiteKing)
	let blackKing = geometry.positions.find(position => storage.at(position) === chess.blackKing)
	
	if (!whiteKing) return
	if (!blackKing) return
	
	let possibilities =
	[
		[1, "K", chess.whiteRook, whiteKing], [-1, "Q", chess.whiteRook, whiteKing],
		[1, "k", chess.blackRook, blackKing], [-1, "q", chess.blackRook, blackKing],
	]
	
	let whiteCastling = []
	let blackCastling = []
	
	if (width <= 8)
	{
		for (let [n, side, rook, position] of possibilities)
		{
			if (!castling.has(side)) continue
			
			let {x, y} = position
			let rx
			while (true)
			{
				x += n
				if (x < 0) break
				if (x >= geometry.info.width) break
				if (storage.at(x, y) === rook)
					rx = x
			}
			if (rx === undefined) return
			let rookPosition = geometry.Position(rx, y)
			if (!rookPosition) return
			if (rook.color === "white")
				whiteCastling.push(rookPosition.name)
			else
				blackCastling.push(rookPosition.name)
		}
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
			rook = chess.whiteRook
		else
			king = blackKing,
			rook = chess.blackRook
		
		let position = geometry.Position(file.codePointAt() - 0x61, king.y)
		if (!position) return
		if (storage.at(position)?.color === "white")
			whiteCastling.push(rookPosition.name)
		else
			blackCastling.push(rookPosition.name)
	}
	
	whiteCastling.sort()
	blackCastling.sort()
	if (whiteCastling.length !== 0) state.whiteCastling = whiteCastling
	if (blackCastling.length !== 0) state.blackCastling = blackCastling
	
	return Board({storage, state})
}
