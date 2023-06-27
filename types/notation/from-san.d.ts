import {Board, Move} from "../../chess.js"

export let toMoves: (board: Board, name: string) => Move[]
export let toMove: (board: Board, name: string) => Move|undefined
