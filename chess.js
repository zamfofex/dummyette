/// <reference path="./types/chess.d.ts" />
/// <reference types="./types/chess.d.ts" />

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
	let name = `${color} ${type}`
	let piece = {color, type, name}
	Object.freeze(piece)
	
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
	piece = Piece(piece)
	if (!piece) return
	return piece.name
}

export let Piece = ({color, type}) =>
{
	let name = `${color} ${type}`
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

// king meta values
meta[4 + 0 * 8] = "initial"
meta[4 + 7 * 8] = "initial"

// rook meta values
meta[0] = "initial"
meta[7] = "initial"
meta[0 + 7 * 8] = "initial"
meta[7 + 7 * 8] = "initial"

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
	
	let createPosition = (x, y) =>
	{
		let position = Position(x, y)
		if (!position) return
		if (!range(position.x, 0, width - 1)) return
		if (!range(position.y, 0, height - 1)) return
		return position
	}
	
	let contains = (x, y) => Boolean(createPosition(x, y))
	
	let at = (x, y) =>
	{
		let position = createPosition(x, y)
		if (!position) return
		return array[position.x + position.y * width]
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
	
	let put = (x, y, piece, metaValue) =>
	{
		let position = createPosition(x)
		if (position)
		{
			metaValue = piece
			piece = y
		}
		else
		{
			position = createPosition(x, y)
			if (!position) return
		}
		
		x = position.x
		y = position.y
		
		if (metaValue === undefined) metaValue = null
		if (metaValue !== null) metaValue = String(metaValue)
		
		let i = x + y * width
		
		let nextMeta = [...meta]
		let next = [...array]
		
		if (piece === null)
		{
			metaValue = null
		}
		else
		{
			piece = Piece(piece)
			if (!piece) return
		}
		
		next[i] = piece
		nextMeta[i] = metaValue
		
		for (let x1 = 0 ; x1 < board.width ; x1++)
		for (let y1 = 0 ; y1 < board.height ; y1++)
		{
			if (x1 === x && y1 === y) continue
			let j = x1 + y1 * board.width
			if (nextMeta[j] === "passing")
				nextMeta[j] = null
		}
		
		return createBoard(turn, next, {width, height, meta: nextMeta})
	}
	
	let del = (x, y) => put(x, y, null)
	
	let set = (x, y, meta) => put(x, y, at(x, y), meta)
	
	let get = (x, y) =>
	{
		let position = createPosition(x, y)
		if (!position) return
		return meta[position.x + position.y * width]
	}
	
	let getKingPosition = (color = turn) =>
	{
		let king = King(color)
		if (!king) return
		for (let x = 0 ; x < width ; x++)
		for (let y = 0 ; y < height ; y++)
			if (at(x, y) === king) return Position(x, y)
	}
	
	let isCheck = memoize(() =>
	{
		let position = getKingPosition(turn)
		if (!position) return false
		let {x, y} = position
		return threatened(board, x, y, turn)
	})
	
	let isCheckmate = memoize(() => isCheck() && getMoves().length === 0)
	let isStalemate = memoize(() => !isCheck() && getMoves().length === 0)
	
	let getMoves = memoize(() => getValidMoves(board))
	
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
		Position: createPosition,
		at, atName: at,
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

export let Position = (value, other) =>
{
	if (other !== undefined) return Position({x: value, y: other})
	if (typeof value === "string") value = getPosition(value)
	if (typeof value !== "object") return
	
	let {x, y} = value
	
	x = Number(x)
	y = Number(y)
	
	if (!range(x, 0)) return
	if (!range(y, 0)) return
	
	let file = ""
	let rank = String(y + 1)
	
	let x1 = x + 1
	while (x1 !== 0)
		file += (x1 % 26 + 9).toString(36),
		x1 = Math.floor(x1 / 26)
	
	let position = {x, y, file, rank, name: file + rank}
	Object.freeze(position)
	return position
}

let memoize = f =>
{
	let value
	let g = () => { value = f() ; g = () => value ; return value }
	return () => g()
}

export let standardBoard = createBoard("white", array, {meta})

export let emptyBoard = createBoard("white", Array(64).fill(null))

let range = (n, start = -Infinity, end = Infinity) =>
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
	
	let x = 0
	let y = Number(rank) - 1
	
	for (let ch of file)
		x *= 26,
		x += parseInt(ch, 36) - 9
	x--
	
	return {x, y}
}

let shortNames = {pawn: "p", knight: "n", bishop: "b", rook: "r", queen: "q", king: "k"}

let createMoves = (board, moves, x, y, x1, y1, extra = board => board) =>
{
	if (!board.contains(x1, y1)) return
	
	let piece = board.at(x, y)
	let meta = null
	
	let replacements = [piece]
	if (piece.type === "pawn")
	{
		if (piece.color === "white" && y1 === board.height - 1 || piece.color === "black" && y1 === 0)
			replacements = [Queen, Rook, Bishop, Knight].map(f => f(piece.color))
		
		if (Math.abs(y1 - y) === 2)
			meta = "passing"
	}
	
	for (let piece of replacements)
	{
		let play = () => extra(board.delete(x, y).put(x1, y1, piece, meta)).flip()
		
		let from = Position(x, y)
		let to = Position(x1, y1)
		
		let name = from.name + to.name
		if (replacements.length > 1) name += shortNames[piece.type]
		
		let move = {play, name, from, to}
		Object.freeze(move)
		moves.push(move)
	}
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

let threatened = (board, x, y, color) =>
{
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
		if (rookPosition) return true
		
		let queenPosition = find(board, queen, x, y, dx, dy)
		if (queenPosition) return true
	}
	for (let [dx, dy] of [[-1, 1], [1, -1], [1, 1], [-1, -1]])
	{
		let bishopPosition = find(board, bishop, x, y, dx, dy)
		if (bishopPosition) return true
		
		let queenPosition = find(board, queen, x, y, dx, dy)
		if (queenPosition) return true
	}
	
	for (let [dx, dy] of [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]])
		if (board.at(x + dx, y + dy) === knight)
			return true
	
	let dy = opponent === "white" ? -1 : 1
	for (let dx of [-1, 1])
		if (board.at(x + dx, y + dy) === pawn)
			return true
	
	for (let [dx, dy] of [[1, 1], [1, -1], [-1, 1], [-1, -1], [0, 1], [0, -1], [1, 0], [-1, 0]])
		if (board.at(x + dx, y + dy) === king)
			return true
	
	return false
}

let createLineMoves = (board, moves, x, y, dx, dy) =>
{
	let x1 = x
	let y1 = y
	let color = board.at(x, y).color
	while (true)
	{
		x1 += dx
		y1 += dy
		if (!board.contains(x1, y1)) break
		let piece = board.at(x1, y1)
		if (color !== piece?.color)
			createMoves(board, moves, x, y, x1, y1)
		if (piece) break
	}
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
						createMoves(board, moves, x, y, x1, y1)
				}
				if (board.get(x, y) === "initial")
				if (!board.at(x, y1) && !board.at(x, y1 + dy))
					createMoves(board, moves, x, y, x, y1 + dy)
				
				if (!board.at(x, y1))
					createMoves(board, moves, x, y, x, y1)
				
				let passing = Pawn(other(piece.color))
				if (board.at(x - 1, y) === passing && board.get(x - 1, y) === "passing")
					createMoves(board, moves, x, y, x - 1, y1, board => board.delete(x - 1, y))
				if (board.at(x + 1, y) === passing && board.get(x + 1, y) === "passing")
					createMoves(board, moves, x, y, x + 1, y1, board => board.delete(x + 1, y))
				
				break
			case "rook":
				for (let [dx, dy] of [[0, 1], [1, 0], [0, -1], [-1, 0]])
					createLineMoves(board, moves, x, y, dx, dy)
				break
			case "bishop":
				for (let [dx, dy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]])
					createLineMoves(board, moves, x, y, dx, dy)
				break
			case "knight":
				for (let [dx, dy] of [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]])
				{
					let x1 = x + dx
					let y1 = y + dy
					if (piece.color !== board.at(x1, y1)?.color)
						createMoves(board, moves, x, y, x1, y1)
				}
				break
			case "queen":
				for (let [dx, dy] of [[0, 1], [1, 0], [0, -1], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]])
					createLineMoves(board, moves, x, y, dx, dy)
				break
			case "king":
				for (let [dx, dy] of [[1, 1], [1, -1], [-1, 1], [-1, -1], [0, 1], [0, -1], [1, 0], [-1, 0]])
				{
					let x1 = x + dx
					let y1 = y + dy
					if (piece.color === board.at(x1, y1)?.color) continue
					createMoves(board, moves, x, y, x1, y1)
				}
				
				let meta = board.get(x, y)
				let rook = Rook(piece.color)
				if (meta === "initial" && !board.check)
				{
					rooksLoop:
					for (let [dx, rookX] of [[1, board.width - 1], [-1, 0]])
					{
						if (board.at(rookX, y) !== rook) continue
						if (board.get(rookX, y) !== "initial") continue
						if (threatened(board, x + dx, y, piece.color)) continue
						if (threatened(board, x + 2 * dx, y, piece.color)) continue
						
						for (let x1 = x + dx ; x1 !== rookX ; x1 += dx)
							if (board.at(x1, y)) continue rooksLoop
						
						createMoves(board, moves, x, y, x + 2 * dx, y, board => board.delete(rookX, y).put(x + dx, y, rook))
					}
				}
				
				break
		}
	}
	
	moves = moves.filter(move => isValid(move.play()))
	Object.freeze(moves)
	return moves
}

let isValid = board =>
{
	let color = other(board.turn)
	let position = board.getKingPosition(color)
	if (!position) return true
	return !threatened(board, position.x, position.y, color)
}
