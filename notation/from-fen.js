/// <reference path="../types/notation/from-fen.d.ts" />
/// <reference types="../types/notation/from-fen.d.ts" />

import {Board, variant as chess} from "../variants/chess.js"
import {Board as ChecklessBoard, variant as checkless} from "../variants/checkless-chess.js"
import {whitePawn, whiteKnight, whiteBishop, whiteRook, whiteQueen, whiteKing} from "../variants/checkless-chess.js"
import {blackPawn, blackKnight, blackBishop, blackRook, blackQueen, blackKing} from "../variants/checkless-chess.js"

let variants = new Map([[chess, Board], [checkless, ChecklessBoard]])

let fromShortNames =
{
	P: whitePawn, N: whiteKnight, B: whiteBishop, R: whiteRook, Q: whiteQueen, K: whiteKing,
	p: blackPawn, n: blackKnight, b: blackBishop, r: blackRook, q: blackQueen, k: blackKing,
}

export let toBoard = (string, variant = chess) =>
{
	let Board = variants.get(variant)
	if (!Board) return
	
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
	
	let enPassant
	
	if (string[i++] !== " ") return
	
	if (string[i] === "-")
	{
		i++
	}
	else
	{
		let name = ""
		while (string[i] !== " ")
		{
			name += string[i++]
			if (i >= string.length) break
		}
		
		let match = name.match(/^([a-z]+)([1-9][0-9]*)$/)
		if (!match) return
		let [full, file, rank] = match
		
		let x = 0
		let y = Number(rank) - 1
		
		for (let ch of file)
			x *= 26,
			x += parseInt(ch, 36) - 9
		x--
		
		if (x >= width) return
		if (y >= height) return
		
		if (turn === "white") y--
		if (turn === "black") y++
		
		enPassant = {x, y}
	}
	
	let whiteKingY
	let blackKingY
	
	for (let y = 0 ; y < height ; y++)
	for (let x = 0 ; x < width ; x++)
	{
		if (ranks[y][x] === whiteKing) whiteKingY = y
		if (ranks[y][x] === blackKing) blackKingY = y
	}
	
	if (whiteKingY === undefined) return
	if (blackKingY === undefined) return
	
	let possibilities =
	[
		[-1, "K", whiteRook, whiteKing, width - 1, whiteKingY], [1, "Q", whiteRook, whiteKing, 0, whiteKingY],
		[-1, "k", blackRook, blackKing, width - 1, blackKingY], [1, "q", blackRook, blackKing, 0, blackKingY],
	]
	
	let castlingX = {white: [], black: []}
	
	if (width <= 8)
	{
		for (let [n, side, rook, king, x, y] of possibilities)
		{
			if (!castling.has(side)) continue
			
			while (true)
			{
				if (ranks[y][x] === king) return
				if (ranks[y][x] === rook) break
				x += n
			}
			
			castlingX[rook.color].push(x)
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
			king = whiteKingPosition,
			rook = whiteRook
		else
			king = blackKingPosition,
			rook = blackRook
		
		let x = file.codePointAt() - 0x61
		if (x < 0) return
		if (x >= width) return
		if (x >= 26) return
		if (ranks[king.y][x] !== rook) return
		
		castlingX[rook.color].push(rx)
	}
	
	if (variant === checkless) castlingX = undefined
	return Board(ranks, {turn, passing: enPassant?.x, castling: castlingX})
}
