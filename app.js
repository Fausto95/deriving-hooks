"use strict";

mount(document.getElementById("root"),countdownTimer);



// *************************

function countdownTimer(initialCounter = 5) {
	var [ counter, updateCounter ] = useState(initialCounter);
	var [ timer, updateTimer ] = useState();

	// just for illustrating debugging purposes
	useEffect(function(){
		console.log(`counter: ${ counter }`);
	});

	// first time (only!) setup of the countdown interval
	useEffect(function setupInterval(){
		updateTimer(
			setInterval(function countdown(){
				updateCounter(prevCounter => prevCounter - 1);
			},1000)
		);
	},[]);

	// cleanup the interval when it finishes
	// note: will run initially (but as a no-op),
	// then run again at the end
	useEffect(function cleanupInterval(){
		if (counter <= 0) {
			clearInterval(timer);
		}
	},[ (counter > 0) ]);

	return `
		<span>${
			(counter > 0) ?
				`Counting down: ${ counter }` :
				"Finished!"
		}
		</span>
	`;
}
