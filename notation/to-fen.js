import {Board, variant as chess} from "../variants/chess.js"
import {Board as ChecklessBoard, variant as checkless} from "../variants/chess.js"
import {whitePawn, whiteKnight, whiteBishop, whiteRook, whiteQueen, whiteKing} from "../variants/checkless-chess.js"
import {blackPawn, blackKnight, blackBishop, blackRook, blackQueen, blackKing} from "../variants/checkless-chess.js"
import {toName} from "../variants/checkless-chess.js"

let variants = [chess, checkless]

let names = {pawn: "p", knight: "n", bishop: "b", rook: "r", queen: "q", king: "k"}

export let fromBoard = board =>
{
	if (!variants.includes(board.variant)) return
	
	let ranks = []
	for (let y = board.height - 1 ; y >= 0 ; y--)
	{
		let rank = ""
		let n = 0
		
		for (let x = 0 ; x < board.width ; x++)
		{
			let piece = board.at({x, y})
			if (!piece)
			{
				n++
				continue
			}
			
			if (n !== 0)
			{
				rank += n
				n = 0
			}
			
			if (!(piece.type in names)) return
			let name = names[piece.type]
			if (piece.color === "white") name = name.toUpperCase()
			rank += name
		}
		
		if (n !== 0) rank += n
		
		ranks.push(rank)
	}
	
	let result = ranks.join("/") + " "
	if (board.turn === "white") result += "w "
	if (board.turn === "black") result += "b "
	
	let castling = JSON.parse(board.get("castling")) ?? {}
	let whiteCastling = castling.white ?? []
	let blackCastling = castling.black ?? []
	let standardCastling = castling => castling.every(n => n === 0 || n === 7)
	
	if (board.width === 8 && standardCastling(whiteCastling) && standardCastling(blackCastling))
	{
		let castling = ""
		if (whiteCastling.includes(7)) castling += "K"
		if (whiteCastling.includes(0)) castling += "Q"
		if (blackCastling.includes(7)) castling += "k"
		if (blackCastling.includes(0)) castling += "q"
		if (!castling) castling = "-"
		result += castling + " "
	}
	else
	{
		let castling = ""
		for (let c of whiteCastling)
		{
			if (c >= 26)
			{
				castling += `[${c + 1}]`
				continue
			}
			castling += String.fromCodePoint(0x41 + c)
		}
		for (let c of blackCastling)
		{
			if (c >= 26)
			{
				castling += `{${c + 1}}`
				continue
			}
			castling += String.fromCodePoint(0x61 + c)
		}
		
		if (!castling) castling = "-"
		result += castling + " "
	}
	
	let x = board.get("passing")
	if (x === undefined)
	{
		result += "-"
	}
	else
	{
		let y
		if (board.turn === "white") y = 5
		if (board.turn === "black") y = 2
		
		result += toName({x, y})
	}
	
	return result
}
