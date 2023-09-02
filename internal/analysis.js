export let Node = (board, parent, play) => ({board, parent, play, score: 0, visits: 0, children: []})

export let confidence = node =>
{
	if (node.visits === 0) return Infinity
	return node.score / node.visits + 1.4 * Math.sqrt(Math.log(node.parent.visits) / node.visits)
}

let select = node =>
{
	while (node.children.length !== 0)
	{
		let max
		let maxConfidence = -Infinity
		for (let child of node.children)
		{
			let c = confidence(child)
			if (c > maxConfidence)
			{
				max = child
				maxConfidence = c
			}
		}
		node = max
		node.unplay = node.play()
	}
	return node
}

let expand = node =>
{
	for (let play of node.board.getMoves())
		node.children.push(Node(node.board, node, play))
}

let table = (i, n) =>
{
	if (n === 0) return 0
	let table = tables[(n >>> 4) - 1][(n & 0x0F) - 1]
	return table[i]
}

let evaluate = node =>
{
	let score = 0
	for (let i = 0 ; i < 64 ; i++)
		score += table(i, node.board.array[i])
	if (node.board.turn[0]) score *= -1
	if (Math.abs(score) > 5000) score *= Infinity
	if (!Number.isFinite(score)) node.children = []
	return 1 / (1 + 10 ** (-score / 4))
}

let backpropagate = (node, score) =>
{
	while (node)
	{
		node.unplay?.()
		node.visits++
		node.score += score
		node = node.parent
		score = 1 - score
	}
}

let toName = ({from, to, promotion = ""}) =>
{
	let x0 = from % 8
	let x1 = to % 8
	let y0 = Math.floor(from / 8)
	let y1 = Math.floor(to / 8)
	return String.fromCodePoint(x0 + 0x61, y0 + 0x31, x1 + 0x61, y1 + 0x31) + promotion
}

export let serialise = (node, root = true) =>
{
	let {score, visits, children} = node
	let result = {score, visits, children: children.map(node => serialise(node, false))}
	if (root)
	{
		for (let [i, {play}] of children.entries())
			result.children[i].name = toName(play)
	}
	return result
}

export let deserialise = (serialised, board, parent, play) =>
{
	let {score, visits, children} = serialised
	let node = {board, parent, play, score, visits}
	node.unplay = play?.()
	let moves = children.length !== 0 && board.getMoves()
	node.children = children.map((child, i) => deserialise(child, board, node, moves[i]))
	node.unplay?.()
	return node
}

export let traverse = (board, node) =>
{
	if (node) node = deserialise(node, board)
	else node = Node(board)
	
	for (let i = 0 ; i < 2048 ; i++)
	{
		let leaf = select(node)
		expand(leaf)
		backpropagate(leaf, evaluate(leaf))
	}
	
	return {node: serialise(node), score: node.visits}
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
