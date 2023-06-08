import {Board} from "../variants.js"

let Rules = (baseBoard, options) =>
{
	if (baseBoard === undefined) return
	
	let {isRoyal, key, flip} = options
	
	let mutableBoard = baseBoard.MutableBoard()
	
	let getMoves = () => filterMoves(mutableBoard.getMoves(), mutableBoard, isRoyal)
	let getCaptures = () => filterMoves(mutableBoard.getCaptures(), mutableBoard, isRoyal)
	
	let at = mutableBoard.at
	let put = mutableBoard.put
	let set = mutableBoard.set
	
	let get = key1 =>
	{
		if (key1 !== key) return mutableBoard.get(key1)
		return isCheck(mutableBoard, {isRoyal, flip})
	}
	
	let clone = () => Rules(mutableBoard.Board(), options)
	
	return {getMoves, getCaptures, at, put, get, set, clone}
}

let failed = Symbol()

let flip0 = key => board =>
{
	let turn = board.get(key)
	if (turn === "white")
	{
		board.set(key, "black")
		return
	}
	if (turn === "black")
	{
		board.set(key, "white")
		return
	}
	return failed
}

let isRoyal0 = piece => piece.type === "king"

export let vary = (baseBoard, variant, {key = "check", turnKey = "turn", isRoyal = isRoyal0, flip = flip0(turnKey)} = {}) =>
{
	if (typeof key !== "string") return
	if (typeof isRoyal !== "function") return
	if (typeof flip !== "function") return
	
	let rules = Rules(baseBoard, {isRoyal, key, flip})
	if (!rules) return
	
	return Board(variant, rules)
}

let isValid = (board, isRoyal) =>
	board.getMoves().every(move =>
	{
		let piece = board.at(move.to)
		return !piece || !isRoyal(piece)
	})

export let isCheck = (board, {turnKey = "turn", isRoyal = isRoyal0, flip = flip0(turnKey)} = {}) =>
{
	if (flip(board) === failed) return false
	let check = !isValid(board, isRoyal)
	if (flip(board) === failed) throw new Error("inconsistent board state: could not flip board back")
	return check
}

let filterMoves = (moves, board, isRoyal) =>
	moves.filter(move =>
	{
		move.play()
		let valid = isValid(board, isRoyal)
		move.unplay()
		return valid
	})
