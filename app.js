"use strict";

mount(document.getElementById("root"),countdownTimer);



// *************************

function useCountdown(initialCounter) {
	var [ countdownStarted, updateCountdownStarted ] = useState(false);
	var [ counter, updateCounter ] = useState(initialCounter);
	var timerRef = useRef();

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

	useEffectToggle(function setupInterval(){
		console.log("starting countdown timer");
		timerRef.current = setInterval(function countdown(){
			updateCounter(prevCounter => prevCounter - 1);
		},1000);

		// clearup timer interval
		return () => {
			console.log("clearing countdown timer");
			clearInterval(timerRef.current);
		};
	},(countdownStarted && counter > 0));

	return [ countdownStarted, counter ];
}

function useWelcomeMessage(initialMsg,countdownStarted) {
	var [ welcomeMsg, setWelcomeMsg ] = useState(initialMsg);
	var timerRef = useRef();

	// delay rendering of a welcome message
	useEffectToggle(function wait(){
		console.log("starting welcome message timer");
		timerRef.current = setTimeout(
			() => setWelcomeMsg("Welcome!"),
			2000
		);
		return () => {
			console.log("clearing welcome message timer");
			clearTimeout(timerRef.current);
		};
	},(!countdownStarted && (welcomeMsg == initialMsg)));

	return welcomeMsg;
}

function countdownTimer(initialCounter = 5) {
	var [ countdownStarted, counter	] = useCountdown(initialCounter);
	var welcomeMsg = useWelcomeMessage("Loading...",countdownStarted);

	return (
		countdownStarted ?
			`<span>${
				(counter > 0) ?
					`Counting down: ${ counter }` :
					"Finished!"
			}
			</span>` :
			`<p>${ welcomeMsg }</p>
			<button type="button" id="start-countdown">start countdown</button>`
	);
}
