export let traverse = (turn, board, depth, i = 0) =>
{
	let moves = board.getMoves()
	
	if (moves.length === 0)
	{
		if ((i % 2 === 0) === board.isCheck())
			return [Infinity, i]
		else
			return [-Infinity, i]
	}
	
	let boardScore = board.getScore()
	
	let next = moves
	
	if (i > depth)
	{
		next = []
	}
	else if (i > 2)
	{
		next = []
		for (let move of moves)
		{
			move.play()
			if (board.isCheck() || board.getScore() !== boardScore)
				next.push(move)
			move.unplay()
		}
	}
	
	if (next.length === 0)
	{
		if (turn === "black") return [-boardScore]
		else return [boardScore]
	}
	
	let score
	let minimax
	
	if (i % 2 === 0)
		score = [Infinity],
		minimax = (a, b) => a[0] < b[0] ? a : b
	else
		score = [-Infinity],
		minimax = (a, b) => a[0] > b[0] ? a : b
	
	for (let move of next)
	{
		move.play()
		score = minimax(score, traverse(turn, board, depth, i + 1))
		move.unplay()
	}
	
	return score
}
