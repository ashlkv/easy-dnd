import { Vue } from "vue-property-decorator";
export declare class DnDEvent {
    type: any;
    data: any;
    top: Vue;
    previousTop: Vue;
    source: Vue;
    position: {
        x: any;
        y: any;
    };
    success: Boolean;
    native: TouchEvent | MouseEvent;
}
export declare class ReorderEvent extends DnDEvent {
    to: number;
    from: number;
    constructor(from: number, to: number, event?: DnDEvent);
    apply(array: any[]): void;
}
export declare class InsertEvent extends DnDEvent {
    type: any;
    data: any;
    index: number;
    constructor(type: any, data: any, index: number, event?: DnDEvent);
}
export declare class LeaveEvent extends DnDEvent {
    index: number;
    constructor(index: number, event?: DnDEvent);
}
