import { CustomCardGUIWrapper } from './CustomCardGUIWrapper.js';
import { SingleCardDisplay } from './SingleCardDisplay.js';
import { CARD_STACKS_DEFINITION } from './StackDefinition.js';

export class CustomCard extends Card {

    constructor(...args) {
        super(...args);
    }

    get backIcon() {
        return this.source.backIcon;
    }

    get frontIcon() {
        return this.source.frontIcon;
    }

    /**
     * Shortcut for cards same function
     */
    localizedLabel(labelPath, {alternativeCoreKey=null}={}) {
        return this.source.localizedLabel(labelPath);
    }

    /**
     * Current card impl depending on its type.
     * See SimpleCard for a classic implementation
     */
    get impl() {
        if( !this._impl ) {
            const coreRef = this.source.coreStackRef;
            const cls = CARD_STACKS_DEFINITION.core[coreRef].cardClass;
            this._impl = new cls(this);
        }
        return this._impl;
    }

    get forGUI() {
        return new CustomCardGUIWrapper(this);
    }

    /**
     * @override
     */
    get sheet() {
        if( !this.source.handledByModule ) { return super.sheet; }
        return new SingleCardDisplay(this, defaultSheet.options);
    }
}
