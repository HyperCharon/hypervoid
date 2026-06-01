"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
} from "motion/react";
import type * as THREE from "three";

type Photo = {
  id: string;
  url: string;
  caption: string | null;
};

const EASE_OUT = [0.215, 0.61, 0.355, 1] as const;

/* ── main component: Three.js sphere ── */
export function PhotoSphereGL({ photos }: { photos: Photo[] }) {
  const [lightbox, setLightbox] = useState<Photo | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<{
    renderer: unknown;
    scene: unknown;
    camera: unknown;
    controls: unknown;
    frameId: number;
    group: unknown;
  } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let disposed = false;

    (async () => {
      try {
        const THREE = await import("three");
        const { OrbitControls } = await import(
          "three/examples/jsm/controls/OrbitControls.js"
        );

        if (disposed) return;

        const w = canvas.clientWidth;
        const h = canvas.clientHeight;

        // renderer
        const renderer = new THREE.WebGLRenderer({
          canvas,
          antialias: true,
          alpha: true,
        });
        renderer.setSize(w, h);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000, 0);

        // scene
        const scene = new THREE.Scene();

        // camera
        const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 2000);
        camera.position.set(0, 0, 500);

        // controls
        const controls = new OrbitControls(camera, canvas);
        controls.enableDamping = true;
        controls.dampingFactor = 0.06;
        controls.enableZoom = true;
        controls.minDistance = 200;
        controls.maxDistance = 900;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 1.2;
        controls.enablePan = false;

        // group
        const group = new THREE.Group();
        scene.add(group);

        // ambient light
        scene.add(new THREE.AmbientLight(0xffffff, 1));

        // ── wireframe sphere skeleton ──
        const radius = 250;

        // 1. wireframe icosahedron (main structure lines)
        const wireGeo = new THREE.IcosahedronGeometry(radius, 2);
        const wireMat = new THREE.MeshBasicMaterial({
          color: 0x8888ff,
          wireframe: true,
          transparent: true,
          opacity: 0.06,
        });
        const wireSphere = new THREE.Mesh(wireGeo, wireMat);
        group.add(wireSphere);

        // 2. equator + meridian rings
        const ringColors = [0x6666cc, 0x5555aa, 0x4444aa];
        const ringRotations: [number, number, number][] = [
          [0, 0, 0],
          [Math.PI / 3, 0, 0],
          [0, 0, Math.PI / 3],
        ];
        ringColors.forEach((color, i) => {
          const ringGeo = new THREE.TorusGeometry(radius, 0.5, 8, 128);
          const ringMat = new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: 0.1,
          });
          const ring = new THREE.Mesh(ringGeo, ringMat);
          ring.rotation.set(...ringRotations[i]);
          group.add(ring);
        });

        // 3. particle dots on sphere surface (fibonacci distribution)
        const dotCount = 120;
        const dotPositions = new Float32Array(dotCount * 3);
        const goldenAngleDot = Math.PI * (3 - Math.sqrt(5));
        for (let i = 0; i < dotCount; i++) {
          const y = 1 - (2 * (i + 0.5)) / dotCount;
          const rAtY = Math.sqrt(1 - y * y);
          const theta = goldenAngleDot * i;
          dotPositions[i * 3] = Math.cos(theta) * rAtY * radius;
          dotPositions[i * 3 + 1] = y * radius;
          dotPositions[i * 3 + 2] = Math.sin(theta) * rAtY * radius;
        }
        const dotGeo = new THREE.BufferGeometry();
        dotGeo.setAttribute("position", new THREE.BufferAttribute(dotPositions, 3));
        const dotMat = new THREE.PointsMaterial({
          color: 0xaaaaff,
          size: 3,
          transparent: true,
          opacity: 0.35,
          sizeAttenuation: true,
        });
        const dots = new THREE.Points(dotGeo, dotMat);
        group.add(dots);

        // 4. connection lines between nearby dots
        const linePositions: number[] = [];
        const threshold = radius * 0.55; // max distance for connection
        for (let i = 0; i < dotCount; i++) {
          for (let j = i + 1; j < dotCount; j++) {
            const ax = dotPositions[i * 3], ay = dotPositions[i * 3 + 1], az = dotPositions[i * 3 + 2];
            const bx = dotPositions[j * 3], by = dotPositions[j * 3 + 1], bz = dotPositions[j * 3 + 2];
            const dist = Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2 + (az - bz) ** 2);
            if (dist < threshold) {
              linePositions.push(ax, ay, az, bx, by, bz);
            }
          }
        }
        const lineGeo = new THREE.BufferGeometry();
        lineGeo.setAttribute("position", new THREE.Float32BufferAttribute(linePositions, 3));
        const lineMat = new THREE.LineBasicMaterial({
          color: 0x7777cc,
          transparent: true,
          opacity: 0.08,
        });
        const lines = new THREE.LineSegments(lineGeo, lineMat);
        group.add(lines);

        // distribute photos on sphere
        const goldenAngle = Math.PI * (3 - Math.sqrt(5));
        const loader = new THREE.TextureLoader();
        const planeW = 80;
        const planeH = 60;

        const raycasterTargets: THREE.Mesh[] = [];

        photos.forEach((photo, i) => {
          const y = 1 - (i / (photos.length - 1)) * 2;
          const radiusAtY = Math.sqrt(1 - y * y);
          const theta = goldenAngle * i;

          const x = Math.cos(theta) * radiusAtY * radius;
          const z = Math.sin(theta) * radiusAtY * radius;
          const yPos = y * radius;

          const geo = new THREE.PlaneGeometry(planeW, planeH);
          const mat = new THREE.MeshBasicMaterial({
            color: 0x333333,
            transparent: true,
            opacity: 0.3,
          });

          const mesh = new THREE.Mesh(geo, mat);
          mesh.position.set(x, yPos, z);
          mesh.lookAt(0, 0, 0);
          mesh.userData = { photoIndex: i };

          // load texture
          loader.load(photo.url, (tex) => {
            if (disposed) return;
            tex.colorSpace = THREE.SRGBColorSpace;
            mat.map = tex;
            mat.color.set(0xffffff);
            mat.opacity = 1;
            mat.needsUpdate = true;
          });

          group.add(mesh);
          raycasterTargets.push(mesh);
        });

        // raycaster for clicks
        const raycaster = new THREE.Raycaster();
        const pointer = new THREE.Vector2();
        let isDragging = false;
        const pointerDown = new THREE.Vector2();

        canvas.addEventListener("pointerdown", (e) => {
          pointerDown.set(e.clientX, e.clientY);
          isDragging = false;
        });

        canvas.addEventListener("pointermove", (e) => {
          if (
            Math.abs(e.clientX - pointerDown.x) > 5 ||
            Math.abs(e.clientY - pointerDown.y) > 5
          ) {
            isDragging = true;
          }
        });

        canvas.addEventListener("pointerup", (e) => {
          if (isDragging) return;
          const rect = canvas.getBoundingClientRect();
          pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
          pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
          raycaster.setFromCamera(pointer, camera);
          const hits = raycaster.intersectObjects(raycasterTargets);
          if (hits.length > 0) {
            const idx = hits[0].object.userData.photoIndex as number;
            if (idx !== undefined) {
              // trigger click via custom event
              canvas.dispatchEvent(
                new CustomEvent("photo-click", { detail: idx }),
              );
            }
          }
        });

        // photo click handler
        const onPhotoClick = (e: Event) => {
          const idx = (e as CustomEvent).detail as number;
          if (photos[idx]) setLightbox(photos[idx]);
        };
        canvas.addEventListener("photo-click", onPhotoClick);

        // hover effect
        canvas.addEventListener("pointermove", (e) => {
          const rect = canvas.getBoundingClientRect();
          pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
          pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
          raycaster.setFromCamera(pointer, camera);
          const hits = raycaster.intersectObjects(raycasterTargets);
          canvas.style.cursor = hits.length > 0 ? "pointer" : "grab";
          raycasterTargets.forEach((m) => {
            const mat = m.material as THREE.MeshBasicMaterial;
            if (hits.length > 0 && m === hits[0].object) {
              mat.color.set(0xffffff);
            }
          });
        });

        // animation loop
        function animate() {
          if (disposed) return;
          controls.update();
          renderer.render(scene, camera);
          sceneRef.current!.frameId = requestAnimationFrame(animate);
        }

        // resize
        const onResize = () => {
          const w2 = canvas.clientWidth;
          const h2 = canvas.clientHeight;
          camera.aspect = w2 / h2;
          camera.updateProjectionMatrix();
          renderer.setSize(w2, h2);
        };
        window.addEventListener("resize", onResize);

        sceneRef.current = {
          renderer,
          scene,
          camera,
          controls,
          frameId: 0,
          group,
        };

        animate();
        setLoaded(true);

        // cleanup refs
        return () => {
          window.removeEventListener("resize", onResize);
          canvas.removeEventListener("photo-click", onPhotoClick);
        };
      } catch (e) {
        console.error("[PhotoSphereGL]", e);
        setError("3D 渲染初始化失败");
        setLoaded(true);
      }
    })();

    return () => {
      disposed = true;
      const s = sceneRef.current;
      if (s) {
        cancelAnimationFrame(s.frameId);
        (s.renderer as THREE.WebGLRenderer)?.dispose();
      }
    };
  }, [photos]);

  // keyboard nav for lightbox
  useEffect(() => {
    if (!lightbox) return;
    const idx = photos.findIndex((p) => p.id === lightbox.id);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowRight" && idx < photos.length - 1)
        setLightbox(photos[idx + 1]);
      if (e.key === "ArrowLeft" && idx > 0) setLightbox(photos[idx - 1]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, photos]);

  return (
    <>
      {/* grain overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-[998] opacity-[0.025]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      <div className="relative mx-auto h-[70vh] overflow-hidden rounded-xl">
        {/* loading state */}
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-muted">
            {error}
          </div>
        )}

        <canvas
          ref={canvasRef}
          className="size-full"
          style={{ touchAction: "none" }}
        />

        {/* instruction hint */}
        <div className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 text-xs text-white/30">
          拖拽旋转 · 滚轮缩放 · 点击查看
        </div>
      </div>

      {/* lightbox */}
      <AnimatePresence>
        {lightbox && (
          <Lightbox
            photo={lightbox}
            photos={photos}
            onClose={() => setLightbox(null)}
            onNavigate={setLightbox}
          />
        )}
      </AnimatePresence>
    </>
  );
}

/* ── lightbox ── */
function Lightbox({
  photo,
  photos,
  onClose,
  onNavigate,
}: {
  photo: Photo;
  photos: Photo[];
  onClose: () => void;
  onNavigate: (p: Photo) => void;
}) {
  const idx = photos.findIndex((p) => p.id === photo.id);
  const hasPrev = idx > 0;
  const hasNext = idx < photos.length - 1;

  const goPrev = useCallback(() => {
    if (hasPrev) onNavigate(photos[idx - 1]);
  }, [hasPrev, idx, onNavigate, photos]);

  const goNext = useCallback(() => {
    if (hasNext) onNavigate(photos[idx + 1]);
  }, [hasNext, idx, onNavigate, photos]);

  const dragX = useMotionValue(0);
  const handleDragEnd = useCallback(
    (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
      if (info.offset.x > 80 || info.velocity.x > 400) goPrev();
      else if (info.offset.x < -80 || info.velocity.x < -400) goNext();
    },
    [goPrev, goNext],
  );

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="照片预览"
      className="fixed inset-0 z-[1000] flex items-center justify-center"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="absolute inset-0 bg-black/85"
        style={{ backdropFilter: "blur(12px)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      <motion.div
        className="absolute top-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-white/8 px-4 py-1.5 text-xs font-medium text-white/60 backdrop-blur-md ring-1 ring-white/10"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        <span className="tabular-nums">{idx + 1}</span>
        <span className="text-white/30">/</span>
        <span className="tabular-nums">{photos.length}</span>
      </motion.div>

      <motion.div
        className="relative flex max-h-[90vh] max-w-[90vw] items-center"
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.4, opacity: 0 }}
        transition={{ type: "spring", damping: 26, stiffness: 340 }}
      >
        {hasPrev && (
          <button
            type="button"
            onClick={goPrev}
            aria-label="上一张"
            className="absolute -left-14 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/8 text-white/70 ring-1 ring-white/10 backdrop-blur-md transition-all hover:scale-110 hover:bg-white/15 hover:text-white sm:-left-16"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            <span className="sr-only">上一张</span>
          </button>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={photo.id}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.18}
            onDragEnd={handleDragEnd}
            style={{ x: dragX }}
            initial={{ opacity: 0, scale: 0.9, x: 50 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: -50 }}
            transition={{ duration: 0.25, ease: EASE_OUT }}
            className="cursor-grab active:cursor-grabbing"
          >
            <Image
              src={photo.url}
              alt={photo.caption ?? ""}
              width={1600}
              height={1200}
              className="max-h-[82vh] rounded-xl object-contain shadow-2xl select-none"
              draggable={false}
            />
          </motion.div>
        </AnimatePresence>

        {photo.caption && (
          <motion.p
            className="absolute -bottom-12 left-0 right-0 text-center text-sm text-white/50"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {photo.caption}
          </motion.p>
        )}

        {hasNext && (
          <button
            type="button"
            onClick={goNext}
            aria-label="下一张"
            className="absolute -right-14 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/8 text-white/70 ring-1 ring-white/10 backdrop-blur-md transition-all hover:scale-110 hover:bg-white/15 hover:text-white sm:-right-16"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
            <span className="sr-only">下一张</span>
          </button>
        )}

        <motion.div
          className="absolute -bottom-16 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-full bg-white/8 px-2 py-1.5 ring-1 ring-white/10 backdrop-blur-md"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭"
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="6" x2="18" y2="18" /><line x1="6" y1="18" x2="18" y2="6" /></svg>
            <span className="sr-only">关闭</span>
          </button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
