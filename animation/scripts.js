// Scene setup
const container = document.getElementById("container");

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000010, 0.002);

const camera = new THREE.PerspectiveCamera(
60,
  window.innerWidth / window.innerHeight,
  0.1,
  2000
);
camera.position.set(0, 50, 250);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);


// Scene controls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Scene lighting
const ambientLight = new THREE.AmbientLight(0x555555);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 2, 1000);
pointLight.position.set(0, 0, 0);
scene.add(pointLight);

//Central planet
const centralGeo = new THREE.SphereGeometry(20, 64, 64);
const centralMaterial = new THREE.MeshStandardMaterial({ color: 0x1e3fff,
emissive: 0x000040,
roughness: 0.4,
 });
const centralPlanet = new THREE.Mesh(centralGeo, centralMaterial);
scene.add(centralPlanet);

// Planets
const planetsData = [
  {distance: 80, speed: 0.04, color: 0xff0000},
  {distance: 140, speed: 0.02, color: 0xffeb3b},
  {distance: 100, speed: 0.06, color: 0x00ffcc}
];

const planets = [];
const trails = [];

planetsData.forEach((pd) => {
  const geo = new THREE.SphereGeometry(8, 32, 32);
  const material = new THREE.MeshStandardMaterial({ color: pd.color, emissive: pd.color/4 });
  const mesh = new THREE.Mesh(geo, material);

  mesh.userData = { angle: Math.random() * Math.PI * 2, distance: pd.distance, speed: pd.speed };
  scene.add(mesh);
  planets.push(mesh);


  // Trails
  const trailGeo = new THREE.BufferGeometry().setFromPoints([]);
  const trailMaterial = new THREE.PointsMaterial({ color: pd.color, size: 2, transparent: true, opacity: 0.6 });
  const trail = new THREE.Points(trailGeo, trailMaterial);
  scene.add(trail);
  trails.push(trail);
});

// Sound Effects
const listener = new THREE.AudioListener();
camera.add(listener);

const soundAmbient = new THREE.Audio(listener);
const soundEffect = new THREE.Audio(listener);

const audioLoader = new THREE.audioLoader();
audioLoader.load("/sounds/Space Ambience.mp3", (buffer) => {
  soundAmbient.setBuffer(buffer);
  soundAmbient.setLoop(true);
  soundAmbient.setVolume(0.4);
  soundAmbient.play();
});

audioLoader.load("/sounds/animation/sounds/envato_sfxgen_Dec_23_2025_10_03_13 (1).mp3", (buffer) => {
  soundAmbient.setBuffer(buffer);
  soundAmbient.setLoop(true);
  soundAmbient.setVolume(0.4);
  soundAmbient.play();
});

// Animations
// ===== Animations =====
function animate() {
  requestAnimationFrame(animate);

  // Central planet animation - center rotation
  centralPlanet.rotation.y += 0.002;

  // Other planets elliptical orbit animation
  planets.forEach((pl, idx) => {
    pl.userData.angle += pl.userData.speed;
    pl.position.set(
      Math.cos(pl.userData.angle)*pl.userData.dist,
      Math.sin(pl.userData.angle*0.5)*10,
      Math.sin(pl.userData.angle)*pl.userData.dist
    );

    // Trail
    const trail = trails[idx];
    const positions = trail.geometry.attributes.position?.array || [];
    const newPos = new THREE.Vector3().copy(pl.position);
    const arr = Array.from(positions);
    arr.unshift(newPos.x, newPos.y, newPos.z);
    if (arr.length > 300) arr.splice(300);
    trail.geometry.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));
    trail.geometry.attributes.position.needsUpdate = true;
  });

  controls.update();
  renderer.render(scene, camera);
}
animate();

// Interactive Mouse Speed Control
window.addEventListener("mousemove", (e) => { 
  const xNorm = (e.clientX / window.innerWidth) * 2 - 1;
  planets.forEach((pl) => {
    pl.userData.speed = THREE.MathUtils.lerp(0.01, 0.1, Math.abs(xNorm))
  });
  soundEffect.play();
});


// Resizing
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
