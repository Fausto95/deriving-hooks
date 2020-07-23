"use strict";

function countdownTimer(counter) {
	return `
		<span>${
			(counter > 0) ?
				`Counting down: ${ counter }` :
				"Finished!"
		}
		</span>
	`;
}




// *************************

(function app(){
	var root = document.getElementById("root");
	var div = document.createElement("div");
	root.appendChild(div);

	var counter = 5;
	div.innerHTML = countdownTimer(counter);

	var timer = setInterval(function countdown(){
		counter--;
		div.innerHTML = countdownTimer(counter);

		if (counter <= 0) {
			clearInterval(timer);
		}
	},1000);
})();
