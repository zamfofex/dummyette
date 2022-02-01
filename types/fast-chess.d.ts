import {Board} from "../chess.js"

export type MutableBoard =
{
	getScore: () => number,
	getMoves: () => Move[],
	isCheck: () => boolean,
}

export type Move =
{
	play: () => undefined,
	unplay: () => undefined,
}

// --- // --- //

export let MutableBoard: (board: Board) => MutableBoard
