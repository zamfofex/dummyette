export type Values = {pawn: 1, knight: 3, bishop: 3, rook: 5, queen: 9}

export type Colors = ["white", "black"]
export type Color = Colors[number]
export type Colorish = string

export type Types = ["pawn", "knight", "bishop", "rook", "queen", "king"]
export type Type = Types[number]
export type Typeish = string

export type Pawn<C extends Color> = {color: C, type: "pawn", name: `${C} pawn`}
export type Knight<C extends Color> = {color: C, type: "knight", name: `${C} knight`}
export type Bishop<C extends Color> = {color: C, type: "bishop", name: `${C} bishop`}
export type Rook<C extends Color> = {color: C, type: "rook", name: `${C} rook`}
export type Queen<C extends Color> = {color: C, type: "queen", name: `${C} queen`}
export type King<C extends Color> = {color: C, type: "king", name: `${C} king`}

export type WhitePiece<T extends Type> = {color: "white", type: T, name: `white ${T}`}
export type BlackPiece<T extends Type> = {color: "black", type: T, name: `black ${T}`}

export type WhitePawn = Pawn<"white">
export type WhiteKnight = Knight<"white">
export type WhiteBishop = Bishop<"white">
export type WhiteRook = Rook<"white">
export type WhiteQueen = Queen<"white">
export type WhiteKing = King<"white">

export type BlackPawn = Pawn<"black">
export type BlackKnight = Knight<"black">
export type BlackBishop = Bishop<"black">
export type BlackRook = Rook<"black">
export type BlackQueen = Queen<"black">
export type BlackKing = King<"black">

export type WhitePieces = [WhitePawn, WhiteKnight, WhiteBishop, WhiteRook, WhiteQueen, WhiteKing]
export type BlackPieces = [BlackPawn, BlackKnight, BlackBishop, BlackRook, BlackQueen, BlackKing]

export type Pieces = [...WhitePieces, ...BlackPieces]
export type Piece = Pieces[number]
export type Pieceish = {color: Colorish, type: Typeish}

export type PieceNames =
[
	"white pawn", "white knight", "white bishop", "white rook", "white queen", "white king",
	"black pawn", "black knight", "black bishop", "black rook", "black queen", "black king",
]
export type PieceName = PieceNames[number]

export type PieceNameObject =
{
	"white pawn": WhitePawn,
	"white knight": WhiteKnight,
	"white bishop": WhiteBishop,
	"white rook": WhiteRook,
	"white queen": WhiteQueen,
	"white king": WhiteKing,
	"black pawn": BlackPawn,
	"black knight": BlackKnight,
	"black bishop": BlackBishop,
	"black rook": BlackRook,
	"black queen": BlackQueen,
	"black king": BlackKing,
}

export type PieceIdentifierObject =
{
	whitePawn: WhitePawn,
	whiteKnight: WhiteKnight,
	whiteBishop: WhiteBishop,
	whiteRook: WhiteRook,
	whiteQueen: WhiteQueen,
	whiteKing: WhiteKing,
	blackPawn: BlackPawn,
	blackKnight: BlackKnight,
	blackBishop: BlackBishop,
	blackRook: BlackRook,
	blackQueen: BlackQueen,
	blackKing: BlackKing,
}

export type PieceObject = PieceNameObject&PieceIdentifierObject

export type Position = {x: number, y: number, file: string, rank: string, name: string}
export type Positionish = {x: number, y: number} | string
export type PositionArguments = [Positionish]|[number, number]

export type Meta = string|null

export type Move =
{
	play: () => Board,
	name: string,
	from: Position,
	to: Position,
}

export type Board =
{
	width: number,
	height: number,
	
	turn: Color,
	
	at: (...position: PositionArguments) => Piece|null|undefined,
	atName: (...position: PositionArguments) => Piece|null|undefined,
	
	contains: (...position: PositionArguments) => boolean,
	Position: (...position: PositionArguments) => Position|undefined,
	
	get: ((...position: PositionArguments) => Meta|undefined),
	set:
		((position: Positionish, piece: Piece|null, meta?: Meta) => Board|undefined) &
		((x: number, y: number, piece: Piece|null, meta?: Meta) => Board|undefined),
	delete: (...position: PositionArguments) => Board|undefined,
	
	flip: (color?: Color) => Board,
	
	check: boolean,
	checkmate: boolean,
	stalemate: boolean,
	draw: boolean,
	
	getScore: ((color?: Color) => number) & ((color: Colorish) => number|undefined),
	score: number,
	
	getKingPosition: ((color?: Color) => Piece) & ((color: Colorish) => Piece|undefined),
	
	toASCII: ((color?: Color) => string) & ((color: Colorish) => string|undefined),
	
	Move: (name: string) => Move|undefined,
	
	play: (...names: string[]) => Board|undefined,
	
	moves: Move[],
}

// --- // --- //

export let values: Values
export let types: Types
export let colors: Colors

export let pieceNames: PieceNames

export let other:
	((color: "white") => "black") &
	((color: "black") => "white")

export let Color:
	((color: Color) => Color) &
	((color: Colorish) => Color|undefined)
	
export let Type:
	((type: Type) => Type) &
	((type: Typeish) => Type|undefined)

export let Piece:
	((piece: Piece) => Piece) &
	((piece: Pieceish) => Piece|undefined)

export let Pawn: <C extends Color>(color: C) => Pawn<C>
export let Knight: <C extends Color>(color: C) => Knight<C>
export let Bishop: <C extends Color>(color: C) => Bishop<C>
export let Rook: <C extends Color>(color: C) => Rook<C>
export let Queen: <C extends Color>(color: C) => Queen<C>
export let King: <C extends Color>(color: C) => King<C>

export let WhitePiece: <T extends Type>(type: T) => WhitePiece<T>
export let BlackPiece: <T extends Type>(type: T) => BlackPiece<T>

export let getPieceName:
	((piece: Piece) => PieceName) &
	((piece: Pieceish) => PieceName|undefined)

export let pieceList: Pieces
export let pieces: PieceObject

export let Position: (...args: PositionArguments) => Position|undefined

export let standardBoard: Board
export let emptyBoard: Board
export let EmptyBoard: (width?: number, height?: number) => Board|undefined
