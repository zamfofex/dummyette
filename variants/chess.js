import {Rules, MoveGenerator, TurnRules, SquareGeometry, Storage, Board as VariantBoard} from "../variants.js"

export let types = ["pawn", "knight", "bishop", "rook", "queen", "king"]
export let colors = ["white", "black"]
Object.freeze(types)
Object.freeze(colors)

export let pieceNames = []
export let pieces = []

for (let color of colors)
for (let type of types)
{
	let name = `${color} ${type}`
	let piece = {color, type, name}
	Object.freeze(piece)
	
	let titleName = color + type[0].toUpperCase() + type.slice(1)
	pieces.push(piece)
	pieceNames.push(name)
}

Object.freeze(pieceNames)
Object.freeze(pieces)

export let Piece = ({color, type}) =>
{
	color = Color(color)
	type = Type(type)
	let name = `${color} ${type}`
	return pieces.find(piece => piece.name === name)
}

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

export let Pawn = color => Piece({type: "pawn", color})
export let Knight = color => Piece({type: "knight", color})
export let Bishop = color => Piece({type: "bishop", color})
export let Rook = color => Piece({type: "rook", color})
export let Queen = color => Piece({type: "queen", color})
export let King = color => Piece({type: "king", color})

export let WhitePiece = type => Piece({type, color: "white"})
export let BlackPiece = type => Piece({type, color: "black"})

export let whitePawn = Pawn("white")
export let whiteKnight = Knight("white")
export let whiteBishop = Bishop("white")
export let whiteRook = Rook("white")
export let whiteQueen = Queen("white")
export let whiteKing = King("white")

export let blackPawn = Pawn("black")
export let blackKnight = Knight("black")
export let blackBishop = Bishop("black")
export let blackRook = Rook("black")
export let blackQueen = Queen("black")
export let blackKing = King("black")

let createMoveGenerator = (createMoves, a, b, piece, {capturable = other => other.color !== piece.color}) =>
{
	if (piece === undefined) return
	
	a = Number(a)
	b = Number(b)
	
	if (!Number.isInteger(a)) return
	if (!Number.isInteger(b)) return
	
	if (a < 0) return
	if (b < 0) return
	
	if (a === 0 && b === 0) return
	
	let getMoves = storage =>
	{
		let moves = []
		
		let addMoves = (x, y) => createMoves(moves, x, y, piece, capturable, storage)
		
		addMoves(a, b)
		if (a > 0) addMoves(-a, b)
		if (b > 0) addMoves(a, -b)
		if (a > 0 && b > 0) addMoves(-a, -b)
		
		if (a !== b)
		{
			addMoves(b, a)
			if (a > 0) addMoves(b, -a)
			if (b > 0) addMoves(-b, a)
			if (a > 0 && b > 0) addMoves(-b, -a)
		}
		
		Object.freeze(moves)
		return moves
	}
	
	return MoveGenerator(getMoves)
}

let createJumperMoves = (moves, dx, dy, piece, capturable, storage) =>
{
	for (let from of storage.geometry.positions)
	{
		let value = storage.at(from)
		if (value !== piece) continue
		
		let to = storage.geometry.Position({x: from.x + dx, y: from.y + dy})
		if (!to) continue
		
		let other = storage.at(to)
		if (other !== undefined && !capturable(other)) continue
		
		moves.push({movements: [{from, to}]})
	}
	
	return moves
}

let createSliderMoves = (moves, dx, dy, piece, capturable, storage) =>
{
	for (let from of storage.geometry.positions)
	{
		let value = storage.at(from)
		if (value !== piece) continue
		
		let x = from.x
		let y = from.y
		while (true)
		{
			x += dx
			y += dy
			
			let to = storage.geometry.Position({x, y})
			if (!to) break
			
			let other = storage.at(to)
			if (other !== undefined && !capturable(other)) break
			
			moves.push({movements: [{from, to}]})
			
			if (other !== undefined) break
		}
	}
	
	return moves
}

export let JumperRules = (a, b, piece, options) => Rules({getMoves: createMoveGenerator(createJumperMoves, a, b, piece, options)})
export let SliderRules = (a, b, piece, options) => Rules({getMoves: createMoveGenerator(createSliderMoves, a, b, piece, options)})

let ForwardPawnRules = (dy, piece) => Rules(
{
	getMoves: storage =>
	{
		let moves = []
		for (let from of storage.geometry.positions)
		{
			let value = storage.at(from)
			if (value !== piece) continue
			
			let x = from.x
			let y = from.y + dy
			
			let to = storage.geometry.Position({x, y})
			if (!to) continue
			
			if (storage.at({x, y: from.y + Math.sign(dy)}) !== undefined) continue
			if (storage.at(to) !== undefined) continue
			
			moves.push({movements: [{from, to}]})
		}
		
		return moves
	}
})

let PawnCaptureRules = (piece, dy, {capturable = other => other.color !== piece.color}) => Rules(
{
	getMoves: storage =>
	{
		let moves = []
		for (let from of storage.geometry.positions)
		{
			let value = storage.at(from)
			if (value !== piece) continue
			
			for (let dx of [-1, 1])
			{
				let x = from.x + dx
				let y = from.y + dy
				
				let to = storage.geometry.Position({x, y})
				if (!to) continue
				
				let other = storage.at(to)
				if (other === undefined) continue
				if (!capturable(other)) continue
				
				moves.push({movements: [{from, to}]})
			}
		}
		
		return moves
	}
})

let lowRanks = move => move.movements.every(({from}) => from.y < 2)
let highRanks = (move, storage) => move.movements.every(({from}) => from.y >= storage.geometry.info.height - 2)

export let PromotionRules = (rules, piece, pieces, {y = -1} = {}) =>
{
	y = Number(y)
	if (!Number.isInteger(y)) return
	
	rules = Rules(rules)
	if (!rules) return
	
	return rules.flatMapMoves((move, storage, state) =>
	{
		let y1 = y
		if (y1 < 0) y1 += storage.geometry.info.height
		
		if (y1 < 0) return [move]
		if (y1 >= storage.geometry.info.height) return [move]
		
		let result = move.apply(storage, state)
		
		let moves = [move]
		for (let x = 0 ; x < storage.geometry.info.width ; x++)
		{
			let to = storage.geometry.Position({x, y: y1})
			if (result.storage.at(to) !== piece) continue
			moves = moves.flatMap(move => pieces.map(piece => ({...move, movements: [...move.movements, {to, piece}]})))
		}
		
		return moves
	})
}

export let RegularWhitePawnRules = piece => ForwardPawnRules(1, piece)
export let RegularBlackPawnRules = piece => ForwardPawnRules(-1, piece)

export let DoubleWhitePawnRules = piece => ForwardPawnRules(2, piece)
export let DoubleBlackPawnRules = piece => ForwardPawnRules(-2, piece)

export let InitialWhitePawnRules = piece => DoubleWhitePawnRules(piece).filterMoves(lowRanks)
export let InitialBlackPawnRules = piece => DoubleBlackPawnRules(piece).filterMoves(highRanks)

export let WhitePawnCaptureRules = (piece, options = {}) => PawnCaptureRules(piece, 1, options)
export let BlackPawnCaptureRules = (piece, options = {}) => PawnCaptureRules(piece, -1, options)

export let WhitePawnRules = (piece, options = {}) =>
	PromotionRules(
		Rules(
			RegularWhitePawnRules(piece),
			InitialWhitePawnRules(piece),
			WhitePawnCaptureRules(piece, options),
		),
		piece,
		options.pieces,
	)

export let BlackPawnRules = (piece, options = {}) =>
	PromotionRules(
		Rules(
			RegularBlackPawnRules(piece),
			InitialBlackPawnRules(piece),
			BlackPawnCaptureRules(piece, options),
		),
		piece,
		options.pieces,
		{y: 0},
	)

export let KnightRules = (piece, options = {}) => JumperRules(1, 2, piece, options)
export let BishopRules = (piece, options = {}) => SliderRules(1, 1, piece, options)
export let RookRules = (piece, options = {}) => SliderRules(0, 1, piece, options)
export let QueenRules = (piece, options = {}) => Rules(BishopRules(piece, options), RookRules(piece, options))
export let KingRules = (piece, options = {}) => Rules(JumperRules(0, 1, piece, options), JumperRules(1, 1, piece, options))

export let CheckRules = (rules, [...pieces]) =>
	Rules(
	{
		isValid: (storage, state) =>
		{
			let moves = rules.getMoves(storage, state)
			
			for (let move of moves)
			{
				let result = move.apply(storage, state)
				if (!rules.isValid(result.storage, result.state))
					continue
				
				for (let {to} of move.movements)
					if (pieces.includes(storage.at(to)))
						return false
			}
			
			return true
		},
	})

export let ExistenceRules = piece => Rules(
{
	isValid: storage =>
	{
		for (let position of storage.geometry.positions)
			if (storage.at(position) === piece)
				return true
		return false
	},
})

export let UniquenessRules = piece => Rules(
{
	isValid: storage =>
	{
		let count = 0
		for (let position of storage.geometry.positions)
		{
			if (storage.at(position) === piece)
				count++
			if (count > 1) return false
		}
		return true
	},
})

export let RoyaltyRules = (rules, pieces) => Rules(CheckRules(rules, pieces), ...pieces.map(piece => ExistenceRules(piece)), ...pieces.map(piece => UniquenessRules(piece)))

export let EnPassantRules = (rules, piece, otherPiece, n = 1, name = "passing") =>
{
	rules = Rules(rules)
	if (!rules) return
	
	n = Number(n)
	if (n !== 1 && n !== -1) return
	
	rules = rules.mapMoves((move, storage) =>
	{
		let passing = []
		for (let {from, to, apply} of move.movements)
		{
			if (!from) continue
			if (!to) continue
			
			if (storage.at(from) !== piece) continue
			storage = apply(storage)
			if (!storage) return
			
			if (to.y - from.y === 2 * n && from.x === to.x)
			if (storage.at({x: to.x + 1, y: to.y}) === otherPiece || storage.at({x: to.x - 1, y: to.y}) === otherPiece)
				passing.push(to.name)
		}
		
		Object.freeze(passing)
		if (passing.length === 0) passing = undefined
		return {...move, state: {...move.state, [name]: passing}}
	})
	
	return Rules(
		rules,
		{
			isValid: (storage, state) =>
			{
				if (state[name] === undefined) return true
				if (!(state[name] instanceof Array)) return false
				if (state[name].length === 0) return false
				
				for (let position of state[name])
				{
					if (typeof position !== "string") return false
					position = storage.geometry.Position(position)
					if (!position) return false
					if (storage.at(position) !== otherPiece) return false
					
					let {x, y} = position
					if (storage.at({x: x - 1, y}) !== piece)
					if (storage.at({x: x + 1, y}) !== piece)
						return false
				}
				
				return true
			},
			getMoves: (storage, state) =>
			{
				if (state[name] === undefined) return []
				
				let moves = []
				for (let position of state.passing)
				{
					if (typeof position !== "string") continue
					position = storage.geometry.Position(position)
					if (!position) continue
					if (storage.at(position) !== otherPiece) continue
					
					let {x, y} = position
					if (storage.at({x: x - 1, y}) === piece)
						moves.push({state: {[name]: undefined}, movements: [{from: {x: x - 1, y}, to: {x, y: y + n}}, {from: position}]})
					if (storage.at({x: x + 1, y}) === piece)
						moves.push({state: {[name]: undefined}, movements: [{from: {x: x + 1, y}, to: {x, y: y + n}}, {from: position}]})
				}
				
				return moves
			},
		},
	)
}

function * range(a, b)
{
	let i = Math.sign(b - a)
	while (true)
	{
		a += i
		if (a === b) break
		yield a
	}
}

export let CastlingRules = (king, rook, name = "castling", isValid = () => true) => Rules(
{
	getMoves: (storage, state) =>
	{
		if (state[name] === undefined) return []
		if (!(state[name] instanceof Array)) return []
		
		let moves = []
		for (let [i, position] of state[name].entries())
		{
			if (typeof position !== "string") continue
			position = storage.geometry.Position(position)
			if (!position) continue
			
			if (storage.at(position) === undefined) continue
			
			outer:
			for (let x = 0 ; x < storage.geometry.info.width ; x++)
			{
				let kingPosition = storage.geometry.Position({x, y: position.y})
				if (storage.at(kingPosition) !== king) continue
				
				for (let x of range(kingPosition.x, position.x))
					if (storage.at({x, y: position.y}) !== undefined)
						continue outer
				
				if (!isValid(storage, state)) continue
				
				let kingTo
				let rookTo
				if (position.x < x)
					kingTo = {x: 2, y: position.y},
					rookTo = {x: 3, y: position.y}
				else
					kingTo = {x: storage.geometry.info.width - 2, y: position.y},
					rookTo = {x: storage.geometry.info.width - 3, y: position.y}
				
				let storage2 = storage.delete(position)?.delete(kingPosition)
				
				if (storage2)
				{
					for (let x of range(kingPosition.x, kingTo.x))
					{
						storage2 = storage2.put({x, y: position.y}, king)
						if (!storage2) break
						if (!isValid(storage2, state)) continue outer
					}
				}
				
				let castling = [...state[name]]
				castling.splice(i, 1)
				if (castling.length === 0) castling = undefined
				
				moves.push({state: {[name]: castling}, movements: [{from: kingPosition, to: kingTo}, {from: position, to: rookTo}]})
			}
		}
		
		return moves
	},
	isValid: (storage, state) =>
	{
		if (state[name] === undefined) return true
		if (!(state[name] instanceof Array)) return false
		if (state[name].length === 0) return false
		
		let last
		for (let position of state[name])
		{
			if (typeof position !== "string") return false
			position = storage.geometry.Position(position)
			if (!position) return false
			
			if (last !== undefined && last >= position.name)
				return false
			
			last = position.name
			
			if (storage.at(position) !== rook) return false
			
			for (let x = 0 ; x < storage.geometry.info.width ; x++)
				if (storage.at({x, y: position.y}) === king)
					return true
			
			return false
		}
		
		return true
	}
})

export let CastlingRevocationRules = (rules, king, rook, name = "castling") => Rules(rules).mapMoves((move, storage, state) =>
{
	for (let {from} of move.movements)
		if (storage.at(from) === king)
			return {...move, state: {...move.state, [name]: undefined}}
	
	let result = move.apply(storage, state)
	
	let castling = result.state[name]
	if (castling === undefined) return move
	if (!(castling instanceof Array)) return move
	
	castling = castling.filter(position =>
	{
		if (typeof position !== "string") return true
		return result.storage.at(position) === rook
	})
	
	if (castling.length === 0) castling = undefined
	
	return {...move, state: {...move.state, [name]: castling}}
})

let knightSteps = [[1, 2], [-1, 2], [1, -2], [-1, -2], [2, 1], [-2, 1], [2, -1], [-2, -1]]
let bishopSteps = [[1, 1], [-1, 1], [1, -1], [-1, -1]]
let rookSteps = [[0, 1], [0, -1], [1, 0], [-1, 0]]
let queenSteps = [...bishopSteps, ...rookSteps]
let kingSteps = queenSteps

let jumperSteps = [[Knight, knightSteps], [King, kingSteps]]
let sliderSteps = [[Bishop, bishopSteps], [Rook, rookSteps], [Queen, queenSteps]]

let isAttacked = (storage, position) =>
{
	let piece = storage.at(position)
	if (!piece) return false
	let color = piece.color === "white" ? "black" : "white"
	
	let {x, y} = position
	
	for (let [create, steps] of jumperSteps)
	{
		let attacker = create(color)
		for (let [dx, dy] of steps)
		{
			if (storage.at({x: x + dx, y: y + dy}) === attacker)
				return true
		}
	}
	
	for (let [create, steps] of sliderSteps)
	{
		let attacker = create(color)
		for (let [dx, dy] of steps)
		{
			let x0 = x
			let y0 = y
			while (true)
			{
				x0 += dx
				y0 += dy
				let position = storage.geometry.Position({x: x0, y: y0})
				if (!position) break
				let piece = storage.at(position)
				if (!piece) continue
				if (piece !== attacker) break
				return true
			}
		}
	}
	
	let pawn = Pawn(color)
	let dy = color === "white" ? -1 : 1
	if (storage.at({x: x + 1, y: y + dy}) === pawn) return true
	if (storage.at({x: x - 1, y: y + dy}) === pawn) return true
	
	return false
}

// note: this cannot be 'let checkRules = CheckRules(pieceRules, [whiteKing, blackKing])'
// because that is way too slow
let checkRules = Rules(
{
	isValid: (storage, state) =>
	{
		let king = King(state.turn === "white" ? "black" : "white")
		let position = storage.geometry.positions.find(position => storage.at(position) === king)
		return !isAttacked(storage, position)
	},
})

let whitePawnRules = WhitePawnRules(whitePawn, {pieces: [whiteQueen, whiteRook, whiteBishop, whiteKnight, whiteKing]})
let blackPawnRules = BlackPawnRules(blackPawn, {pieces: [blackQueen, blackRook, blackBishop, blackKnight, blackKing]})

let whiteKnightRules = KnightRules(whiteKnight)
let blackKnightRules = KnightRules(blackKnight)

let whiteBishopRules = BishopRules(whiteBishop)
let blackBishopRules = BishopRules(blackBishop)

let whiteRookRules = RookRules(whiteRook)
let blackRookRules = RookRules(blackRook)

let whiteQueenRules = QueenRules(whiteQueen)
let blackQueenRules = QueenRules(blackQueen)

let whiteKingRules = KingRules(whiteKing)
let blackKingRules = KingRules(blackKing)

let whitePieceRules0 = Rules(whitePawnRules, whiteKnightRules, whiteBishopRules, whiteRookRules, whiteQueenRules, whiteKingRules)
let blackPieceRules0 = Rules(blackPawnRules, blackKnightRules, blackBishopRules, blackRookRules, blackQueenRules, blackKingRules)

let AttackPredicate = piece => storage => !isAttacked(storage, storage.geometry.positions.find(position => storage.at(position) === piece))

let whitePieceCastlingRules = CastlingRules(whiteKing, whiteRook, "whiteCastling", AttackPredicate(whiteKing))
let blackPieceCastlingRules = CastlingRules(blackKing, blackRook, "blackCastling", AttackPredicate(blackKing))

let whitePieceRules1 = Rules(whitePieceRules0, whitePieceCastlingRules)
let blackPieceRules1 = Rules(blackPieceRules0, blackPieceCastlingRules)

let whitePieceRules2 = EnPassantRules(whitePieceRules1, whitePawn, blackPawn)
let blackPieceRules2 = EnPassantRules(blackPieceRules1, blackPawn, whitePawn, -1)

let WhiteCastlingRevocation = rules => CastlingRevocationRules(rules, whiteKing, whiteRook, "whiteCastling")
let BlackCastlingRevocation = rules => CastlingRevocationRules(rules, blackKing, blackRook, "blackCastling")
let ChessCastlingRevocation = rules => WhiteCastlingRevocation(BlackCastlingRevocation(rules))

let pieceRules = ChessCastlingRevocation(
	TurnRules({},
		{color: "white", rules: whitePieceRules2},
		{color: "black", rules: blackPieceRules2},
	),
)

let royaltyRules =
	Rules(
		checkRules,
		ExistenceRules(whiteKing),
		ExistenceRules(blackKing),
		UniquenessRules(whiteKing),
		UniquenessRules(blackKing),
	)

let knownStateKeys = ["turn", "passing", "whiteCastling", "blackCastling"]
let disallowUnknownStateKeys = Rules(
{
	isValid: (storage, state) =>
	{
		for (let key in state)
			if (!knownStateKeys.includes(key))
				return false
		return true
	},
})

let disallowUnknownPieces = Rules(
{
	isValid: storage =>
	{
		for (let position in storage.geometry.positions)
		{
			let piece = storage.at(position)
			if (piece === undefined) continue
			if (!pieces.includes(piece))
				return false
		}
		return true
	},
})

export let isCheck = ({storage, state}) =>
{
	let king = King(state.turn)
	let position = storage.geometry.positions.find(position => storage.at(position) === king)
	return isAttacked(storage, position)
}

export let isCheckmate = board => board.moves.length === 0 && isCheck(board)
export let isStalemate = board => board.moves.length === 0 && !isCheck(board)

export let Board960 = (n = Math.floor(Math.random() * 960)) =>
{
	n = Number(n)
	if (!Number.isInteger(n)) return n
	if (n < 0) return
	if (n >= 960) return
	
	let storage = Storage({geometry})
	let available = Array(8).fill().map((n, i) => i)
	
	let next = m =>
	{
		let result = n % m
		n = Math.floor(n / m)
		return result
	}
	
	let place = (type, x) =>
	{
		let whitePiece = Piece({type, color: "white"})
		let blackPiece = Piece({type, color: "black"})
		
		storage = storage.put({x, y: 0}, whitePiece)
		storage = storage.put({x, y: 1}, whitePawn)
		
		storage = storage.put({x, y: 7}, blackPiece)
		storage = storage.put({x, y: 6}, blackPawn)
		
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
	
	let castling = [available[0], available[2]]
	let whiteCastling = castling.map(x => geometry.Position({x, y: 0}).name)
	let blackCastling = castling.map(x => geometry.Position({x, y: 7}).name)
	
	place("rook", available[0])
	place("king", available[0])
	place("rook", available[0])
	
	return VariantBoard({storage, state: {turn: "white", whiteCastling, blackCastling}, rules})
}

export let geometry = SquareGeometry(8)
export let rules = Rules(pieceRules, royaltyRules, disallowUnknownStateKeys, disallowUnknownPieces)

export let standardBoard = Board960(518)
export let {storage, state} = standardBoard

export let Board = ({storage: storage0 = storage, state: state0 = state} = {}) => VariantBoard({storage: storage0, state: state0, rules})

let shortNames = {pawn: "p", knight: "n", bishop: "b", rook: "r", queen: "q", king: "k"}

export let toASCII = (storage, color = "white") =>
{
	let ascii = []
	for (let y0 = 0 ; y0 < storage.geometry.info.height ; y0++)
	{
		let rank = []
		for (let x0 = 0 ; x0 < storage.geometry.info.width ; x0++)
		{
			let x = x0
			let y = y0
			
			if (color === "white") y = storage.geometry.info.height - 1 - y
			else x = storage.geometry.info.width - 1 - x
			
			let piece = storage.at({x, y})
			let name
			if (piece) name = shortNames[piece.type]
			else name = " "
			if (piece?.color === "white") name = name.toUpperCase()
			rank.push(name)
		}
		ascii.push(rank.join(" "))
	}
	
	return ascii.join("\n")
}

export let isCastling = move =>
{
	if (move.movements.length !== 2) return false
	if (move.movements[0].piece.type !== "king") return false
	if (move.movements[1].piece.type !== "rook") return false
	return true
}

export let isLowCastling = move =>
{
	if (!isCastling(move)) return false
	return move.movements[0].to.x === 2
}

export let isHighCastling = move =>
{
	if (!isCastling(move)) return false
	return move.movements[0].to.x === move.before.storage.geometry.info.width - 2
}

export let isEnPassant = move =>
{
	if (move.movements.length !== 2) return false
	if (move.movements[0].piece.type !== "pawn") return false
	return true
}

export let capturedPiece = move =>
{
	if (isEnPassant(move)) return move.movements[1].piece
	return move.before.storage.at(move.movements[0].to)
}

export let promotionPiece = move =>
{
	if (move.movements.length !== 2) return false
	if (isEnPassant(move)) return false
	return move.movements[1].piece
}
