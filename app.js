"use strict";

mount(document.getElementById("root"),countdownTimer);



// *************************

function useCountdown(initialCounter) {
	var [ countdownStarted, updateCountdownStarted ] = useState(false);
	var [ counter, updateCounter ] = useState(initialCounter);
	var [ timer, updateTimer ] = useState();

	useEffect(function handleButtonClick(){
		if (!countdownStarted) {
			let btnEl = document.getElementById("start-countdown");

			let startCountdown = () => {
				countdownStarted = updateCountdownStarted(true);
			};
			console.log("adding click handler");
			btnEl.addEventListener("click",startCountdown,false);

			// cleanup click handler
			return () => {
				console.log("removing click handler");
				btnEl.removeEventListener("click",startCountdown,false);
			};
		}
	});

	useEffect(function setupInterval(){
		if (countdownStarted && counter > 0) {
			console.log("starting countdown timer");
			timer = updateTimer(
				setInterval(function countdown(){
					updateCounter(prevCounter => prevCounter - 1);
				},1000)
			);

			// clearup timer interval
			return () => {
				console.log("clearing timer");
				clearInterval(timer);
			};
		}
	},[ countdownStarted, (counter > 0) ]);

	return [ countdownStarted, counter ];
}

function countdownTimer(initialCounter = 5) {
	var [ countdownStarted, counter	] = useCountdown(initialCounter);

	return (
		countdownStarted ?
			`<span>${
				(counter > 0) ?
					`Counting down: ${ counter }` :
					"Finished!"
			}
			</span>` :
			`<button type="button" id="start-countdown">start countdown</button>`
	);
}
