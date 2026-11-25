import * as THREE from 'three';
import { makeLabelTextures, makeLidTextures, makeSauceTexture, makeShadowTexture } from './textures.js';

/*
  JarStage
  --------
  One fixed, transparent WebGL canvas covers the viewport. The jar is placed
  every frame from DOM "slots" ([data-jar]) so CSS owns the layout and the
  3D simply follows it. Between two slots flagged `travel`, the jar glides
  from one to the other as they cross the centre of the screen. Otherwise it
  rides with whichever slot is closer to the centre (the hand-off happens
  while both are off-screen, so it's invisible).
*/

const JAR_HEIGHT = 2.75; // world units, base of glass to top of lid
const JAR_WIDTH = 2.05;

const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smooth = (t) => t * t * (3 - 2 * t);

function buildStudioEnvironment() {
  // A dark room with emissive softboxes: gives glass & gold crisp strip highlights.
  const s = new THREE.Scene();
  const room = new THREE.Mesh(
    new THREE.BoxGeometry(40, 40, 40),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(0.035, 0.02, 0.016), side: THREE.BackSide })
  );
  s.add(room);
  const panel = (w, h, hex, intensity, pos) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(hex).multiplyScalar(intensity), side: THREE.DoubleSide })
    );
    m.position.set(...pos);
    m.lookAt(0, 0, 0);
    s.add(m);
  };
  panel(5, 11, 0xffffff, 7, [-8, 1, 8]); // big key softbox
  panel(1.2, 16, 0xffffff, 10, [8, 0, 6]); // hard strip
  panel(12, 3, 0xffe2b8, 3.5, [0, 11, 2]); // overhead
  panel(5, 12, 0xff6a1a, 4, [-7, 0, -9]); // warm rim
  panel(4, 12, 0xff2d87, 3.5, [8, 1, -8]); // pink kicker
  panel(20, 3, 0xffc21a, 0.6, [0, -10, 4]); // floor bounce
  return s;
}

function ribbedLidGeometry(radius, height, ribs, amp) {
  const g = new THREE.CylinderGeometry(radius, radius, height, ribs * 4, 1, true);
  const p = g.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const a = Math.atan2(v.x, v.z);
    const r = radius + amp * Math.pow(0.5 + 0.5 * Math.cos(a * ribs), 0.6);
    const k = r / Math.hypot(v.x, v.z);
    p.setXYZ(i, v.x * k, v.y, v.z * k);
  }
  g.computeVertexNormals();
  return g;
}

function buildJar(renderer) {
  const jar = new THREE.Group();
  const inner = new THREE.Group();
  inner.position.y = -0.24; // pivot around the visual centre
  jar.add(inner);

  // --- sauce (opaque core) ---
  const sauceProfile = [
    [0, -1.04], [0.9, -1.04], [0.95, -1.0], [0.972, -0.92], [0.972, 0.82],
    [0.95, 0.93], [0.9, 0.99], [0.6, 1.0], [0, 1.0],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const sauceTex = makeSauceTexture(renderer);
  sauceTex.repeat.set(2, 1);
  const sauce = new THREE.Mesh(
    new THREE.LatheGeometry(sauceProfile, 96),
    new THREE.MeshPhysicalMaterial({
      map: sauceTex,
      color: 0xffffff,
      roughness: 0.5,
      clearcoat: 0.25,
      clearcoatRoughness: 0.5,
      envMapIntensity: 0.7,
    })
  );
  inner.add(sauce);

  // --- glass shell ---
  const glassProfile = [
    [0.001, -1.1], [0.9, -1.1], [0.975, -1.075], [1.0, -1.0], [1.0, 0.84],
    [0.985, 0.95], [0.94, 1.05], [0.885, 1.12], [0.875, 1.3],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const glass = new THREE.Mesh(
    new THREE.LatheGeometry(glassProfile, 128),
    new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0,
      roughness: 0.03,
      transparent: true,
      opacity: 0.12,
      envMapIntensity: 5,
      clearcoat: 1,
      clearcoatRoughness: 0.02,
      specularIntensity: 1,
      ior: 1.5,
      depthWrite: false,
    })
  );
  glass.renderOrder = 2;
  inner.add(glass);

  // --- wrap-around label (leaves a window at the back to show the sauce) ---
  const labelTex = makeLabelTextures(renderer);
  const arc = Math.PI * 2 * 0.84;
  const label = new THREE.Mesh(
    new THREE.CylinderGeometry(1.013, 1.013, 1.36, 160, 1, true, -arc / 2, arc),
    new THREE.MeshPhysicalMaterial({
      map: labelTex.map,
      metalnessMap: labelTex.metalnessMap,
      metalness: 1,
      roughness: 0.32,
      clearcoat: 0.7,
      clearcoatRoughness: 0.2,
      envMapIntensity: 1.5,
    })
  );
  label.position.y = -0.12;
  label.renderOrder = 3;
  inner.add(label);

  // --- ribbed black lid ---
  const lidMat = new THREE.MeshPhysicalMaterial({
    color: 0x0c0706,
    roughness: 0.3,
    metalness: 0.15,
    clearcoat: 1,
    clearcoatRoughness: 0.12,
    envMapIntensity: 1.3,
  });
  const lid = new THREE.Mesh(ribbedLidGeometry(0.95, 0.38, 72, 0.016), lidMat);
  lid.position.y = 1.37;
  inner.add(lid);

  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.918, 0.046, 20, 128), lidMat);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 1.56;
  inner.add(rim);

  const lip = new THREE.Mesh(new THREE.TorusGeometry(0.945, 0.022, 12, 128), lidMat);
  lip.rotation.x = Math.PI / 2;
  lip.position.y = 1.185;
  inner.add(lip);

  const lidTex = makeLidTextures(renderer);
  const top = new THREE.Mesh(
    new THREE.CircleGeometry(0.93, 96),
    new THREE.MeshPhysicalMaterial({
      map: lidTex.map,
      metalnessMap: lidTex.metalnessMap,
      metalness: 1,
      roughness: 0.3,
      specularIntensity: 0.35,
      clearcoat: 0.2,
      clearcoatRoughness: 0.35,
      envMapIntensity: 1.2,
    })
  );
  top.rotation.x = -Math.PI / 2;
  top.position.y = 1.588;
  inner.add(top);

  return jar;
}

export class JarStage {
  constructor(canvas, { reduced = false } = {}) {
    this.canvas = canvas;
    this.reduced = reduced;
    this.anchors = [];
    this.intro = 0; // 0..1, tweened from outside
    this.mouse = { x: 0, y: 0, sx: 0, sy: 0 };
    this.time = 0;
    this.visible = true;

    const mobile = matchMedia('(max-width: 767px)').matches;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.6 : 1.85));
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.NeutralToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(24, 1, 0.1, 100);
    this.camera.position.set(0, 0, 18);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(buildStudioEnvironment(), 0.035).texture;
    pmrem.dispose();

    // Lights follow the jar's position (not its rotation).
    this.rig = new THREE.Group();
    this.scene.add(this.rig);
    this.rig.add(new THREE.HemisphereLight(0xfff1dc, 0x2a0e05, 0.5));
    const key = new THREE.DirectionalLight(0xfff4e6, 1.4);
    key.position.set(-4, 5, 8);
    const rimA = new THREE.DirectionalLight(0xff8a3d, 2.4);
    rimA.position.set(6, 3, -5);
    const rimB = new THREE.DirectionalLight(0xff2d87, 1.6);
    rimB.position.set(-6, -1, -5);
    this.sweep = new THREE.PointLight(0xffffff, 60, 20, 2);
    this.rig.add(key, rimA, rimB, this.sweep, key.target, rimA.target, rimB.target);

    this.jar = buildJar(this.renderer);
    this.scene.add(this.jar);

    this.shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({
        map: makeShadowTexture(this.renderer),
        transparent: true,
        depthWrite: false,
        opacity: 0.5,
        toneMapped: false,
      })
    );
    this.shadow.renderOrder = -1;
    this.scene.add(this.shadow);

    this.resize = this.resize.bind(this);
    window.addEventListener('resize', this.resize);
    this.resize();

    if (!reduced && matchMedia('(hover: hover) and (pointer: fine)').matches) {
      window.addEventListener(
        'pointermove',
        (e) => {
          this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
          this.mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
        },
        { passive: true }
      );
    }
  }

  /** anchors: [{ el, travel, rot(time, anchor) => {x,y,z}, fill, bob, parallax }] */
  setAnchors(list) {
    this.anchors = list;
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    // world units per CSS pixel on the z = 0 plane
    this.wpp = (2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)) * this.camera.position.z) / h;
    this.w = w;
    this.h = h;
  }

  sample(a) {
    const r = a.el.getBoundingClientRect();
    const fill = a.fill ?? 0.9;
    const px = Math.min(r.height / JAR_HEIGHT, r.width / JAR_WIDTH) * fill; // px per jar unit
    const rot = a.rot(this.time, a);
    return {
      cx: r.left + r.width / 2,
      cy: r.top + r.height / 2,
      px,
      rx: rot.x,
      ry: rot.y,
      rz: rot.z,
      bob: a.bob ?? 0,
      par: a.parallax ?? 1,
    };
  }

  compute() {
    const c = this.h / 2;
    const s = this.anchors.map((a) => this.sample(a));
    let i = -1;
    for (let k = 0; k < s.length; k++) if (s[k].cy <= c) i = k;
    if (i === -1) return s[0];
    if (i === s.length - 1) return s[i];
    const A = s[i];
    const B = s[i + 1];
    if (!this.anchors[i].travel) return c - A.cy < B.cy - c ? A : B;
    const t = smooth(clamp01((c - A.cy) / Math.max(1, B.cy - A.cy)));
    const out = {};
    for (const key of Object.keys(A)) out[key] = lerp(A[key], B[key], t);
    return out;
  }

  update(dt) {
    if (!this.anchors.length) return;
    this.time += this.reduced ? 0 : dt;
    const st = this.compute();

    // Smoothed mouse parallax.
    const m = this.mouse;
    const k = 1 - Math.exp(-dt * 4);
    m.sx += (m.x - m.sx) * k;
    m.sy += (m.y - m.sy) * k;

    const intro = this.intro;
    const sizePx = st.px * JAR_HEIGHT * intro;
    const offscreen = st.cy + sizePx < -40 || st.cy - sizePx > this.h + 40 || intro <= 0.001;
    if (offscreen) {
      if (this.visible) {
        this.renderer.clear();
        this.visible = false;
      }
      return;
    }
    this.visible = true;

    const scale = st.px * this.wpp * intro;
    const bob = Math.sin(this.time * 1.3) * 0.06 * st.bob;
    const x = (st.cx - this.w / 2) * this.wpp + m.sx * 0.18 * st.par;
    const y = -(st.cy - this.h / 2) * this.wpp + bob * scale * JAR_HEIGHT - m.sy * 0.12 * st.par;

    this.jar.position.set(x, y, 0);
    this.jar.scale.setScalar(scale);
    this.jar.rotation.set(
      st.rx + m.sy * 0.16 * st.par,
      st.ry + m.sx * 0.38 * st.par + (1 - intro) * -2.2,
      st.rz - m.sx * 0.05 * st.par
    );

    // light rig: follows jar, with a sweeping highlight
    this.rig.position.set(x, y, 0);
    const sw = this.time * 0.7;
    this.sweep.position.set(Math.cos(sw) * 5 * scale, 2.5 * scale, 4 + Math.sin(sw) * 2);
    this.sweep.distance = 20 * Math.max(scale, 0.3);
    this.scene.environmentRotation.y = Math.sin(this.time * 0.25) * 0.6;

    // soft drop shadow: sits under the jar, fades as it tumbles / lifts
    const upright = Math.abs(Math.cos(st.rx)) * Math.abs(Math.cos(st.rz));
    const lift = 1 - Math.max(0, bob) * 4;
    this.shadow.position.set(x, -(st.cy - this.h / 2) * this.wpp - JAR_HEIGHT * 0.5 * scale - 0.04 * scale, -1.2 * scale);
    this.shadow.scale.set(2.6 * scale * lift, 0.5 * scale * lift, 1);
    this.shadow.material.opacity = 0.55 * upright * upright * intro;

    this.renderer.render(this.scene, this.camera);
  }
}
