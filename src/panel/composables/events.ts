import type {
  ComponentPublicInstance,
  Ref,
  ShallowRef,
  WritableComputedRef,
} from "vue";
import { getCurrentScope, onScopeDispose, unref, watch } from "kirbyuse";

type MaybeRef<T> = T | Ref<T> | ShallowRef<T> | WritableComputedRef<T>; // TODO: Remove in Vue 3.
type MaybeElement = HTMLElement | ComponentPublicInstance | undefined | null;

/**
 * Registers the listener once the target element exists and removes it again
 * when the target changes or the surrounding effect scope is disposed.
 *
 * @see https://vueuse.org/useEventListener
 */
export function useEventListener<K extends keyof HTMLElementEventMap>(
  target: MaybeRef<MaybeElement>,
  event: K,
  listener: (this: HTMLElement, event: HTMLElementEventMap[K]) => unknown,
  options?: boolean | AddEventListenerOptions,
): () => void;
export function useEventListener<K extends keyof MediaQueryListEventMap>(
  target: MediaQueryList,
  event: K,
  listener: (this: MediaQueryList, event: MediaQueryListEventMap[K]) => unknown,
  options?: boolean | AddEventListenerOptions,
): () => void;
export function useEventListener(
  target: MaybeRef<MaybeElement> | MediaQueryList,
  event: string,
  listener: EventListenerOrEventListenerObject,
  options?: boolean | AddEventListenerOptions,
): () => void {
  let cleanupFn: (() => void) | undefined;

  const cleanup = () => {
    cleanupFn?.();
    cleanupFn = undefined;
  };

  const register = (target: EventTarget) => {
    target.addEventListener(event, listener, options);
    return () => target.removeEventListener(event, listener, options);
  };

  const stopWatch = watch(
    () => unrefElement(target),
    (el) => {
      cleanup();
      if (!el) return;

      cleanupFn = register(el);
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

export interface IntersectionObserverOptions {
  root?: Element | Document | null;
  rootMargin?: string;
  threshold?: number | number[];
}

/**
 * Watches any number of elements with a single observer, each with its own
 * callback, and disconnects when the surrounding effect scope is disposed.
 */
export function useIntersectionObserver(
  options: IntersectionObserverOptions = {},
) {
  const callbacks = new WeakMap<Element, (isIntersecting: boolean) => void>();
  // A `WeakMap` cannot list its keys, so the observed elements need their own set.
  const observedElements = new Set<Element>();
  let observer: IntersectionObserver | undefined;

  const { root, rootMargin = "0px", threshold = 0.5 } = options;

  const cleanup = () => {
    if (!observer) return;

    for (const element of observedElements) observer.unobserve(element);
    observedElements.clear();
    // `WeakMap` will clear itself when references are gone.
    observer = undefined;
  };

  const observe = (
    element: Element | undefined | null,
    callback: (isIntersecting: boolean) => void,
  ) => {
    observer ??= new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          callbacks.get(entry.target)?.(entry.isIntersecting);
        }
      },
      { root, rootMargin, threshold },
    );

    if (element) {
      callbacks.set(element, callback);
      observedElements.add(element);
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer?.unobserve(element);
        observedElements.delete(element);
        callbacks.delete(element);
      }
    };
  };

  const unobserve = (element?: Element | null) => {
    if (!element) return;

    observer?.unobserve(element);
    observedElements.delete(element);
    callbacks.delete(element);
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

function unrefElement(
  target: MaybeRef<MaybeElement> | MediaQueryList,
): EventTarget | undefined | null {
  const plain = unref(target as MaybeRef<MaybeElement>);
  return ((plain as ComponentPublicInstance)?.$el as HTMLElement) ?? plain;
}
