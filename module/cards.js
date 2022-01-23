import { CustomCardsDisplay } from "./CardsDisplay.js";
import { CustomCardStack } from "./CustomCardStack.js";

export class CustomCards extends Cards {

    /**
     * CustomCards will delegate custom actions to CustomCardStack
     * @returns {CustomCardStack}
     */
    get delegateTo() {
        if( !this._delegateTo ) {
            this._delegateTo = new CustomCardStack(this);
        }
        return this._delegateTo;
    }

    /**
     * For cards handled by module, GUI is always CustomCardsDisplay
     * Other stacks still can use other GUI
     * @override
     */
     get sheet() {
        if(!this.delegateTo.handledByModule) {
            return super.sheet;
        }

        if ( !this._customSheet ) {
            this._customSheet = new CustomCardsDisplay(this, {editable: this.isOwner});
        }        
        return this._customSheet;
    }

    /* -------------------------------------------- 
      Capture cards movements and trigger custom hook
    /* -------------------------------------------- */

    /** @override */
    _onUpdate(data, options, userId) {
        super._onUpdate(data, options, userId);
        Hooks.call('updateCustomCardsContent', this, options, userId); // FIXME Need to move it inside CustomCardStack
    }

    /** @override */
    _onCreateEmbeddedDocuments(embeddedName, documents, result, options, userId) {
        super._onCreateEmbeddedDocuments(embeddedName, documents, result, options, userId);
        Hooks.call('updateCustomCardsContent', this, options, userId);
    }

    /** @override */
    _onUpdateEmbeddedDocuments(embeddedName, documents, result, options, userId) {
        super._onUpdateEmbeddedDocuments(embeddedName, documents, result, options, userId);
        Hooks.call('updateCustomCardsContent', this, options, userId);
    }

    /** @override */
    _onDeleteEmbeddedDocuments(embeddedName, documents, result, options, userId) {
        super._onDeleteEmbeddedDocuments(embeddedName, documents, result, options, userId);
        Hooks.call('updateCustomCardsContent', this, options, userId);
    }
}

