"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { motion, useMotionValue, useTransform, type MotionValue, type PanInfo } from "motion/react";
import { Activity, CalendarDays, Eye, FileText, Heart } from "lucide-react";
import { useT } from "@/components/LocaleProvider";

export type StatsCarouselItem = {
  id: string;
  title: string;
  value: string;
  description: string;
  tone: "cyan" | "violet" | "rose" | "amber";
};

type InternalItem = StatsCarouselItem & {
  icon: ReactNode;
};

const DRAG_BUFFER = 0;
const VELOCITY_THRESHOLD = 500;
const GAP = 16;
const SPRING_OPTIONS = { type: "spring", stiffness: 300, damping: 30 } as const;

const ICON_BY_ID: Record<string, ReactNode> = {
  posts: <FileText className="h-4 w-4" aria-hidden />,
  views: <Eye className="h-4 w-4" aria-hidden />,
  likes: <Heart className="h-4 w-4" aria-hidden />,
  uptime: <CalendarDays className="h-4 w-4" aria-hidden />,
};

function CarouselItem({
  item,
  index,
  itemWidth,
  trackItemOffset,
  x,
}: {
  item: InternalItem;
  index: number;
  itemWidth: number;
  trackItemOffset: number;
  x: MotionValue<number>;
}) {
  const range = [-(index + 1) * trackItemOffset, -index * trackItemOffset, -(index - 1) * trackItemOffset];
  const rotateY = useTransform(x, range, [48, 0, -48], { clamp: false });
  const opacity = useTransform(x, range, [0.72, 1, 0.72], { clamp: false });

  return (
    <motion.div
      className={`stats-carousel-item tone-${item.tone}`}
      style={{ width: itemWidth, rotateY, opacity }}
      transition={SPRING_OPTIONS}
    >
      <div className="stats-carousel-item-header">
        <span className="stats-carousel-icon">{item.icon}</span>
        <span className="stats-carousel-id">{item.title}</span>
      </div>
      <div className="stats-carousel-item-content">
        <div className="stats-carousel-value">{item.value}</div>
        <p className="stats-carousel-description">{item.description}</p>
      </div>
    </motion.div>
  );
}

export function StatsCarousel({
  items,
  baseWidth = 330,
  autoplay = true,
  autoplayDelay = 3000,
  pauseOnHover = false,
  loop = false,
}: {
  items: StatsCarouselItem[];
  baseWidth?: number;
  autoplay?: boolean;
  autoplayDelay?: number;
  pauseOnHover?: boolean;
  loop?: boolean;
}) {
  const t = useT();
  const [containerWidth, setContainerWidth] = useState(baseWidth);
  const containerPadding = 12;
  const measuredWidth = containerWidth || baseWidth;
  const itemWidth = Math.max(1, measuredWidth - containerPadding * 2);
  const trackItemOffset = itemWidth + GAP;
  const normalizedItems = useMemo<InternalItem[]>(
    () =>
      items.map((item) => ({
        ...item,
        icon: ICON_BY_ID[item.id] ?? <Activity className="h-4 w-4" aria-hidden />,
      })),
    [items],
  );
  const itemsForRender = useMemo(() => {
    if (!loop) return normalizedItems;
    if (normalizedItems.length === 0) return [];
    return [normalizedItems[normalizedItems.length - 1], ...normalizedItems, normalizedItems[0]];
  }, [normalizedItems, loop]);

  const [position, setPosition] = useState(loop ? 1 : 0);
  const [isHovered, setIsHovered] = useState(false);
  const [isJumping, setIsJumping] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const x = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateWidth = () => {
      const nextWidth = Math.floor(container.getBoundingClientRect().width);
      if (nextWidth > 0) setContainerWidth(nextWidth);
    };

    updateWidth();

    if (typeof ResizeObserver === "undefined") return;

    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (!pauseOnHover || !containerRef.current) return;
    const container = containerRef.current;
    const handleMouseEnter = () => setIsHovered(true);
    const handleMouseLeave = () => setIsHovered(false);
    container.addEventListener("mouseenter", handleMouseEnter);
    container.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      container.removeEventListener("mouseenter", handleMouseEnter);
      container.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [pauseOnHover]);

  useEffect(() => {
    if (!autoplay || itemsForRender.length <= 1) return;
    if (pauseOnHover && isHovered) return;

    const timer = window.setInterval(() => {
      setPosition((prev) => {
        if (loop) return prev + 1;
        return prev >= itemsForRender.length - 1 ? 0 : prev + 1;
      });
    }, autoplayDelay);

    return () => window.clearInterval(timer);
  }, [autoplay, autoplayDelay, isHovered, pauseOnHover, itemsForRender.length, loop]);

  useEffect(() => {
    const startingPosition = loop ? 1 : 0;
    setPosition(startingPosition);
    x.set(-startingPosition * trackItemOffset);
  }, [items.length, loop, trackItemOffset, x]);

  const effectiveTransition = isJumping ? { duration: 0 } : SPRING_OPTIONS;

  function handleAnimationComplete() {
    if (!loop || itemsForRender.length <= 1) {
      setIsAnimating(false);
      return;
    }

    const lastCloneIndex = itemsForRender.length - 1;
    if (position === lastCloneIndex) {
      setIsJumping(true);
      setPosition(1);
      x.set(-trackItemOffset);
      requestAnimationFrame(() => {
        setIsJumping(false);
        setIsAnimating(false);
      });
      return;
    }

    if (position === 0) {
      const target = normalizedItems.length;
      setIsJumping(true);
      setPosition(target);
      x.set(-target * trackItemOffset);
      requestAnimationFrame(() => {
        setIsJumping(false);
        setIsAnimating(false);
      });
      return;
    }

    setIsAnimating(false);
  }

  function handleDragEnd(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    const { offset, velocity } = info;
    const direction =
      offset.x < -DRAG_BUFFER || velocity.x < -VELOCITY_THRESHOLD
        ? 1
        : offset.x > DRAG_BUFFER || velocity.x > VELOCITY_THRESHOLD
          ? -1
          : 0;

    if (direction === 0) return;

    setPosition((prev) => {
      const next = prev + direction;
      const max = itemsForRender.length - 1;
      return Math.max(0, Math.min(next, max));
    });
  }

  const activeIndex =
    normalizedItems.length === 0
      ? 0
      : loop
        ? (position - 1 + normalizedItems.length) % normalizedItems.length
        : Math.min(position, normalizedItems.length - 1);

  return (
    <div ref={containerRef} className="stats-carousel-container">
      <div className="stats-carousel-shell">
        <motion.div
          className="stats-carousel-track"
          drag={isAnimating ? false : "x"}
          dragConstraints={loop ? undefined : { left: -trackItemOffset * Math.max(itemsForRender.length - 1, 0), right: 0 }}
          style={{
            width: itemWidth,
            gap: `${GAP}px`,
            perspective: 1000,
            perspectiveOrigin: `${position * trackItemOffset + itemWidth / 2}px 50%`,
            x,
          }}
          onDragEnd={handleDragEnd}
          animate={{ x: -(position * trackItemOffset) }}
          transition={effectiveTransition}
          onAnimationStart={() => setIsAnimating(true)}
          onAnimationComplete={handleAnimationComplete}
        >
          {itemsForRender.map((item, index) => (
            <CarouselItem
              key={`${item.id}-${index}`}
              item={item}
              index={index}
              itemWidth={itemWidth}
              trackItemOffset={trackItemOffset}
              x={x}
            />
          ))}
        </motion.div>
      </div>

      <div className="stats-carousel-indicators" aria-label={t.stats.carouselLabel}>
        {normalizedItems.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={`stats-carousel-indicator ${activeIndex === index ? "active" : "inactive"}`}
            aria-label={`${t.stats.viewItem}${item.title}`}
            aria-current={activeIndex === index}
            onClick={() => setPosition(loop ? index + 1 : index)}
          />
        ))}
      </div>
    </div>
  );
}
