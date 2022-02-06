let depth = 4

export let traverse = (turn, board, i) =>
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
	
	if (i === depth)
	{
		next = []
	}
	else if (i > 1)
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
		if (turn === "black") boardScore *= -1
		return [boardScore]
	}
	
	let score
	let minimax
	
	if (i % 2 === 0)
		score = Infinity,
		minimax = Math.min
	else
		score = -Infinity,
		minimax = Math.max
	
	for (let move of next)
	{
		move.play()
		score = minimax(score, traverse(turn, board, i + 1)[0])
		move.unplay()
	}
	
	return [score]
}
