import {values} from "../chess.js"

let fileA = 0x0101010101010101n
let rank1 = 0b11111111n

let fileH = fileA << 7n
let rank8 = rank1 << (7n * 8n)

let cornerA1 = fileA | rank1
let cornerA8 = fileA | rank8
let cornerH1 = fileH | rank1
let cornerH8 = fileH | rank8

let knightA = fileA | (fileA << 1n)
let knightH = fileH | (fileH >> 1n)
let knight1 = rank1 | (rank1 << 8n)
let knight8 = rank8 | (rank8 >> 8n)

export let traverse = board =>
{
	if (board.done) return [Infinity * (board.status * 2 - 1), 0]
	
	let {score, whiteScore, blackScore} = board
	
	let play = (bitboard, before, after) =>
	{
		let scoreBefore = score
		
		if (after & any & bitboard.other[0])
		{
			let n = (bitboard.color === white) / blackScore - (bitboard.color === black) / whiteScore
			
			score += n * ((after & pawns[0]) !== 0n) * 1
			score += n * ((after & knights[0]) !== 0n) * 3
			score += n * ((after & bishops[0]) !== 0n) * 3
			score += n * ((after & rooks[0]) !== 0n) * 5
			score += n * ((after & queens[0]) !== 0n) * 9
			score += n * ((after & kings[0]) !== 0n) * 5999
		}
		
		let anyBefore = any
		let colorBefore = bitboard.color[0]
		
		let capture = after & any
		
		let color = bitboard.color[0]
		let group = bitboard.group[0]
		let other = bitboard.other[0]
		
		any &= ~before
		any |= after
		
		bitboard.self = after
		bitboard.group[0] |= after
		bitboard.color[0] |= after
		bitboard.other[0] &= ~after
		
		next()
		
		score = scoreBefore
		
		bitboard.self = before
		bitboard.color[0] = color
		bitboard.group[0] = group
		bitboard.other[0] = other
		
		after &= ~capture
		
		any |= before
		any &= ~after
	}
	
	let playPromotion = (bitboard, before, after) =>
	{
		let scoreBefore = score
		
		let n = (bitboard.color === white) * 2 - 1
		score += n * 8
		
		let move = bitboard.move
		bitboard.move = moveQueen
		
		let group = bitboard.group[0]
		let queensBefore = queens[0]
		bitboard.group[0] &= ~before
		bitboard.group = queens
		bitboard.group[0] |= before
		
		play(bitboard, before, after)
		
		score = scoreBefore
		bitboard.move = move
		bitboard.group[0] = queensBefore
		bitboard.group = pawns
		bitboard.group[0] = group
	}
	
	let playLineCapture = (bitboard, limit, n) =>
	{
		let before = bitboard.self
		let after
		
		after = before
		while (true)
		{
			if (after & limit) break
			
			after >>= n
			if (after & any)
			{
				if (after & bitboard.other[0]) play(bitboard, before, after)
				break
			}
		}
	}
	
	let playLineMove = (bitboard, limit, n) =>
	{
		let before = bitboard.self
		let after
		
		after = before
		while (true)
		{
			if (after & limit) break
			after >>= n
			if (after & any) break
			play(bitboard, before, after)
		}
	}
	
	let moveRook = bitboard =>
	{
		playLineCapture(bitboard, rank1, 8n)
		playLineCapture(bitboard, rank8, -8n)
		playLineCapture(bitboard, fileA, 1n)
		playLineCapture(bitboard, fileH, -1n)
		
		playLineMove(bitboard, rank1, 8n)
		playLineMove(bitboard, rank8, -8n)
		playLineMove(bitboard, fileA, 1n)
		playLineMove(bitboard, fileH, -1n)
	}
	
	let moveBishop = bitboard =>
	{
		playLineCapture(bitboard, cornerA1, 9n)
		playLineCapture(bitboard, cornerA8, -7n)
		playLineCapture(bitboard, cornerH1, 7n)
		playLineCapture(bitboard, cornerH8, -9n)
		
		playLineMove(bitboard, cornerA1, 9n)
		playLineMove(bitboard, cornerA8, -7n)
		playLineMove(bitboard, cornerH1, 7n)
		playLineMove(bitboard, cornerH8, -9n)
	}
	
	let moveQueen = bitboard =>
	{
		playLineCapture(bitboard, rank1, 8n)
		playLineCapture(bitboard, rank8, -8n)
		playLineCapture(bitboard, fileA, 1n)
		playLineCapture(bitboard, fileH, -1n)
		playLineCapture(bitboard, cornerA1, 9n)
		playLineCapture(bitboard, cornerA8, -7n)
		playLineCapture(bitboard, cornerH1, 7n)
		playLineCapture(bitboard, cornerH8, -9n)
		
		playLineMove(bitboard, rank1, 8n)
		playLineMove(bitboard, rank8, -8n)
		playLineMove(bitboard, fileA, 1n)
		playLineMove(bitboard, fileH, -1n)
		playLineMove(bitboard, cornerA1, 9n)
		playLineMove(bitboard, cornerA8, -7n)
		playLineMove(bitboard, cornerH1, 7n)
		playLineMove(bitboard, cornerH8, -9n)
	}
	
	let moveKnight = bitboard =>
	{
		let before = bitboard.self
		
		if (!(before & knightA) && !(before & rank1))
		{
			let after = before >> 10n
			if (!(after & any & bitboard.color[0]))
				play(bitboard, before, after)
		}
		if (!(before & fileA) && !(before & knight1))
		{
			let after = before >> 17n
			if (!(after & any & bitboard.color[0]))
				play(bitboard, before, after)
		}
		if (!(before & knightA) && !(before & rank8))
		{
			let after = before << 6n
			if (!(after & any & bitboard.color[0]))
				play(bitboard, before, after)
		}
		if (!(before & fileA) && !(before & knight8))
		{
			let after = before << 15n
			if (!(after & any & bitboard.color[0]))
				play(bitboard, before, after)
		}
		if (!(before & knightH) && !(before & rank1))
		{
			let after = before >> 6n
			if (!(after & any & bitboard.color[0]))
				play(bitboard, before, after)
		}
		if (!(before & fileH) && !(before & knight1))
		{
			let after = before >> 15n
			if (!(after & any & bitboard.color[0]))
				play(bitboard, before, after)
		}
		if (!(before & knightH) && !(before & rank8))
		{
			let after = before << 10n
			if (!(after & any & bitboard.color[0]))
				play(bitboard, before, after)
		}
		if (!(before & fileH) && !(before & knight8))
		{
			let after = before << 17n
			if (!(after & any & bitboard.color[0]))
				play(bitboard, before, after)
		}
	}
	
	let moveKing = bitboard =>
	{
		let before = bitboard.self
		if (!(before & fileA))
		{
			let after = before >> 1n
			if (!(after & any & bitboard.color[0]))
				play(bitboard, before, after)
			
			if (!(before & rank1))
			{
				let after = before >> 9n
				if (!(after & any & bitboard.color[0]))
					play(bitboard, before, after)
			}
			if (!(before & rank8))
			{
				let after = before << 7n
				if (!(after & any & bitboard.color[0]))
					play(bitboard, before, after)
			}
		}
		if (!(before & fileH))
		{
			let after = before << 1n
			if (!(after & any & bitboard.color[0]))
				play(bitboard, before, after)
			
			if (!(before & rank1))
			{
				let after = before >> 7n
				if (!(after & any & bitboard.color[0]))
					play(bitboard, before, after)
			}
			if (!(before & rank8))
			{
				let after = before << 9n
				if (!(after & any & bitboard.color[0]))
					play(bitboard, before, after)
			}
		}
		if (!(before & rank1))
		{
			let after = before >> 8n
			if (!(after & any & bitboard.color[0]))
				play(bitboard, before, after)
		}
		if (!(before & rank8))
		{
			let after = before << 8n
			if (!(after & any & bitboard.color[0]))
				play(bitboard, before, after)
		}
	}
	
	let moveWhitePawn = bitboard =>
	{
		let before = bitboard.self
		let after
		
		after = before << 7n
		if (!(before & fileA) && (after & any & black[0]))
		{
			if (after & rank8)
				playPromotion(bitboard, before, after)
			else
				play(bitboard, before, after)
		}
		
		after = before << 9n
		if (!(before & fileH) && (after & any & black[0]))
		{
			if (after & rank8)
				playPromotion(bitboard, before, after)
			else
				play(bitboard, before, after)
		}
		
		after = before << 8n
		if (!(after & any))
		{
			if (after & rank8)
				playPromotion(bitboard, before, after)
			else
				play(bitboard, before, after)
		}
	}
	
	let moveBlackPawn = bitboard =>
	{
		let before = bitboard.self
		let after
		
		after = before >> 7n
		if (!(before & fileH) && (after & any & white[0]))
		{
			if (after & rank1)
				playPromotion(bitboard, before, after)
			else
				play(bitboard, before, after)
		}
		
		after = before >> 9n
		if (!(before & fileA) &&  (after & any & white[0]))
		{
			if (after & rank1)
				playPromotion(bitboard, before, after)
			else
				play(bitboard, before, after)
		}
		
		after = before >> 8n
		if (!(after & any))
		{
			if (after & rank1)
				playPromotion(bitboard, before, after)
			else
				play(bitboard, before, after)
		}
	}
	
	let moveInitialWhitePawn = bitboard =>
	{
		bitboard.move = moveWhitePawn
		
		moveWhitePawn(bitboard)
		let before = bitboard.self
		let after = before << 16n
		if (!(after & any))
			play(bitboard, before, after)
		
		bitboard.move = moveInitialWhitePawn
	}
	
	let moveInitialBlackPawn = bitboard =>
	{
		bitboard.move = moveBlackPawn
		
		moveBlackPawn(bitboard)
		let before = bitboard.self
		let after = before >> 16n
		if (!(after & any))
			play(bitboard, before, after)
		
		bitboard.move = moveInitialBlackPawn
	}
	
	let results = [-Infinity]
	let indices = [0]
	
	let whiteTurn = board.turn === "white"
	let initialTurn = whiteTurn * 2 - 1
	
	let i = 0
	let next = () =>
	{
		if (!(kings[0] & any & white[0]))
		{
			indices[i] = i
			results[i] = Infinity * initialTurn
			return
		}
		if (!(kings[0] & any & black[0]))
		{
			indices[i] = i
			results[i] = -Infinity * initialTurn
			return
		}
		
		if (i > 2)
		{
			if (results[i] > score * initialTurn)
				results[i] = -score * initialTurn
			return
		}
		
		whiteTurn = !whiteTurn
		i++
		
		if (i % 2 !== 0)
		{
			indices[i] = i
			results[i] = Infinity
			for (let bitboard of bitboards)
			{
				if (results[i] < results[i - 1]) break
				if ((bitboard.color === white) === whiteTurn) continue
				if (!(bitboard.self & bitboard.color[0] & any)) continue
				bitboard.move(bitboard)
			}
			
			if (results[i - 1] < results[i])
				results[i - 1] = results[i],
				indices[i - 1] = indices[i]
		}
		else
		{
			indices[i] = i
			results[i] = -Infinity
			for (let bitboard of bitboards)
			{
				if (results[i] > results[i - 1]) break
				if ((bitboard.color === white) === whiteTurn) continue
				if (!(bitboard.self & bitboard.color[0] & any)) continue
				bitboard.move(bitboard)
			}
			
			if (results[i - 1] > results[i])
				results[i - 1] = results[i],
				indices[i - 1] = indices[i]
		}
		
		whiteTurn = !whiteTurn
		i--
	}
	
	let any = 0n
	let pawns = [0n]
	let knights = [0n]
	let bishops = [0n]
	let rooks = [0n]
	let queens = [0n]
	let kings = [0n]
	let white = [0n]
	let black = [0n]
	
	let bitboards = []
	
	for (let y = 7 ; y >= 0 ; y--)
	for (let x = 7 ; x >= 0 ; x--)
	{
		any <<= 1n
		pawns[0] <<= 1n
		knights[0] <<= 1n
		bishops[0] <<= 1n
		rooks[0] <<= 1n
		queens[0] <<= 1n
		kings[0] <<= 1n
		white[0] <<= 1n
		black[0] <<= 1n
		
		for (let i of bitboards.keys()) bitboards[i].self <<= 1n
		
		let piece = board.array[x + y * 8]
		if (!piece) continue
		
		let bitboard = {self: 1n}
		bitboards.push(bitboard)
		
		if (piece.color === "white") white[0] |= 1n, bitboard.color = white, bitboard.other = black
		if (piece.color === "black") black[0] |= 1n, bitboard.color = black, bitboard.other = white
		
		any |= 1n
		switch (piece.type)
		{
			case "pawn":
				pawns[0] |= 1n
				bitboard.group = pawns
				if (piece.color === "white")
				{
					if (y === 1) bitboard.move = moveInitialWhitePawn
					else bitboard.move = moveWhitePawn
				}
				else
				{
					if (y === 6) bitboard.move = moveInitialBlackPawn
					else bitboard.move = moveBlackPawn
				}
				
				break
			case "knight":
				knights[0] |= 1n
				bitboard.group = knights
				bitboard.move = moveKnight
				break
			case "bishop":
				bishops[0] |= 1n
				bitboard.group = bishops
				bitboard.move = moveBishop
				break
			case "rook":
				rooks[0] |= 1n
				bitboard.group = rooks
				bitboard.move = moveRook
				break
			case "queen":
				queens[0] |= 1n
				bitboard.group = queens
				bitboard.move = moveQueen
				break
			case "king":
				kings[0] |= 1n
				bitboard.group = kings
				bitboard.move = moveKing
				break
		}
	}
	
	next()
	return [results[0], indices[0]]
}

export let serialize = (board, before) =>
{
	if (board.moves.length === 0) return {done: true, status: board.checkmate}
	
	let whiteScore = 1
	let blackScore = 1
	
	let result = {turn: board.turn, array: []}
	
	for (let y = 0 ; y < 8 ; y++)
	for (let x = 0 ; x < 8 ; x++)
	{
		let piece = before.at(x, y)
		if (!piece) continue
		
		let {color, type} = piece
		if (type === "king") continue
		if (color === "white")
			whiteScore += values[type]
		else
			blackScore += values[type]
	}
	
	let score = 0
	
	for (let y = 0 ; y < 8 ; y++)
	for (let x = 0 ; x < 8 ; x++)
	{
		let piece = board.at(x, y)
		if (!piece)
		{
			result.array.push(null)
			continue
		}
		
		let {color, type} = piece
		result.array.push({color, type})
		
		if (type === "king") continue
		
		if (color === "white")
			score += values[type] / whiteScore
		else
			score -= values[type] / blackScore
	}
	
	Object.assign(result, {score, whiteScore, blackScore})
	
	return result
}
