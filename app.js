"use strict";

function makeCountdownTimer(initialCounter = 5) {
	var counter = initialCounter;

	return function countdownTimer(){
		var html = `
			<span>${
				(counter > 0) ?
					`Counting down: ${ counter }` :
					"Finished!"
			}
			</span>
		`;
		counter--;
		return html;
	};
}




// *************************

(function app(){
	var root = document.getElementById("root");
	var div = document.createElement("div");
	root.appendChild(div);

	var initialCounter = 5;
	var countdownTimer = makeCountdownTimer(initialCounter);

	div.innerHTML = countdownTimer();

	var i = 0;
	var timer = setInterval(function countdown(){
		div.innerHTML = countdownTimer();

		i++;
		if (i == initialCounter) {
			clearInterval(timer);
		}
	},1000);
})();
