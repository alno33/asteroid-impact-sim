from flask import Flask, redirect, render_template, request
import requests
import math

meteor_madness= Flask(__name__)

#API key for accessing NASA data
apiKey="8fYkN9E1S94cnsvzxZyyr1a65ddo5Z6iqVJO8hfs"

#home page
#gives you options to select aesteroid data
#or customize an aesteroid
@meteor_madness.route("/")
def home():
    return render_template("home.html")

#select page
#lets you select an existing asteroid- generated with chatGPT
@meteor_madness.route('/select-asteroid')
def selectAsteroid():
    # get dates entered by user from url params
    startDate = request.args.get("startDate", "2025-10-01")
    endDate = request.args.get("endDate", "2025-10-01")

    # get needed asteroid data
    url = f"https://api.nasa.gov/neo/rest/v1/feed?start_date={startDate}&end_date={endDate}&api_key={apiKey}"
    response = requests.get(url)
    
    asteroidInfo = []
    no_results = False

    try:
        data = response.json()  # get json data as a dict
        # flatten the dict data into a list
        for date, asteroids in data["near_earth_objects"].items():
            for asteroid in asteroids:
                asteroidInfo.append({
                    "name": asteroid["name"],
                    "diameter": asteroid["estimated_diameter"]["meters"]["estimated_diameter_max"],
                    "velocity": asteroid["close_approach_data"][0]["relative_velocity"]["kilometers_per_second"],
                    "missDistance": asteroid["close_approach_data"][0]["miss_distance"]["kilometers"]
                })
        if len(asteroidInfo) == 0:
            no_results = True
    except:
        no_results = True

    # pass asteroids list and no_results flag to template
    return render_template("selectExisting.html", asteroids=asteroidInfo, no_results=no_results)


#customize page
#lets you customize an asteroid
@meteor_madness.route("/customize", methods=["GET","POST"])
def customize():
    if request.method == "POST":
        size = request.form.get("size", 50)
        velocity = request.form.get("velocity", 50)
        # Redirect to launch page
        return redirect(url_for('launchCustom', size=size, velocity=velocity))
    return render_template("customize.html")


#after asteroid is selected
@meteor_madness.route("/launch-selected-asteroid")
def launchSelected():
    name = request.args.get("name")
    diameter = request.args.get("diameter")
    velocity = request.args.get("velocity")
    miss = request.args.get("miss")

    asteroid = {
        "name": name,
        "diameter": diameter,
        "velocity": velocity,
        "miss": miss,
        "type": "selected"  # optional
    }
    return render_template("launchSelectedAsteroid.html", asteroid=asteroid)



#after customizing an asteroid
@meteor_madness.route("/launch-custom-asteroid", methods=["GET", "POST"])
def launchCustom():
    if request.method == "POST":
        size = request.form.get("size", 50)
        velocity = request.form.get("velocity", 50)
    else:
        size = request.args.get("size", 50)
        velocity = request.args.get("velocity", 50)

    asteroid = {
        "name": "Custom Asteroid",
        "diameter": size,
        "velocity": velocity,
        "type": "custom"  # optional, just in case
    }
    return render_template("launchSelectedAsteroid.html", asteroid=asteroid)


#for showing the impacts of an asteroid hitting a selected location
@meteor_madness.route("/impacts")
def impact():
    # Retrieve asteroid + impact info from query parameters
    asteroid_name = request.args.get("name")
    impact_lat = request.args.get("lat")
    impact_lon = request.args.get("lon")
    diameter = request.args.get("diameter")
    velocity = request.args.get("velocity")
    direction = request.args.get("direction", "prograde")

    if not all([asteroid_name, impact_lat, impact_lon, diameter, velocity]):
        return "Missing impact data", 400

    # Convert to floats for calculations
    diameter = float(diameter)
    velocity = float(velocity)
    impact_lat = float(impact_lat)
    impact_lon = float(impact_lon)

    # Example simplified impact calculations
    impact_energy = 0.5 * (diameter ** 3) * velocity**2  # simplified, arbitrary units
    estimated_crater_radius_km = diameter * 0.1  # rough approximation
    severity = "Low"
    if diameter > 100:
        severity = "High"
    elif diameter > 50:
        severity = "Medium"

    # Calculate affected area (circle around crater)
    affected_area_km2 = 3.1416 * (estimated_crater_radius_km ** 2)

    impact_data = {
        "name": asteroid_name,
        "latitude": impact_lat,
        "longitude": impact_lon,
        "diameter": diameter,
        "velocity": velocity,
        "direction": direction,
        "impact_energy": impact_energy,
        "crater_radius": estimated_crater_radius_km,
        "severity": severity,
        "affected_area": affected_area_km2
    }

    return render_template("impacts.html", impact=impact_data)


#launch main module
if __name__=="__main__":
    meteor_madness.run(debug=True)
