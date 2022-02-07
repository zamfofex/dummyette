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
	
	let boardScore = board.getScore()
	
	let next = moves
	
	if (i > 2)
	{
		next = []
		for (let move of moves)
		{
			move.play()
			
			let score = board.getScore()
			let turnScore = score
			if (turn === "black") turnScore *= -1
			if (i % 2 !== 0) turnScore *= -1
			
			if (i < 4 && board.isCheck() || turnScore >= 0 && score !== boardScore)
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
		score = minimax(score, traverse(turn, board, i + 1))
		move.unplay()
	}
	
	return score
}
