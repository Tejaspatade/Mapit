"use strict";

// DOM Selections
const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");

// Class For All Major functionalities
class Mapty {
    // Private Properties 🤫
    #map;
    #mapEvent;
    #mapZoomLevel = 15;
    #workouts = [];

    // Constructor
    constructor() {
        // Get Coordinates & load the map at user's current position
        this._getPosition();

        // Get LocalStorage workouts
        this._getWorkouts();

        // Event Handlers
        // Form Submission Event
        form.addEventListener("submit", this._newWorkout.bind(this));
        // Change input field for Cycling/Running
        inputType.addEventListener("change", this._toggleElevationField);
        // Workout Focus on Click
        containerWorkouts.addEventListener(
            "click",
            this._focusOnWorkout.bind(this)
        );
    }

    // Gets position using Geolocation API
    _getPosition() {
        // Check if Geolocation API exists(For old browsers)
        if (navigator.geolocation)
            navigator.geolocation.getCurrentPosition(
                this._loadMap.bind(this),
                () => {
                    // Error Messsage When Location wasn't detected
                    alert("Couldn't Find Your Location!!");
                }
            );
    }

    // Render Map for current location with Leaflet.js
    _loadMap(position) {
        // Co-ordinates
        const { latitude } = position.coords;
        const { longitude } = position.coords;

        // Render Map From Leaflet
        const coords = [latitude, longitude];
        this.#map = L.map("map").setView(coords, this.#mapZoomLevel);

        // Tiles for map
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(this.#map);

        // Click Event on Map
        this.#map.on("click", this._showForm.bind(this));

        // Existing Workout List Markers Rendered
        this.#workouts.forEach((workout) => this._renderWorkoutMarker(workout));
    }

    // Display Form when mapEvent happens
    _showForm(event) {
        // Set private property for our map click event object
        this.#mapEvent = event;

        // Display Form
        form.classList.remove("hidden");
        inputDistance.focus();
    }

    // Change Input Field Event Handler Callback
    _toggleElevationField() {
        inputCadence
            .closest(".form__row")
            .classList.toggle("form__row--hidden");
        inputElevation
            .closest(".form__row")
            .classList.toggle("form__row--hidden");
    }

    // Generate New Workout
    _newWorkout(event) {
        // 1. Get Inputs of the Form
        const type = inputType.value;
        const distance = +inputDistance.value;
        const duration = +inputDuration.value;
        const { lat, lng } = this.#mapEvent.latlng;
        let workout;

        // Utility Functions for Validations
        const validNums = (...inputs) =>
            inputs.every((inp) => Number.isFinite(inp));
        const positiveNums = (...inputs) => inputs.every((inp) => inp > 0);

        // 2. Checking workout types
        if (type === "running") {
            // Input Cadence for Running
            const cadence = +inputCadence.value;

            // Validate The Inputs from the form
            if (
                !validNums(distance, duration, cadence) ||
                !positiveNums(distance, duration, cadence)
            )
                return alert(
                    "Please Input All Fields with Positive Numbers Only."
                );

            // Instantiating Object
            // prettier-ignore
            workout = new Running([lat, lng], distance, duration, cadence);
        }
        if (type === "cycling") {
            // Input Elevation for Cycling
            const elevation = +inputElevation.value;

            // Validate The Inputs from the form
            if (
                !validNums(distance, duration, elevation) ||
                !positiveNums(distance, duration)
            )
                return alert(
                    "Please Input All fields except Elevation with Positive Numbers Only."
                );

            // Instantiating Object
            // prettier-ignore
            workout = new Cycling([lat, lng], distance, duration, elevation);
        }

        // 3.Add new workout object to workouts list
        this.#workouts.push(workout);

        // 4. Render Workout Marker & Popup on map
        this._renderWorkoutMarker(workout);

        // 5. Render Workout List
        this._renderWorkout(workout);

        // 6. Prevent page reload due to form submission
        event.preventDefault();

        // 7. Clear Input Fields & Hide Form
        this._hideForm();

        // 8. Store all current workouts in localStorage using localStorage API
        this._storeWorkouts();
    }

    _renderWorkoutMarker(workout) {
        //  Display Popup & Marker
        L.marker(workout.coords)
            .addTo(this.#map)
            .bindPopup(
                L.popup({
                    maxWidth: 250,
                    minWidth: 100,
                    autoClose: false,
                    closeOnClick: false,
                    className: `${workout.type}-popup`,
                })
            )
            .setPopupContent(
                `${workout.type === "running" ? "🏃🏼‍♂️" : "🚴🏼‍♂️"} ${
                    workout.description
                }`
            )
            .openPopup();
    }

    _renderWorkout(workout) {
        // Generate Markup
        let markup = `
        <li class="workout workout--${workout.type}" data-id="${workout.id}">
            <h2 class="workout__title">${
                workout.description
            } &nbsp;&nbsp;&nbsp;&nbsp;<i class="fa-solid fa-pen-to-square"></i> &nbsp;&nbsp;<i class="fa-solid fa-x"></i></h2>
            <div class="workout__details">
                <span class="workout__icon">${
                    workout.type === "running" ? "🏃🏼‍♂️" : "🚴🏼‍♂️"
                }</span>
                <span class="workout__value">${workout.distance}</span>
                <span class="workout__unit">km</span>
            </div>
            <div class="workout__details">
                <span class="workout__icon">⏱</span>
                <span class="workout__value">${workout.duration}</span>
                <span class="workout__unit">min</span>
            </div>`;

        // Append Additional HTML based on workout Type
        if (workout.type === "running")
            markup += `
            <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.cadence.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.pace}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>`;

        if (workout.type === "cycling")
            markup += `
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevation}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>`;

        // Add HTML as sibling to form element in sidebar
        form.insertAdjacentHTML("afterend", markup);
    }

    _hideForm() {
        // Hide Form
        form.style.display = "none";
        form.classList.add("hidden");
        setTimeout(() => (form.style.display = "grid"), 1000);
        // Clear Input Fields
        inputElevation.value =
            inputCadence.value =
            inputDuration.value =
            inputDistance.value =
                "";
    }

    _focusOnWorkout(event) {
        // Match closest workout sibling element
        const workoutEl = event.target.closest(".workout");

        // Guard Clause
        if (!workoutEl) return;

        //Find Workout from workouts list
        const workout = this.#workouts.find(
            (workout) => workout.id === workoutEl.dataset.id
        );

        // Leaflet map Object
        this.#map.setView(workout.coords, this.#mapZoomLevel + 1, {
            animate: true,
            pan: {
                duration: 0.8,
            },
        });
    }

    _storeWorkouts() {
        // Stored workouts array as string.
        localStorage.setItem("workouts", JSON.stringify(this.#workouts));
    }

    _getWorkouts() {
        // Convert string from localStorage back to objects
        const data = JSON.parse(localStorage.getItem("workouts"));

        // Guard Clause
        if (!data) return;

        this.#workouts = data;

        // Existing Workout List Rendered
        this.#workouts.forEach((workout) => this._renderWorkout(workout));
    }

    reset() {
        localStorage.removeItem("workouts");
    }
}

// Instantiate Mapty app
const app = new Mapty();

// Workout Class
class Workout {
    date = new Date();
    id = (Date.now() + "").slice(-10);

    constructor(coords, distance, duration) {
        this.coords = coords;
        this.distance = distance; // in km
        this.duration = duration; // in mins
    }

    _setDescription() {
        // prettier-ignore
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        // Description String
        this.description = `${this.type[0].toUpperCase()}${this.type.slice(
            1
        )} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
    }
}

// Child Classes based on Workout type
class Running extends Workout {
    // Public Field
    type = "running";

    constructor(coords, distance, duration, cadence) {
        super(coords, distance, duration);
        this.cadence = cadence;
        this.calcPace();
        this._setDescription();
    }

    calcPace() {
        // mins/km
        this.pace = this.duration / this.distance;
        return this.pace;
    }
}
class Cycling extends Workout {
    // Public Field
    type = "cycling";

    constructor(coords, distance, duration, elevation) {
        super(coords, distance, duration);
        this.elevation = elevation;
        this.calcSpeed();
        this._setDescription();
    }

    calcSpeed() {
        // km/hr
        this.speed = this.distance / (this.duration / 60);
        return this.pace;
    }
}
