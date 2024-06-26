<template>
    <component :is="rootTag" v-bind="rootProps" v-on="rootListeners" :class="clazz" :style="style">
        <template v-if="dropIn && dropAllowed">
            <template v-if="reordering">
                <template v-if="hasReorderingFeedback">
                    <slot name="item" v-for="(item, index) in itemsBeforeReorderingFeedback" :item="item"
                        :index="index" />
                    <slot name="reordering-feedback" :item="items[fromIndex]" :index="itemsBeforeReorderingFeedback.length - 1"/>
                    <slot name="item" v-for="(item, index) in itemsAfterReorderingFeedback" :item="item"
                        :index="itemsBeforeReorderingFeedback.length + index" />
                </template>
                <template v-else>
                    <slot name="item" v-for="(item, index) in reorderedItems" :item="item"
                        :index="index"
                        :reorder="index === closestIndex"/>
                </template>
            </template>
            <template v-else>
                <slot name="item" v-for="(item, index) in itemsBeforeFeedback" :item="item" :reorder="false"
                     :index="index"/>
                <slot name="feedback" :data="dragData" :type="dragType" :index="itemsBeforeFeedback.length - 1"/>
                <slot name="item" v-for="(item, index) in itemsAfterFeedback" :item="item" :reorder="false"
                     :index="itemsBeforeFeedback.length + index"/>
            </template>
        </template>
        <template v-else>
            <slot name="item" v-for="(item, index) in items" :item="item" :reorder="false" :index="index"/>
            <slot name="empty" v-if="items.length < 1" />
        </template>
        <drag-feedback class="__feedback" v-if="showDragFeedback" ref="feedback" key="drag-feedback">
            <slot name="feedback" :data="dragData" :type="dragType"/>
        </drag-feedback>
        <div class="__drag-image" v-if="showInsertingDragImage" ref="drag-image" key="inserting-drag-image">
            <slot name="drag-image" :type="dragType" :data="dragData" :index="itemsBeforeFeedback.length - 1"/>
        </div>
        <div class="__drag-image" v-if="showReorderingDragImage" ref="drag-image" key="reordering-drag-image">
            <slot name="reordering-drag-image" :item="items[fromIndex]" :index="itemsBeforeReorderingFeedback.length - 1" />
        </div>
        <slot />
    </component>
</template>

<script lang="ts">
import {Component, Prop} from "vue-property-decorator";
import DropMixin from "../mixins/DropMixin";
import DragFeedback from "./DragFeedback.vue";
import Grid from "../ts/Grid";
import {DnDEvent, InsertEvent, ReorderEvent, LeaveEvent} from "../ts/events";
import {createDragImage} from "../ts/createDragImage"
import {dnd} from "../ts/DnD";

@Component({
    components: {DragFeedback},
    inheritAttrs: false
})
export default class DropList extends DropMixin {

    @Prop({default: 'div', type: [String, Object, Function]})
    tag: any;

    @Prop()
    items: any[];

    @Prop({default: null})
    row: boolean;

    @Prop({default: null, type: Boolean})
    column: boolean;

    @Prop({default: false, type: Boolean})
    noAnimations: boolean;

    @Prop ({type: Number, default: undefined})
    scrollingEdgeSize: number;

    grid: Grid = null;
    forbiddenKeys = [];
    feedbackKey = null;
    fromIndex: number = null;

    get rootTag() {
        if (this.noAnimations) {
            return this.tag ? this.tag : 'div';
        } else {
            return "transition-group";
        }
    }

    get rootProps() {
        if (this.noAnimations) {
            return this.$attrs;
        } else {
            return {
                tag: this.tag,
                duration: {enter: 0, leave: 0},
                css: false
            }
        }
    }

    get rootListeners() {
        if (this.noAnimations) {
            return this.$listeners;
        } else {
            return {};
        }
    }

    created() {
        dnd.on("dragstart", this.onDragStart);
        dnd.on("dragend", this.onDragEnd);
    }

    get direction() {
        if (this.row && this.column) return 'both'
        if (this.row) return 'row';
        if (this.column) return 'column';
        return 'auto';
    }

    beforeDestroy() {
        dnd.off("dragstart", this.onDragStart);
        dnd.off("dragend", this.onDragEnd);
    }

    // Presence of feedback node in the DOM and of keys in the virtual DOM required => delayed until what
    // depends on drag data has been processed.
    refresh () {
      this.$nextTick(() => {
        this.grid = this.computeInsertingGrid();
        this.feedbackKey = this.computeFeedbackKey();
        this.forbiddenKeys = this.computeForbiddenKeys();
      });
    }

    onDragStart(event: DnDEvent) {
        if (this.candidate(dnd.type, dnd.data, dnd.source)) {
            if (this.reordering) {
                this.fromIndex = Array.prototype.indexOf.call(event.source.$el.parentElement.children, event.source.$el);
                this.grid = this.computeReorderingGrid();
            } else {
              this.refresh()
            }
        }
    }

    onDragEnd() {
        this.fromIndex = null;
        this.feedbackKey = null;
        this.forbiddenKeys = null;
        this.grid = null;
    }

    get reordering() {
        if (dnd.inProgress) {
            return dnd.source.$el.parentElement === this.$el && this.$listeners.hasOwnProperty('reorder');
        } else {
            return null;
        }
    }

    get closestIndex() {
        if (this.grid) {
            return this.grid.closestIndex(dnd.position);
        } else {
            return null;
        }
    }

    get dropAllowed() {
        if (this.dragInProgress) {
            if (this.reordering) {
                return this.items.length > 1;
            } else {
                let superDropAllowed = DropMixin['options'].computed.dropAllowed.get.call(this);
                if (!superDropAllowed) {
                    return false;
                } else {
                    if (this.forbiddenKeys !== null && this.feedbackKey !== null) {
                        return !this.forbiddenKeys.includes(this.feedbackKey)
                    } else {
                        return null;
                    }
                }
            }
        } else {
            return null;
        }
    }

    get itemsBeforeFeedback() {
        if (this.closestIndex === 0) {
            return [];
        } else {
            return this.items.slice(0, this.closestIndex);
        }
    }

    get itemsAfterFeedback() {
        if (this.closestIndex === this.items.length) {
            return [];
        } else {
            return this.items.slice(this.closestIndex);
        }
    }

    get itemsBeforeReorderingFeedback() {
        if (this.closestIndex <= this.fromIndex) {
            return this.items.slice(0, this.closestIndex);
        } else {
            return this.items.slice(0, this.closestIndex + 1);
        }
    }

    get itemsAfterReorderingFeedback() {
        if (this.closestIndex <= this.fromIndex) {
            return this.items.slice(this.closestIndex);
        } else {
            return this.items.slice(this.closestIndex + 1);
        }
    }

    get reorderedItems() {
        let toIndex = this.closestIndex;
        let reordered = [...this.items];
        let temp = reordered[this.fromIndex];
        reordered.splice(this.fromIndex, 1);
        reordered.splice(toIndex, 0, temp);
        return reordered;
    }

    get clazz() {
        return {
            'drop-list': true,
            'reordering': this.reordering === true,
            'inserting': this.reordering === false,
            ...(this.reordering === false ? this.cssClasses : {'dnd-drop': true})
        };
    }

    get style() {
        return {
            ...(this.reordering === false ? this.cssStyle : {})
        };
    }

    get showDragFeedback() {
        return this.dragInProgress && this.typeAllowed && !this.reordering;
    }

    get showInsertingDragImage() {
        return this.dragInProgress && this.typeAllowed && !this.reordering && this.$scopedSlots.hasOwnProperty("drag-image");
    }

    get showReorderingDragImage() {
        return this.dragInProgress && this.reordering && this.$scopedSlots.hasOwnProperty("reordering-drag-image");
    }


    doDrop(event: DnDEvent) {
        if (this.reordering) {
            if (this.fromIndex !== this.closestIndex) {
                this.$emit('reorder', new ReorderEvent(
                    this.fromIndex,
                    this.closestIndex,
                    event,
                ));
            } else {
                this.$emit('leave', new LeaveEvent(this.fromIndex, event));
            }
        } else {
            DropMixin['options'].methods.doDrop.call(this, event);
            this.$emit('insert', new InsertEvent(
                event.type,
                event.data,
                this.closestIndex,
                event,
            ));
        }
    }

    candidate(type, data, source): boolean {
        let superCandidate = DropMixin['options'].methods.candidate.call(this, ...arguments);
        return (superCandidate && (this.$listeners.hasOwnProperty("insert") || this.$listeners.hasOwnProperty("drop"))) || this.reordering;
    }

    computeForbiddenKeys() {
        let vnodes = this.noAnimations ? [] : this.$children[0].$vnode.context.$children[0].$slots.default;
        return vnodes
            .map(vn => vn.key)
            .filter(k => k !== undefined && k !== 'drag-image' && k !== 'drag-feedback');
    }

    computeFeedbackKey() {
        return this.$refs['feedback']['$slots']['default'][0]['key'];
    }

    get hasReorderingFeedback() {
        return this.$scopedSlots.hasOwnProperty("reordering-feedback");
    }

    computeInsertingGrid() {
        let feedbackParent = this.$refs['feedback']['$el'] as HTMLElement;
        let feedback = feedbackParent.children[0];
        let clone = feedback.cloneNode(true) as HTMLElement;
        let tg = this.$el as HTMLElement;
        if (tg.children.length > this.items.length) {
            tg.insertBefore(clone, tg.children[this.items.length]);
        } else {
            tg.appendChild(clone);
        }
        let grid = new Grid(tg.children, this.items.length, this.direction, null);
        tg.removeChild(clone);
        return grid;
    }

    computeReorderingGrid() {
        let tg = this.$el as HTMLElement;
        return new Grid(tg.children, this.items.length - 1, this.direction, this.fromIndex);
    }

    createDragImage() {
        let image;
        if (this.$refs['drag-image']) {
            let el = this.$refs['drag-image'] as HTMLElement;
            let model;
            if (el.childElementCount !== 1) {
                model = el;
            } else {
                model = el.children.item(0);
            }
            let clone = model.cloneNode(true) as HTMLElement;
            let tg = this.$el as HTMLElement;
            tg.appendChild(clone);
            image = createDragImage(clone);
            tg.removeChild(clone);
            image['__opacity'] = this.dragImageOpacity;
            image.classList.add('dnd-ghost')
        } else {
            image = 'source';
        }
      return image;
    }

}
</script>

<style scoped lang="scss">
.drop-list {
  &::v-deep > * {
    transition: transform .2s;
  }
}

.__feedback {
  display: none;
}

/* Places a drag image out of sight while keeping its computed styles accessibles. */
.__drag-image {
  position: fixed;
  top: -10000px;
  left: -10000px;
  will-change: left, top;
}

.drop-list:not(.drop-in) {
  &::v-deep .drag-source {
    // transition: none !important;
  }
}
</style>

<style lang="scss">
.drop-allowed.drop-in * {
  cursor: inherit !important;
}

.drop-forbidden.drop-in {
  &, * {
    cursor: no-drop !important;
  }
}
</style>
