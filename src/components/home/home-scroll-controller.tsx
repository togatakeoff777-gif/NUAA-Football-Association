"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const screenLabels = [
  "品牌首页",
  "比赛信息",
  "重要公告",
  "年度赛事",
  "新闻动态",
  "关于协会",
] as const;

const desktopQuery = "(min-width: 1024px)";
const reducedMotionQuery = "(prefers-reduced-motion: reduce)";
const wheelThreshold = 36;
const inputLockDuration = 700;

function getHomeSections(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>("[data-home-screen]"));
}

export function HomeScrollController() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const lockUntilRef = useRef(0);

  const moveTo = useCallback((nextIndex: number) => {
    const container = document.querySelector<HTMLElement>(".home-scroll-shell");
    if (!container) return;

    const sections = getHomeSections(container);
    const safeIndex = Math.max(0, Math.min(nextIndex, sections.length - 1));
    const reducedMotion = window.matchMedia(reducedMotionQuery).matches;

    const destination = sections[safeIndex];
    if (!destination) return;

    if (animationFrameRef.current !== null) cancelAnimationFrame(animationFrameRef.current);
    container.classList.remove("is-programmatic-scrolling");
    container.classList.remove("is-footer-flow");
    activeIndexRef.current = safeIndex;
    setActiveIndex(safeIndex);

    if (reducedMotion) {
      container.scrollTop = destination.offsetTop;
      lockUntilRef.current = 0;
      return;
    }

    const startTop = container.scrollTop;
    const distance = destination.offsetTop - startTop;
    const duration = 680;
    const startTime = performance.now();
    lockUntilRef.current = startTime + inputLockDuration;
    container.classList.add("is-programmatic-scrolling");

    const animate = (timestamp: number) => {
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = progress < .5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      container.scrollTop = startTop + distance * eased;
      if (progress < 1) animationFrameRef.current = requestAnimationFrame(animate);
      else {
        animationFrameRef.current = null;
        container.classList.remove("is-programmatic-scrolling");
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    const container = document.querySelector<HTMLElement>(".home-scroll-shell");
    if (!container) return;

    const sections = getHomeSections(container);
    if (sections.length !== screenLabels.length) return;

    const ratios = new Map<Element, number>();
    const observationRoot = window.matchMedia("(min-width: 768px)").matches ? container : null;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          ratios.set(entry.target, entry.intersectionRatio);
          if (entry.isIntersecting) entry.target.classList.add("is-visible");
        });

        let bestIndex = activeIndexRef.current;
        let bestRatio = -1;
        sections.forEach((section, index) => {
          const ratio = ratios.get(section) ?? 0;
          if (ratio > bestRatio) {
            bestIndex = index;
            bestRatio = ratio;
          }
        });

        if (bestRatio > 0 && performance.now() >= lockUntilRef.current && bestIndex !== activeIndexRef.current) {
          activeIndexRef.current = bestIndex;
          setActiveIndex(bestIndex);
        }
      },
      { root: observationRoot, threshold: [0.15, 0.35, 0.55, 0.75] },
    );

    sections.forEach((section) => observer.observe(section));
    container.classList.add("home-motion-ready");

    const desktopMedia = window.matchMedia(desktopQuery);
    let accumulatedDelta = 0;
    const lastSection = sections.at(-1);

    const syncFooterFlow = () => {
      if (!lastSection) return;
      container.classList.toggle("is-footer-flow", container.scrollTop > lastSection.offsetTop + 2);
    };

    const canSectionScrollInternally = (section: HTMLElement, direction: 1 | -1) => {
      if (section.scrollHeight <= container.clientHeight + 2) return false;
      const sectionTop = section.offsetTop;
      const sectionBottom = sectionTop + section.offsetHeight;
      const viewportTop = container.scrollTop;
      const viewportBottom = viewportTop + container.clientHeight;
      return direction > 0 ? viewportBottom < sectionBottom - 2 : viewportTop > sectionTop + 2;
    };

    const handleWheel = (event: WheelEvent) => {
      if (!desktopMedia.matches || event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;

      const direction: 1 | -1 = event.deltaY > 0 ? 1 : -1;
      const current = sections[activeIndexRef.current];
      if (!current || canSectionScrollInternally(current, direction)) return;

      if (container.classList.contains("is-footer-flow")) {
        accumulatedDelta = 0;
        return;
      }

      if (direction > 0 && activeIndexRef.current === sections.length - 1) {
        container.classList.add("is-footer-flow");
        accumulatedDelta = 0;
        return;
      }

      if (direction < 0 && activeIndexRef.current === 0) {
        accumulatedDelta = 0;
        return;
      }

      if (performance.now() < lockUntilRef.current) {
        event.preventDefault();
        return;
      }

      accumulatedDelta = Math.sign(accumulatedDelta || event.deltaY) === Math.sign(event.deltaY)
        ? accumulatedDelta + event.deltaY
        : event.deltaY;

      if (Math.abs(accumulatedDelta) < wheelThreshold) return;

      event.preventDefault();
      accumulatedDelta = 0;
      moveTo(activeIndexRef.current + direction);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!desktopMedia.matches || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      if (container.classList.contains("is-footer-flow")) return;
      const target = event.target as HTMLElement | null;
      if (target?.isContentEditable || target?.matches("input, textarea, select, button, a")) return;

      let nextIndex: number | null = null;
      if (event.key === "ArrowDown" || event.key === "PageDown") nextIndex = activeIndexRef.current + 1;
      if (event.key === "ArrowUp" || event.key === "PageUp") nextIndex = activeIndexRef.current - 1;
      if (event.key === "Home") nextIndex = 0;
      if (event.key === "End") nextIndex = sections.length - 1;
      if (nextIndex === null) return;

      event.preventDefault();
      moveTo(nextIndex);
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    container.addEventListener("scroll", syncFooterFlow, { passive: true });
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      observer.disconnect();
      if (animationFrameRef.current !== null) cancelAnimationFrame(animationFrameRef.current);
      container.classList.remove("is-programmatic-scrolling");
      container.classList.remove("is-footer-flow");
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("scroll", syncFooterFlow);
      window.removeEventListener("keydown", handleKeyDown);
      container.classList.remove("home-motion-ready");
    };
  }, [moveTo]);

  return (
    <nav className="home-screen-dots" aria-label="首页分屏导航">
      {screenLabels.map((label, index) => (
        <button
          aria-current={activeIndex === index ? "step" : undefined}
          aria-label={`前往${label}`}
          className={activeIndex === index ? "is-active" : undefined}
          key={label}
          onClick={() => moveTo(index)}
          title={label}
          type="button"
        >
          <span>{label}</span>
          <i aria-hidden="true" />
        </button>
      ))}
    </nav>
  );
}
