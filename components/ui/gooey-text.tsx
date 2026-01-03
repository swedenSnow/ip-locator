import * as React from 'react';

import { cn } from '@/lib/utils';

interface GooeyTextProps {
  texts: string[];
  morphTime?: number;
  cooldownTime?: number;
  className?: string;
  textClassName?: string;
}

export function GooeyText({
  texts,
  morphTime = 1,
  cooldownTime = 1.5,
  className,
  textClassName,
}: GooeyTextProps) {
  const text1Ref = React.useRef<HTMLSpanElement>(null);
  const text2Ref = React.useRef<HTMLSpanElement>(null);

  React.useEffect(() => {
    if (!text1Ref.current || !text2Ref.current || texts.length === 0) return;

    // Use refs for animation state to avoid closure issues
    let animationFrameId: number;
    let currentIndex = 0;
    let nextIndex = 1 % texts.length;
    let lastTime = performance.now();
    let morph = 0;
    let cooldown = cooldownTime;

    const text1 = text1Ref.current;
    const text2 = text2Ref.current;

    // Responsive blur intensity based on screen size
    const getBlurIntensity = () => {
      const width = window.innerWidth;
      if (width < 700) return 4; // Reduced blur for small screens
      return 8; // Normal blur for larger screens
    };

    // Initialize: text1 shows first word fully visible, text2 hidden with next word
    text1.textContent = texts[0];
    text2.textContent = texts[nextIndex];
    text1.style.opacity = '100%';
    text1.style.filter = 'blur(0px)';
    text2.style.opacity = '0%';
    text2.style.filter = 'blur(0px)';

    function setMorph(fraction: number) {
      const blurIntensity = getBlurIntensity();

      // text2 fades in (the next word)
      text2.style.filter = `blur(${Math.min(blurIntensity / fraction - blurIntensity, 100)}px)`;
      text2.style.opacity = `${Math.pow(fraction, 0.4) * 100}%`;

      // text1 fades out (the current word)
      const inverseFraction = 1 - fraction;
      text1.style.filter = `blur(${Math.min(blurIntensity / inverseFraction - blurIntensity, 100)}px)`;
      text1.style.opacity = `${Math.pow(inverseFraction, 0.4) * 100}%`;
    }

    function completeMorph() {
      // Morph is complete - text2 is now fully visible
      // Swap: copy text2 content to text1, advance indices
      text1.textContent = texts[nextIndex];
      text1.style.opacity = '100%';
      text1.style.filter = 'blur(0px)';
      text2.style.opacity = '0%';
      text2.style.filter = 'blur(0px)';

      // Advance to next word pair
      currentIndex = nextIndex;
      nextIndex = (nextIndex + 1) % texts.length;
      text2.textContent = texts[nextIndex];
    }

    function animate(currentTime: number) {
      animationFrameId = requestAnimationFrame(animate);

      const dt = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      // Cooldown phase: display current word
      if (cooldown > 0) {
        cooldown -= dt;
        return;
      }

      // Morphing phase
      morph += dt;
      const fraction = morph / morphTime;

      if (fraction < 1) {
        setMorph(fraction);
      } else {
        // Morph complete - reset for next cycle
        completeMorph();
        morph = 0;
        cooldown = cooldownTime;
      }
    }

    animationFrameId = requestAnimationFrame(animate);

    // Cleanup on unmount or dependency change
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [texts, morphTime, cooldownTime]);

  const gradientStyle = {
    background: 'linear-gradient(135deg, #00ff88 0%, #00ccff 50%, #ff00aa 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    whiteSpace: 'nowrap',
  } as React.CSSProperties;

  return (
    <div className={cn('relative', className)}>
      <svg className="absolute h-0 w-0" aria-hidden="true" focusable="false">
        <defs>
          <filter id="threshold">
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      0 0 0 255 -140"
            />
          </filter>
        </defs>
      </svg>

      <div
        className="flex items-center justify-center"
        style={{ filter: 'url(#threshold)' }}
      >
        <span
          ref={text1Ref}
          className={cn('absolute inline-block select-none text-center', textClassName)}
          style={gradientStyle}
        />
        <span
          ref={text2Ref}
          className={cn('absolute inline-block select-none text-center', textClassName)}
          style={gradientStyle}
        />
      </div>
    </div>
  );
}
