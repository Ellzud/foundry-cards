import { CustomCardsDisplay } from './CardsDisplay.js';


export class SingleCardDisplay extends CustomCardsDisplay {
    constructor(card) {
        super(card.parent, card.sheet.options);
        this._currentSelection = card;

        // See if the listing is allowed :
        const owner = this._cards.getFlag('ready-to-use-cards', 'owner');
        if( game.user.isGM ) { 
            this._listingAllowed = (owner == 'gm') || card.parent.type == 'pile';
        } else { 
            this._listingAllowed = owner === game.user.id; 
        }
    }

    /** @override */
    get listingAllowed() {
        return this._listingAllowed;
    }

    /** @override */
    get detailsForced() {
        return true;
    }
}
