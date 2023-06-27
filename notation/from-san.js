/// <reference path="../types/notation/from-san.d.ts" />
/// <reference types="../types/notation/from-san.d.ts" />

let pieces =
{
	p: "pawn",
	n: "knight",
	b: "bishop",
	r: "rook",
	q: "queen",
	k: "king",
	
	B: "bishop",
	
	"♙": "pawn",
	"♘": "knight",
	"♗": "bishop",
	"♖": "rook",
	"♕": "queen",
	"♔": "king",
	
	"♟︎": "pawn",
	"♞": "knight",
	"♝": "bishop",
	"♜": "rook",
	"♛": "queen",
	"♚": "king",
}

let names = Object.keys(pieces)

let files = [..."abcdefgh"]
let ranks = [..."12345678"]

let tt = () => true
let ff = () => false

let and = (f, g) => (...args) => f(...args) && g(...args)
let or = (f, g) => (...args) => f(...args) || g(...args)
let not = f => (...args) => !f(...args)

let check = move => move.play().check
let checkmate = move => move.play().checkmate
let promotes = move => Boolean(move.before.at(move.from) !== move.play().at(move.to))
let promotesTo = type => move => move.play().at(move.to).type === type
let fileFrom = file => move => move.from.file === file
let rankFrom = rank => move => move.from.rank === rank
let fileTo = file => move => move.to.file === file || move.rook?.from?.file === file
let rankTo = rank => move => move.to.rank === rank || move.rook?.from?.rank === rank
let pieceFrom = type => move => move.play().at(move.to).type === type
let captures = move => Boolean(move.captured)
let shortCastle = move => move.rook && move.rook.from.x > move.from.x
let longCastle = move => move.rook && move.rook.from.x < move.from.x
let castle = move => Boolean(move.rook)
let checkmark = ch =>
{
	if (ch === "+") return check
	if (ch === "#") return checkmate
}

let promotionTo = ch =>
{
	if (names.includes(ch)) return and(promotes, promotesTo(pieces[ch]))
}

let promotion = ch =>
{
	if (ch === "=") return promotes
}

let toRank = ch =>
{
	if (ranks.includes(ch)) return rankTo(ch)
}

let toFile = ch =>
{
	if (files.includes(ch)) return fileTo(ch)
}

let fromRank = ch =>
{
	if (ranks.includes(ch)) return rankFrom(ch)
}

let fromFile = ch =>
{
	if (files.includes(ch)) return fileFrom(ch)
}

let captureMark = ch =>
{
	if (ch === "×" || ch === "x") return captures
}

let fromPiece = ch =>
{
	if (names.includes(ch)) return pieceFrom(pieces[ch])
}

let parsers = [() => tt, checkmark, promotionTo, promotion, toRank, toFile, captureMark, fromRank, fromFile, fromPiece]

let parseMoveName = (name, bishops) =>
{
	name = String(name)
	name = name.normalize("NFKD")
	name = name.replace(/[^A-Za-z0-9\p{S}#]/ug, "")
	
	let castles = name.match(/^([oO0]{1,3})([+#]?)$/)
	if (castles)
	{
		let [{}, castling, check] = castles
		let result = castle
		if (castling.length === 2) result = shortCastle
		if (castling.length === 3) result = longCastle
		if (check) result = and(result, checkmark(check))
		return result
	}
	
	name = [...name]
	name.reverse()
	let original = name
	name = name.map(ch => ch.toLowerCase())
	
	let traverse = (i, j, has) =>
	{
		if ((j === parsers.length) !== (i === name.length)) return
		
		if (i === name.length)
		{
			if (!has.includes(toFile))
			if (!has.includes(toRank))
				return
			if (has.includes(captureMark))
			if (!has.includes(fromRank))
			if (!has.includes(fromPiece))
				return pieceFrom("pawn")
			if (!has.includes(fromFile))
			if (!has.includes(fromRank))
			if (!has.includes(fromPiece))
				return pieceFrom("pawn")
			return tt
		}
		
		let parse = parsers[j]
		
		if (!has.includes(captureMark))
		{
			if (parse === fromRank)
			if (!has.includes(toRank))
				return
			if (parse === fromFile)
			if (!has.includes(toFile))
				return
		}
		
		if (parse === promotion && !has.includes(promotionTo)) return
		
		let ch = name[i]
		if (bishops && ch === "b")
		{
			ch = original[i]
			if (parse === fromPiece && ch === "b")
				return
		}
		
		let f = parse(ch)
		if (!f) return
		
		has = [...has, parse]
		
		let result = ff
		
		for (let k = j + 1 ; k <= parsers.length ; k++)
		{
			let f = traverse(i + 1, k, has)
			if (!f) continue
			result = or(f, result)
		}
		
		if (result === ff) return
		return and(result, f)
	}
	
	return traverse(-1, 0, [])
}

export let toMoves = (board, name) =>
{
	let moves = board.moves.filter(parseMoveName(name) ?? ff)
	if (moves.length !== 1)
	{
		let moves = board.moves.filter(parseMoveName(name, true) ?? ff)
		if (moves.length === 1)
		{
			Object.freeze(moves)
			return moves
		}
	}
	Object.freeze(moves)
	return moves
}

export let toMove = (board, name) =>
{
	let moves = toMoves(board, name)
	if (moves.length !== 1) return
	return moves[0]
}
