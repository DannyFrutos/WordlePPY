const FLIP_ANIMATION_DURATION = 500;
const DANCE_ANIMATION_DURATION = 500;
const MAX_ATTEMPTS = 6;
const keyboard = document.querySelector("[data-keyboard]");
const guessGrid = document.querySelector("[data-guess-grid]");
const alertContainer = document.querySelector("[data-alert-container]");
const restartButton = document.getElementById("restartButton");
let targetWord = "";
let remainingAttempts = MAX_ATTEMPTS;
let gameEnded = false;

fetch("https://random-word-api.herokuapp.com/word?lang=es&length=5")
	.then(response => response.json())
	.then(data => {
		targetWord = data[0].toLowerCase();
		console.log("Palabra obtenida:", targetWord);
		startInteraction();
	})
	.catch(error => console.error("Error al obtener la palabra:", error));

restartButton.addEventListener("click", restartGame);
function startInteraction() {
	if (gameEnded) {
		return;
	}

	document.addEventListener("click", handleMouseClick);
	document.addEventListener("keydown", handleKeyPress);
}

function stopInteraction() {
	document.removeEventListener("click", handleMouseClick);
	document.removeEventListener("keydown", handleKeyPress);
}

function restartGame() {
	targetWord = "";
	remainingAttempts = MAX_ATTEMPTS;
	gameEnded = false;

	fetch("https://random-word-api.herokuapp.com/word?lang=es&length=5")
		.then(response => response.json())
		.then(data => {
			targetWord = data[0].toLowerCase();
			console.log("Nueva palabra obtenida:", targetWord);
		})
		.catch(error => console.error("Error al obtener la palabra:", error));

	resetInterface();
	startInteraction();
}

function resetInterface() {
	const tiles = guessGrid.querySelectorAll(".tile");
	tiles.forEach(tile => {
		tile.textContent = "";
		delete tile.dataset.state;
		delete tile.dataset.letter;
		tile.classList.remove("correct-grid", "wrong-location-grid", "wrong", "shake", "flip", "dance");
	});

	const keys = keyboard.querySelectorAll("[data-key]");
	keys.forEach(key => {
		key.classList.remove("correct", "wrong-location", "wrong");
	});

	const alerts = alertContainer.querySelectorAll(".alert");
	alerts.forEach(alert => alert.remove());
}
function handleMouseClick(e) {
	if (e.target.matches("[data-key]") && !gameEnded) {
		pressKey(e.target.dataset.key);
		return;
	}
	if (e.target.matches("[data-enter]")) {
		submitGuess(targetWord);
		return;
	}
	if (e.target.matches("[data-delete]") && !gameEnded) {
		deleteKey();
		return;
	}
}

function handleKeyPress(e) {
	if (gameEnded) {
		return;
	}

	if ((e.key === "Backspace" || e.key === "Delete") && !gameEnded) {
		deleteKey();
		return;
	}

	if (e.key === "Enter" && !gameEnded) {
		e.preventDefault();
		const activeTiles = getActiveTiles();

		if (activeTiles.length === 5) {
			submitGuess(targetWord);
		} else {
			showAlert("No has ingresado la cantidad correcta de letras");
		}

		return;
	}

	if (e.key.match(/^[a-z]$/) && !gameEnded) {
		pressKey(e.key);
	}
}

function pressKey(key) {
	const activeTiles = getActiveTiles();
	if (activeTiles.length >= 5 || gameEnded) {
		return;
	}
	const nextTile = guessGrid.querySelector(".tile:not([data-letter])");
	if (nextTile) {
		nextTile.dataset.letter = key.toLowerCase();
		nextTile.textContent = key;
		nextTile.dataset.state = "active";
	}
}

function deleteKey() {
	const activeTiles = getActiveTiles();
	const lastTile = activeTiles[activeTiles.length - 1];
	if (lastTile == null || gameEnded) {
		return;
	}
	lastTile.textContent = "";
	delete lastTile.dataset.state;
	delete lastTile.dataset.letter;
}

function submitGuess(targetWord) {
	const activeTiles = [...getActiveTiles()];
	if (remainingAttempts === 0) {
		showAlert("¡Se han agotado los intentos! La palabra correcta era: " + targetWord);
		gameEnded = true;
		return;
	}

	if (activeTiles.length !== 5) {
		showAlert("No has ingresado la cantidad correcta de letras");
		shakeTiles(activeTiles);
		return;
	}

	remainingAttempts--;

	if (targetWord === activeTiles.map(tile => tile.dataset.letter).join('')) {
		showAlert("¡Correcto! Has adivinado la palabra.");

		activeTiles.forEach(tile => {
			tile.classList.add("correct-grid");
			const letter = tile.dataset.letter;
			const key = keyboard.querySelector(`[data-key="${letter}"i]`);
			key.classList.add("correct");
		});
		danceTiles(activeTiles);
		gameEnded = true;
		stopInteraction();
		return;
	}

	stopInteraction();
	activeTiles.forEach((tile, index, array) => flipTile(tile, index, array, targetWord));
}


function flipTile(tile, index, array, targetWord) {
	const letter = tile.dataset.letter;
	const key = keyboard.querySelector(`[data-key="${letter}"i]`);

	const onTransitionEnd = () => {
		tile.classList.remove("flip");

		if (targetWord[index] === letter) {
			tile.dataset.state = "correct";
			key.classList.add("correct");

			if (index === array.length - 1) {
				const isWordGuessed = targetWord === array.map(tile => tile.dataset.letter).join('');

				if (isWordGuessed) {
					array.forEach((tile, index) => {
						setTimeout(() => {
							tile.classList.add("correct-grid");
						}, (index * FLIP_ANIMATION_DURATION) / 2);
					});
				}
			}
		} else if (targetWord.includes(letter)) {
			tile.dataset.state = "wrong-location";
			tile.classList.add("wrong-location-grid");
			key.classList.add("wrong-location");
		} else {
			tile.dataset.state = "wrong";
			key.classList.add("wrong");
		}

		if (index === array.length - 1) {
			tile.removeEventListener("transitionend", onTransitionEnd);

			startInteraction();
			checkAttempts();
		}
	};

	tile.addEventListener("transitionend", onTransitionEnd, { once: true });

	setTimeout(() => {
		tile.classList.add("flip");
	}, (index * FLIP_ANIMATION_DURATION) / 2);
}

function danceTiles(tiles) {
	tiles.forEach((tile, index) => {
		setTimeout(() => {
			tile.classList.add("dance");
			tile.addEventListener(
				"animationend",
				() => {
					tile.classList.remove("dance");
				},
				{ once: true }
			);
		}, (index * DANCE_ANIMATION_DURATION) / 5);
	});
}

function getActiveTiles() {
	return guessGrid.querySelectorAll("[data-state='active']");
}

function showAlert(message, duration = 1000) {
	const alert = document.createElement("div");
	alert.textContent = message;
	alert.classList.add("alert");
	alertContainer.prepend(alert);

	if (duration == null) return;

	setTimeout(() => {
		alert.classList.add("hide");
		alert.addEventListener("transitionend", () => {
			alert.remove();
		});
	}, duration);
}

function shakeTiles(tiles) {
	tiles.forEach((tile) => {
		tile.classList.add("shake");
		tile.addEventListener(
			"animationend",
			() => {
				tile.classList.remove("shake");
			},
			{ once: true }
		);
	});
}

function checkAttempts() {
	if (remainingAttempts === 0) {
		showAlert("¡Se han agotado los intentos! La palabra correcta era: " + targetWord);
		gameEnded = true;
	} else {
		showAlert(`Te quedan ${remainingAttempts} intentos.`);
	}
}
