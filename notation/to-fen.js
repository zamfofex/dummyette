/// <reference path="../types/notation/to-fen.d.ts" />
/// <reference types="../types/notation/to-fen.d.ts" />

let names = {pawn: "p", knight: "n", bishop: "b", rook: "r", queen: "q", king: "k"}

export let fromBoard = board =>
{
	let ranks = []
	for (let y = board.height - 1 ; y >= 0 ; y--)
	{
		let rank = ""
		let n = 0
		
		for (let x = 0 ; x < board.width ; x++)
		{
			let piece = board.at(x, y)
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
	
	let whiteCastling = board.castling?.white?.map(({x}) => x) ?? []
	let blackCastling = board.castling?.black?.map(({x}) => x) ?? []
	let standardCastling = castling => castling.every(x => x === 0 || x === 7)
	
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
	
	let passingPosition = board.passing
	if (passingPosition === undefined)
	{
		result += "-"
	}
	else
	{
		let y
		if (board.turn === "white") y = board.height - 3
		if (board.turn === "black") y = 2
		
		result += board.Position(passingPosition.x, y).name
	}
	
	return result
}
