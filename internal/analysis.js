let table = (i, n) =>
{
	if (n === 0) return 0
	let table = tables[(n >>> 4) - 1][(n & 0x0F) - 1]
	return table[i]
}

export let traverse = (board, depth) =>
{
	let qdepth = 3
	
	let evaluate = i =>
	{
		let score = 0
		for (let i = 0 ; i < 64 ; i++)
			score += table(i, board.array[i])
		
		if (!board.turn[0]) score *= -1
		if (score < -5000) return -10000 * (depth - i + 1)
		return score
	}
	
	let quiesce = (i, alpha, beta) =>
	{
		let score = evaluate(i)
		if (score < -5000) return score
		if (i === 0) return score
		
		if (score >= beta) return beta
		if (alpha < score) alpha = score
		
		for (let play of board.getCaptures())
		{
			let unplay = play()
			let score = -quiesce(i - 1, -beta, -alpha)
			unplay()
			
			if (score >= beta) return beta
			if (score > alpha) alpha = score
		}
		
		return alpha
	}
	
	let search = (i, alpha, beta) =>
	{
		if (i === 0) return quiesce(qdepth, alpha, beta)
		
		for (let play of board.getMoves())
		{
			let unplay = play()
			let score = -search(i - 1, -beta, -alpha)
			unplay()
			
			if (score >= beta) return beta
			if (score > alpha) alpha = score
		}
		
		return alpha
	}
	
	return -search(depth, -Infinity, Infinity)
}

// tables from: <https://www.chessprogramming.org/Simplified_Evaluation_Function>

let pawnTable =
[
	[0, 0, 0, 0],
	[50, 50, 50, 50],
	[30, 20, 10, 10],
	[25, 10, 5, 5],
	[20, 0, 0, 0],
	[0, -10, -5, 5],
	[-20, 10, 10, 5],
	[0, 0, 0, 0],
]

let knightTable =
[
	[20, 15, 0, -30],
	[15, 10, 5, -30],
	[5, 0, -20, -40],
	[-30, -30, -40, -50],
]

let bishopTable =
[
	[-10, -10, -10, -20],
	[0, 0, 0, -10],
	[10, 5, 0, -10],
	[10, 5, 5, -10],
	[10, 10, 0, -10],
	[10, 10, 10, -10],
	[0, 0, 5, -10],
	[-10, -10, -10, -20],
]

let rookTable =
[
	[0, 0, 0, 0],
	[10, 10, 10, 5],
	[0, 0, 0, -5],
	[0, 0, 0, -5],
	[0, 0, 0, -5],
	[0, 0, 0, -5],
	[0, 0, 0, -5],
	[5, 0, 0, 0],
]

let queenTable =
[
	[5, 5, 0, -5],
	[5, 5, 0, -10],
	[0, 0, 0, -10],
	[-5, -10, -10, -20],
]

let kingMiddleGameTable =
[
	[-50, -40, -40, -30],
	[-50, -40, -40, -30],
	[-50, -40, -40, -30],
	[-50, -40, -40, -30],
	[-40, -30, -30, -20],
	[-20, -20, -20, -10],
	[0, 0, 20, 20],
	[0, 10, 30, 20],
]

// todo: this table is currently unused.
let kingEndGameTable =
[
	[40, 30, -10, -30],
	[30, 20, -10, -30],
	[0, 0, -30, -30],
	[-30, -30, -30, -50],
]

let tableScores = [[100, pawnTable], [320, knightTable], [330, bishopTable], [500, rookTable], [900, queenTable], [5999900, kingMiddleGameTable], [0, kingEndGameTable]]

for (let [score, table] of tableScores)
{
	for (let array of table)
	{
		for (let i of array.keys())
			array[i] += score,
			array[i] /= 100
		
		let others = [...array]
		others.reverse()
		array.unshift(...others)
	}
	
	if (table.length === 4)
	{
		let others = [...table]
		others.reverse()
		table.unshift(...others)
	}
}

let tables = []

for (let [score, table0] of tableScores)
{
	let array = []
	tables.push(array)
	for (let i of [1, -1])
	{
		let table = []
		array.push(table)
		
		for (let x = 0 ; x < 8 ; x++)
		for (let y = 0 ; y < 8 ; y++)
		{
			let y0 = y
			if (i === 1) y0 = 7 - y
			let score = table0[y0][x]
			table[x + y * 8] = score * i
		}
	}
}
