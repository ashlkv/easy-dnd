import DropMixin from "../mixins/DropMixin";
import Grid from "../ts/Grid";
import { DnDEvent } from "../ts/events";
export default class DropList extends DropMixin {
    tag: any;
    items: any[];
    row: boolean;
    column: boolean;
    noAnimations: boolean;
    defaultSlotClass: any;
    grid: Grid;
    forbiddenKeys: any[];
    feedbackKey: any;
    fromIndex: number;
    get rootTag(): any;
    get rootProps(): Record<string, string> | {
        tag: any;
        duration: {
            enter: number;
            leave: number;
        };
        css: boolean;
    };
    get rootListeners(): Record<string, Function | Function[]>;
    created(): void;
    get direction(): "row" | "column" | "auto";
    destroyed(): void;
    refresh(): void;
    onDragStart(event: DnDEvent): void;
    onDragEnd(): void;
    get reordering(): boolean;
    get closestIndex(): number;
    get dropAllowed(): boolean;
    get itemsBeforeFeedback(): any[];
    get itemsAfterFeedback(): any[];
    get itemsBeforeReorderingFeedback(): any[];
    get itemsAfterReorderingFeedback(): any[];
    get reorderedItems(): any[];
    get clazz(): any;
    get style(): {};
    get showDragFeedback(): boolean;
    get showInsertingDragImage(): boolean;
    get showReorderingDragImage(): boolean;
    doDrop(event: DnDEvent): void;
    candidate(type: any, data: any, source: any): boolean;
    computeForbiddenKeys(): (string | number)[];
    computeFeedbackKey(): any;
    get hasReorderingFeedback(): boolean;
    computeInsertingGrid(): Grid;
    computeReorderingGrid(): Grid;
    createDragImage(): any;
}
