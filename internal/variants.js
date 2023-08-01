export let Board = base =>
{
	let {variant, width, height, turn, Piece, getMoves: getMoves0, storage: storage0, info, validate, castling, passing} = base
	
	width = Number(width)
	height = Number(height)
	
	if (!Number.isInteger(width)) return
	if (!Number.isInteger(height)) return
	
	if (width <= 0) return
	if (height <= 0) return
	
	let storage = []
	for (let piece of storage0)
	{
		if (storage.length >= width * height) break
		if (piece)
		{
			piece = Piece(piece)
			if (!piece) return
			storage.push(piece)
		}
		else
		{
			storage.push(undefined)
		}
	}
	
	Object.freeze(storage)
	
	let createPosition = (x, y) =>
	{
		let position = Position(x, y)
		if (!position) return
		if (!range(position.x, 0, width - 1)) return
		if (!range(position.y, 0, height - 1)) return
		return position
	}
	
	let positions = []
	for (let x = 0 ; x < width ; x++)
	for (let y = 0 ; y < height ; y++)
		positions.push(createPosition(x, y))
	Object.freeze(positions)
	
	let at = (x, y) =>
	{
		let position = createPosition(x, y)
		if (!position) return
		return storage[position.x + position.y * width]
	}
	
	let byName = (a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0
	
	castling ??= {}
	castling = {white: [...castling.white ?? []].map(p => createPosition(p)), black: [...castling.black ?? []].map(p => createPosition(p))}
	if (!castling.white.every(Boolean)) return
	if (!castling.black.every(Boolean)) return
	
	castling.white = [...new Set(castling.white)]
	castling.black = [...new Set(castling.black)]
	
	castling.white.sort(byName)
	castling.black.sort(byName)
	
	Object.freeze(castling.white, castling.black, castling)
	
	let is = (piece, color, type) => piece && piece.color === color && piece.type === type
	let whitePosition = positions.find(position => is(at(position), "white", "king"))
	let blackPosition = positions.find(position => is(at(position), "black", "king"))
	
	if (!castling.white.every(({y}) => y === whitePosition.y)) return
	if (!castling.black.every(({y}) => y === blackPosition.y)) return
	
	if (!castling.white.every(position => is(at(position), "white", "rook"))) return
	if (!castling.black.every(position => is(at(position), "black", "rook"))) return
	
	passing = createPosition(passing)
	if (passing)
	{
		let pawn = at(passing)
		if (!pawn) return
		
		if (pawn.type !== "pawn") return
		if (pawn.color === turn) return
		
		let a = at(passing.x - 1, passing.y)
		let b = at(passing.x + 1, passing.y)
		
		if (a?.type !== "pawn" || a?.color !== turn)
		if (b?.type !== "pawn" || b?.color !== turn)
			return
	}
	
	Object.assign(base, {width, height, storage, castling, passing})
	
	let contains = (x, y) => Boolean(createPosition(x, y))
	
	let play = (...moves) =>
	{
		if (moves.length === 0) return board
		
		let move = Move(moves[0])
		if (!move) return
		
		let other = move.play()
		return other.play(...moves.slice(1))
	}
	
	let getMoves = memoise(() => getMoves0(board))
	
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
	
	let getter = name => { if (name in info) Object.defineProperty(board, name, {get: memoise(() => info[name](board))}) }
	
	let board =
	{
		variant,
		width, height,
		turn,
		contains,
		Position: createPosition,
		at,
		play,
		Move,
		storage,
		positions,
		castling,
		passing,
		get moves() { return getMoves() },
	}
	
	getter("check")
	getter("checkmate")
	getter("stalemate")
	getter("draw")
	
	Object.freeze(board)
	if (validate(board)) return board
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

export let Position = (value, other) =>
{
	if (other !== undefined) return Position({x: value, y: other})
	if (typeof value === "string") value = getPosition(value)
	if (typeof value !== "object") return
	if (!value) return
	
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

let range = (n, start = -Infinity, end = Infinity) =>
{
	n = Number(n)
	
	if (!Number.isInteger(n)) return false
	
	if (n < start) return false
	if (n > end) return false
	
	return true
}

let memoise = f =>
{
	let value
	let g = () => { value = f() ; g = () => value ; return value }
	return () => g()
}

export let sameBoard = (a, b) =>
{
	if (a.variant !== b.variant) return false
	if (a.width !== b.width) return false
	if (a.height !== b.height) return false
	
	let {width, height} = a
	
	for (let x = 0 ; x < width ; x++)
	for (let y = 0 ; y < width ; y++)
		if (a.at(x, y) !== b.at(x, y)) return false
	
	return true
}
