import {Board, Move} from "../chess.js"

export type Evaluation =
{
	move: Move,
	score: number,
}

export type AsyncAnalyser =
{
	analyse: (board: Board) => Promise<Move[]>,
	evaluate: (board: Board) => Promise<Evaluation[]>,
}

// --- // --- //

export let analyse: (board: Board) => Move[]

export let AsyncAnalyser: (options?: {workers: number}) => AsyncAnalyser
