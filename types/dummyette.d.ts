import {Board, Move} from "../chess.js"

export type Evaluation =
{
	move: Move,
	score: number,
}

export type AsyncAnalyser =
{
	analyse: (board: Board, options?: {time?: number}) => Promise<Move[]>,
	evaluate: (board: Board, options?: {time?: number}) => Promise<Evaluation[]>,
}

// --- // --- //

export let analyse: (board: Board, options?: {workers?: number, time?: number}) => Promise<Move[]>
export let evaluate: (board: Board, options?: {workers?: number, time?: number}) => Promise<Evaluation[]>

export let AsyncAnalyser: (options?: {workers?: number}) => AsyncAnalyser
