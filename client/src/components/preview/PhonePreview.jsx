import { useCallback, useEffect, useRef, useState } from "react";
import PublicPageSceneView from "../public/PublicPageSceneView.jsx";
import { getMyPageTheme } from "../public/myPageTheme.js";

const MIN_SCROLL_THUMB_HEIGHT = 42;

export default function PhonePreview({ page }) {
  const scrollRef = useRef(null);
  const trackRef = useRef(null);
  const [scrollbar, setScrollbar] = useState({
    visible: false,
    thumbHeight: 0,
    thumbTop: 0,
  });
  const theme = getMyPageTheme(page || {});

  const updateScrollbar = useCallback(() => {
    const scrollElement = scrollRef.current;
    const trackElement = trackRef.current;

    if (!scrollElement || !trackElement) {
      return;
    }

    const scrollableHeight = scrollElement.scrollHeight - scrollElement.clientHeight;

    if (scrollableHeight <= 1) {
      setScrollbar((current) =>
        current.visible || current.thumbHeight || current.thumbTop
          ? { visible: false, thumbHeight: 0, thumbTop: 0 }
          : current,
      );
      return;
    }

    const trackHeight = trackElement.clientHeight || scrollElement.clientHeight;
    const thumbHeight = Math.max(
      MIN_SCROLL_THUMB_HEIGHT,
      Math.round((scrollElement.clientHeight / scrollElement.scrollHeight) * trackHeight),
    );
    const maxThumbTop = Math.max(0, trackHeight - thumbHeight);
    const thumbTop = Math.round((scrollElement.scrollTop / scrollableHeight) * maxThumbTop);

    setScrollbar((current) => {
      if (
        current.visible &&
        current.thumbHeight === thumbHeight &&
        current.thumbTop === thumbTop
      ) {
        return current;
      }

      return {
        visible: true,
        thumbHeight,
        thumbTop,
      };
    });
  }, []);

  useEffect(() => {
    const scrollElement = scrollRef.current;

    if (!scrollElement) {
      return undefined;
    }

    let animationFrame = window.requestAnimationFrame(updateScrollbar);
    const queueUpdate = () => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(updateScrollbar);
    };

    scrollElement.addEventListener("scroll", queueUpdate, { passive: true });

    let resizeObserver;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(queueUpdate);
      resizeObserver.observe(scrollElement);

      if (scrollElement.firstElementChild) {
        resizeObserver.observe(scrollElement.firstElementChild);
      }
    } else {
      window.addEventListener("resize", queueUpdate);
    }

    queueUpdate();

    return () => {
      window.cancelAnimationFrame(animationFrame);
      scrollElement.removeEventListener("scroll", queueUpdate);

      if (resizeObserver) {
        resizeObserver.disconnect();
      } else {
        window.removeEventListener("resize", queueUpdate);
      }
    };
  }, [page, updateScrollbar]);

  return (
    <div className="phone-preview">
      <div
        className="phone-preview__frame"
        style={{
          boxShadow: `0 30px 80px -34px ${theme.design?.buttonColor || "#0f172a"}`,
        }}
      >
        <div className="phone-preview__viewport">
          <div className="phone-preview__scroll" ref={scrollRef}>
            <PublicPageSceneView page={page} mode="preview" interactive={false} />
          </div>
          <div
            aria-hidden="true"
            className={`phone-preview__scrollbar${scrollbar.visible ? " is-visible" : ""}`}
            ref={trackRef}
          >
            <span
              className="phone-preview__scrollbar-thumb"
              style={{
                height: `${scrollbar.thumbHeight}px`,
                transform: `translate3d(0, ${scrollbar.thumbTop}px, 0)`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
