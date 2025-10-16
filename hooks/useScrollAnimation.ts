import { useEffect, useState, useRef, RefObject } from 'react';

type IntersectionObserverOptions = {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
};

export const useScrollAnimation = (options?: IntersectionObserverOptions): [RefObject<HTMLDivElement>, boolean] => {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (options?.triggerOnce !== false && elementRef.current) {
            observer.unobserve(elementRef.current);
          }
        } else {
            if (options?.triggerOnce === false) {
                setIsVisible(false);
            }
        }
      },
      {
        threshold: options?.threshold || 0.1,
        rootMargin: options?.rootMargin || '0px',
      }
    );

    const currentElement = elementRef.current;
    if (currentElement) {
      observer.observe(currentElement);
    }

    return () => {
      if (currentElement) {
        observer.unobserve(currentElement);
      }
    };
  }, [options]);

  return [elementRef, isVisible];
};
