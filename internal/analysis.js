let min = (a, b) => a[0] < b[0] ? a : b
let max = (a, b) => a[0] > b[0] ? a : b

export let traverse = (turn, board, i = 0) =>
{
	let moves = board.getMoves()
	
	if (moves.length === 0)
	{
		if (!board.isCheck()) return [0]
		if (i % 2 === 0)
			return [Infinity, i]
		else
			return [-Infinity, i]
	}
	
	if (i === 3)
	{
		let score = board.getScore()
		if (turn === "black") score *= -1
		score += moves.length / 10
		
		return [score]
	}
	
	let score
	let minimax
	
	if (i % 2 === 0)
		score = [Infinity],
		minimax = min
	else
		score = [-Infinity],
		minimax = max
	
	for (let move of moves)
	{
		move.play()
		score = minimax(score, traverse(turn, board, i + 1))
		move.unplay()
	}
	
	return score
}
