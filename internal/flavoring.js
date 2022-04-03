let happy =
[
	":)", ":-)",
	";)", ";-)",
	":D", ":-D",
	";D", ";-D",
]

let confused =
[
	"<.<", ">.>",
	"@.@", "#.#",
	"<_<", ">_>",
	"@_@", "#_#",
	":#", ":-#",
	";#", ";-#",
	";(", ";-(",
	";/", ";-/",
]

let surprised =
[
	":O", ":-O",
	";O", ";-O",
]

let snarky =
[
	":3", ";3",
	">:)", ">:-)",
	">;)", ">;-)",
	";)", ";-)",
	";D", ";-D",
]

let x = ([...strings], ...values) =>
{
	let results = [strings.shift()]
	for (let [i, string] of strings.entries())
	{
		let results2 = []
		for (let value of values[i])
		for (let result of results)
			results2.push(result + value + string)
		results = results2
	}
	return results
}

export let losing =
[
	...x`Oh no${["!", "..."]} ${[...confused, ...surprised]}`,
	...x`Well, huh${[".", "..."]} ${[...confused, ...surprised]}`,
	...x`No way! ${[...confused, ...surprised]}`,
	...x`I... ${["", "uh... ", "hmm... "]}huh${[".", "..."]} ${confused}`,
	...x`I still got this! ${snarky}`,
	...x`I still got this${["!", "...", ","]} I think${[".", "..."]} ${confused}`,
	...x`${["", "I think "]}I can still win this! ${snarky}`,
	...x`I think I can still win this${[".", "..."]} ${confused}`,
	...x`Oh wow! ${surprised}`,
	...x`${["You’re", "You are"]} good at this${".", "!"} ${[...surprised, ...happy, ...snarky]}`,
	...x`Good move! ${[...happy, ...surprised]}`,
	...x`Well played! ${[...happy, ...surprised]}`,
]

export let winning =
[
	...x`Aha! ${snarky}`,
	...x`${["", "I think "]}I got this${[".", "!"]} ${snarky}`,
	...x`Huzzah! ${snarky}`,
	...x`Take ${["this", "that"]}! ${snarky}`,
	...x`${["", "I think "]}${["I’m", "I am"]} kinda good at this${[".", "!", "..."]} ${[...surprised, ...snarky]}`,
]

export let lost =
[
	...x`${["I’m", "I am"]}${["", "..."]} not the best at this${[".", "..."]} ${confused}`,
	...x`I bet I can win next time${[".", "!"]} ${snarky}`,
	...x`Good game${[".", "!"]} ${happy}`,
	...x`Thank you for playing! ${happy}`,
	...x`I hope you had fun! ${happy}`,
]

export let won =
[
	...x`Good game${[".", "!"]} ${[...happy, ...snarky]}`,
	...x`I got it! ${[...happy, ...surprised, ...snarky]}`,
	...x`I won${[".", "!"]} ${[...happy, ...surprised, ...snarky]}`,
	...x`Thank you for playing! ${happy}`,
	...x`I hope you had fun! ${happy}`,
]

export let start =
[
	...x`Good luck${[".", "!"]} ${[...happy, ...snarky]}`,
	...x`Good luck, ${["you’ll", "you will"]} need it${[".", "!"]} ${snarky}`,
	...x`Good luck, have fun! ${happy}`,
]
