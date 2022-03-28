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

export let sameBoard = (a, b) =>
{
	if (a.width !== b.width) return false
	if (a.height !== b.height) return false
	
	let {width, height} = a
	
	for (let x = 0 ; x < width ; x++)
	for (let y = 0 ; y < width ; y++)
	{
		if (a.at(x, y) !== b.at(x, y)) return false
		if (a.get(x, y) !== b.get(x, y)) return false
	}
	
	return true
}

let range = (n, start = -Infinity, end = Infinity) =>
{
	n = Number(n)
	
	if (!Number.isInteger(n)) return false
	
	if (n < start) return false
	if (n > end) return false
	
	return true
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
	
	let play = (...moves) =>
	{
		if (moves.length === 0) return board
		
		let move = Move(moves[0])
		if (!move) return
		
		let other = move.play()
		return other.play(...moves.slice(1))
	}
	
	let Move = move =>
	{
		let moves = getMoves()
		if (moves.includes(move)) return move
		
		let name = move
		if (typeof move !== "string")
		{
			if (!sameBoard(board, move.before))
				return
			name = move.name
		}
		
		return moves.find(move => move.name === name)
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
		
		if (piece === undefined) piece = null
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
	
	let set = (x, y, meta) =>
	{
		let position = createPosition(x)
		if (position)
		{
			meta = y
		}
		else
		{
			position = createPosition(x, y)
			if (!position) return
		}
		
		return put(position, at(position), meta)
	}
	
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
		return attacked(board, x, y, turn)
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

export let Board960 = (n = Math.floor(Math.random() * 960)) =>
{
	n = Number(n)
	if (!range(n, 0, 959)) return
	
	let board = emptyBoard
	let available = Array(8).fill().map((n, i) => i)
	
	let next = m =>
	{
		let result = n % m
		n = Math.floor(n / m)
		return result
	}
	
	let place = (type, x) =>
	{
		let meta = null
		if (type === "king") meta = "initial"
		if (type === "rook") meta = "initial"
		let white = Piece({type, color: "white"})
		let black = Piece({type, color: "black"})
		
		board = board.put(x, 0, white, meta)
		board = board.put(x, 1, pieces.whitePawn, "initial")
		
		board = board.put(x, 7, black, meta)
		board = board.put(x, 6, pieces.blackPawn, "initial")
		
		available.splice(available.indexOf(x), 1)
	}
	
	place("bishop", next(4) * 2 + 1)
	place("bishop", next(4) * 2)
	
	place("queen", available[next(6)])
	
	if (n < 4)
	{
		place("knight", available[0])
		place("knight", available[n])
	}
	else if (n < 7)
	{
		place("knight", available[1])
		place("knight", available[n - 3])
	}
	else if (n < 9)
	{
		place("knight", available[2])
		place("knight", available[n - 5])
	}
	else
	{
		place("knight", available[3])
		place("knight", available[3])
	}
	
	place("rook", available[0])
	place("king", available[0])
	place("rook", available[0])
	
	return board
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

export let emptyBoard = EmptyBoard()

export let standardBoard = Board960(518)

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

let createMoves = (board, moves, x, y, x1, y1, rook, capturedPosition) =>
{
	if (!board.contains(x1, y1)) return
	
	let piece = board.at(x, y)
	let meta = null
	
	if (!capturedPosition) capturedPosition = Position(x1, y1)
	let capturedPiece = board.at(capturedPosition)
	let captured
	
	if (rook)
	{
		rook.piece = board.at(rook.from)
		Object.freeze(rook)
	}
	else if (capturedPiece)
	{
		captured = {piece: capturedPiece, position: capturedPosition}
		Object.freeze(captured)
	}
	
	let replacements = [piece]
	if (piece.type === "pawn")
	{
		if (piece.color === "white" && y1 === board.height - 1 || piece.color === "black" && y1 === 0)
			replacements = [Queen, Rook, Bishop, Knight].map(f => f(piece.color))
		
		if (Math.abs(y1 - y) === 2)
			meta = "passing"
	}
	
	let extra = board => board
	if (rook) extra = board => board.delete(rook.from).put(rook.to, rook.piece)
	if (capturedPosition.y !== y1) extra = board => board.delete(capturedPosition)
	
	for (let replacement of replacements)
	{
		let play = () => extra(board.delete(x, y)).put(x1, y1, replacement, meta).flip()
		
		let from = Position(x, y)
		let to = Position(x1, y1)
		
		let name = from.name + to.name
		let move = {play, name, from, to, piece, before: board}
		
		if (replacements.length > 1)
			move.name += shortNames[replacement.type],
			move.promotion = replacement
		
		if (captured) move.captured = captured
		
		// castling
		if (rook)
		{
			move.rook = rook
			
			x1 = rook.to.x + Math.sign(move.to.x - move.from.x)
			move.to = Position(x1, y1)
			
			if (attacked(board, x, y1, piece.color)) return
			
			let dx = Math.sign(move.to.x - move.from.x)
			
			for (let x0 = x + dx ; x0 !== x1 ; x0 += dx)
			{
				if (attacked(board, x0, y1, piece.color)) return
				
				let other = board.at(x0, y1)
				if (other === rook.piece) continue
				if (other) return
			}
			
			let rdx = Math.sign(rook.to.x - rook.from.x)
			for (let x1 = rook.from.x + rdx ; x1 !== rook.to.x ; x1 += rdx)
			{
				let other = board.at(x1, y)
				if (other === piece) continue
				if (other) return
			}
			
			let other = board.at(rook.to.x, y)
			if (other && other !== piece) return
			
			if (board.width === 8)
			if (rook.from.x === 0 || rook.from.x === 7)
			if (x === 4)
				move.name = from.name + to.name
		}
		
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

let attacked = (board, x, y, color) =>
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
					createMoves(board, moves, x, y, x - 1, y1, null, Position(x - 1, y))
				if (board.at(x + 1, y) === passing && board.get(x + 1, y) === "passing")
					createMoves(board, moves, x, y, x + 1, y1, null, Position(x + 1, y))
				
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
					for (let [dx, toX] of [[-1, 3], [1, board.width - 3]])
					{
						let rookX = x
						
						while (board.at(rookX, y) !== rook)
						{
							rookX += dx
							if (rookX < 0) continue rooksLoop
							if (rookX >= board.width) continue rooksLoop
						}
						
						if (board.get(rookX, y) !== "initial") continue
						
						createMoves(board, moves, x, y, rookX, y, {from: Position(rookX, y), to: Position(toX, y, rook)})
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
	return !attacked(board, position.x, position.y, color)
}

export let Game = (...entries) =>
{
	let boards = [standardBoard]
	let moves = []
	
	for (let move of entries)
	{
		let board = boards[boards.length - 1]
		move = board.Move(move)
		if (!move) return
		moves.push(move)
		boards.push(move.play())
	}
	
	let finished = boards[boards.length - 1].moves.length === 0
	let ongoing = !finished
	
	let deltas = []
	for (let move of moves)
	{
		let delta = {before: move.before, move, after: move.play()}
		Object.freeze(delta)
		deltas.push(delta)
	}
	
	let game = {boards, moves, deltas, finished, ongoing}
	
	Object.freeze(boards)
	Object.freeze(moves)
	Object.freeze(deltas)
	Object.freeze(game)
	
	return game
}
