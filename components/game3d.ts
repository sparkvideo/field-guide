// The 3D stage for "Go and Tell": low-poly people on a city street, drawn at low resolution
// with flat shading and nearest-neighbour textures, the way a PlayStation 1 game looked.
// Everything is built in code (boxes, cylinders and textures painted on a canvas). The only image
// files are the Valley Bible Church logo and mark on the church (public/icons/vbc-*.png).
//
// Three places: 0 the street at dusk, 1 the marketplace by day, 2 the city gate at night.

import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

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
  helmet: THREE.Object3D | null;
  heart: THREE.Mesh;
  phone: THREE.Mesh | null;
  smile: THREE.Mesh | null;
  sign: THREE.Object3D | null;
  glasses: THREE.Object3D | null;
  mats: { shirt: THREE.MeshLambertMaterial; pants: THREE.MeshLambertMaterial; skin: THREE.MeshLambertMaterial; hair: THREE.MeshLambertMaterial } | null;
};

export type Pose = {
  x: number; y: number; z: number; face: number; phase: number;
  mode: "stand" | "lie" | "kneel" | "dive";
  reach?: boolean; shield?: boolean; flail?: boolean; happy?: boolean; phone?: boolean;
  sign?: boolean; glasses?: boolean; helmet?: boolean; toss?: boolean; t: number;
};

export type PickupKind = "sandals" | "helmet" | "sword";

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

type ThemeSpec = {
  sky: [number, string][]; stars: boolean; sun: string | null;
  fog: number; fogNear: number; fogFar: number;
  hemi: [number, number, number]; sunLight: [number, number]; rim: [number, number];
  pave: string; road: string; lines: boolean;
  walls: string[]; lit: string[]; dark: string; litChance: number; heights: number[]; wide: number;
  far: string; farH: [number, number]; props: "lamps" | "stalls" | "torches";
};

const SPECS: ThemeSpec[] = [
  { // the street at dusk
    sky: [[0, "#12152e"], [0.22, "#2b2b5c"], [0.4, "#6a3f6e"], [0.52, "#c9685c"], [0.62, "#f0a765"], [1, "#f0a765"]], stars: true, sun: "#ffe2a0",
    fog: 0x5b3f66, fogNear: 16, fogFar: 46, hemi: [0xb9b4ff, 0x4a3350, 2.2], sunLight: [0xffb878, 2.6], rim: [0xff8a5c, 1.2],
    pave: "#ffffff", road: "#ffffff", lines: true,
    walls: ["#3a3050", "#44355a", "#2f2a48", "#4d3a52"], lit: ["#f2c15a", "#ffe9a8"], dark: "#1f1b30", litChance: 0.45,
    heights: [3, 4.5, 6, 3.5, 5, 4], wide: 3.6, far: "#2a2242", farH: [6, 7], props: "lamps",
  },
  { // the marketplace by day
    sky: [[0, "#3f8fd6"], [0.3, "#7fbdea"], [0.5, "#cfe6f2"], [0.62, "#f6e7c4"], [1, "#f6e7c4"]], stars: false, sun: "#fffbe0",
    fog: 0xe9d7b2, fogNear: 22, fogFar: 62, hemi: [0xffffff, 0xb89a6a, 2.7], sunLight: [0xfff1c8, 3.2], rim: [0xffffff, 0.6],
    pave: "#f3dcae", road: "#d2a878", lines: false,
    walls: ["#d9b98a", "#c9a26e", "#e3c79a", "#b98f5e"], lit: ["#4a3323", "#4a3323"], dark: "#5e4330", litChance: 0.5,
    heights: [2.4, 3.2, 2.8, 3.6, 2.6, 3], wide: 3.8, far: "#cdb48c", farH: [4, 3], props: "stalls",
  },
  { // the city gate at night
    sky: [[0, "#05071a"], [0.3, "#111736"], [0.5, "#27264e"], [0.62, "#43325a"], [1, "#43325a"]], stars: true, sun: "#e8ecff",
    fog: 0x1b1b36, fogNear: 14, fogFar: 42, hemi: [0x9fb0ff, 0x2a2440, 2.0], sunLight: [0xffa860, 2.2], rim: [0x7f8cff, 1.0],
    pave: "#aab0c8", road: "#8388a0", lines: false,
    walls: ["#5d6178", "#555a72", "#666a82", "#4f546c"], lit: ["#ffb060", "#ffd08a"], dark: "#3d4158", litChance: 0.06,
    heights: [5.2, 5.2, 5.2, 5.2, 5.2, 5.2], wide: 4.04, far: "#12122a", farH: [8, 6], props: "torches",
  },
];

export function createStage(canvas: HTMLCanvasElement) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "low-power" });
  renderer.setPixelRatio(1);
  renderer.setSize(VIEW_W, VIEW_H, false);

  const scene = new THREE.Scene();
  const fog = new THREE.Fog(0x5b3f66, 16, 46);
  scene.fog = fog;
  const camera = new THREE.PerspectiveCamera(44, VIEW_W / VIEW_H, 0.5, 90);

  const hemi = new THREE.HemisphereLight(0xb9b4ff, 0x4a3350, 2.2);
  const sun = new THREE.DirectionalLight(0xffb878, 2.6);
  sun.position.set(-6, 7, 8);
  const rim = new THREE.DirectionalLight(0xff8a5c, 1.2);
  rim.position.set(5, 3, -8);
  scene.add(hemi, sun, rim);

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
  const paveMat = new THREE.MeshLambertMaterial({ map: paveTex });
  const pave = new THREE.Mesh(new THREE.PlaneGeometry(80, 4), paveMat);
  pave.rotation.x = -Math.PI / 2;
  pave.position.set(0, 0, -0.4);
  const kerbMat = lambert("#b9b4c4");
  const kerb = box(80, 0.18, 0.2, kerbMat, 0, -0.09, 1.7);
  const roadPaint = (lines: boolean) => paint(64, 32, (c) => {
    c.fillStyle = lines ? "#2a2733" : "#9a968c";
    c.fillRect(0, 0, 64, 32);
    c.fillStyle = lines ? "#34313f" : "#847f74";
    for (let i = 0; i < 40; i++) c.fillRect((i * 17) % 63, (i * 11) % 31, lines ? 2 : 3, lines ? 1 : 2);
    if (lines) { c.fillStyle = "#d4b062"; c.fillRect(8, 15, 28, 2); }
  }, true);
  const roadTexLines = roadPaint(true);
  const roadTexPlain = roadPaint(false);
  roadTexLines.repeat.set(16, 1);
  roadTexPlain.repeat.set(16, 1);
  const roadMat = new THREE.MeshLambertMaterial({ map: roadTexLines });
  const road = new THREE.Mesh(new THREE.PlaneGeometry(80, 7), roadMat);
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, -0.18, 5.2);
  scene.add(pave, kerb, road);

  // ----- each place has its own sky and its own row of buildings -----
  const themes = SPECS.map((sp, ti) => {
    const sky = paint(256, 144, (c) => {
      const g = c.createLinearGradient(0, 0, 0, 144);
      for (const [o, col] of sp.sky) g.addColorStop(o, col);
      c.fillStyle = g;
      c.fillRect(0, 0, 256, 144);
      if (sp.stars) {
        c.fillStyle = "#f4e9c9";
        for (let i = 0; i < 46; i++) c.fillRect(Math.floor(hash(i + 3 + ti) * 256), Math.floor(hash(i + 71) * 44), 1, 1);
      }
      if (sp.sun) {
        c.fillStyle = sp.sun;
        c.beginPath();
        c.arc(ti === 2 ? 60 : 196, ti === 0 ? 74 : 30, ti === 2 ? 7 : 9, 0, Math.PI * 2);
        c.fill();
      }
    });
    const protos = sp.heights.map((h, i) => {
      const tex = paint(32, 64, (c) => {
        c.fillStyle = sp.walls[i % sp.walls.length];
        c.fillRect(0, 0, 32, 64);
        if (sp.props === "torches") {
          c.fillStyle = sp.dark; // stone blocks
          for (let y = 0; y < 64; y += 8) {
            c.fillRect(0, y, 32, 1);
            for (let x = (y / 8) % 2 ? 0 : 8; x < 32; x += 16) c.fillRect(x, y, 1, 8);
          }
          if (i % 3 === 0) { c.fillStyle = sp.lit[0]; c.fillRect(14, 18, 4, 9); }
        } else {
          for (let y = 3; y < 60; y += 8) {
            for (let x = 3; x < 30; x += 7) {
              const lit = hash(i * 31 + x * 7 + y + ti * 13) < sp.litChance;
              c.fillStyle = lit ? sp.lit[hash(x + y * 3 + i) < 0.3 ? 1 : 0] : sp.dark;
              c.fillRect(x, y, 4, 5);
            }
          }
        }
      }, true);
      tex.repeat.set(1, h / 8);
      let geo: THREE.BufferGeometry = new THREE.BoxGeometry(sp.wide, h, 4);
      geo.translate(0, h / 2, 0);
      if (sp.props === "torches") {
        const a = new THREE.BoxGeometry(0.9, 0.7, 4);
        a.translate(-1.1, h + 0.35, 0);
        const b = new THREE.BoxGeometry(0.9, 0.7, 4);
        b.translate(1.1, h + 0.35, 0);
        geo = mergeGeometries([geo, a, b])!;
      }
      return { geo, mat: new THREE.MeshLambertMaterial({ map: tex }) };
    });
    return { sp, sky, protos };
  });
  let theme = themes[0];

  const near: THREE.Mesh[] = [];
  for (let i = 0; i < 16; i++) {
    const m = new THREE.Mesh(theme.protos[0].geo, theme.protos[0].mat);
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

  // ----- props: street lamps, market stalls, torches; things to trip over -----
  const flameMat = new THREE.MeshBasicMaterial({ color: "#ff7a2a", fog: false });
  const coreMat = new THREE.MeshBasicMaterial({ color: "#ffe27a", fog: false });
  const poleMat = lambert("#22202c");
  const bulbMat = new THREE.MeshBasicMaterial({ color: "#ffe6a0", fog: false });
  const lamps: THREE.Group[] = [];
  const torches: { g: THREE.Group; flame: THREE.Mesh }[] = [];
  const stalls: THREE.Group[] = [];
  const wood = lambert("#8a5a34");
  const awnings = ["#c0453a", "#3f7fbf", "#d08a2e", "#4f9d69"].map((c) => lambert(c));
  const goods = ["#e2b33c", "#b8452f", "#6f9d3f", "#e8dcc0"].map((c) => lambert(c));
  for (let i = 0; i < 6; i++) {
    const g = new THREE.Group();
    g.add(box(0.1, 3.4, 0.1, poleMat, 0, 1.7, 0), box(0.1, 0.1, 0.9, poleMat, 0, 3.4, 0.4), box(0.3, 0.16, 0.3, bulbMat, 0, 3.3, 0.8));
    scene.add(g);
    lamps.push(g);

    const t = new THREE.Group();
    t.add(box(0.12, 2.2, 0.12, wood, 0, 1.1, 0));
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.55, 5), flameMat);
    flame.position.y = 2.5;
    const core = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.32, 4), coreMat);
    core.position.y = 2.42;
    t.add(flame, core);
    scene.add(t);
    torches.push({ g: t, flame });

    const st = new THREE.Group();
    st.add(box(2.0, 0.8, 0.9, wood, 0, 0.4, 0));
    for (const [px, pz] of [[-0.95, -0.4], [0.95, -0.4], [-0.95, 0.4], [0.95, 0.4]]) st.add(box(0.08, 2.1, 0.08, wood, px, 1.05, pz));
    st.add(box(2.4, 0.12, 1.5, awnings[i % awnings.length], 0, 2.15, 0.1));
    for (let k = 0; k < 4; k++) st.add(box(0.3, 0.26, 0.3, goods[(i + k) % goods.length], -0.7 + k * 0.46, 0.93, 0.1));
    scene.add(st);
    stalls.push(st);
  }
  const red = lambert("#c8392b");
  const crateMat = lambert("#9a6a3a");
  const blocks: { hydrant: THREE.Group; crate: THREE.Mesh }[] = [];
  for (let i = 0; i < 3; i++) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 0.5, 6), red);
    body.position.y = 0.25;
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.14, 0.14, 6), red);
    cap.position.y = 0.57;
    g.add(body, cap, box(0.44, 0.1, 0.1, red, 0, 0.32, 0));
    const crate = box(0.5, 0.5, 0.5, crateMat, 0, 0.25, 0.9);
    g.visible = crate.visible = false;
    scene.add(g, crate);
    blocks.push({ hydrant: g, crate });
  }

  // ----- the church you walk to between levels -----
  const church = new THREE.Group();
  {
    const white = lambert("#f1ece0");
    const roofMat = lambert("#7a4a3a");
    const warm = new THREE.MeshBasicMaterial({ color: "#ffd98a", fog: false });
    const cross = new THREE.MeshBasicMaterial({ color: "#f0cf6a", fog: false });
    church.add(box(3.4, 2.6, 2.6, white, 0, 1.3, 0));
    const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 2.0, 1.3, 4), roofMat);
    roof.rotation.y = Math.PI / 4;
    roof.scale.set(1.25, 1, 0.95);
    roof.position.y = 3.25;
    church.add(roof);
    church.add(box(1.0, 1.9, 1.0, white, 0, 4.0, 0.9));
    const spire = new THREE.Mesh(new THREE.ConeGeometry(0.8, 1.3, 4), roofMat);
    spire.rotation.y = Math.PI / 4;
    spire.position.set(0, 5.6, 0.9);
    church.add(spire);
    church.add(box(0.12, 0.9, 0.12, cross, 0, 6.6, 0.9), box(0.5, 0.12, 0.12, cross, 0, 6.7, 0.9));
    church.add(box(0.9, 1.5, 0.08, warm, 0, 0.75, 1.32)); // open door, lit from inside
    church.add(box(0.4, 0.7, 0.08, warm, -1.1, 1.5, 1.32), box(0.4, 0.7, 0.08, warm, 1.1, 1.5, 1.32));
    const loader = new THREE.TextureLoader();
    const logoMat = (file: string) => {
      const tex = loader.load(file);
      tex.colorSpace = THREE.SRGBColorSpace;
      return new THREE.MeshBasicMaterial({ map: tex, transparent: true, fog: false });
    };
    const mark = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 0.78), logoMat("/icons/vbc-mark.png"));
    mark.position.set(0, 4.15, 1.42);
    church.add(mark);
    // the sign out front
    const board = lambert("#1d2320");
    church.add(box(3.0, 1.05, 0.12, board, 3.5, 1.25, 1.5), box(0.12, 0.8, 0.12, board, 2.2, 0.4, 1.5), box(0.12, 0.8, 0.12, board, 4.8, 0.4, 1.5));
    const logo = new THREE.Mesh(new THREE.PlaneGeometry(2.7, 0.83), logoMat("/icons/vbc-logo.png"));
    logo.position.set(3.5, 1.25, 1.57);
    church.add(logo);
    church.position.z = -2.6;
    church.visible = false;
    scene.add(church);
  }

  function setTheme(i: number) {
    theme = themes[i % themes.length];
    const sp = theme.sp;
    scene.background = theme.sky;
    fog.color.set(sp.fog);
    fog.near = sp.fogNear;
    fog.far = sp.fogFar;
    hemi.color.set(sp.hemi[0]);
    hemi.groundColor.set(sp.hemi[1]);
    hemi.intensity = sp.hemi[2];
    sun.color.set(sp.sunLight[0]);
    sun.intensity = sp.sunLight[1];
    rim.color.set(sp.rim[0]);
    rim.intensity = sp.rim[1];
    paveMat.color.set(sp.pave);
    kerbMat.color.set(sp.pave).multiplyScalar(0.8);
    roadMat.map = sp.lines ? roadTexLines : roadTexPlain;
    roadMat.color.set(sp.road);
    roadMat.needsUpdate = true;
    farMat.color.set(sp.far);
    for (const l of lamps) l.visible = sp.props === "lamps";
    for (const s of stalls) s.visible = sp.props === "stalls";
    for (const t of torches) t.g.visible = sp.props === "torches";
  }

  // ----- people -----
  const shadowGeo = new THREE.CircleGeometry(0.42, 10);
  const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.32, depthWrite: false });
  const eyeMat = new THREE.MeshBasicMaterial({ color: "#16110c" });
  const whiteMat = new THREE.MeshBasicMaterial({ color: "#ffffff" });
  const shoeMat = lambert("#1b1b1f");
  const brass = lambert("#d4b062");
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
    let sign: THREE.Object3D | null = null;
    let glasses: THREE.Object3D | null = null;
    let helmet: THREE.Object3D | null = null;
    if (disciple) {
      const robe = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.37, 1.22, 6), cloth);
      robe.position.y = 0.8;
      turn.add(robe);
      turn.add(box(0.56, 0.09, 0.58, brass, 0, 0.98, 0)); // sash
      turn.add(box(0.36, 0.36, 0.36, skin, 0, 1.6, 0));
      turn.add(box(0.42, 0.14, 0.42, lambert("#f4ead2"), 0, 1.8, 0)); // head cloth
      turn.add(box(0.12, 0.44, 0.42, lambert("#f4ead2"), -0.21, 1.6, 0));
      turn.add(box(0.14, 0.22, 0.3, lambert("#5b3a1e"), 0.17, 1.45, 0)); // beard
      const h = new THREE.Group();
      h.add(box(0.46, 0.2, 0.46, brass, 0, 1.84, 0), box(0.1, 0.16, 0.5, lambert("#8a6a2c"), 0, 2.0, 0), box(0.5, 0.06, 0.5, lambert("#8a6a2c"), 0, 1.74, 0));
      h.visible = false;
      turn.add(h);
      helmet = h;
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
      const sg = new THREE.Group(); // a blank placard on a pole
      sg.add(box(0.06, 1.5, 0.06, wood, 0.34, 1.7, 0), box(0.06, 0.7, 1.0, lambert("#f4f0e4"), 0.36, 2.3, 0), box(0.02, 0.08, 0.7, eyeMat, 0.4, 2.42, 0), box(0.02, 0.08, 0.5, eyeMat, 0.4, 2.24, 0));
      sg.visible = false;
      turn.add(sg);
      sign = sg;
      const gl = box(0.03, 0.09, 0.38, eyeMat, 0.19, 1.64, 0);
      gl.visible = false;
      turn.add(gl);
      glasses = gl;
    }
    turn.add(box(0.02, 0.06, 0.06, eyeMat, 0.185, 1.64, 0.09), box(0.02, 0.06, 0.06, eyeMat, 0.185, 1.64, -0.09));

    let shield: THREE.Object3D | null = null;
    if (disciple) {
      const g = new THREE.Group();
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.08, 10), brass);
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
    return { root, tilt, turn, armL, armR, legL, legR, shadow, shield, helmet, heart, phone, smile, sign, glasses, mats };
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
    if (p.sign && p.mode === "stand") armA = armB = 1.2;
    if (p.toss) armA = 2.0 + Math.sin(p.t * 16) * 0.5;
    r.legL.rotation.z = legA;
    r.legR.rotation.z = legB;
    r.armL.rotation.z = armA;
    r.armR.rotation.z = armB;
    r.shadow.scale.setScalar(p.mode === "lie" ? 1.7 : Math.max(0.5, 1 - p.y * 0.25));
    r.shadow.position.y = 0.02 - p.y;
    if (r.shield) r.shield.visible = !!p.shield;
    if (r.helmet) r.helmet.visible = !!p.helmet;
    if (r.phone) r.phone.visible = !!p.phone;
    if (r.sign) r.sign.visible = !!p.sign && p.mode === "stand";
    if (r.glasses) r.glasses.visible = !!p.glasses;
    if (r.smile) r.smile.visible = !!p.happy;
    r.heart.visible = !!p.happy;
    if (p.happy) {
      r.heart.rotation.y = p.t * 2.4;
      r.heart.position.y = 2.3 + Math.sin(p.t * 3 + p.x) * 0.08;
    }
  }

  // ----- flaming arrows, landing marks, hearts, dust, coins, armor to pick up -----
  const shaftMat = lambert("#5a4028");
  const arrows: { g: THREE.Group; flame: THREE.Mesh }[] = [];
  const marks: THREE.Mesh[] = [];
  for (let i = 0; i < 10; i++) {
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
  const coinMat = new THREE.MeshBasicMaterial({ color: "#ffd24a", fog: false });
  const coins: THREE.Mesh[] = [];
  for (let i = 0; i < 6; i++) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.05, 8), coinMat);
    m.rotation.x = Math.PI / 2;
    m.visible = false;
    scene.add(m);
    coins.push(m);
  }

  const pickups: Record<PickupKind, THREE.Group> = { sandals: new THREE.Group(), helmet: new THREE.Group(), sword: new THREE.Group() };
  const leather = new THREE.MeshBasicMaterial({ color: "#b07a44", fog: false });
  const gold = new THREE.MeshBasicMaterial({ color: "#f0cf6a", fog: false });
  const steel = new THREE.MeshBasicMaterial({ color: "#e6ecff", fog: false });
  pickups.sandals.add(box(0.5, 0.1, 0.2, leather, 0, 0, 0.14), box(0.5, 0.1, 0.2, leather, 0, 0, -0.14), box(0.08, 0.2, 0.2, gold, 0.1, 0.12, 0.14), box(0.08, 0.2, 0.2, gold, 0.1, 0.12, -0.14));
  pickups.helmet.add(box(0.5, 0.3, 0.5, gold, 0, 0, 0), box(0.12, 0.2, 0.56, leather, 0, 0.22, 0), box(0.56, 0.08, 0.56, leather, 0, -0.14, 0));
  pickups.sword.add(box(0.1, 0.9, 0.04, steel, 0, 0.2, 0), box(0.4, 0.08, 0.08, gold, 0, -0.26, 0), box(0.08, 0.24, 0.08, leather, 0, -0.42, 0));
  const ringMat = new THREE.MeshBasicMaterial({ color: "#fff3b0", transparent: true, opacity: 0.8, fog: false, side: THREE.DoubleSide });
  const glow = new THREE.Mesh(new THREE.RingGeometry(0.45, 0.6, 14), ringMat);
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = 0.03;
  glow.visible = false;
  scene.add(glow);
  for (const k of Object.keys(pickups) as PickupKind[]) { pickups[k].visible = false; scene.add(pickups[k]); }

  const columnMat = () => new THREE.MeshBasicMaterial({ color: "#fff3b0", transparent: true, opacity: 0.28, fog: false, side: THREE.DoubleSide, depthWrite: false });
  const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 14, 8, 1, true), columnMat());
  beacon.position.y = 7;
  beacon.visible = false;
  // boldness: light from above and a ring at the disciple's feet
  const boldLight = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.55, 14, 8, 1, true), columnMat());
  boldLight.position.y = 7;
  boldLight.visible = false;
  const boldRing = new THREE.Mesh(new THREE.RingGeometry(0.6, 0.85, 16), ringMat);
  boldRing.rotation.x = -Math.PI / 2;
  boldRing.position.y = 0.04;
  boldRing.visible = false;
  scene.add(beacon, boldLight, boldRing);

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

  function setCoins(xs: number[], t: number) {
    for (let i = 0; i < coins.length; i++) {
      coins[i].visible = i < xs.length;
      if (i < xs.length) {
        coins[i].position.set(xs[i], 0.18, 0.3);
        coins[i].rotation.z = t * 9 + i;
      }
    }
  }

  function setPickup(p: { kind: PickupKind; x: number } | null, t: number) {
    for (const k of Object.keys(pickups) as PickupKind[]) pickups[k].visible = !!p && p.kind === k;
    glow.visible = !!p;
    if (!p) return;
    const g = pickups[p.kind];
    g.position.set(p.x, 0.75 + Math.sin(t * 3) * 0.12, 0.2);
    g.rotation.y = t * 2.2;
    glow.position.x = p.x;
    glow.position.z = 0.2;
    glow.scale.setScalar(0.9 + Math.sin(t * 6) * 0.12);
  }

  function setBeacon(x: number | null, t: number) {
    beacon.visible = x !== null;
    if (x !== null) {
      beacon.position.x = x;
      beacon.rotation.y = t;
      (beacon.material as THREE.MeshBasicMaterial).opacity = 0.22 + Math.sin(t * 4) * 0.08;
    }
  }

  function setBold(on: boolean, x: number, y: number, t: number) {
    boldLight.visible = boldRing.visible = on;
    if (!on) return;
    boldLight.position.x = boldRing.position.x = x;
    boldLight.rotation.y = t * 1.5;
    (boldLight.material as THREE.MeshBasicMaterial).opacity = 0.2 + Math.sin(t * 7) * 0.06;
    boldRing.position.y = 0.04;
    boldRing.scale.setScalar(1 + Math.sin(t * 8) * 0.12 - y * 0.1);
  }

  function setChurch(x: number | null) {
    church.visible = x !== null;
    if (x !== null) church.position.x = x;
  }

  function setBlocks(xs: number[]) {
    const crates = theme.sp.props !== "lamps";
    for (let i = 0; i < blocks.length; i++) {
      const on = i < xs.length;
      blocks[i].hydrant.visible = on && !crates;
      blocks[i].crate.visible = on && crates;
      if (on) {
        blocks[i].hydrant.position.set(xs[i], 0, 0.9);
        blocks[i].crate.position.x = xs[i];
      }
    }
  }

  /** Move the camera and slide the endless street under it. shake jolts it, zoom pulls it in. */
  function setCamera(cx: number, t: number, shake = 0, zoom = 0) {
    const jx = shake ? Math.sin(t * 91) * shake : 0;
    const jy = shake ? Math.cos(t * 77) * shake : 0;
    camera.position.set(cx + jx, 2.5 + jy - zoom * 0.25, 9.6 - zoom);
    camera.lookAt(cx + jx, 2.05 + jy - zoom * 0.3, 0);
    pave.position.x = cx;
    road.position.x = cx;
    kerb.position.x = cx;
    paveTex.offset.x = cx / 2;
    roadTexLines.offset.x = roadTexPlain.offset.x = cx / 5;
    const sp = theme.sp;
    const base = Math.floor(cx / 4) - 8;
    for (let i = 0; i < near.length; i++) {
      const c = base + i;
      const pr = theme.protos[Math.floor(hash(c * 1.7 + 3) * theme.protos.length)];
      near[i].geometry = pr.geo;
      near[i].material = pr.mat;
      near[i].position.set(c * 4 + 2, 0, sp.props === "torches" ? -4.8 : -4.6 - hash(c + 50) * 0.8);
    }
    const fb = Math.floor(cx / 6) - 7;
    for (let i = 0; i < far.length; i++) {
      const c = fb + i;
      far[i].position.set(c * 6 + 3, 0, -13);
      far[i].scale.y = sp.farH[0] + hash(c * 2.3) * sp.farH[1];
    }
    const lb = Math.floor(cx / 11) - 3;
    for (let i = 0; i < lamps.length; i++) {
      lamps[i].position.set((lb + i) * 11 + 5, 0, -1.9);
      torches[i].g.position.set((lb + i) * 11 + 5, 0, -2.3);
      torches[i].flame.scale.setScalar(0.9 + Math.sin(t * 30 + i * 2) * 0.2);
    }
    const sb = Math.floor(cx / 7) - 3;
    for (let i = 0; i < stalls.length; i++) stalls[i].position.set((sb + i) * 7 + 3, 0, -2.2);
  }

  const v = new THREE.Vector3();
  /** Where a point in the world lands on the screen, as a fraction of its width and height. */
  function project(x: number, y: number, z: number): [number, number] {
    v.set(x, y, z).project(camera);
    return [v.x * 0.5 + 0.5, -v.y * 0.5 + 0.5];
  }

  setTheme(0);

  return {
    player, takeRig, freeRig, pose, setBits, setArrows, setCoins, setPickup, setBeacon, setBold, setChurch, setBlocks, setCamera, setTheme, project,
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
