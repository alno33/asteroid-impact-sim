document.addEventListener("DOMContentLoaded", () => {
    // Get size input
    const DEFAULT_SIZE = 500;
    const ASTEROID_SIZE_INPUT = document.getElementById("size");
    const SIZE_VALUE_DISPLAY = document.getElementById("sizeValue");

    if (ASTEROID_SIZE_INPUT != SIZE_VALUE_DISPLAY) {
        ASTEROID_SIZE_INPUT.value = SIZE_VALUE_DISPLAY;
    }

    const VELOCITY_INPUT=document.getElementById("velocity");

    // Scene setup
    const container = document.getElementById("scene-container");
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
        75,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
    );
    camera.position.z = 7;


    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(5, 10, 7);
    scene.add(dir);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);
    
    const TextureLoader = new THREE.TextureLoader();
    let baseSize = Number(ASTEROID_SIZE_INPUT.value) / 10;
    const asteroid = new THREE.Mesh(
        new THREE.SphereGeometry(1, 32, 32),
        new THREE.MeshBasicMaterial({map: TextureLoader.load('/static/img/ast.jpg'), transparent: false})
    );
    
    scene.add(asteroid);

    
    // Animate loop
    function animate() {
        requestAnimationFrame(animate);
        asteroid.scale.set(baseSize, baseSize, baseSize);
        renderer.render(scene, camera);
    }
    animate();

    // Update scale when slider changes
    ASTEROID_SIZE_INPUT.addEventListener("input", () => {
        baseSize = Number(ASTEROID_SIZE_INPUT.value) / 350;
         SIZE_VALUE_DISPLAY.textContent = ASTEROID_SIZE_INPUT.value;
    });
    asteroid.scale.set(baseSize, baseSize, baseSize);
    SIZE_VALUE_DISPLAY.textContent = ASTEROID_SIZE_INPUT.value;
});
