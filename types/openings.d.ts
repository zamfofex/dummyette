import {Board} from "../chess.js"

export type Move =
{
	name: string,
	weight: number,
}

export type OpeningBook =
{
	lookup: (board: Board) => Move[] | undefined,
}
