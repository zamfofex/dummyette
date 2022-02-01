import {Board} from "../chess.js"

declare let boardJSON: unique symbol

export type JSON = {[boardJSON]: true}

export type MutableBoard =
{
	getScore: () => number,
	getMoves: () => Move[],
	isCheck: () => boolean,
	toJSON: () => JSON,
}

export type Move =
{
	play: () => undefined,
	unplay: () => undefined,
}

// --- // --- //

export let MutableBoard: (board: Board) => MutableBoard

export let fromJSOM: (json: JSON) => MutableBoard
