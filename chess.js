export let values = {pawn: 1, knight: 3, bishop: 3, rook: 5, queen: 9}
Object.freeze(values)

export let other = color =>
{
	if (color === "white")
		return "black"
	else if (color === "black")
		return "white"
}

export let types = ["pawn", "knight", "bishop", "rook", "queen", "king"]
export let colors = ["white", "black"]
Object.freeze(types)
Object.freeze(colors)

export let pieceList = []
export let pieceNames = []
export let pieces = {}

for (let color of colors)
for (let type of types)
{
	let piece = {color, type}
	Object.freeze(piece)
	
	let name = `${color} ${type}`
	let titleName = color + type[0].toUpperCase() + type.slice(1)
	pieceList.push(piece)
	pieceNames.push(name)
	pieces[name] = piece
	pieces[titleName] = piece
}

Object.freeze(pieceList)
Object.freeze(pieceNames)
Object.freeze(pieces)

export let getPieceName = piece =>
{
	if (!piece) return
	let {color, type} = piece
	color = Color(color)
	type = Type(type)
	if (!color) return
	if (!type) return
	return `${color} ${type}`
}

let Piece = piece =>
{
	let name = getPieceName(piece)
	if (!name) return
	return pieces[name]
}

export let Pawn = color => Piece({type: "pawn", color})
export let Knight = color => Piece({type: "knight", color})
export let Bishop = color => Piece({type: "bishop", color})
export let Rook = color => Piece({type: "rook", color})
export let Queen = color => Piece({type: "queen", color})
export let King = color => Piece({type: "king", color})

export let WhitePiece = type => Piece({type, color: "white"})
export let BlackPiece = type => Piece({type, color: "black"})

export let Color = color =>
{
	color = String(color)
	if (!colors.includes(color)) return
	return color
}

export let Type = type =>
{
	type = String(type)
	if (!type.includes(type)) return
	return type
}

let ordered = [Rook, Knight, Bishop, Queen, King, Bishop, Knight, Rook]

let array = Array(64).fill(null)
let meta = Array(64).fill(null)
meta[4 + 0 * 8] = "both"
meta[4 + 7 * 8] = "both"
for (let x = 0 ; x < 8 ; x++)
{
	array[x + 0 * 8] = ordered[x]("white")
	array[x + 7 * 8] = ordered[x]("black")
	array[x + 1 * 8] = pieces.whitePawn
	array[x + 6 * 8] = pieces.blackPawn
	meta[x + 1 * 8] = "initial"
	meta[x + 6 * 8] = "initial"
}

export let EmptyBoard = (width = 8, height = width) =>
{
	width = Number(width)
	height = Number(height)
	if (!range(width, 1)) return
	if (!range(height, 1)) return
	
	let array = Array(width * height).fill(null)
	
	return createBoard("white", array, {width, height})
}

let createBoard = (turn, array, {width = 8, height = 8, meta = Array(width * height).fill(null)} = {}) =>
{
	Object.freeze(array)
	Object.freeze(meta)
	
	let contains = (x, y) =>
	{
		x = Number(x)
		y = Number(y)
		if (!range(x, 0, width - 1)) return
		if (!range(y, 0, height - 1)) return
		
		return true
	}
	
	let atName = name =>
	{
		name = String(name)
		let position = getPosition(name)
		if (!position) return
		let {x, y} = position
		return at(x, y)
	}
	
	let at = (x, y) =>
	{
		x = Number(x)
		y = Number(y)
		if (!contains(x, y)) return
		return array[x + y * width]
	}
	
	let play = (...names) =>
	{
		if (names.length === 0) return board
		
		let name = String(names[0])
		let move = Move(name)
		if (!move) return
		
		let other = move.play()
		return other.play(...names.slice(1))
	}
	
	let Move = name =>
	{
		name = String(name)
		return getMoves().find(move => move.name === name)
	}
	
	let put = (x, y, piece, option) =>
	{
		x = Number(x)
		y = Number(y)
		if (!contains(x, y)) return
		if (option === undefined) option = null
		if (option !== null) option = String(option)
		
		let i = x + y * width
		
		let nextMeta = [...meta]
		let next = [...array]
		next[i] = piece
		
		if (piece === null)
		{
			nextMeta[i] = null
		}
		else
		{
			piece = Piece(piece)
			if (!piece) return
			
			let m = null
			if (piece.type === "pawn")
			{
				m = "normal"
				if (piece.color === "white")
				{
					if (y === width - 1) return
					if (y <= 1) m = "initial"
				}
				else
				{
					if (y === 0) return
					if (y >= width - 2) m = "initial"
				}
				
				if (option !== null) m = option
				
				if (m !== "initial")
				if (m !== "passing")
				if (m !== "normal")
					return
				
				let pawn = Pawn(other(piece.color))
				if (m === "passing" && at(x - 1, y) !== pawn && at(x + 1, y) !== pawn)
					m = "normal"
			}
			else if (piece.type === "king")
			{
				m = "none"
				if (option !== null) m = option
				
				if (m !== "none")
				if (m !== "both")
				if (m !== "queen side")
				if (m !== "king side")
					return
				
				if (m !== "none")
				{
					if (x <= 1) return
					if (x >= width - 2) return
					
					let queenRook
					let kingRook
					
					if (piece.color === "white")
					{
						if (y !== 0) return
						queenRook = at(0, 0)
						kingRook = at(width - 1, 0)
					}
					else
					{
						if (y !== height - 1) return
						queenRook = at(0, height - 1)
						kingRook = at(width - 1, height - 1)
					}
					
					if (m !== "king side" && queenRook !== Rook(piece.color)) return
					if (m !== "queen side" && kingRook !== Rook(piece.color)) return
				}
			}
			else if (option !== null)
			{
				return
			}
			
			nextMeta[i] = m
		}
		
		for (let x1 = 0 ; x1 < board.width ; x1++)
		for (let y1 = 0 ; y1 < board.height ; y1++)
		{
			let j = x1 + y1 * board.width
			if (array[j]?.type === "pawn" && meta[j] === "passing")
			{
				if (x1 === x && y1 === y) continue
				nextMeta[j] = "normal"
			}
		}
		
		return createBoard(turn, next, {width, height, meta: nextMeta})
	}
	
	let del = (x, y) => put(x, y, null)
	
	let set = (x, y, option) => put(x, y, at(x, y), option)
	
	let get = (x, y) =>
	{
		x = Number(x)
		y = Number(y)
		if (!contains(x, y)) return
		return meta[x + y * width]
	}
	
	let getKingPosition = (color = turn) =>
	{
		let king = King(color)
		if (!king) return
		for (let x = 0 ; x < width ; x++)
		for (let y = 0 ; y < height ; y++)
			if (at(x, y) === king) return Object.freeze({x, y})
	}
	
	let isCheck = memoize(() =>
	{
		let position = getKingPosition(turn)
		if (!position) return false
		let {x, y} = position
		if (threatened(board, x, y, false, turn))
			return true
		return false
	})
	
	let isCheckmate = memoize(() => isCheck() && getMoves().length === 0)
	let isStalemate = memoize(() => !isCheck() && getMoves().length === 0)
	
	let getMoves = memoize(() =>
	{
		let moves = getValidMoves(board)
		Object.freeze(moves)
		return moves
	})
	
	let getScore = (color = turn) =>
	{
		let result = 0
		for (let i = 0 ; i < width * height ; i++)
		{
			let piece = array[i]
			if (!piece) continue
			if (piece.type === "king") continue
			let value = values[piece.type]
			if (piece.color === "white") result += value
			else result -= value
		}
		
		getScore = (color = turn) =>
		{
			if (color === "white") return result
			else if (color === "black") return -result
		}
		
		return getScore(color)
	}
	
	let flip = (color = other(turn)) => createBoard(color, array, {width, height, meta})
	
	let toASCII = (color = "white") =>
	{
		color = Color(color)
		if (!color) return
		
		let ascii = []
		if (color === "white")
		{
			for (let y = height - 1 ; y >= 0 ; y--)
			{
				let rank = []
				for (let x = 0 ; x < width ; x++)
				{
					let piece = array[x + y * board.width]
					let name
					if (piece) name = shortNames[piece.type]
					else name = " "
					if (piece?.color === "white") name = name.toUpperCase()
					rank.push(name)
				}
				ascii.push(rank.join(" "))
			}
		}
		else
		{
			for (let y = 0 ; y < height ; y++)
			{
				let rank = []
				for (let x = width - 1 ; x >= 0 ; x--)
				{
					let piece = array[x + y * board.width]
					let name
					if (piece) name = shortNames[piece.type]
					else name = " "
					if (piece?.color === "white") name = name.toUpperCase()
					rank.push(name)
				}
				ascii.push(rank.join(" "))
			}
		}
		
		return ascii.join("\n")
	}
	
	let board =
	{
		width, height,
		turn, flip,
		contains,
		at, atName,
		play,
		Move,
		put, delete: del,
		get, set,
		getScore,
		getKingPosition,
		toASCII,
		get check() { return isCheck() },
		get checkmate() { return isCheckmate() },
		get stalemate() { return isStalemate() },
		get draw() { return isStalemate() },
		get moves() { return getMoves() },
		get score() { return getScore("white") },
	}
	
	Object.freeze(board)
	return board
}

let memoize = f =>
{
	let value
	let g = () => { value = f() ; g = () => value ; return value }
	return () => g()
}

export let standardBoard = createBoard("white", array, {meta})

export let emptyBoard = createBoard("white", Array(64).fill(null))

let range = (n, start = -Ininifty, end = Infinity) =>
{
	n = Number(n)
	
	// Note: This accounts for fractional numbers, as well as 'NaN'.
	if (Math.floor(n) !== n) return false
	
	// Note: This accounts for positive and negative infinity.
	if (n !== 0 && n / n !== 1) return false
	
	if (n < start) return false
	if (n > end) return false
	
	return true
}

let getPosition = name =>
{
	name = String(name)
	let match = name.match(/^([a-z]+)([1-9][0-9]*)$/)
	if (!match) return
	let [full, file, rank] = match
	
	let x = -1
	let y = Number(rank) - 1
	
	for (let ch of file)
		x *= 26,
		x += parseInt(ch, 36) - 9
	
	return {x, y}
}

let getPositionName = (x, y) =>
{
	let file = ""
	let rank = y + 1
	
	x++
	while (x !== 0)
		file += (x % 26 + 9).toString(36),
		x = Math.floor(x / 26)
	
	return file + rank
}

let shortNames = {pawn: "p", knight: "n", bishop: "b", rook: "r", queen: "q", king: "k"}

let createMove = (board, x, y, x1, y1) =>
{
	if (!board.contains(x1, y1)) return
	
	let piece = board.at(x, y)
	if (!piece) return
	
	let meta = null
	
	let extra = board => board
	
	if (piece.type === "king")
	{
		let threat = threatened(board.delete(x, y), x1, y1, false, piece.color)
		if (threat) return
		
		else if (x1 - x === -2)
			extra = board => board.delete(0, y).put(x1 + 1, y, Rook(piece.color))
		if (x1 - x === 2)
			extra = board => board.delete(board.width - 1, y).put(x1 - 1, y, Rook(piece.color))
	}
	else
	{
		let dx = x1 - x
		let dy = y1 - y
		if (checks(board, x, y, dx, dy)) return
	}
	
	if (piece.type === "rook")
	{
		let other
		if (x === 0) other = "king side"
		if (x === board.width - 1) other = "queen side"
		
		if (other)
		{
			let position = board.getKingPosition()
			if (position?.y === y)
			{
				let meta = board.get(position.x, y)
				if (meta !== "none")
				{
					if (meta === "both") meta = other
					else if (meta !== other) meta = "none"
					extra = board => board.set(position.x, y, meta)
				}
			}
		}
	}
	
	let replacements = [piece]
	if (piece.type === "pawn")
	{
		if (piece.color === "white" && y1 === board.height - 1)
			replacements = [pieces.whiteQueen, pieces.whiteRook, pieces.whiteBishop, pieces.whiteKnight]
		if (piece.color === "black" && y1 === 0)
			replacements = [pieces.blackQueen, pieces.blackRook, pieces.blackBishop, pieces.blackKnight]
		
		if (Math.abs(y1 - y) === 2)
			meta = "passing"
		
		if (x !== x1 && board.get(x1, y) === "passing") extra = board => board.delete(x1, y)
	}
	
	let moves = []
	for (let piece of replacements)
	{
		let play = () => extra(board.delete(x, y).put(x1, y1, piece, meta)).flip()
		
		let name = getPositionName(x, y) + getPositionName(x1, y1)
		if (replacements.length > 1) name += shortNames[piece.type]
		
		moves.push({play, name})
	}
	
	return moves
}

let find = (board, piece, x, y, dx, dy) =>
{
	while (true)
	{
		x += dx
		y += dy
		if (!board.contains(x, y)) return
		if (board.at(x, y) === piece) return [x, y]
		else if (board.at(x, y)) return
	}
}

let checks = (board, x, y, dx, dy) =>
{
	let piece = board.at(x, y)
	
	let color = other(piece.color)
	
	let king = King(piece.color)
	let rook = Rook(color)
	let queen = Queen(color)
	let bishop = Bishop(color)
	
	let rookMoves = []
	if (dx === 0) rookMoves.push([1, 0], [-1, 0])
	else if (dy === 0) rookMoves.push([0, 1], [0, -1])
	else rookMoves.push([1, 0], [-1, 0], [0, 1], [0, -1])
	
	let bishopMoves = []
	if (dx === dy) bishopMoves.push([-1, 1], [1, -1])
	else if (dx === -dy) bishopMoves.push([1, 1], [-1, -1])
	else bishopMoves.push([-1, 1], [1, -1], [1, 1], [-1, -1])
	
	for (let [dx, dy] of rookMoves)
	{
		if (!find(board, king, x, y, dx, dy)) continue
		if (find(board, rook, x, y, -dx, -dy)) return true
		if (find(board, queen, x, y, -dx, -dy)) return true
		break
	}
	for (let [dx, dy] of bishopMoves)
	{
		if (!find(board, king, x, y, dx, dy)) continue
		if (find(board, bishop, x, y, -dx, -dy)) return true
		if (find(board, queen, x, y, -dx, -dy)) return true
		break
	}
}

let threatened = (board, x, y, all, color) =>
{
	let threats = []
	
	let opponent = other(color)
	
	let rook = Rook(opponent)
	let queen = Queen(opponent)
	let bishop = Bishop(opponent)
	let knight = Knight(opponent)
	let pawn = Pawn(opponent)
	let king = King(opponent)
	
	for (let [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]])
	{
		let rookPosition = find(board, rook, x, y, dx, dy)
		if (rookPosition)
			if (all) threats.push(rookPosition)
			else return true
		
		let queenPosition = find(board, queen, x, y, dx, dy)
		if (queenPosition)
			if (all) threats.push(queenPosition)
			else return true
	}
	for (let [dx, dy] of [[-1, 1], [1, -1], [1, 1], [-1, -1]])
	{
		let bishopPosition = find(board, bishop, x, y, dx, dy)
		if (bishopPosition)
			if (all) threats.push(bishopPosition)
			else return true
		
		let queenPosition = find(board, queen, x, y, dx, dy)
		if (queenPosition)
			if (all) threats.push(queenPosition)
			else return true
	}
	
	for (let [dx, dy] of [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]])
		if (board.at(x + dx, y + dy) === knight)
			if (all) threats.push([x + dx, y + dy])
			else return true
	
	let dy = opponent === "white" ? -1 : 1
	for (let dx of [-1, 1])
		if (board.at(x + dx, y + dy) === pawn)
			if (all) threats.push([x + dx, y + dy])
			else return true
	
	for (let [dx, dy] of [[1, 1], [1, -1], [-1, 1], [-1, -1], [0, 1], [0, -1], [1, 0], [-1, 0]])
		if (board.at(x + dx, y + dy) === king)
			if (all) threats.push([x + dx, y + dy])
			else return true
	
	if (all) return threats
	
	return false
}

let uncheck = (board, x, y) =>
{
	let color = board.at(x, y).color
	let opponentColor = other(color)
	let threats = threatened(board, x, y, true, color)
	if (threats.length !== 1) return []
	
	let moves = []
	
	let [x1, y1] = threats[0]
	for (let [x2, y2] of threatened(board, x1, y1, true, opponentColor))
		moves.push(createMove(board, x2, y2, x1, y1))
	
	let block = (x, y) =>
	{
		for (let [x1, y1] of threatened(board, x, y, true, opponentColor))
		{
			let piece = board.at(x1, y1)
			
			// The king cannot block itself from check.
			if (piece.type === "king") continue
			
			// Pawns can only block the check diagonally if there is actually a piece that can be captured there.
			if (piece.type === "pawn" && !board.at(x, y)) continue
			
			moves.push(createMove(board, x1, y1, x, y))
		}
		
		let dy = color === "white" ? 1 : -1
		
		let pawn = Pawn(color)
		
		// Pawns can block the check by moving forwards.
		if (board.at(x, y - dy) === pawn)
			moves.push(createMove(board, x, y - dy, x, y))
		
		// Pawns might also be able to move two squares forward.
		if (board.at(x, y - dy - dy) === pawn)
		if (board.get(x, y - dy - dy) === "initial")
		if (!board.at(x, y - dy))
			moves.push(createMove(board, x, y - dy - dy, x, y))
	}
	
	let dx = x - x1
	let dy = y - y1
	if (dx === 0)
	{
		if (dy < 0)
			for (let y2 = y + 1 ; y2 < y1 ; y2++)
				block(x, y2)
		else
			for (let y2 = y - 1 ; y2 > y1 ; y2--)
				block(x, y2)
	}
	if (dy === 0)
	{
		if (dx < 0)
			for (let x2 = x + 1 ; x2 < x1 ; x2++)
				block(x2, y)
		else
			for (let x2 = x - 1 ; x2 > x1 ; x2--)
				block(x2, y)
	}
	
	if (dx === dy)
	{
		if (dx > 0)
			for (let d = 1 ; d < dx ; d++)
				block(x1 + d, y1 + d)
		else
			for (let d = -1 ; d > dx ; d--)
				block(x1 + d, y1 + d)
	}
	if (dx === -dy)
	{
		if (dx > 0)
			for (let d = 1 ; d < dx ; d++)
				block(x1 + d, y1 - d)
		else
			for (let d = -1 ; d > dx ; d--)
				block(x1 + d, y1 - d)
	}
			
	return moves
}

let createLineMove = (board, x, y, dx, dy) =>
{
	let moves = []
	
	let x1 = x
	let y1 = y
	while (true)
	{
		x1 += dx
		y1 += dy
		if (!board.contains(x1, y1)) break
		let piece = board.at(x1, y1)
		if (piece)
		{
			if (board.at(x, y)?.color !== piece.color)
				moves.push(createMove(board, x, y, x1, y1))
			break
		}
		moves.push(createMove(board, x, y, x1, y1))
	}
	
	return moves
}

let getValidMoves = board =>
{
	let moves = []
	for (let y = 0 ; y < board.height ; y++)
	for (let x = 0 ; x < board.width ; x++)
	{
		let piece = board.at(x, y)
		if (!piece) continue
		if (piece.color !== board.turn) continue
		switch (piece.type)
		{
			case "pawn":
				let dy = piece.color === "white" ? 1 : -1
				let y1 = y + dy
				for (let dx of [1, -1])
				{
					let x1 = x + dx
					let piece2 = board.at(x1, y1)
					if (piece2 && piece.color !== piece2.color)
						moves.push(createMove(board, x, y, x1, y1))
				}
				if (board.get(x, y) === "initial")
				if (!board.at(x, y1) && !board.at(x, y1 + dy))
					moves.push(createMove(board, x, y, x, y1 + dy))
				
				if (!board.at(x, y1))
					moves.push(createMove(board, x, y, x, y1))
				
				let passing = Pawn(other(piece.color))
				if (board.at(x - 1, y) === passing && board.get(x - 1, y) === "passing")
					moves.push(createMove(board, x, y, x - 1, y1))
				if (board.at(x + 1, y) === passing && board.get(x + 1, y) === "passing")
					moves.push(createMove(board, x, y, x + 1, y1))
				
				break
			case "rook":
				for (let [dx, dy] of [[0, 1], [1, 0], [0, -1], [-1, 0]])
					moves.push(createLineMove(board, x, y, dx, dy))
				break
			case "bishop":
				for (let [dx, dy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]])
					moves.push(createLineMove(board, x, y, dx, dy))
				break
			case "knight":
				for (let [dx, dy] of [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]])
				{
					let x1 = x + dx
					let y1 = y + dy
					if (piece.color !== board.at(x1, y1)?.color)
						moves.push(createMove(board, x, y, x1, y1))
				}
				break
			case "queen":
				for (let [dx, dy] of [[0, 1], [1, 0], [0, -1], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]])
					moves.push(createLineMove(board, x, y, dx, dy))
				break
			case "king":
				let checked = threatened(board, x, y, false, piece.color)
				if (checked) moves = uncheck(board, x, y)
				
				for (let [dx, dy] of [[1, 1], [1, -1], [-1, 1], [-1, -1], [0, 1], [0, -1], [1, 0], [-1, 0]])
				{
					let x1 = x + dx
					let y1 = y + dy
					if (piece.color === board.at(x1, y1)?.color) continue
					moves.push(createMove(board, x, y, x1, y1))
				}
				
				if (checked) return moves.flat(Infinity).filter(Boolean)
				
				let meta = board.get(x, y)
				if (meta === "queen side" || meta === "both")
				if (!threatened(board, x - 1, y, false, piece.color))
				if (!threatened(board, x - 2, y, false, piece.color))
				{
					let castling = true
					for (let x1 = x - 1 ; x1 > 1 ; x1--)
						if (board.at(x1, y)) { castling = false ; break }
					
					if (castling) moves.push(createMove(board, x, y, x - 2, y))
				}
				
				if (meta === "king side" || meta === "both")
				if (!threatened(board, x + 1, y, false, piece.color))
				if (!threatened(board, x + 2, y, false, piece.color))
				{
					let castling = true
					for (let x1 = x + 1 ; x1 < board.width - 1 ; x1++)
						if (board.at(x1, y)) { castling = false ; break }
					
					if (castling) moves.push(createMove(board, x, y, x + 2, y))
				}
				
				break
		}
	}
	
	return moves.flat(Infinity).filter(Boolean)
}
