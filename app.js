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
	div.innerHTML = countdownTimer(5);
})();
