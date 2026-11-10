// The 3D stage for "Go and Tell": low-poly people on a dusk city street, drawn at low
// resolution with flat shading and nearest-neighbour textures, the way a PlayStation 1 game looked.
// Everything is built in code (boxes, cylinders and textures painted on a canvas), so there are
// no model or image files and the game works offline.

import * as THREE from "three";

export const VIEW_W = 480;
export const VIEW_H = 270;

export type Look = { shirt: string; pants: string; skin: string; hair: string };

export type Rig = {
  root: THREE.Group; // position in the world
  tilt: THREE.Group; // falling over, diving
  turn: THREE.Group; // facing left or right
  armL: THREE.Group;
  armR: THREE.Group;
  legL: THREE.Group;
  legR: THREE.Group;
  shadow: THREE.Mesh;
  shield: THREE.Object3D | null;
  heart: THREE.Mesh;
  phone: THREE.Mesh | null;
  smile: THREE.Mesh | null;
  mats: { shirt: THREE.MeshLambertMaterial; pants: THREE.MeshLambertMaterial; skin: THREE.MeshLambertMaterial; hair: THREE.MeshLambertMaterial } | null;
};

export type Pose = {
  x: number; y: number; z: number; face: number; phase: number;
  mode: "stand" | "lie" | "kneel" | "dive";
  reach?: boolean; shield?: boolean; flail?: boolean; happy?: boolean; phone?: boolean; t: number;
};

const hash = (n: number) => {
  const v = Math.sin(n * 127.1) * 43758.5453;
  return v - Math.floor(v);
};

function lambert(color: string | number) {
  return new THREE.MeshLambertMaterial({ color, flatShading: true });
}

function box(w: number, h: number, d: number, mat: THREE.Material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  return m;
}

function paint(w: number, h: number, draw: (c: CanvasRenderingContext2D) => void, repeat = false) {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  draw(cv.getContext("2d")!);
  const tex = new THREE.CanvasTexture(cv);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.colorSpace = THREE.SRGBColorSpace;
  if (repeat) tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function heartGeometry() {
  const s = new THREE.Shape();
  s.moveTo(0, -0.16);
  s.bezierCurveTo(-0.3, 0.05, -0.16, 0.26, 0, 0.1);
  s.bezierCurveTo(0.16, 0.26, 0.3, 0.05, 0, -0.16);
  return new THREE.ExtrudeGeometry(s, { depth: 0.08, bevelEnabled: false, curveSegments: 3 });
}

export function createStage(canvas: HTMLCanvasElement) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "low-power" });
  renderer.setPixelRatio(1);
  renderer.setSize(VIEW_W, VIEW_H, false);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x5b3f66, 16, 46);
  scene.background = paint(256, 144, (c) => {
    const g = c.createLinearGradient(0, 0, 0, 144);
    g.addColorStop(0, "#12152e");
    g.addColorStop(0.22, "#2b2b5c");
    g.addColorStop(0.4, "#6a3f6e");
    g.addColorStop(0.52, "#c9685c");
    g.addColorStop(0.62, "#f0a765");
    g.addColorStop(1, "#f0a765");
    c.fillStyle = g;
    c.fillRect(0, 0, 256, 144);
    c.fillStyle = "#f4e9c9";
    for (let i = 0; i < 40; i++) c.fillRect(Math.floor(hash(i + 3) * 256), Math.floor(hash(i + 71) * 40), 1, 1);
    c.fillStyle = "#ffe2a0";
    c.beginPath();
    c.arc(196, 74, 9, 0, Math.PI * 2);
    c.fill();
  });

  const camera = new THREE.PerspectiveCamera(44, VIEW_W / VIEW_H, 0.5, 80);

  scene.add(new THREE.HemisphereLight(0xb9b4ff, 0x4a3350, 2.2));
  const sun = new THREE.DirectionalLight(0xffb878, 2.6);
  sun.position.set(-6, 7, 8);
  scene.add(sun);
  const rim = new THREE.DirectionalLight(0xff8a5c, 1.2);
  rim.position.set(5, 3, -8);
  scene.add(rim);

  // ----- ground: pavement and road, textures slide so the street never ends -----
  const paveTex = paint(32, 32, (c) => {
    c.fillStyle = "#8d889b";
    c.fillRect(0, 0, 32, 32);
    c.fillStyle = "#6e697c";
    c.fillRect(0, 0, 32, 1);
    c.fillRect(0, 0, 1, 32);
    c.fillStyle = "#9a95a8";
    for (let i = 0; i < 26; i++) c.fillRect((i * 13) % 31, (i * 7) % 31, 1, 1);
  }, true);
  paveTex.repeat.set(40, 2);
  const pave = new THREE.Mesh(new THREE.PlaneGeometry(80, 4), new THREE.MeshLambertMaterial({ map: paveTex }));
  pave.rotation.x = -Math.PI / 2;
  pave.position.set(0, 0, -0.4);
  scene.add(pave);

  const kerb = box(80, 0.18, 0.2, lambert("#b9b4c4"), 0, -0.09, 1.7);
  scene.add(kerb);

  const roadTex = paint(64, 32, (c) => {
    c.fillStyle = "#2a2733";
    c.fillRect(0, 0, 64, 32);
    c.fillStyle = "#34313f";
    for (let i = 0; i < 40; i++) c.fillRect((i * 17) % 63, (i * 11) % 31, 2, 1);
    c.fillStyle = "#d4b062";
    c.fillRect(8, 15, 28, 2);
  }, true);
  roadTex.repeat.set(16, 1);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(80, 7), new THREE.MeshLambertMaterial({ map: roadTex }));
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, -0.18, 5.2);
  scene.add(road);

  // ----- buildings: a near row with lit windows and a far row lost in the haze -----
  const walls = ["#3a3050", "#44355a", "#2f2a48", "#4d3a52"];
  const protos = [3, 4.5, 6, 3.5, 5, 4].map((h, i) => {
    const tex = paint(32, 64, (c) => {
      c.fillStyle = walls[i % walls.length];
      c.fillRect(0, 0, 32, 64);
      for (let y = 3; y < 60; y += 8) {
        for (let x = 3; x < 30; x += 7) {
          const lit = hash(i * 31 + x * 7 + y) < 0.45;
          c.fillStyle = lit ? (hash(x + y * 3 + i) < 0.3 ? "#ffe9a8" : "#f2c15a") : "#1f1b30";
          c.fillRect(x, y, 4, 5);
        }
      }
    }, true);
    tex.repeat.set(1, h / 8);
    const geo = new THREE.BoxGeometry(3.6, h, 4);
    geo.translate(0, h / 2, 0);
    return { geo, mat: new THREE.MeshLambertMaterial({ map: tex }) };
  });
  const near: THREE.Mesh[] = [];
  for (let i = 0; i < 16; i++) {
    const m = new THREE.Mesh(protos[0].geo, protos[0].mat);
    scene.add(m);
    near.push(m);
  }
  const farGeo = new THREE.BoxGeometry(5.4, 1, 4);
  farGeo.translate(0, 0.5, 0);
  const farMat = lambert("#2a2242");
  const far: THREE.Mesh[] = [];
  for (let i = 0; i < 14; i++) {
    const m = new THREE.Mesh(farGeo, farMat);
    scene.add(m);
    far.push(m);
  }

  // ----- street lamps and fire hydrants -----
  const poleMat = lambert("#22202c");
  const bulbMat = new THREE.MeshBasicMaterial({ color: "#ffe6a0", fog: false });
  const lamps: THREE.Group[] = [];
  for (let i = 0; i < 6; i++) {
    const g = new THREE.Group();
    g.add(box(0.1, 3.4, 0.1, poleMat, 0, 1.7, 0));
    g.add(box(0.1, 0.1, 0.9, poleMat, 0, 3.4, 0.4));
    g.add(box(0.3, 0.16, 0.3, bulbMat, 0, 3.3, 0.8));
    scene.add(g);
    lamps.push(g);
  }
  const red = lambert("#c8392b");
  const hydrants: THREE.Group[] = [];
  for (let i = 0; i < 3; i++) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 0.5, 6), red);
    body.position.y = 0.25;
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.14, 0.14, 6), red);
    cap.position.y = 0.57;
    g.add(body, cap, box(0.44, 0.1, 0.1, red, 0, 0.32, 0));
    g.visible = false;
    scene.add(g);
    hydrants.push(g);
  }

  // ----- people -----
  const shadowGeo = new THREE.CircleGeometry(0.42, 10);
  const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.32, depthWrite: false });
  const eyeMat = new THREE.MeshBasicMaterial({ color: "#16110c" });
  const whiteMat = new THREE.MeshBasicMaterial({ color: "#ffffff" });
  const shoeMat = lambert("#1b1b1f");
  const heartGeo = heartGeometry();
  const heartMat = new THREE.MeshBasicMaterial({ color: "#ff5c7a", fog: false });

  function makeRig(disciple: boolean): Rig {
    const root = new THREE.Group();
    const tilt = new THREE.Group();
    const turn = new THREE.Group();
    root.add(tilt);
    tilt.add(turn);
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.02;
    root.add(shadow);

    const mats = disciple
      ? null
      : { shirt: lambert("#c0453a"), pants: lambert("#2c3350"), skin: lambert("#d9a273"), hair: lambert("#231a14") };
    const skin = mats ? mats.skin : lambert("#d9a273");
    const cloth = mats ? mats.shirt : lambert("#e2d3ad");
    const legMat = mats ? mats.pants : lambert("#d9a273");

    const limb = (y: number, z: number, len: number, w: number, mat: THREE.Material, end: THREE.Material, endH: number) => {
      const g = new THREE.Group();
      g.position.set(0, y, z);
      g.add(box(w, len, w, mat, 0, -len / 2, 0));
      g.add(box(w + 0.08, endH, w + 0.02, end, 0.04, -len - endH / 2 + 0.02, 0));
      turn.add(g);
      return g;
    };
    const legL = limb(0.78, 0.13, 0.7, 0.2, legMat, disciple ? lambert("#6b4a2a") : shoeMat, 0.1);
    const legR = limb(0.78, -0.13, 0.7, 0.2, legMat, disciple ? lambert("#6b4a2a") : shoeMat, 0.1);
    const armL = limb(1.36, 0.33, 0.52, 0.15, cloth, skin, 0.12);
    const armR = limb(1.36, -0.33, 0.52, 0.15, cloth, skin, 0.12);

    let phone: THREE.Mesh | null = null;
    let smile: THREE.Mesh | null = null;
    if (disciple) {
      const robe = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.37, 1.22, 6), cloth);
      robe.position.y = 0.8;
      turn.add(robe);
      turn.add(box(0.56, 0.09, 0.58, lambert("#d4b062"), 0, 0.98, 0)); // sash
      turn.add(box(0.36, 0.36, 0.36, skin, 0, 1.6, 0));
      turn.add(box(0.42, 0.14, 0.42, lambert("#f4ead2"), 0, 1.8, 0)); // head cloth
      turn.add(box(0.12, 0.44, 0.42, lambert("#f4ead2"), -0.21, 1.6, 0));
      turn.add(box(0.14, 0.22, 0.3, lambert("#5b3a1e"), 0.17, 1.45, 0)); // beard
    } else {
      turn.add(box(0.34, 0.62, 0.5, cloth, 0, 1.08, 0));
      turn.add(box(0.36, 0.36, 0.36, skin, 0, 1.6, 0));
      turn.add(box(0.4, 0.13, 0.4, mats!.hair, -0.01, 1.82, 0));
      turn.add(box(0.1, 0.3, 0.4, mats!.hair, -0.19, 1.66, 0));
      smile = box(0.02, 0.05, 0.16, whiteMat, 0.185, 1.5, 0);
      smile.visible = false;
      turn.add(smile);
      phone = box(0.05, 0.16, 0.1, new THREE.MeshBasicMaterial({ color: "#cfe6ff" }), 0.26, 1.52, 0.2);
      phone.visible = false;
      turn.add(phone);
    }
    turn.add(box(0.02, 0.06, 0.06, eyeMat, 0.185, 1.64, 0.09), box(0.02, 0.06, 0.06, eyeMat, 0.185, 1.64, -0.09));

    let shield: THREE.Object3D | null = null;
    if (disciple) {
      const g = new THREE.Group();
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.08, 10), lambert("#d4b062"));
      const rimMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.66, 0.66, 0.05, 10), lambert("#8a6a2c"));
      rimMesh.position.y = -0.03;
      const cream = new THREE.MeshBasicMaterial({ color: "#fff8e7" });
      g.add(disc, rimMesh, box(0.16, 0.03, 0.8, cream, 0, 0.05, 0), box(0.5, 0.03, 0.16, cream, 0, 0.05, -0.12));
      g.position.set(0, 2.25, 0.1);
      g.rotation.x = 0.85;
      g.visible = false;
      root.add(g);
      shield = g;
    }
    const heart = new THREE.Mesh(heartGeo, heartMat);
    heart.position.set(0, 2.25, 0);
    heart.visible = false;
    root.add(heart);

    scene.add(root);
    return { root, tilt, turn, armL, armR, legL, legR, shadow, shield, heart, phone, smile, mats };
  }

  const player = makeRig(true);
  const pool: Rig[] = [];
  function takeRig(look: Look) {
    const r = pool.pop() ?? makeRig(false);
    r.mats!.shirt.color.set(look.shirt);
    r.mats!.pants.color.set(look.pants);
    r.mats!.skin.color.set(look.skin);
    r.mats!.hair.color.set(look.hair);
    r.root.visible = true;
    return r;
  }
  function freeRig(r: Rig) {
    r.root.visible = false;
    pool.push(r);
  }

  function pose(r: Rig, p: Pose) {
    r.root.position.set(p.x, p.y, p.z);
    r.turn.rotation.y = p.face > 0 ? -0.5 : Math.PI + 0.5;
    r.tilt.rotation.z = 0;
    r.tilt.position.y = 0;
    r.turn.position.y = 0;
    let legA = Math.sin(p.phase) * 0.75;
    let armA = -Math.sin(p.phase) * 0.6;
    let armB = Math.sin(p.phase) * 0.6;
    let legB = -legA;
    if (p.mode === "lie") {
      r.tilt.rotation.z = (-Math.PI / 2) * p.face;
      r.tilt.position.y = 0.22;
      legA = legB = armA = armB = 0;
      if (p.flail) {
        legA = Math.sin(p.t * 22) * 0.6;
        legB = -legA;
        armA = 1.6 + Math.sin(p.t * 19) * 0.7;
        armB = 1.6 - Math.sin(p.t * 19) * 0.7;
      }
    } else if (p.mode === "kneel") {
      r.turn.position.y = -0.34 + Math.sin(p.t * 9) * 0.03;
      legA = legB = 1.35;
    } else if (p.mode === "dive") {
      r.tilt.rotation.z = -1.05 * p.face;
      r.tilt.position.y = 0.25;
      legA = -0.5;
      legB = -0.2;
    }
    if (p.reach) armA = armB = 1.5;
    if (p.shield) armA = armB = Math.PI - 0.15;
    if (p.phone) armA = 2.3;
    r.legL.rotation.z = legA;
    r.legR.rotation.z = legB;
    r.armL.rotation.z = armA;
    r.armR.rotation.z = armB;
    r.shadow.scale.setScalar(p.mode === "lie" ? 1.7 : Math.max(0.5, 1 - p.y * 0.25));
    r.shadow.position.y = 0.02 - p.y;
    if (r.shield) r.shield.visible = !!p.shield;
    if (r.phone) r.phone.visible = !!p.phone;
    if (r.smile) r.smile.visible = !!p.happy;
    r.heart.visible = !!p.happy;
    if (p.happy) {
      r.heart.rotation.y = p.t * 2.4;
      r.heart.position.y = 2.3 + Math.sin(p.t * 3 + p.x) * 0.08;
    }
  }

  // ----- flaming arrows, landing marks, hearts and dust -----
  const flameMat = new THREE.MeshBasicMaterial({ color: "#ff7a2a", fog: false });
  const coreMat = new THREE.MeshBasicMaterial({ color: "#ffe27a", fog: false });
  const shaftMat = lambert("#5a4028");
  const arrows: { g: THREE.Group; flame: THREE.Mesh }[] = [];
  const marks: THREE.Mesh[] = [];
  for (let i = 0; i < 6; i++) {
    const g = new THREE.Group();
    g.add(box(1.0, 0.05, 0.05, shaftMat, -0.5, 0, 0));
    g.add(box(0.22, 0.14, 0.02, lambert("#e8dcc0"), -0.95, 0, 0));
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.5, 5), flameMat);
    flame.rotation.z = Math.PI / 2;
    flame.position.x = -0.12;
    const core = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.3, 4), coreMat);
    core.rotation.z = Math.PI / 2;
    core.position.x = -0.05;
    g.add(flame, core);
    g.visible = false;
    scene.add(g);
    arrows.push({ g, flame });
    const mk = new THREE.Mesh(new THREE.RingGeometry(0.28, 0.42, 12), new THREE.MeshBasicMaterial({ color: "#ff5236", transparent: true, opacity: 0.85, fog: false, side: THREE.DoubleSide }));
    mk.rotation.x = -Math.PI / 2;
    mk.position.y = 0.03;
    mk.visible = false;
    scene.add(mk);
    marks.push(mk);
  }
  const bits: THREE.Mesh[] = [];
  const dustMat = new THREE.MeshBasicMaterial({ color: "#d8d2e0" });
  const dustGeo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
  const smallHeart = heartGeo.clone().scale(0.6, 0.6, 0.6);
  for (let i = 0; i < 28; i++) {
    const m = new THREE.Mesh(dustGeo, dustMat);
    m.visible = false;
    scene.add(m);
    bits.push(m);
  }

  function setBits(list: { x: number; y: number; heart: boolean; t: number }[]) {
    for (let i = 0; i < bits.length; i++) {
      const b = list[i];
      const m = bits[i];
      if (!b) { m.visible = false; continue; }
      m.visible = true;
      m.geometry = b.heart ? smallHeart : dustGeo;
      m.material = b.heart ? heartMat : dustMat;
      m.position.set(b.x, b.y, 0.5);
      m.rotation.y = b.heart ? b.t * 5 : 0;
    }
  }

  function setArrows(list: { x: number; y: number; vx: number; vy: number; tx: number }[], t: number) {
    for (let i = 0; i < arrows.length; i++) {
      const a = list[i];
      arrows[i].g.visible = !!a;
      marks[i].visible = !!a;
      if (!a) continue;
      arrows[i].g.position.set(a.x, a.y, 0);
      arrows[i].g.rotation.z = Math.atan2(a.vy, a.vx);
      arrows[i].flame.scale.setScalar(0.85 + Math.sin(t * 40 + i) * 0.25);
      marks[i].position.x = a.tx;
      marks[i].scale.setScalar(0.8 + Math.sin(t * 12) * 0.2);
    }
  }

  function setHydrants(xs: number[]) {
    for (let i = 0; i < hydrants.length; i++) {
      hydrants[i].visible = i < xs.length;
      if (i < xs.length) hydrants[i].position.set(xs[i], 0, 0.9);
    }
  }

  /** Move the camera and slide the endless street under it. */
  function setCamera(cx: number) {
    camera.position.set(cx, 2.5, 9.6);
    camera.lookAt(cx, 2.05, 0);
    pave.position.x = cx;
    road.position.x = cx;
    kerb.position.x = cx;
    paveTex.offset.x = cx / 2;
    roadTex.offset.x = cx / 5;
    const base = Math.floor(cx / 4) - 8;
    for (let i = 0; i < near.length; i++) {
      const c = base + i;
      const pr = protos[Math.floor(hash(c * 1.7 + 3) * protos.length)];
      near[i].geometry = pr.geo;
      near[i].material = pr.mat;
      near[i].position.set(c * 4 + 2, 0, -4.6 - hash(c + 50) * 0.8);
    }
    const fb = Math.floor(cx / 6) - 7;
    for (let i = 0; i < far.length; i++) {
      const c = fb + i;
      far[i].position.set(c * 6 + 3, 0, -13);
      far[i].scale.y = 6 + hash(c * 2.3) * 7;
    }
    const lb = Math.floor(cx / 11) - 3;
    for (let i = 0; i < lamps.length; i++) lamps[i].position.set((lb + i) * 11 + 5, 0, -1.9);
  }

  const v = new THREE.Vector3();
  /** Where a point in the world lands on the screen, as a fraction of its width and height. */
  function project(x: number, y: number, z: number): [number, number] {
    v.set(x, y, z).project(camera);
    return [v.x * 0.5 + 0.5, -v.y * 0.5 + 0.5];
  }

  return {
    player, takeRig, freeRig, pose, setBits, setArrows, setHydrants, setCamera, project,
    render: () => renderer.render(scene, camera),
    dispose: () => {
      renderer.dispose();
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
      });
    },
  };
}

export type Stage = ReturnType<typeof createStage>;
