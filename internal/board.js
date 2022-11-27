let fileA = 0x0101010101010101n
let rank1 = 0b11111111n

let fileH = fileA << 7n
let rank8 = rank1 << (7n * 8n)

let rank2 = (rank1 << 8n)
let rank7 = (rank8 >> 8n)

let fileB = (fileA << 1n)
let fileG = (fileH >> 1n)

let cornerA1 = fileA | rank1
let cornerA8 = fileA | rank8
let cornerH1 = fileH | rank1
let cornerH8 = fileH | rank8

let knightA = fileA | fileB
let knightH = fileH | fileG
let knight1 = rank1 | rank2
let knight8 = rank8 | rank7

let moveSlider = (i, moves, before, self, other, limit, n) =>
{
	let after = before
	while (true)
	{
		if (after & limit) break
		after >>= n
		if (after & self) break
		moves.push([i, after])
		if (after & other) break
	}
}

let moveRook = (i, moves, before, self, other) =>
{
	moveSlider(i, moves, before, self, other, rank1, 8n)
	moveSlider(i, moves, before, self, other, rank8, -8n)
	moveSlider(i, moves, before, self, other, fileA, 1n)
	moveSlider(i, moves, before, self, other, fileH, -1n)
}

let moveBishop = (i, moves, before, self, other) =>
{
	moveSlider(i, moves, before, self, other, cornerA1, 9n)
	moveSlider(i, moves, before, self, other, cornerA8, -7n)
	moveSlider(i, moves, before, self, other, cornerH1, 7n)
	moveSlider(i, moves, before, self, other, cornerH8, -9n)
}

let moveQueen = (i, moves, before, self, other) =>
{
	moveRook(i, moves, before, self, other)
	moveBishop(i, moves, before, self, other)
}

let moveKnight = (i, moves, before, self) =>
{
	if (!(before & knightA) && !(before & rank1))
	{
		let after = before >> 10n
		if (!(after & self))
			moves.push([i, after])
	}
	if (!(before & fileA) && !(before & knight1))
	{
		let after = before >> 17n
		if (!(after & self))
			moves.push([i, after])
	}
	if (!(before & knightA) && !(before & rank8))
	{
		let after = before << 6n
		if (!(after & self))
			moves.push([i, after])
	}
	if (!(before & fileA) && !(before & knight8))
	{
		let after = before << 15n
		if (!(after & self))
			moves.push([i, after])
	}
	if (!(before & knightH) && !(before & rank1))
	{
		let after = before >> 6n
		if (!(after & self))
			moves.push([i, after])
	}
	if (!(before & fileH) && !(before & knight1))
	{
		let after = before >> 15n
		if (!(after & self))
			moves.push([i, after])
	}
	if (!(before & knightH) && !(before & rank8))
	{
		let after = before << 10n
		if (!(after & self))
			moves.push([i, after])
	}
	if (!(before & fileH) && !(before & knight8))
	{
		let after = before << 17n
		if (!(after & self))
			moves.push([i, after])
	}
}

let moveKing = (i, moves, before, self) =>
{
	if (!(before & fileA))
	{
		let after = before >> 1n
		if (!(after & self))
			moves.push([i, after])
		
		if (!(before & rank1))
		{
			let after = before >> 9n
			if (!(after & self))
				moves.push([i, after])
		}
		if (!(before & rank8))
		{
			let after = before << 7n
			if (!(after & self))
				moves.push([i, after])
		}
	}
	if (!(before & fileH))
	{
		let after = before << 1n
		if (!(after & self))
			moves.push([i, after])
		
		if (!(before & rank1))
		{
			let after = before >> 7n
			if (!(after & self))
				moves.push([i, after])
		}
		if (!(before & rank8))
		{
			let after = before << 9n
			if (!(after & self))
				moves.push([i, after])
		}
	}
	if (!(before & rank1))
	{
		let after = before >> 8n
		if (!(after & self))
			moves.push([i, after])
	}
	if (!(before & rank8))
	{
		let after = before << 8n
		if (!(after & self))
			moves.push([i, after])
	}
}

let moveWhitePawn = (i, moves, before, self, other) =>
{
	let after
	
	after = before << 7n
	if (!(before & fileA) && (after & other))
		moves.push([i, after])
	
	after = before << 9n
	if (!(before & fileH) && (after & other))
		moves.push([i, after])
	
	after = before << 8n
	if (!(after & (self | other)))
	{
		moves.push([i, after])
		after = before << 16n
		if ((before & rank2) && !(after & (self | other)))
			moves.push([i, after])
	}
}

let moveBlackPawn = (i, moves, before, self, other) =>
{
	let after
	
	after = before >> 7n
	if (!(before & fileH) && (after & other))
		moves.push([i, after])
	
	after = before >> 9n
	if (!(before & fileA) && (after & other))
		moves.push([i, after])
	
	after = before >> 8n
	if (!(after & (self | other)))
	{
		moves.push([i, after])
		after = before >> 16n
		if ((before & rank7) && !(after & (self | other)))
			moves.push([i, after])
	}
}

let move = (moves, self, other, bitboards, f) =>
{
	let i = bitboards.byteOffset / 8
	for (let [j, bitboard] of bitboards.entries())
	{
		if (!bitboard) continue
		f(i + j, moves, bitboard, self, other)
	}
}

let createBitboards = () => new BigUint64Array(96)

let separate = bitboards =>
{
	let i = 0
	let slice = n => bitboards.subarray(i, i += n)
	
	let whitePawns = slice(8)
	let whiteKnights = slice(10)
	let whiteBishops = slice(10)
	let whiteRooks = slice(10)
	let whiteQueens = slice(9)
	let whiteKings = slice(1)
	
	let blackPawns = slice(8)
	let blackKnights = slice(10)
	let blackBishops = slice(10)
	let blackRooks = slice(10)
	let blackQueens = slice(9)
	let blackKings = slice(1)
	
	if (i !== bitboards.length) throw new Error(`${i} != ${bitboards.length}`)
	
	return [
		whitePawns, blackPawns,
		whiteKnights, blackKnights,
		whiteBishops, blackBishops,
		whiteRooks, blackRooks,
		whiteQueens, blackQueens,
		whiteKings, blackKings,
	]
}

export let Board = (bitboards, whiteTurn) =>
{
	let allBitboards = separate(bitboards)
	
	let whitePieces = 0n
	let blackPieces = 0n
	
	for (let [i, bitboards] of allBitboards.entries())
	{
		let count = 0
		for (let [j, bitboard] of bitboards.entries())
		{
			if (bitboard)
			{
				count = j + 1
				
				if (i % 2 === 0) whitePieces |= bitboard
				else blackPieces |= bitboard
			}
		}
		allBitboards[i] = bitboards.subarray(0, count)
	}
	
	let [
		whitePawns, blackPawns,
		whiteKnights, blackKnights,
		whiteBishops, blackBishops,
		whiteRooks, blackRooks,
		whiteQueens, blackQueens,
		whiteKings, blackKings,
	] = allBitboards
	
	let getMoves = () =>
	{
		let moves = []
		if (whiteTurn)
		{
			move(moves, whitePieces, blackPieces, whitePawns, moveWhitePawn)
			move(moves, whitePieces, blackPieces, whiteKnights, moveKnight)
			move(moves, whitePieces, blackPieces, whiteBishops, moveBishop)
			move(moves, whitePieces, blackPieces, whiteRooks, moveRook)
			move(moves, whitePieces, blackPieces, whiteQueens, moveQueen)
			move(moves, whitePieces, blackPieces, whiteKings, moveKing)
		}
		else
		{
			move(moves, blackPieces, whitePieces, blackPawns, moveBlackPawn)
			move(moves, blackPieces, whitePieces, blackKnights, moveKnight)
			move(moves, blackPieces, whitePieces, blackBishops, moveBishop)
			move(moves, blackPieces, whitePieces, blackRooks, moveRook)
			move(moves, blackPieces, whitePieces, blackQueens, moveQueen)
			move(moves, blackPieces, whitePieces, blackKings, moveKing)
		}
		
		return moves
	}
	
	let play = ([i, after]) =>
	{
		let self
		let other
		
		let pieces
		
		if (whiteTurn)
		{
			self = whitePieces
			other = blackPieces
			pieces =
			[
				blackPawns,
				blackKnights,
				blackBishops,
				blackRooks,
				blackQueens,
				blackKings,
			]
		}
		else
		{
			self = blackPieces
			other = whitePieces
			pieces =
			[
				whitePawns,
				whiteKnights,
				whiteBishops,
				whiteRooks,
				whiteQueens,
				whiteKings,
			]
		}
		
		let before = bitboards[i]
		bitboards[i] = after
		
		let n
		let m
		if (after & other)
		{
			for (let [k, bitboards] of pieces.entries())
			{
				let i = bitboards.byteOffset / 8
				for (let [j, bitboard] of bitboards.entries())
				{
					if (bitboard & after)
					{
						bitboards[j] = 0n
						n = i + j
						m = k
						break
					}
				}
				if (n !== undefined) break
			}
		}
		
		let promotion = false
		if (i % (bitboards.length / 2) <= 8 && (after & (rank1 | rank8)))
		{
			promotion = true
			
			let queens
			if (whiteTurn)
			{
				let i = whiteQueens.byteOffset / 8
				whiteQueens = bitboards.subarray(i, i + whiteQueens.length + 1)
				queens = whiteQueens
			}
			else
			{
				let i = blackQueens.byteOffset / 8
				blackQueens = bitboards.subarray(i, i + blackQueens.length + 1)
				queens = blackQueens
			}
			
			queens[queens.length - 1] = after
			bitboards[i] = 0n
		}
		
		self &= ~before
		self |= after
		other &= ~after
		
		if (whiteTurn)
			whitePieces = self,
			blackPieces = other
		else
			blackPieces = self,
			whitePieces = other
		
		whiteTurn = !whiteTurn
		
		return [n, m, before, promotion]
	}
	
	let unplay = ([i, after], [j, k, before, promotion]) =>
	{
		whiteTurn = !whiteTurn
		
		bitboards[i] = before
		
		if (whiteTurn)
			whitePieces &= ~after,
			whitePieces |= before
		else
			blackPieces &= ~after,
			blackPieces |= before
		
		if (j !== undefined)
		{
			bitboards[j] = after
			if (whiteTurn)
				blackPieces |= after
			else
				whitePieces |= after
		}
		
		if (promotion)
		{
			if (whiteTurn)
				whiteQueens[whiteQueens.length - 1] = 0n,
				whiteQueens = whiteQueens.subarray(0, whiteQueens.length - 1)
			else
				blackQueens[blackQueens.length - 1] = 0n,
				blackQueens = blackQueens.subarray(0, blackQueens.length - 1)
		}
	}
	
	let result = {getMoves, play, unplay, get whiteTurn() { return whiteTurn }, bitboards: allBitboards}
	Object.freeze(result)
	return result
}

let byColor = {white: 0, black: 1}
let byType = {pawn: 0, knight: 2, bishop: 4, rook: 6, queen: 8, king: 10}

export let Bitboards = board =>
{
	if (board.width !== 8) return
	if (board.height !== 8) return
	
	let boards = [[],[],[],[],[],[],[],[],[],[],[],[]]
	
	for (let x = 0 ; x < 8 ; x++)
	for (let y = 0 ; y < 8 ; y++)
	{
		let piece = board.at(x, y)
		if (!piece) continue
		boards[byColor[piece.color] + byType[piece.type]].push(1n << BigInt(x + y * 8))
	}
	
	let bitboards = createBitboards()
	let allBitboards = separate(bitboards)
	
	for (let [i, bitboards] of boards.entries())
		for (let [j, bitboard] of bitboards.entries())
			allBitboards[i][j] = bitboard
	
	return bitboards
}
