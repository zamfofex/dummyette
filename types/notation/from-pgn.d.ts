import {Board, Move} from "../../chess.js"
import {LiveStream} from "../../streams.js"

export type Delta =
{
	move: Move,
	before: Board,
	after: Board,
	comments: string[],
	annotation: number,
}

export type Game =
{
	tags: [string, string][],
	info: {[key: string]: string},
	deltas: Delta[],
	result: "1-0"|"0-1"|"1/2-1/2"|"*",
}

export let toGames:
	((pgn: string|Iterable<string>) => Game[] | undefined) &
	((pgn: AsyncIterable<string>) => LiveStream<Game>)
