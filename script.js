"use strict";

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

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

    // Constructor
    constructor() {
        // Get Coordinates & load the map at user's current position
        this._getPosition();

        // Event Handlers
        // Form Submission Event
        form.addEventListener("submit", this._newWorkout.bind(this));
        // Change input field for Cycling/Running
        inputType.addEventListener("change", this._toggleElevationField);
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
        this.#map = L.map("map").setView(coords, 13);

        // Tiles for map
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(this.#map);

        // Click Event on Map
        this.#map.on("click", this._showForm.bind(this));
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
        // Prevent page reload sue to form submission
        event.preventDefault();

        // Clear Input Fields
        inputElevation.value =
            inputCadence.value =
            inputDuration.value =
            inputDistance.value =
                "";

        //  Display Popup & Marker
        // Get Click Lat & Long
        const { lat, lng } = this.#mapEvent.latlng;
        L.marker([lat, lng])
            .addTo(this.#map)
            .bindPopup(
                L.popup({
                    maxWidth: 250,
                    minWidth: 100,
                    autoClose: false,
                    closeOnClick: false,
                    className: "cycling-popup",
                })
            )
            .setPopupContent("Workout")
            .openPopup();
    }
}

// Instantiate Mapty app
const app = new Mapty();

//
