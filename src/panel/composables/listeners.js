import { getCurrentScope, onScopeDispose, unref, watch } from "kirbyuse";

export function useEventListener(target, event, listener, options) {
  let cleanupFn;

  const cleanup = () => {
    cleanupFn?.();
    cleanupFn = undefined;
  };

  const register = (el, event, listener, options) => {
    el.addEventListener(event, listener, options);
    return () => el.removeEventListener(event, listener, options);
  };

  const stopWatch = watch(
    () => unrefElement(target),
    (el) => {
      cleanup();
      if (!el) return;

      cleanupFn = register(el, event, listener, options);
    },
    { immediate: true, flush: "post" },
  );

  const stop = () => {
    stopWatch();
    cleanup();
  };

  if (getCurrentScope()) {
    onScopeDispose(stop);
  }

  return stop;
}

export function useIntersectionObserver(options = {}) {
  const elements = new WeakMap();
  // Track observed elements separately, since `WeakMap` has no way to get keys.
  const observedElements = new Set();
  let observer;

  const { root, rootMargin = "0px", threshold = 0.5 } = options;

  const cleanup = () => {
    if (observer) {
      for (const el of observedElements) observer.unobserve(el);
      observedElements.clear();
      // `WeakMap` will clear itself when references are gone.
      observer = undefined;
    }
  };

  const observe = (element, callback) => {
    observer ??= new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const cb = elements.get(entry.target);
          if (cb) cb(entry.isIntersecting);
        }
      },
      {
        root,
        rootMargin,
        threshold,
      },
    );

    if (element) {
      elements.set(element, callback);
      observedElements.add(element);
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer?.unobserve(element);
        observedElements.delete(element);
        elements.delete(element);
      }
    };
  };

  const unobserve = (element) => {
    if (element) {
      observer?.unobserve(element);
      observedElements.delete(element);
      elements.delete(element);
    }
  };

  if (getCurrentScope()) {
    onScopeDispose(cleanup);
  }

  return {
    observe,
    unobserve,
    disconnect: cleanup,
  };
}

export function unrefElement(elRef) {
  const plain = unref(elRef);
  return plain?.$el ?? plain;
}
