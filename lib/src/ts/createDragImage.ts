/**
 * This files contains the primitives required to create drag images from HTML elements that serve as models. A snapshot
 * of the computed styles of the model elements is taken when creating the drag image, so that it will look the same as
 * the model, no matter where the drag images is grafted into the DOM.
 */

/**
 * Creates a drag image using the given element as model.
 */
export function createDragImage(el: HTMLElement): HTMLElement {
    let clone = deepClone(el);
    clone.style.position = 'fixed';
    clone.style.margin = '0';
    clone.style["z-index"] = '1000';
    clone.style.transition = 'opacity 0.2s';
    return clone;
}

/**
 * Clones the given element and all its descendants.
 */
function deepClone(el: HTMLElement): HTMLElement {
    let clone = el.cloneNode(true) as HTMLElement;
    copyStyle(el, clone);
    let vSrcElements = el.getElementsByTagName("*");
    let vDstElements = clone.getElementsByTagName("*");
    for (let i = vSrcElements.length; i--;) {
        let vSrcElement = vSrcElements[i] as HTMLElement;
        let vDstElement = vDstElements[i] as HTMLElement;
        copyStyle(vSrcElement, vDstElement);
    }
    return clone;
}

/**
 * Copy the computed styles from src to destination.
 */
function copyStyle(src: HTMLElement, destination: HTMLElement) {
    const computedStyle = window.getComputedStyle(src);
    for (const key of computedStyle) {
        destination.style.setProperty(key, computedStyle.getPropertyValue(key), computedStyle.getPropertyPriority(key))
    }
    destination.style.pointerEvents = 'none';
}
