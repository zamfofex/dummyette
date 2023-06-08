import {Move} from "../../chess.js"

export let toMoves: (san: string) => Move[]
export let toMove: (san: string) => Move | undefined
