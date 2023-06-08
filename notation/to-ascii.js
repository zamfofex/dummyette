import {Color} from "../variants/checkless-chess.js"

let shortNames = {pawn: "p", knight: "n", bishop: "b", rook: "r", queen: "q", king: "k"}

let toStandardShortName = piece =>
{
	let name = shortNames[piece.type]
	if (piece.color === "white") name = name.toUpperCase()
	return name
}

export let fromBoard = (board, color = "white", toShortName = toStandardShortName) =>
{
	color = Color(color)
	if (!color) return
	
	let ascii = []
	for (let y0 = 0 ; y0 < board.height ; y0++)
	{
		let rank = []
		for (let x0 = 0 ; x0 < board.width ; x0++)
		{
			let x = x0
			let y = y0
			
			if (color === "white") y = board.height - 1 - y
			else x = board.width - 1 - x
			
			let piece = board.at({x, y})
			let name = piece === undefined ? " " : toShortName(piece) ?? "?"
			name = String(name)
			rank.push(name)
		}
		ascii.push(rank.join(" "))
	}
	
	return ascii.join("\n")
}
