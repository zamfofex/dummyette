import {Move, Board} from "../chess.js"

export let toSAN: (move: Move) => string
export let fromFEN: (string: string) => Board|undefined
