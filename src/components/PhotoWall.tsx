"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  useSpring,
} from "framer-motion";
import { useT } from "@/components/LocaleProvider";

type Photo = {
  id: string;
  url: string;
  caption: string | null;
};

/* ── motion tokens (inspired by Ant Design) ── */
const EASE_OUT = [0.215, 0.61, 0.355, 1] as const;
const EASE_OUT_QUINT = [0.23, 1, 0.32, 1] as const;

function seededRandom(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++)
    h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  return (h % 1000) / 1000;
}

/* ── main component ── */
export function PhotoWall({ photos }: { photos: Photo[] }) {
  const t = useT();
  const [lightbox, setLightbox] = useState<Photo | null>(null);

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
      {/* grain texture overlay for atmosphere */}
      <div
        data-slot="grain-overlay"
        className="pointer-events-none fixed inset-0 z-[999] opacity-[0.03]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      <div
        data-slot="photo-wall"
        role="region"
        aria-roledescription={t.gallery.wall}
        aria-label={t.gallery.gallery}
        className="columns-2 gap-4 sm:columns-3 lg:columns-4"
      >
        {photos.map((p, i) => (
          <PhotoCard key={p.id} photo={p} index={i} onClick={setLightbox} />
        ))}
      </div>

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

/* ── photo card ── */
function PhotoCard({
  photo,
  index,
  onClick,
}: {
  photo: Photo;
  index: number;
  onClick: (p: Photo) => void;
}) {
  const t = useT();
  const cardRef = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [6, -6]), {
    stiffness: 300,
    damping: 30,
  });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-6, 6]), {
    stiffness: 300,
    damping: 30,
  });

  const rotation = (seededRandom(photo.id) - 0.5) * 4; // -2 to +2 deg
  const isLarge = index % 5 === 0;
  const aspectClass = isLarge ? "aspect-[4/3]" : "aspect-square";

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const rect = cardRef.current?.getBoundingClientRect();
      if (!rect) return;
      x.set((e.clientX - rect.left) / rect.width - 0.5);
      y.set((e.clientY - rect.top) / rect.height - 0.5);
    },
    [x, y],
  );

  const handleMouseLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  return (
    <motion.button
      ref={cardRef}
      type="button"
      role="group"
      aria-roledescription={t.gallery.slide}
      aria-label={photo.caption ?? `${t.gallery.photo} ${index + 1}`}
      onClick={() => onClick(photo)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, perspective: 800 }}
      data-slot="photo-card"
      className="group/card relative mb-4 w-full cursor-pointer break-inside-avoid overflow-hidden rounded-xl border border-border/40 bg-card text-left shadow-sm transition-shadow duration-300 hover:shadow-xl hover:shadow-primary/8"
      initial={{
        opacity: 0,
        y: 50,
        rotate: rotation,
        filter: "grayscale(100%) brightness(1.15)",
      }}
      whileInView={{
        opacity: 1,
        y: 0,
        rotate: rotation,
        filter: "grayscale(0%) brightness(1)",
      }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{
        duration: 0.7,
        delay: Math.min(index * 0.08, 0.64),
        ease: EASE_OUT,
      }}
      whileHover={{
        scale: 1.03,
        rotate: 0,
        zIndex: 10,
        transition: { duration: 0.35, ease: EASE_OUT_QUINT },
      }}
    >
      {/* image */}
      <div data-slot="photo-card-image" className={`relative overflow-hidden ${aspectClass}`}>
        <Image
          src={photo.url}
          alt={photo.caption ?? ""}
          width={isLarge ? 960 : 640}
          height={isLarge ? 720 : 640}
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          loading="lazy"
          className="size-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover/card:scale-110"
        />

        {/* blur vignette edges (Creative Tim pattern) */}
        <div
          data-slot="photo-card-vignette"
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/card:opacity-100"
          style={{
            maskImage:
              "linear-gradient(to bottom, black 0%, transparent 15%, transparent 85%, black 100%), linear-gradient(to right, black 0%, transparent 15%, transparent 85%, black 100%)",
            maskComposite: "intersect",
            WebkitMaskComposite: "source-in",
            backdropFilter: "blur(2px)",
          }}
        />

        {/* gradient overlay */}
        <div
          data-slot="photo-card-overlay"
          className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 transition-opacity duration-400 group-hover/card:opacity-100"
        />

        {/* shimmer gleam (Creative Tim) */}
        <div
          data-slot="photo-card-shimmer"
          className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition-all duration-700 group-hover/card:translate-x-full group-hover/card:opacity-100"
        />

        {/* view icon (Ant Design cover pattern) */}
        <div
          data-slot="photo-card-cover"
          className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover/card:opacity-100"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 backdrop-blur-md transition-transform duration-300 group-hover/card:scale-110">
            <svg
              className="h-5 w-5 text-white drop-shadow"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
        </div>

        {/* caption */}
        {photo.caption ? (
          <div
            data-slot="photo-card-caption"
            className="absolute inset-x-0 bottom-0 translate-y-full px-4 pb-3 pt-8 text-sm font-medium text-white transition-transform duration-400 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover/card:translate-y-0"
          >
            {photo.caption}
          </div>
        ) : null}

        {/* corner accent dot */}
        <div className="absolute right-3 top-3 h-1.5 w-1.5 rounded-full bg-white/0 shadow-[0_0_0px_rgba(255,255,255,0)] transition-all duration-300 group-hover/card:bg-white/70 group-hover/card:shadow-[0_0_8px_rgba(255,255,255,0.3)]" />
      </div>

      {/* bottom glow line */}
      <div className="absolute -bottom-px left-6 right-6 h-px bg-gradient-to-r from-transparent via-primary/0 to-transparent transition-all duration-500 group-hover/card:via-primary/40" />
    </motion.button>
  );
}

/* ── lightbox (Ant Design preview + shadcn dialog pattern) ── */
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

  // drag to navigate
  const dragX = useMotionValue(0);
  const handleDragEnd = useCallback(
    (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
      const threshold = 80;
      if (info.offset.x > threshold || info.velocity.x > 400) goPrev();
      else if (info.offset.x < -threshold || info.velocity.x < -400) goNext();
    },
    [goPrev, goNext],
  );

  return (
    <motion.div
      data-slot="lightbox"
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
      {/* backdrop with blur (Ant Design mask pattern) */}
      <motion.div
        data-slot="lightbox-mask"
        className="absolute inset-0 bg-black/85"
        style={{ backdropFilter: "blur(12px)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      {/* counter pill (shadcn badge pattern) */}
      <motion.div
        data-slot="lightbox-counter"
        className="absolute top-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-white/8 px-4 py-1.5 text-xs font-medium text-white/60 backdrop-blur-md ring-1 ring-white/10"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15, ease: EASE_OUT }}
      >
        <span className="tabular-nums">{idx + 1}</span>
        <span className="text-white/30">/</span>
        <span className="tabular-nums">{photos.length}</span>
      </motion.div>

      {/* content (Ant Design scale-from-thumbnail) */}
      <motion.div
        data-slot="lightbox-content"
        className="relative flex max-h-[90vh] max-w-[90vw] items-center"
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.4, opacity: 0 }}
        transition={{
          type: "spring",
          damping: 26,
          stiffness: 340,
          mass: 0.8,
        }}
      >
        {/* prev arrow */}
        {hasPrev && (
          <button
            type="button"
            onClick={goPrev}
            aria-label="上一张"
            className="absolute -left-14 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/8 text-white/70 ring-1 ring-white/10 backdrop-blur-md transition-all duration-200 hover:scale-110 hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 sm:-left-16"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span className="sr-only">上一张</span>
          </button>
        )}

        {/* draggable image container */}
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

        {/* caption */}
        <AnimatePresence mode="wait">
          {photo.caption && (
            <motion.p
              key={photo.caption}
              data-slot="lightbox-caption"
              className="absolute -bottom-12 left-0 right-0 text-center text-sm text-white/50"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.1, ease: EASE_OUT }}
            >
              {photo.caption}
            </motion.p>
          )}
        </AnimatePresence>

        {/* next arrow */}
        {hasNext && (
          <button
            type="button"
            onClick={goNext}
            aria-label="下一张"
            className="absolute -right-14 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/8 text-white/70 ring-1 ring-white/10 backdrop-blur-md transition-all duration-200 hover:scale-110 hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 sm:-right-16"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
            <span className="sr-only">下一张</span>
          </button>
        )}

        {/* pill action bar (Ant Design toolbar pattern) */}
        <motion.div
          data-slot="lightbox-toolbar"
          className="absolute -bottom-16 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-full bg-white/8 px-2 py-1.5 ring-1 ring-white/10 backdrop-blur-md"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, ease: EASE_OUT }}
        >
          {/* close */}
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭"
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 transition-colors duration-200 hover:bg-white/10 hover:text-white"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="6" y1="18" x2="18" y2="6" />
            </svg>
            <span className="sr-only">关闭</span>
          </button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
