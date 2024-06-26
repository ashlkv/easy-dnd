export default class Grid {

    reference: HTMLElement;
    referenceOriginalPosition: { x, y };
    magnets: { x, y }[] = [];
    direction: 'row' | 'column' | 'both' | 'auto';

    constructor(collection: HTMLCollection, upToIndex: number, direction: 'row' | 'column' | 'both' | 'auto', fromIndex: number) {
        this.reference = collection.item(0).parentNode as HTMLElement;
        this.referenceOriginalPosition = {
            x: this.reference.getBoundingClientRect().left - this.reference.scrollLeft,
            y: this.reference.getBoundingClientRect().top - this.reference.scrollTop,
        };
        if (direction === 'auto') {
            // Auto mode not supported for now. Row or column must be defined explicitly if there are nested drop lists.
            throw new Error("Easy-DnD error : a drop list is missing one of these attributes : 'row' or 'column'.");
        }
        this.direction = direction;
        const isHorizontal = direction === 'row';
        let index = 0;
        for (let child of collection) {
            if (index > upToIndex) break;
            let rect = child.getBoundingClientRect();
            let hasNestedDrop = child.classList.contains("dnd-drop") || child.getElementsByClassName("dnd-drop").length > 0;
            if (fromIndex === null) {
                // Inserting mode.
                this.magnets.push(hasNestedDrop ? this.before(rect, isHorizontal) : this.center(rect));
            } else {
                // Reordering mode.
                this.magnets.push(hasNestedDrop ? (
                    fromIndex < index ? this.after : this.before
                )(rect, isHorizontal) : this.center(rect));
            }
            // Debug : show magnets :
            //document.body.insertAdjacentHTML("beforeend", "<div style='background-color: red; position: fixed; width: 1px; height: 1px; top:" + this.magnets[index].y + "px; left:" + this.magnets[index].x + "px;' ></div>")
            index++;
        }
    }

    /**
     * Returns the center of the rectangle.
     */
    center(rect: DOMRect) {
        return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
    }

    /**
     * When horizontal is true / false, returns middle of the left / top side of the rectangle.
     */
    before(rect: DOMRect, horizontal: boolean) {
        return horizontal ? {
            x: rect.left,
            y: rect.top + rect.height / 2
        } : {
            x: rect.left + rect.width / 2,
            y: rect.top
        };
    }

    /**
     * When horizontal is true / false, returns middle of the right / bottom side of the rectangle.
     */
    after(rect: DOMRect, horizontal: boolean) {
        return horizontal ? {
            x: rect.left + rect.width,
            y: rect.top + rect.height / 2
        } : {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height
        };
    }

    /**
     * In case the user scrolls during the drag, the position of the magnets are not what they used to be when the drag
     * started. A correction must be applied that takes into account the amount of scroll. This correction is the
     * difference between the current position of the parent element and its position when the drag started.
     */
    correction(): { x, y } {
        return {
            x: this.reference.getBoundingClientRect().left  - this.reference.scrollLeft - this.referenceOriginalPosition.x,
            y: this.reference.getBoundingClientRect().top - this.reference.scrollTop - this.referenceOriginalPosition.y,
        };
    }

    closestIndex(position: { x, y }) {
        let x = position.x - this.correction().x;
        let y = position.y - this.correction().y;
        let minDist = 999999;
        let index = -1;
        const isHorizontal = this.direction === 'row';
        const is2d = this.direction === 'both';
        for (let i = 0; i < this.magnets.length; i++) {
            let magnet = this.magnets[i];
            let dist = is2d
                ? Math.sqrt(Math.pow(magnet.x - x, 2) + Math.pow(magnet.y - y, 2))
                : isHorizontal ? Math.abs(magnet.x - x) : Math.abs(magnet.y - y);
            if (dist < minDist) {
                minDist = dist;
                index = i;
            }
        }
        return index;
    }

}
