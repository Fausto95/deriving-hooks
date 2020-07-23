"use strict";

mount(document.getElementById("root"),countdownTimer);



// *************************

function countdownTimer(initialCounter = 5) {
	var [ counter, updateCounter ] = useState(initialCounter);
	var [ timer, updateTimer ] = useState();

	// one time setup of the countdown interval
	if (!timer) {
		timer = updateTimer(
			setInterval(function countdown(){
				var counter = updateCounter(prevCounter => prevCounter - 1);

				if (counter <= 0) {
					clearInterval(timer);
				}
			},1000)
		);
	}

	return `
		<span>${
			(counter > 0) ?
				`Counting down: ${ counter }` :
				"Finished!"
		}
		</span>
	`;
}
