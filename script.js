'use strict';



const form = document.querySelector('.form');
// const containerWorkouts = document.querySelector('.workout');
// console.dir(containerWorkouts)
const containerWorkouts = document.querySelector('.workouts__container');



const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const $ = document.querySelector.bind(document)
const $$ = document.querySelectorAll.bind(document)



class Workout 
{
    date = new Date();
    id = new Date().getTime() * Math.random() * 100000 + '';
    

    constructor(coordinates,distance,duration)
    {
        this.coordinates = coordinates;
        this.distance = distance;
        this.duration = duration;
        
    }
    _setDescription()
    {
        // prettier-ignore
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        this.description = `${this.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`
    }
}
class Running extends Workout 
{
    type = 'running';
    constructor(coordinates,distance,duration,cadence)
    {
        super(coordinates,distance,duration)
        this.cadence = cadence;
        this.calPace()
        this._setDescription()
    }

    calPace() 
    {
        this.pace = this.duration / this.distance;
        return this.pace;
    }
}
class Cycling extends Workout 
{
    type = 'cycling';

    constructor(coordinates,distance,duration,elevationGain)
    {
        super(coordinates,distance,duration)
        this.elevationGain = elevationGain;
        this.calSpeed()
        this._setDescription()
    }

    calSpeed() 
    {
        this.speed = this.distance / (this.duration / 60);
        return this.speed;
    }
}

class App 
{
    #map;
    #mapEvent;
    #workouts = [];
    #mapZoomLevel = 13

    constructor() 
    {
        // Get location
        this._getPosition()

        // Get data from local storage

        this._getLocalStorage()

        // Event Attach
        form.addEventListener('submit', this._newWorkout.bind(this))
        inputType.addEventListener('change', this._toggleElevationField);

    }

    _getPosition() 
    {
        if (navigator.geolocation)
        {
            navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), () => alert(`Don't get your current position`))
        }

    }

    _loadMap(position) 
    {
        const { latitude,longitude } = position.coords;
        const coords = [latitude,longitude];

        this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map);
        
        this.#map.on('click',this._showForm.bind(this))

        // Render marker from local storage

        this.#workouts.forEach(workout => 
        {
            this._renderWorkoutMarker(workout)
        })
        
    }

    _showForm(mapE) 
    {
        this.#mapEvent = mapE
        form.classList.remove('hidden')
        inputDistance.focus()
    }

    _toggleElevationField() 
    {
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
        inputDistance.focus()
    }

    _newWorkout(e) 
    {
        const type = inputType.value;
        const duration = +inputDuration.value; // + means convert to number
        const distance = +inputDistance.value;
        const {lat, lng} = this.#mapEvent.latlng
        let workout;
        e.preventDefault();
        
        // check invalid data input 
        const isNumberInputs = (...inputs) => inputs.every(input => Number.isFinite(input))
        const isPositive = (...elements) => elements.every(ele => ele > 0)

        // Get data form from workout

        // For Running create a object 
        if (type === 'running') 
        {
            const cadence = +inputCadence.value;
            if (!isNumberInputs(distance,duration,cadence) || !isPositive(distance,duration,cadence)) return alert('Inputs are not valid!')
            workout = new Running([lat,lng],distance,duration,cadence)
        }
        


        // For Cycling create a object for
        if (type === 'cycling') 
        {
            const elevation = +inputElevation.value;
            if (!isNumberInputs(distance,duration,elevation) || !isPositive(distance,duration)) return alert('Inputs are not valid!')
            workout = new Cycling([lat,lng],distance,duration,elevation)

        }
        // Add workout to array
        this.#workouts.push(workout)
        
        
        this._renderWorkoutMarker(workout)
        
        // Render Workout
        this._renderWorkout(workout)

        // Save data to local storage

        this._setLocalStorage()

        

        
        
        // Hide Form and Clear all fields
        this._hideForm()

        
      
        
    }
    _renderWorkoutMarker(workout)
    {
        L.marker(workout.coordinates).addTo(this.#map)
        .bindPopup(L.popup(
        {
            autoClose: false,
            closeOnClick: false,
            maxWidth: 300, 
            minWidth: 100,
            className: `${workout.type}-popup`


        }))
        .setPopupContent(workout.description)
        .openPopup();

    }
    _renderWorkout(workout) 
    {
        let html = `
        
            <li class="workout workout--${workout.type}" data-id=${workout.id}>
                <h2 class="workout__title">${workout.description}</h2>
                <div class="workout__details">
                    <span class="workout__icon">${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'}</span>
                    <span class="workout__value">${workout.distance}</span>
                    <span class="workout__unit">km</span>
                </div>
                <div class="workout__details">
                    <span class="workout__icon">⏱</span>
                    <span class="workout__value">${workout.duration}</span>
                    <span class="workout__unit">minutes</span>
                </div>
        `
        if(workout.type === 'running') 
        {
            html += `
                    <div class="workout__details">
                    <span class="workout__icon">⚡️</span>
                    <span class="workout__value">${workout.pace.toFixed(1)}</span>
                    <span class="workout__unit">min/km</span>
                    </div>
                    <div class="workout__details">
                        <span class="workout__icon">🦶🏼</span>
                        <span class="workout__value">${workout.cadence}</span>
                        <span class="workout__unit">spm</span>
                    </div>
                </li>
            

            `
        }
        else if(workout.type === 'cycling') 
        {
            html += `
                <div class="workout__details">
                <span class="workout__icon">⚡️</span>
                <span class="workout__value">${workout.speed.toFixed(1)}</span>
                <span class="workout__unit">km/h</span>
                </div>
                <div class="workout__details">
                    <span class="workout__icon">⛰</span>
                    <span class="workout__value">${workout.elevationGain}</span>
                    <span class="workout__unit">m</span>
                </div>
            </li>

            `
        }
        form.insertAdjacentHTML("afterend",html)
        const workoutList = $(`.workout.workout--${workout.type}`)
        workoutList.addEventListener('click',this._moveToPopup.bind(this))

    }
    _hideForm() 
    {
        form.classList.add('hidden')
        inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = '';

    }
    _moveToPopup(e)
    {
        const parentWorkout = e.target.closest('.workout')
        const workout = this.#workouts.find(work => parentWorkout.dataset.id === work.id);

        this.#map.setView(workout.coordinates,this.#mapZoomLevel,{
            animate: true,
            pan: 
            {
                // animate: true,
                duration: 1,
            }
        });

    }
    _setLocalStorage() 
    {
        localStorage.setItem('workouts', JSON.stringify(this.#workouts));
    }
    _getLocalStorage()
    {
        const data = JSON.parse(localStorage.getItem('workouts'));
        if (data)
        {
            this.#workouts = data
            this.#workouts.forEach(workout => 
            {
                this._renderWorkout(workout)
            })
        }

    }





}
const app = new App();



