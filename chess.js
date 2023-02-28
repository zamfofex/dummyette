export * from "./variants/chess.js"
export * from "./variants.js"

export {SquarePosition as Position} from "./variants.js"

console.warn("the 'chess.js' module is deprecated and will be removed eventually: use 'variants.js' and 'variants/chess.js' instead")

export let EmptyBoard = () => { }
export let emptyBoard

export let other = color =>
{
	color = String(color)
	if (color === "white") return "black"
	if (color === "black") return "white"
}
