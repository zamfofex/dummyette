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
	
	let score
	let minimax
	
	if (i % 2 === 0)
		score = [Infinity],
		minimax = (a, b) => a[0] < b[0] ? a : b
	else
		score = [-Infinity],
		minimax = (a, b) => a[0] > b[0] ? a : b
	
	if (i > 2)
	{
		let boardScore = board.getScore()
		let done = true
		
		for (let move of moves)
		{
			move.play()
			
			let moveScore = board.getScore()
			let turnScore = moveScore
			if (turn === "black") turnScore *= -1
			if (i % 2 === 0) turnScore *= -1
			
			if (i < 4 && board.isCheck() || turnScore <= 0 && moveScore !== boardScore)
				score = minimax(score, traverse(turn, board, i + 1)),
				done = false
			
			move.unplay()
		}
		
		if (done)
		{
			if (turn === "black") return [-boardScore]
			else return [boardScore]
		}
	}
	else
	{
		for (let move of moves)
		{
			move.play()
			score = minimax(score, traverse(turn, board, i + 1))
			move.unplay()
		}
	}
	
	return score
}
