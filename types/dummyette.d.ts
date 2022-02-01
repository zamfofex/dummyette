import {Board, Move} from "../chess.js"

type AsyncAnalyser =
{
	analyse: (board: Board) => Promise<Move[]>,
}

// --- // --- //

export let analyse: (board: Board) => Move[]

export let AsyncAnalyser: (options?: {workers: number}) => AsyncAnalyser
