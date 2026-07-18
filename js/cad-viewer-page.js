/* ============================================================
   cad-viewer-page.js — visor 3D de página completa (sin popup)
   Basado en el patrón probado de test3d.html: canvas a pantalla
   completa colgado directo de <body>, tamaño tomado de
   window.innerWidth/innerHeight (NO de un contenedor con CSS),
   para evitar el problema de renderizado en negro que tenía la
   versión anterior con popup/modal.

   Uso: visor3d.html?model=<ruta.glb|bracket|gear|piston>
                    &title=<texto>&desc=<texto>
   ============================================================ */

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const ACCENT = 0xc9a24b;
const ACCENT_2 = 0x9fb8c9;
const METAL = 0x8a8d90;

/* ---------- parámetros de la URL ---------- */
const params = new URLSearchParams(window.location.search);
const modelKey = params.get("model") || "bracket";
const title = params.get("title") || "Modelo 3D";
const desc = params.get("desc") || "";

const titleEl = document.getElementById("viewerTitle");
const descEl = document.getElementById("viewerDesc");
const loadingEl = document.getElementById("viewerLoading");
const host = document.getElementById("viewerCanvasHost");

if (titleEl) titleEl.textContent = title;
if (descEl) descEl.textContent = desc;
document.title = title + " — Emilia Gómez Murillo";

/* ---------- renderer / escena / cámara ---------- */
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.setSize(window.innerWidth, window.innerHeight);
host.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0b0c);
scene.fog = new THREE.Fog(0x0a0a0b, 10, 40);

// Entorno de iluminación (PMREM) — sin esto, materiales metálicos/PBR
// sin textura (comunes en .glb exportados desde Blender/CAD) se ven negros.
const pmremGenerator = new THREE.PMREMGenerator(renderer);
scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
pmremGenerator.dispose();

const camera = new THREE.PerspectiveCamera(
  42,
  window.innerWidth / window.innerHeight,
  0.01,
  1e6
);
camera.position.set(3.4, 2.4, 4.2);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.autoRotate = true;
controls.autoRotateSpeed = 1.0;
controls.enablePan = true;
controls.minDistance = 0.01;
controls.maxDistance = 1e6;

const ambient = new THREE.AmbientLight(0xffffff, 0.35);
scene.add(ambient);

const keyLight = new THREE.DirectionalLight(0xfff2df, 1.5);
keyLight.position.set(5, 6, 4);
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight(0x9fb8c9, 0.9);
rimLight.position.set(-5, 2, -4);
scene.add(rimLight);

const fillLight = new THREE.PointLight(ACCENT, 0.6, 60);
fillLight.position.set(-2, -1, 3);
scene.add(fillLight);

window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

function metalMat(color, roughness = 0.35, metalness = 0.75) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

/* ---------- modelos procedurales de ejemplo (gear / piston) ---------- */

function buildBracket() {
  const g = new THREE.Group();
  const mat = metalMat(METAL);
  const accentMat = metalMat(ACCENT, 0.4, 0.6);

  const base = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.18, 1.2), mat);
  base.position.set(0, -0.6, 0);
  g.add(base);

  const upright = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.6, 1.2), mat);
  upright.position.set(-1.1, 0.2, 0);
  g.add(upright);

  const gusset = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 1.3, 16),
    accentMat
  );
  gusset.rotation.z = Math.PI / 4;
  gusset.position.set(-0.6, -0.15, 0);
  g.add(gusset);

  [-0.7, 0, 0.7].forEach((x) => {
    const hole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.11, 0.22, 24),
      metalMat(0x0c0c0d, 0.9, 0.1)
    );
    hole.rotation.x = Math.PI / 2;
    hole.position.set(x, -0.6, 0);
    g.add(hole);
  });

  const topHole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.09, 0.2, 24),
    metalMat(0x0c0c0d, 0.9, 0.1)
  );
  topHole.position.set(-1.1, 0.85, 0);
  g.add(topHole);

  g.scale.setScalar(1.15);
  return g;
}

function buildGear() {
  const g = new THREE.Group();
  const mat = metalMat(ACCENT_2, 0.3, 0.8);

  const body = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.4, 48), mat);
  g.add(body);

  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.35, 0.5, 32),
    metalMat(METAL, 0.35, 0.75)
  );
  g.add(hub);

  const bore = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.16, 0.6, 24),
    metalMat(0x0c0c0d, 0.9, 0.1)
  );
  g.add(bore);

  const teethCount = 16;
  for (let i = 0; i < teethCount; i++) {
    const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.4, 0.22), mat);
    const angle = (i / teethCount) * Math.PI * 2;
    tooth.position.set(Math.cos(angle) * 1.24, 0, Math.sin(angle) * 1.24);
    tooth.rotation.y = -angle;
    g.add(tooth);
  }

  g.rotation.x = Math.PI / 2.4;
  return g;
}

function buildPiston() {
  const g = new THREE.Group();
  const alu = metalMat(0xd7d7d2, 0.25, 0.55);
  const steel = metalMat(METAL, 0.35, 0.8);
  const dark = metalMat(0x0c0c0d, 0.9, 0.1);

  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.9, 40), alu);
  head.position.y = 1.1;
  g.add(head);

  [1.45, 1.3, 1.15].forEach((y) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.03, 8, 40), dark);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = y;
    g.add(ring);
  });

  const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 1.7, 24), steel);
  pin.rotation.z = Math.PI / 2;
  pin.position.y = 0.65;
  g.add(pin);

  const rod = new THREE.Mesh(new THREE.BoxGeometry(0.28, 1.5, 0.5), steel);
  rod.position.y = -0.2;
  g.add(rod);

  const bigEnd = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.55, 32), steel);
  bigEnd.rotation.x = Math.PI / 2;
  bigEnd.position.y = -1.05;
  g.add(bigEnd);

  const crankPin = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.7, 24), dark);
  crankPin.rotation.x = Math.PI / 2;
  crankPin.position.y = -1.05;
  g.add(crankPin);

  g.position.y = -0.2;
  g.scale.setScalar(0.95);
  return g;
}

const PROCEDURAL = { bracket: buildBracket, gear: buildGear, piston: buildPiston };

/* ---------- encuadre automático de cámara ---------- */
function frameObject(obj) {
  const box = new THREE.Box3().setFromObject(obj);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  obj.position.sub(center);

  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  const dist = maxDim * 2.2;
  camera.position.set(dist * 0.6, dist * 0.5, dist);
  camera.near = maxDim / 1000;
  camera.far = maxDim * 1000;
  camera.updateProjectionMatrix();
  controls.target.set(0, 0, 0);

  // límites de zoom relativos al tamaño de ESTE modelo
  controls.minDistance = dist / 25;
  controls.maxDistance = dist * 20;
  controls.update();
}

function hideLoading() {
  loadingEl.classList.add("hidden");
}

function showError(msg) {
  loadingEl.textContent = msg;
  loadingEl.classList.add("viewer-error");
}

let modelLoaded = false;

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

const isFile = /\.(glb|gltf)$/i.test(modelKey);

if (isFile) {
  const loader = new GLTFLoader();
  loader.load(
    modelKey,
    (gltf) => {
      const root = gltf.scene;

      // Muchos exportadores (Blender/SolidWorks) dejan piezas sin material,
      // lo que activa el material por defecto de glTF (100% metálico,
      // 100% rugoso) y se ve prácticamente negro. Lo sustituimos por un
      // metal visible normal, y forzamos doble cara por si las normales
      // vienen invertidas por el proceso de exportación.
      root.traverse((obj) => {
        if (!obj.isMesh || !obj.material) return;
        const m = obj.material;
        const looksLikeDefaultMaterial =
          (m.metalness ?? 0) >= 0.9 && (m.roughness ?? 0) >= 0.9 && !m.map;
        if (looksLikeDefaultMaterial) {
          obj.material = metalMat(0x9a9a9a, 0.45, 0.4);
        }
        obj.material.side = THREE.DoubleSide;
      });

      scene.add(root);
      frameObject(root);
      hideLoading();
      modelLoaded = true;
    },
    undefined,
    (err) => {
      console.error("Error cargando modelo 3D:", err);
      showError("No se pudo cargar el modelo 3D.");
    }
  );
} else {
  const builder = PROCEDURAL[modelKey] || buildBracket;
  const group = builder();
  scene.add(group);
  frameObject(group);
  hideLoading();
  modelLoaded = true;
}
