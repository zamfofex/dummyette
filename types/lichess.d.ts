import {LiveStream, RewindStream} from "../streams.js"
import {Color as ChessColor, Board} from "../chess.js"

export type ID = string

export type Level = 1|2|3|4|5|6|7|8
export type Color = ChessColor|"random"

export type Status = "ongoing"|"checkmate"|"draw"|"aborted"

export type AnonymousLichess =
{
	origin: string,
	getGame: (id: ID) => Promise<Game|undefined>,
	getBotUsernames: () => Promise<string[]>,
	getUsernameGameIDs: (username: string) => Promise<ID[]>,
	getUser: (username: string) => Promise<User|undefined>,
	getBots: () => Promise<User[]>,
}

export type Lichess = AnonymousLichess &
{
	username: string,
	challenges: LiveStream<Challenge>,
	acceptChallenges: () => LiveStream<Game>,
	declineChallenges: (reason?: string) => undefined,
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
	rated: boolean,
	chat: Chat,
	whiteTime: number|undefined,
	blackTime: number|undefined,
}

export type Chat =
{
	send: (message: string) => Promise<boolean>,
}

type Info =
{
	count: number,
	rating: number,
	provisional: boolean,
	deviation: number,
}

type ChessInfo =
{
	count: number,
	correspondence: Info,
	classical: Info,
	rapid: Info,
	blitz: Info,
	bullet: Info,
	ultrabullet: Info,
}

type VariantInfos =
{
	chess: ChessInfo,
	chess960: Info,
	atomicChess: Info,
	horde: Info,
	racingKings: Info,
	kingOfTheHill: Info,
}

export type User =
{
	username: string,
	title: string,
	displayName: string,
	variants: VariantInfos,
	violator: boolean,
	getOngoingGameIDs: () => Promise<string[]>,
	getOngoingGames: () => Promise<Game[]>,
}

// --- // --- //

export let variantNames: ["chess", "chess960", "atomicChess", "horde", "racingKings", "kingOfTheHill"]
export let timeControlTypes: ["correspondence", "classical", "rapid", "blitz", "bullet", "ultrabullet"]

export let lichess: AnonymousLichess

export let Lichess: (options: string|{token: string, origin?: string|URL}) => Promise<Lichess|undefined>
export let AnonymousLichess: (options: string|URL|{origin?: string|URL}) => Promise<AnonymousLichess|undefined>
