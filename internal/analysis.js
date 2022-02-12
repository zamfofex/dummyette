let min = (a, b) => a[0] < b[0] ? a : b
let max = (a, b) => a[0] > b[0] ? a : b

export let traverse = (turn, board, depth, moves = board.getMoves(), i = 0) =>
{
	if (moves.length === 0)
	{
		if (!board.isCheck()) return [0]
		if (i % 2 === 0)
			return [Infinity, i]
		else
			return [-Infinity, i]
	}
	
	if (i > depth)
	{
		let score = board.getScore()
		if (turn === "black") score *= -1
		score += moves.length / 10
		
		return [score]
	}
	
	let next = []
	
	for (let move of moves)
	{
		move.play()
		
		let score = board.getScore()
		if (turn === "black") score *= -1
		if (i % 2 === 0) score *= -1
		let moves = board.getMoves()
		score += moves.length / 10
		next.push([score, move, moves])
		
		move.unplay()
	}
	
	let length = Math.ceil((depth - i + 1) * 6 / (depth + 1))
	
	next.sort(([a], [b]) => b - a)
	if (next.length > length) next.length = length
	
	let score
	let minimax
	
	if (i % 2 === 0)
		score = [Infinity],
		minimax = min
	else
		score = [-Infinity],
		minimax = max
	
	for (let [{}, move, moves] of next)
	{
		move.play()
		score = minimax(score, traverse(turn, board, depth, moves, i + 1))
		move.unplay()
	}
	
	return score
}
