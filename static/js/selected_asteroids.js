document.addEventListener("DOMContentLoaded", () => {
    const ASTEROID_DATA = window.ASTEROID_DATA;
if (!ASTEROID_DATA || !ASTEROID_DATA.name) {
    console.error("ASTEROID_DATA is missing!");
}
    const diameter_m = Number(ASTEROID_DATA.diameter) || 50;
    const velocity_km_s = Number(ASTEROID_DATA.velocity) || 20;

    const container = document.getElementById("scene-container");
    const readoutEl = document.getElementById("readout");
    const launchBtn = document.getElementById("launchBtn");
    const seeImpactsBtn = document.getElementById("seeImpactBtn");

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 1.3, 5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(5, 10, 7);
    scene.add(dir);

    // Earth
    const textureLoader = new THREE.TextureLoader();
    const earthMat = new THREE.MeshPhongMaterial({
        map: textureLoader.load('/static/img/earth_atmos_2048.jpg')
    });
    const earth = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 64), earthMat);
    scene.add(earth);
    earth.userData.stopped = false;

    // Asteroid
    const diameter_km = diameter_m / 1000;
    const asteroidRadius = Math.max(0.05, diameter_km / 2 / 6371);
    const asteroidMat = new THREE.MeshPhongMaterial({ color: 0x999999 });
    const asteroid = new THREE.Mesh(new THREE.SphereGeometry(asteroidRadius, 16, 12), asteroidMat);
    scene.add(asteroid);

    let orbitAngle = 0;
    const orbitRadius = 3;
    const omega = velocity_km_s / (orbitRadius * 6371); // rad/s
    const clock = new THREE.Clock();

    let launchPressed = false;
    let launchTarget = null;

    asteroid.userData.falling = false;
    asteroid.userData.velocity = new THREE.Vector3();
    asteroid.userData.impact = false;

    // Track last Earth click coordinates for See Impact
    let lastEarthClickLat = null;
    let lastEarthClickLon = null;

    // Asteroid info display
    if (readoutEl) {
        readoutEl.textContent = `Diameter: ${diameter_m.toFixed(1)} m | Velocity: ${velocity_km_s.toFixed(2)} km/s`;
    }

    //launch button mechanics and click detection- generated with chatGPT
    // Launch button
    launchBtn.addEventListener("click", () => {
        launchPressed = true;
    });

    // Helper: convert 3D point on Earth to latitude/longitude
    function pointToLatLon(point) {
        const localPoint = point.clone().sub(earth.position); // Earth at origin
        const radius = localPoint.length();
        const lat = Math.asin(localPoint.y / radius) * (180 / Math.PI);
        const lon = Math.atan2(localPoint.z, localPoint.x) * (180 / Math.PI);
        return { lat, lon };
    }

    // Click detection
    container.addEventListener("click", (event) => {
        const mouse = new THREE.Vector2(
            (event.clientX / container.clientWidth) * 2 - 1,
            -(event.clientY / container.clientHeight) * 2 + 1
        );
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(earth);

        if (intersects.length > 0) {
            const clickedPoint = intersects[0].point.clone();

            // Convert to lat/lon
            const { lat, lon } = pointToLatLon(clickedPoint);
            lastEarthClickLat = lat;
            lastEarthClickLon = lon;

            // Fire custom event 
            const earthClickEvent = new CustomEvent("earthClick", { detail: { lat, lon } });
            document.dispatchEvent(earthClickEvent);

            // If launch pressed, move asteroid
            if (launchPressed) {
                launchTarget = clickedPoint;
                earth.userData.stopped = true;

                const direction = new THREE.Vector3().subVectors(launchTarget, asteroid.position).normalize();
                const speed = 0.02 * velocity_km_s; // scaled for visualization
                asteroid.userData.velocity.copy(direction.multiplyScalar(speed));
                asteroid.userData.falling = true;

                launchPressed = false;
            }
        }
    });

    function alertMessage(text, duration = 3000) {
        const msg = document.createElement('div');
        msg.textContent = text;
        Object.assign(msg.style, {
            position: 'fixed',
            display: 'inline-block',
            maxWidth: '80%',
            textAlign: 'center',
            wordwrap: 'break-word',
            top: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(255, 255, 255, 0.15)',
            color: '#fff',
            padding: '10px 16px',
            borderRadius: '6px',
            zIndex: 10000,
            fontFamily: 'sans-serif',
            fontSize: '17px',
            opacity: '1'
        });
        document.body.appendChild(msg);
        setTimeout(() => {
            msg.style.transition = 'opacity 300ms';
            msg.style.opacity = '0';
            setTimeout(() => msg.remove(), 300);
        }, duration);
    }

    // See Impact button
    let orbitDirection = "prograde";
    seeImpactsBtn.addEventListener("click", () => {
        if (lastEarthClickLat === null || lastEarthClickLon === null) {
            alertMessage("Please select an impact location first!");
            return;
        }
        const url = `/impacts?name=${encodeURIComponent(ASTEROID_DATA.name)}&diameter=${ASTEROID_DATA.diameter}&velocity=${ASTEROID_DATA.velocity}&lat=${lastEarthClickLat}&lon=${lastEarthClickLon}&direction=${orbitDirection}`;
        window.location.href = url;
    });

    //Animation logic- generated with chatGPT
    // Animation loop
    function animate() {
        const delta = clock.getDelta();

        // Rotate Earth
        if (!earth.userData.stopped) earth.rotation.y += 0.03;

        // Asteroid orbit
        if (!asteroid.userData.falling && !asteroid.userData.impact) {
            orbitAngle -= omega * delta * 1000;
            asteroid.position.set(
                orbitRadius * Math.cos(orbitAngle),
                0,
                orbitRadius * Math.sin(orbitAngle)
            );
        }

        // Asteroid falling
        if (asteroid.userData.falling && !asteroid.userData.impact) {
            asteroid.position.addScaledVector(asteroid.userData.velocity, delta * 60);

            // Check for impact
            const distanceToEarth = asteroid.position.length();
            if (distanceToEarth <= 1 + asteroidRadius) {
                asteroid.userData.impact = true;
                asteroid.userData.falling = false;
                asteroid.userData.velocity.set(0, 0, 0);

                // Snap to Earth's surface
                const dirToCenter = asteroid.position.clone().normalize();
                asteroid.position.copy(dirToCenter.multiplyScalar(1 + asteroidRadius));
            }
        }

        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    }

    animate();

    window.addEventListener('resize', () => {
        renderer.setSize(container.clientWidth, container.clientHeight);
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
    });
});
