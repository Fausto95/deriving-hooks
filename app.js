"use strict";

mount(document.getElementById("root"),countdownTimer);

var state = {};




// *************************

function countdownTimer(forceRender,initialCounter = 5) {
	state.counter = ("counter" in state) ? state.counter : initialCounter;

	// one time setup of the countdown interval
	if (!("timer" in state)) {
		state.timer = setInterval(function countdown(){
			state.counter--;
			forceRender();

			if (state.counter <= 0) {
				clearInterval(state.timer);
			}
		},1000);
	}

	return `
		<span>${
			(state.counter > 0) ?
				`Counting down: ${ state.counter }` :
				"Finished!"
		}
		</span>
	`;
}
