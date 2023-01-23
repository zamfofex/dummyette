let isGeometry = Symbol()

export let Geometry = givenGeometry =>
{
	if (givenGeometry[isGeometry]) return givenGeometry
	
	let {positions, Position, info} = givenGeometry
	
	if (Position === undefined) Position = () => { }
	
	if (typeof Position !== "function")
		return
	
	let map = new Map()
	
	for (let position of positions)
	{
		position = Position(position)
		if (!position) continue
		
		let name = position.name
		while (map.has(name)) name += "'"
		position = {...position, name}
		Object.freeze(position)
		
		map.set(name, position)
	}
	
	let getPosition = (...coordinates) =>
	{
		let position
		if (coordinates.length !== 1)
			position = Position(...coordinates)
		else
			position = coordinates[0]
		
		if (position === undefined) return
		
		if (typeof position === "object")
			position = position.name
		
		if (typeof position === "string")
		{
			let result = map.get(position)
			if (result) return result
		}
		
		if (coordinates.length !== 1) return
		return getPosition(Position(coordinates[0]))
	}
	
	let array = [...map].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)
	array = array.map(([name, position]) => position)
	Object.freeze(array)
	
	let geometry = {positions: array, Position: getPosition, [isGeometry]: true}
	
	info = State(info)
	if (info) geometry.info = info
	
	Object.freeze(geometry)
	return geometry
}

export let Storage = ({geometry, at}) =>
{
	geometry = Geometry(geometry)
	if (!geometry) return
	
	if (at === undefined) at = () => { }
	
	let map = new Map()
	for (let position of geometry.positions)
	{
		let value = at(position)
		if (value === undefined) continue
		map.set(position, value)
	}
	
	return createStorage(geometry, map)
}

let createStorage = (geometry, values) =>
{
	let at = (...coordinates) => values.get(geometry.Position(...coordinates))
	
	let del = (...coordinates) =>
	{
		let position = geometry.Position(...coordinates)
		if (!position) return
		let values2 = new Map([...values])
		values2.delete(position)
		return createStorage(geometry, values2)
	}
	
	let put = (...coordinates) =>
	{
		if (coordinates.length === 0) return
		
		let [value] = coordinates.splice(-1, 1)
		let position = geometry.Position(...coordinates)
		if (!position) return
		
		let values2 = new Map([...values])
		if (value === undefined) values2.delete(position)
		else values2.set(position, value)
		
		return createStorage(geometry, values2)
	}
	
	let storage = {geometry, at, put, delete: del}
	Object.freeze(storage)
	
	return storage
}

export let SquarePosition = (value, other) =>
{
	if (other !== undefined) return SquarePosition({x: value, y: other})
	if (typeof value !== "object") return
	
	let {x, y} = value
	
	x = Number(x)
	y = Number(y)
	
	if (!Number.isInteger(x)) return
	if (!Number.isInteger(y)) return
	
	if (x < 0) return
	if (y < 0) return
	
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

export let SquareGeometry = (width, height = width) =>
{
	width = Number(width)
	height = Number(height)
	
	if (!Number.isInteger(width))
	if (width !== Infinity)
		return
	
	if (!Number.isInteger(height))
	if (height !== Infinity)
		return
	
	if (width <= 0) return
	if (height <= 0) return
	
	let Position = (x, y) =>
	{
		let position = SquarePosition(x, y)
		if (!position) return
		if (position.x >= width) return
		if (position.y >= height) return
		return position
	}
	
	let positions = []
	for (let y = 0 ; y < height ; y++)
	for (let x = 0 ; x < width ; x++)
		positions.push(Position(x, y))
	Object.freeze(positions)
	
	return Geometry({Position, positions, info: {width, height}})
}

export let SquareStorage = (width, height = width) => Storage({geometry: SquareGeometry(width, height)})

let memoise = f =>
{
	let value
	let g = () => { value = f() ; g = () => value ; return value }
	return () => g()
}

export let State = state =>
{
	state = clone(state)
	if (typeof state !== "object") return
	if (state instanceof Array) return
	return state
}

let primitiveTypes = ["string", "number", "boolean", "undefined", "bigint"]
let clone = (value, preserveUndefined) =>
{
	if (value === null) value = undefined
	
	if (value instanceof Array)
	{
		value = value.map(value => clone(value, preserveUndefined))
		Object.freeze(value)
		return value
	}
	
	if (!primitiveTypes.includes(typeof value))
	{
		let result = {}
		for (let [name, other] of Object.entries(value))
		{
			other = clone(other, preserveUndefined)
			if (!preserveUndefined && other === undefined) continue
			result[name] = other
		}
		Object.freeze(result)
		return result
	}
	
	return value
}

let sameState = (a, b) =>
{
	if (typeof a !== typeof b) return false
	if (primitiveTypes.includes(typeof a)) return a === b
	if ((a instanceof Array) !== (b instanceof Array)) return false
	if (a instanceof Array)
	{
		if (a.length !== b.length) return false
		for (let i of a.keys())
			if (!sameState(a[i], b[i]))
				return false
		return true
	}
	
	if (Object.keys(a).length !== Object.keys(b).length) return false
	for (let name of Object.keys(a))
		if (!sameState(a[name], b[name]))
			return false
	return true
}

export let sameBoard = (a, b) =>
{
	if (a.rules !== b.rules) return false
	if (!sameState(a.state, b.state)) return false
	
	for (let position of a.storage.geometry.positions)
		if (!b.storage.geometry.Position(position))
			return false
	for (let position of b.storage.geometry.positions)
		if (!a.storage.geometry.Position(position))
			return false
	for (let position of a.storage.geometry.positions)
		if (a.storage.at(position) !== b.storage.at(position))
			return false
	
	return true
}

let Move = ({state = {}, movements = []}, geometry) =>
{
	state = clone(state, true)
	if (typeof state !== "object") return
	
	let moveMovements = []
	for (let {from, to, piece} of movements)
	{
		if (from)
		{
			from = geometry.Position(from)
			if (!from) return
		}
		
		if (to)
		{
			to = geometry.Position(to)
			if (!to) return
		}
		
		if (!from && !to) return
		
		if (!from && piece === undefined) return
		
		let movement = {}
		if (from) movement.from = from
		if (to) movement.to = to
		if (piece !== undefined) movement.piece = piece
		
		movement.apply = storage =>
		{
			storage = Storage(storage)
			if (!storage) return
			
			if (from)
			{
				if (piece === undefined) piece = storage.at(from)
				storage = storage.delete(from)
			}
			
			if (to) storage = storage.put(to, piece)
			
			return storage
		}
		
		Object.freeze(movement)
		moveMovements.push(movement)
	}
	
	Object.freeze(moveMovements)
	
	let apply = (storage, state) =>
	{
		storage = Storage(storage)
		if (!storage) return
		
		state = State(state)
		if (!state) return
		
		for (let movement of moveMovements)
		{
			storage = movement.apply(storage)
			if (!storage) return
		}
		
		state = State({...state, ...move.state})
		
		let result = {storage, state}
		Object.freeze(result)
		
		return result
	}
	
	let move = {state, movements: moveMovements, apply}
	
	Object.freeze(move)
	return move
}

export let MoveGenerator = (...generators) =>
{
	for (let getMoves of generators)
		if (typeof getMoves !== "function")
			return
	
	return (storage, state) =>
	{
		storage = Storage(storage)
		if (!storage) return
		
		state = State(state)
		if (!state) return
		
		let moves = []
		for (let getMoves of generators)
		{
			for (let move of getMoves(storage, state))
			{
				move = Move(move, storage.geometry)
				if (!move) continue
				moves.push(move)
			}
		}
		
		Object.freeze(moves)
		return moves
	}
}

export let Validator = (...validators) =>
{
	for (let isValid of validators)
		if (typeof isValid !== "function")
			return
	
	return (storage, state) =>
	{
		storage = Storage(storage)
		if (!storage) return
		
		state = State(state)
		if (!state) return
		
		for (let isValid of validators)
			if (!isValid(storage, state))
				return false
		
		return true
	}
}

export let Rules = (...rulesets) =>
{
	let generators = []
	let validators = []
	for (let rules of rulesets)
	{
		if (!rules) return
		
		let {getMoves, isValid} = rules
		
		if (getMoves !== undefined)
		{
			if (typeof getMoves !== "function") return
			generators.push(getMoves)
		}
		if (isValid !== undefined)
		{
			if (typeof isValid !== "function") return
			validators.push(isValid)
		}
	}
	
	let getMoves = MoveGenerator(...generators)
	if (!getMoves) return
	
	let isValid = Validator(...validators)
	if (!isValid) return
	
	let filterMoves = f =>
		Rules({getMoves: (storage, state) => getMoves(storage, state).filter(move => f(move, storage, state)), isValid})
	
	let mapMoves = f =>
		Rules({getMoves: (storage, state) => getMoves(storage, state).map(move => f(move, storage, state)), isValid})
	
	let flatMapMoves = f =>
		Rules({getMoves: (storage, state) => getMoves(storage, state).flatMap(move => f(move, storage, state)), isValid})
	
	let rules = {getMoves, isValid, filterMoves, mapMoves, flatMapMoves}
	Object.freeze(rules)
	return rules
}

export let TurnRules = ({name = "turn"}, ...specifications) =>
{
	if (specifications.length === 0) return
	
	let colors = specifications.map(({color}) => clone(color))
	
	let rulesets = []
	for (let [i, {rules}] of specifications.entries())
	{
		let next = colors[(i + 1) % colors.length]
		let color = colors[i]
		
		rules = rules
			.filterMoves((move, storage, state) => state[name] === color)
			.mapMoves(move => ({...move, state: {...move.state, [name]: next}}))
		
		let isValid = (storage, state) => state[name] !== color || rules.isValid(storage, state)
		
		rulesets.push({...rules, isValid})
	}
	
	return Rules(...rulesets, {isValid: (storage, state) => colors.includes(state[name])})
}

export let Board = ({storage, state, rules}) =>
{
	storage = Storage(storage)
	if (!storage) return
	
	if (state === undefined) state = {}
	state = State(state)
	if (typeof state !== "object") return
	
	rules = Rules(rules)
	if (!rules) return
	
	if (!rules.isValid(storage, state)) return
	
	return createBoard(storage, state, rules)
}

let warnings = new Set()
let warn = (type, message) =>
{
	if (warnings.has(type)) return
	warnings.add(type)
	console.trace(`'${type}' is deprecated (and will be removed eventually): ` + message)
}

let DeprecatedField = (obj, objName) => (name, message, f) => Object.defineProperty(obj, name, {get: () => { warn(`${objName}.${name}`, message) ; return f() }})
let DeprecatedFunction = (obj, objName) => (name, message, f) => obj[name] = (...args) => { warn(`${objName}.${name}(...)`, message) ; return f(...args) }

let createBoard = (storage, state, rules) =>
{
	let createMove = ({apply, movements, state: moveState}, moves = new Map()) =>
	{
		let result = apply(storage, state)
		if (!rules.isValid(result.storage, result.state)) return
		
		let parts = []
		
		let moveMovements = []
		
		for (let {from, to, piece: promotion} of movements)
		{
			let part
			if (!from)
				part = "@" + to.name
			else if (!to)
				part = "#" + from.name
			else
				part = from.name + to.name
			
			let piece
			if (from)
			{
				piece = board.storage.at(from)
				if (!promotion) promotion = piece
			}
			
			if (promotion !== piece) part += `[${promotion.name}]`
			parts.push(part)
			
			let movement = {}
			
			if (piece !== undefined) movement.moved = piece
			if (promotion !== undefined) movement.piece = promotion
			if (from) movement.from = from
			if (to)
			{
				movement.to = to
				let captured = board.storage.at(to)
				if (captured !== undefined) movement.captured = captured
			}
			
			Object.freeze(movement)
			moveMovements.push(movement)
		}
		
		Object.freeze(moveMovements)
		
		let play = () => createBoard(result.storage, result.state, rules)
		
		let name = parts.join(":")
		if (parts.length === 0) name = "null"
		
		while (moves.has(name)) name += "'"
		
		let move = {name, movements: moveMovements, play, before: board, state: moveState}
		
		let deprecatedField = DeprecatedField(move, "move")
		
		deprecatedField("from", "use 'move.movements' instead", () => move.movements[0].from)
		deprecatedField("to", "use 'move.movements' instead", () => move.movements[0].to)
		deprecatedField("piece", "use 'move.movements' instead", () => move.movements[0].piece)
		deprecatedField("rook", "use 'isCastling()' instead", () => { })
		deprecatedField("promotion", "use 'promotionPiece()' instead", () => { })
		
		Object.freeze(move)
		return move
	}
	
	let getMoves = memoise(() =>
	{
		let moves = new Map()
		
		let moves0 = rules.getMoves(storage, state)
		if (!moves0) return
		
		for (let move of moves0)
		{
			move = createMove(move, moves)
			if (!move) continue
			moves.set(move.name, move)
		}
		
		moves = [...moves.values()]
		Object.freeze(moves)
		return moves
	})
	
	let play = (...moves) =>
	{
		if (moves.length === 0) return board
		
		let move = Move(moves[0])
		if (!move) return
		
		let other = move.play()
		if (!other) return
		return other.play(...moves.slice(1))
	}
	
	let Move = move =>
	{
		if (move === undefined) return
		
		let moves = getMoves()
		if (moves.includes(move)) return move
		
		let name = move
		if (typeof move !== "string")
		{
			if (move.before !== undefined && !sameBoard(board, move.before))
				return
			if (move.name !== undefined) name = move.name
			else name = createMove(move).name
		}
		
		return moves.find(move => move.name === name)
	}
	
	let board =
	{
		storage, state, rules,
		play, Move,
		get moves() { return getMoves() },
	}
	
	let deprecatedField = DeprecatedField(board, "board")
	let deprecatedFunction = DeprecatedFunction(board, "board")
	
	deprecatedField("width", "use 'board.storage.geometry.info.width' instead (or 'board.storage.geometry.positions')", () => board.storage.geometry.info.width)
	deprecatedField("height", "use 'board.storage.geometry.info.height' instead (or 'board.storage.geometry.positions')", () => board.storage.geometry.info.height)
	deprecatedField("turn", "use 'board.state.turn' instead", () => board.state.turn)
	deprecatedFunction("at", "use 'board.storage.at(...) instead'", board.storage.at)
	deprecatedFunction("atName", "use 'board.storage.at(...) instead'", board.storage.at)
	deprecatedFunction("contains", "use 'board.storage.geometry.positions.includes(...)' instead'", (...args) => board.storage.geometry.Position(...args) !== undefined)
	deprecatedFunction("Position", "use 'board.storage.geometry.Position(...)' instead'", board.storage.geometry.Position)
	deprecatedFunction("get", "use 'board.state' instead", () => { })
	deprecatedFunction("set", "setting the state is not supported anymore", () => board)
	deprecatedFunction("put", "use 'board.storage.put(...)' instead", (...args) => Board({storage: storage.put(...args), state, rules}))
	deprecatedFunction("flip", "use 'board.state' instead", () => { })
	deprecatedFunction("delete", "use 'board.storage.delete(...)' instead", (...args) => Board({storage: storage.delete(...args), state, rules}))
	deprecatedField("check", "use 'isCheck(board)' instead'", () => false)
	deprecatedField("checkmate", "use 'isCheckmate(board) instead'", () => false)
	deprecatedField("stalemate", "use 'isStalemate(board) instead'", () => false)
	deprecatedField("draw", "use 'isStalemate(board)' instead'", () => false)
	deprecatedFunction("getScore", "use a 'for' loop instead", () => 0)
	deprecatedField("score", "use a 'for' loop instead", () => 0)
	deprecatedFunction("getKingPosition", "use a 'for' loop instead", () => { })
	deprecatedFunction("toASCII", "use 'toASCII(board.storage, color)' instead", "???")
	deprecatedFunction("flip", "use 'board.state' instead", (turn = board.state.turn !== "white" ? "white" : "black") => Board({storage, state: {...board.state, turn}, rules}))
	
	Object.freeze(board)
	return board
}
