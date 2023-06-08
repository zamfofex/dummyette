let createStorage = (width, height) =>
{
	if (width === undefined) width = height ?? 8
	if (height === undefined) height = width ?? 8
	
	width = Number(width)
	height = Number(height)
	
	if (!Number.isInteger(width)) return
	if (!Number.isInteger(height)) return
	
	let storage = Array(width * height)
	
	at = position =>
	{
		if (typeof position !== "object") return
		if (position === null) return
		
		let {x, y} = position
		
		x = Number(x)
		y = Number(y)
		
		return storage[x + y * width]
	}
	
	put = (position, value) =>
	{
		if (typeof position !== "object") return
		if (position === null) return
		
		let {x, y} = position
		
		x = Number(x)
		y = Number(y)
		
		storage[x + y * width] = value
	}
	
	return {at, put}
}

let createState = () =>
{
	let state = new Map()
	let get = key => state.get(key)
	let set = (key, value) =>
	{
		if (value === undefined) state.delete(key)
		else state.set(key, value)
	}
	
	return {get, set}
}

let toFunctions = getMoves => () => getMoves().map(move => () => { move.play() ; return move.unplay })

let wrapMoves = (getMoves, before) => () => getMoves().map(move => Object.freeze({...move, before}))

let primitiveTypes = ["string", "boolean", "number", "undefined", "bigint", "symbol"]

export let MutableBoard = (variant, rules) =>
{
	if (typeof variant !== "symbol") return
	
	if (typeof rules === "function") rules = {getMoves: rules}
	if (typeof rules !== "object") return
	
	let {at, put, get, set, clone: cloneRules} = rules
	let {getMoves, getCaptures = getMoves} = rules
	let {getMoveFunctions = toFunctions(getMoves)} = rules
	let {getCaptureFunctions = toFunctions(getCaptures)} = rules
	
	if ((get === undefined) !== (set === undefined)) return
	
	if ((at === undefined) !== (put === undefined)) return
	
	if (get === undefined)
	{
		let state = new Map()
		get = state.get
		set = state.set
	}
	
	if (typeof get !== "function") return
	if (typeof set !== "function") return
	
	let get0 = get
	let set0 = set
	
	get = key =>
	{
		if (!primitiveTypes.includes(typeof key)) return
		let value = get0(key)
		if (!primitiveTypes.includes(typeof value)) return
		return value
	}
	
	set = (key, value) =>
	{
		if (!primitiveTypes.includes(typeof key)) return
		if (!primitiveTypes.includes(typeof value)) return
		set0(key, value)
	}
	
	if (at === undefined)
	{
		let storage = createStorage(get("width"), get("height"))
		if (!storage) return
		
		at = storage.at
		put = storage.put
	}
	
	if (typeof cloneRules !== "function") return
	if (typeof at !== "function") return
	if (typeof put !== "function") return
	if (typeof getMoves !== "function") return
	if (typeof getCaptures !== "function") return
	if (typeof getMoveFunctions !== "function") return
	if (typeof getCaptureFunctions !== "function") return
	
	let clone = () => MutableBoard(variant, cloneRules())
	
	let board =
	{
		variant,
		at, put, get, set,
		clone,
		getMoveFunctions, getCaptureFunctions,
		Board: () => Board(variant, cloneRules()),
	}
	
	board.getMoves = wrapMoves(getMoves, board)
	board.getCaptures = wrapMoves(getCaptures, board)
	
	Object.freeze(board)
	return board
}

export let Board = (variant, rules) =>
{
	let mutableBoard = MutableBoard(variant, rules)
	if (!mutableBoard) return
	return createBoard(mutableBoard)
}

let createBoard = mutableBoard =>
{
	if (mutableBoard === undefined) return
	
	let mutate = f =>
	{
		let board = mutableBoard.clone()
		f(board)
		return createBoard(board)
	}
	
	let put = (position, piece) => mutate(board => board.put(position, piece))
	
	let set = (key, value) => mutate(board => board.set(key, value))
	
	let getMoves = memoise(() =>
	{
		let moves = []
		
		for (let move0 of mutableBoard.getMoves())
		{
			let play = () =>
			{
				move0.play()
				let board = mutableBoard.clone()
				move0.unplay()
				return createBoard(board)
			}
			
			let move = {...move0, play, before: board}
			delete move.unplay
			
			Object.freeze(move)
			moves.push(move)
		}
		
		Object.freeze(moves)
		return moves
	})
	
	let variant = mutableBoard.variant
	
	let width = Number(mutableBoard.get("width"))
	let height = Number(mutableBoard.get("height"))
	
	if (!Number.isInteger(width)) width = undefined
	if (!Number.isInteger(height)) height = undefined
	
	let turn = String(mutableBoard.get("turn"))
	
	if (turn !== "white" && turn !== "black")
		turn = undefined
	
	let isCheck = memoise(() =>
	{
		let value = mutableBoard.get("check")
		if (typeof value !== "boolean") return
		return value
	})
	
	let isCheckmate = () => isCheck() !== false && getMoves().length === 0
	let isStalemate = () => isCheck() === true && getMoves().length !== 0
	
	let board =
	{
		variant,
		turn,
		get: mutableBoard.get, set,
		at: mutableBoard.at, put,
		get check() { return isCheck() },
		get checkmate() { return isCheckmate() },
		get stalemate() { return isStalemate() },
		get draw() { return isStalemate() },
		get moves() { return getMoves() },
		MutableBoard: () => mutableBoard.clone(),
		mutate,
	}
	
	if (width !== undefined) board.width = width
	if (height !== undefined) board.height = height
	if (turn !== undefined) board.turn = turn
	
	Object.freeze(board)
	return board
}

let memoise = f =>
{
	let value
	let g = () => { value = f() ; g = () => value ; return value }
	return () => g()
}
