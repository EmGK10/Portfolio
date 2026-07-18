// ===== V5 — si ves este comentario en la página en vivo, sí se actualizó =====
/* ============================================================
   cad-viewer.js — visor 3D interactivo para el portafolio CAD
   Usa Three.js (ESM vía CDN, ver importmap en cad.html)

   Contenido de ejemplo: los 3 modelos ("bracket", "gear", "piston")
   se generan de forma procedural con geometría de Three.js, para no
   depender de archivos externos mientras no tengas tus .glb reales.

   Cuando tengas tus modelos CAD exportados a .glb/.gltf:
   1) Súbelos a la carpeta assets/cad/models/
   2) En cad.html cambia el atributo, por ejemplo:
        data-model="assets/cad/models/mi-pieza.glb"
   3) Este script detecta automáticamente la extensión .glb/.gltf
      y lo carga con GLTFLoader en lugar del modelo procedural.
   ============================================================ */

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

let renderer, scene, camera, controls, currentGroup, animId, resizeObserver;

const ACCENT = 0xc9a24b;
const ACCENT_2 = 0x9fb8c9;
const METAL = 0x8a8d90;

function initRendererOnce(wrap) {
  if (renderer) return;

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  wrap.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  scene.background = null;
  scene.fog = new THREE.Fog(0x0a0a0b, 8, 22);

  // Entorno de iluminación (PMREM) — sin esto, los materiales metálicos/PBR
  // que traen muchos .glb exportados desde Blender/CAD (metalness=1, sin
  // textura) se ven casi negros porque no tienen nada que reflejar.
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
  pmremGenerator.dispose();

  camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(3.4, 2.4, 4.2);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 1.4;
  // límites de zoom "de sobra" — se ajustan de verdad por modelo en frameObject()
  controls.minDistance = 0.01;
  controls.maxDistance = 100000;
  controls.enablePan = false;

  const ambient = new THREE.AmbientLight(0xffffff, 0.35);
  scene.add(ambient);

  const key = new THREE.DirectionalLight(0xfff2df, 1.5);
  key.position.set(5, 6, 4);
  scene.add(key);

  const rim = new THREE.DirectionalLight(0x9fb8c9, 0.9);
  rim.position.set(-5, 2, -4);
  scene.add(rim);

  const backLight = new THREE.DirectionalLight(0xffffff, 1.2);
  backLight.position.set(0, -3, -8);
  scene.add(backLight);

  // suelo sutil para recibir sombra de contacto (falsa, vía gradient)
  const groundGeo = new THREE.CircleGeometry(6, 48);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x0e0e10,
    roughness: 1,
    metalness: 0,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -1.4;
  scene.add(ground);
}

function startAnimation() {
  if (animId) return; // ya está corriendo
  animate();
}

function stopAnimation() {
  if (animId) {
    cancelAnimationFrame(animId);
    animId = null;
  }
}

function animate() {
  animId = requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

function clearModel() {
  if (currentGroup) {
    scene.remove(currentGroup);
    currentGroup.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
        else obj.material.dispose();
      }
    });
    currentGroup = null;
  }
}

function metalMat(color, roughness = 0.35, metalness = 0.75) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

/* ---------- modelos procedurales de ejemplo ---------- */

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

  // agujeros representados como pequeños cilindros oscuros incrustados
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
  g.scale.setScalar(1.0);
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

  // ranuras de anillos
  [1.45, 1.3, 1.15].forEach((y) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.75, 0.03, 8, 40),
      dark
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = y;
    g.add(ring);
  });

  const pin = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.16, 1.7, 24),
    steel
  );
  pin.rotation.z = Math.PI / 2;
  pin.position.y = 0.65;
  g.add(pin);

  const rod = new THREE.Mesh(new THREE.BoxGeometry(0.28, 1.5, 0.5), steel);
  rod.position.y = -0.2;
  g.add(rod);

  const bigEnd = new THREE.Mesh(
    new THREE.CylinderGeometry(0.48, 0.48, 0.55, 32),
    steel
  );
  bigEnd.rotation.x = Math.PI / 2;
  bigEnd.position.y = -1.05;
  g.add(bigEnd);

  const crankPin = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.2, 0.7, 24),
    dark
  );
  crankPin.rotation.x = Math.PI / 2;
  crankPin.position.y = -1.05;
  g.add(crankPin);

  g.position.y = -0.2;
  g.scale.setScalar(0.95);
  return g;
}

const PROCEDURAL = {
  bracket: buildBracket,
  gear: buildGear,
  piston: buildPiston,
};

function frameObject(obj) {
  const box = new THREE.Box3().setFromObject(obj);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  obj.position.sub(center);

  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  const dist = maxDim * 1.9;
  camera.position.set(dist * 0.85, dist * 0.6, dist);
  camera.near = maxDim / 100;
  camera.far = maxDim * 100;
  camera.updateProjectionMatrix();
  controls.target.set(0, 0, 0);

  // límites de zoom relativos al tamaño de ESTE modelo, para que la cámara
  // nunca pueda quedar "adentro" del objeto ni alejarse a lo absurdo
  controls.minDistance = dist / 25;
  controls.maxDistance = dist * 20;
  controls.update();
}

async function loadModel(key) {
  clearModel();
  const loadingEl = document.getElementById("cadLoading");
  if (loadingEl) loadingEl.style.display = "flex";

  const isFile = /\.(glb|gltf)$/i.test(key);

  if (isFile) {
    const loader = new GLTFLoader();
    loader.load(
      key,
      (gltf) => {
        currentGroup = gltf.scene;

        // Muchos exportadores (Blender/SolidWorks) dejan piezas sin material,
        // lo que hace que el visor use el material por defecto de glTF:
        // 100% metálico y 100% rugoso. Sin un mapa de entorno fuerte, eso se
        // ve prácticamente negro. Lo sustituimos por un metal visible normal.
        currentGroup.traverse((obj) => {
          if (!obj.isMesh || !obj.material) return;
          const m = obj.material;
          const looksLikeDefaultMaterial =
            (m.metalness ?? 0) >= 0.9 && (m.roughness ?? 0) >= 0.9 && !m.map;
          if (looksLikeDefaultMaterial) {
            obj.material = metalMat(0x9a9a9a, 0.45, 0.4);
          }
          // Muchas piezas CAD exportadas a glTF (Blender, SolidWorks, etc.)
          // traen las normales/orientación de cara invertidas por el proceso
          // de conversión de ejes o por escalas negativas. Si solo se dibuja
          // el lado "de frente" (comportamiento por defecto), la pieza puede
          // volverse invisible desde casi cualquier ángulo. Forzamos que se
          // dibujen ambos lados para no depender de que la exportación
          // venga perfecta.
          obj.material.side = THREE.DoubleSide;
        });

        scene.add(currentGroup);
        frameObject(currentGroup);
        if (loadingEl) loadingEl.style.display = "none";
         window.__cadDebug = { renderer, scene, camera, currentGroup, controls, THREE };

        // --- diagnóstico V4 ---
        console.log("[v4] escena hijos:", scene.children.length);
        console.log("[v4] canvas buffer:", renderer.domElement.width, "x", renderer.domElement.height);
        console.log("[v4] canvas CSS size:", renderer.domElement.style.width, renderer.domElement.style.height);
        console.log("[v4] wrap client size:", document.getElementById("cadCanvasWrap").clientWidth, document.getElementById("cadCanvasWrap").clientHeight);
        console.log("[v4] camera near/far/pos:", camera.near, camera.far, camera.position.toArray());
        console.log("[v4] controls target/dist:", controls.target.toArray(), controls.minDistance, controls.maxDistance);
        console.log("[v4] scene.environment:", scene.environment);
        currentGroup.traverse((obj) => {
          if (obj.isMesh) {
            console.log(
              `[v4] mesh "${obj.name}" material tras override:`,
              obj.material.type,
              obj.material.color ? obj.material.color.getHexString() : null,
              "metalness=" + obj.material.metalness,
              "roughness=" + obj.material.roughness,
              "visible=" + obj.visible
            );
          }
        });
        console.log("[v4] WebGL context:", renderer.getContext());
        // --- fin diagnóstico ---
      },
      undefined,
      (err) => {
        console.error("Error cargando modelo GLB:", err);
        if (loadingEl) loadingEl.textContent = "No se pudo cargar el modelo.";
      }
    );
  } else {
    const builder = PROCEDURAL[key] || buildBracket;
    currentGroup = builder();
    scene.add(currentGroup);
    frameObject(currentGroup);
    // pequeño respiro para que se vea la transición de carga
    await new Promise((r) => setTimeout(r, 180));
    if (loadingEl) loadingEl.style.display = "none";
  }
}

function resizeToWrap(wrap) {
  const w = wrap.clientWidth;
  const h = wrap.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

/* ---------- wiring de la UI (modal) ---------- */

document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("cadModal");
  if (!modal) return;

  const wrap = document.getElementById("cadCanvasWrap");
  const closeBtn = document.getElementById("cadModalClose");
  const titleEl = document.getElementById("cadModalTitle");
  const descEl = document.getElementById("cadModalDesc");

  function openModal(card) {
    const modelKey = card.getAttribute("data-model");
    titleEl.textContent = card.getAttribute("data-title") || "";
    descEl.textContent = card.getAttribute("data-desc") || "";

    modal.classList.add("open");
    document.body.style.overflow = "hidden";

    initRendererOnce(wrap);
    resizeToWrap(wrap);
    loadModel(modelKey);
    startAnimation();

    if (!resizeObserver) {
      resizeObserver = new ResizeObserver(() => resizeToWrap(wrap));
      resizeObserver.observe(wrap);
    }
  }

  function closeModal() {
    modal.classList.remove("open");
    document.body.style.overflow = "";
    stopAnimation();
  }

  document.querySelectorAll("[data-cad]").forEach((card) => {
    card.addEventListener("click", () => openModal(card));
    card.setAttribute("tabindex", "0");
    card.setAttribute("role", "button");
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openModal(card);
      }
    });
  });

  closeBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("open")) closeModal();
  });
});
