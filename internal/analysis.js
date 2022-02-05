let depth = 4
let spread = 16

export let traverse = (turn, board, i) =>
{
	let moves = board.getMoves()
	
	if (moves.length === 0)
	{
		if ((i % 2 === 0) === board.isCheck())
			return Infinity
		else
			return -Infinity
	}
	
	let next = Array(moves.length).fill()
	for (let [j, move] of moves.entries())
	{
		move.play()
		let score = board.getScore() + Math.random() - 0.5
		if ((i % 2 === 0) !== (turn === "black")) score *= -1
		next[j] = {move, score}
		move.unplay()
	}
	
	if (i === depth)
	{
		let score = board.getScore() + Math.random() - 0.5
		if (turn === "black") score *= -1
		return score
	}
	
	let score
	let minimax
	
	if	(i % 2 === 0)
		score = Infinity,
		minimax = Math.min
	else
		score = -Infinity,
		minimax = Math.max
	
	next.sort((a, b) => b.score - a.score)
	next.length = Math.min(next.length, Math.round(spread * (depth - i) / depth))
	for (let {move} of next)
	{
		move.play()
		score = minimax(score, traverse(turn, board, i + 1))
		move.unplay()
	}
	
	return score
}
