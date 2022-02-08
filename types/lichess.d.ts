import {LiveStream, RewindStream} from "../streams.js"
import {Color as ChessColor, Board} from "../chess.js"

export type ID = string

export type Level = 1|2|3|4|5|6|7|8
export type Color = ChessColor|"random"

export type Status = "ongoing"|"checkmate"|"draw"|"aborted"

export type Lichess =
{
	username: string,
	challenges: LiveStream<Challenge>,
	acceptChallenges: () => LiveStream<Game>,
	declineChallenges: (reason?: string) => undefined,
	getGame: (id: ID) => Promise<Game|undefined>,
	getGameIDs: () => Promise<ID[]>,
	getGames: () => Promise<Game[]>,
	StockfishGame: (level: Level, color: Color) => Promise<Game|undefined>,
	challenge: (username: string, options?: {rated?: boolean, time?: TimeControl|string, color?: Color}) => Promise<Game|undefined>,
}

export type TimeControl =
{
	limit: number,
	increment: number,
}

export type Challenge =
{
	id: ID,
	color: ChessColor,
	accept: () => Promise<Game|undefined>,
	decline: (reason?: string) => Promise<boolean>,
	rated: true,
	timeControl: string,
	variant: string,
}

export type HistoryEntry =
{
	move: string,
	moveName: string,
	board: Board,
	turn: ChessColor,
}

export type Game =
{
	id: ID,
	moveNames: RewindStream<string>,
	moves: RewindStream<string>,
	turn: ChessColor,
	status: Status,
	ongoing: boolean,
	finished: boolean,
	color: Color|null,
	play: (...names: string[]) => Promise<number>,
	resign: () => Promise<number>,
	boards: RewindStream<Board>,
	history: RewindStream<HistoryEntry>,
}

// --- // --- //

export let Lichess: (token: string) => Promise<Lichess|undefined>
