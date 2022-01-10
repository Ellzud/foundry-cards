/* --------------------------------------------------------------------------------
         This class can be copied from ready-to-use-cards module
   It handle basic CustomCard behavior and can be extends for additional features
-----------------------------------------------------------------------------------*/

export class CustomCardBase {

    constructor(card, guiClass) {
        this._card = card;
        this._guiClass = guiClass;
    }

    get card() {
        return this._card;
    }

    get cardData() {
        return this._card.data.data;
    }

    get id() {
        return this._card.data._id;
    }

    get name() {
        return this._card.data.name;
    }

    get img() {
        return this._card.img;
    }

    get givenToAPlayer() {
        const parent = this._card.parent;
        const owner = parent.getFlag('ready-to-use-cards','owner');
        if( !owner ) { return false; }
        return ! ['none', 'gm'].includes(owner);
    }

    get ownedByCurrentPlayer() {
        return this._card.parent.ownedByCurrentPlayer;
    }

    get detailsCanBeDisplayed() {
        
        if( this.card.isHome ) {
            return false;
        }

        if( this.ownedByCurrentPlayer ) {
            return true;
        }

        return this._card.parent.type == 'pile';
    }

    /**
     * May be overriden
     */
     get canBeRotated() {
        return true;
    }

    /**
     * May be overriden
     */
    shouldBeRotated( rotatingAsked ) {
        return this.canBeRotated && rotatingAsked;
    }

    /**
     * Will fill the div with whatever the cards wants
     * @param {HTMLElement} htmlDiv 
     */
    fillCardContent(htmlDiv) {
        // By default, card content only have its background. You can add additional content by overriding this method
        htmlDiv.classList.replace('display-content', this._guiClass);
    }

    /**
     * Used when lisiting cards inside chat message.
     * Those info will be added inside the listing-card template
     * @param {CustomCards} from : Where the card was previously
     * @param {boolean} addCardDescription : If description should be added for each card
     * @returns {object} Card data wich will be added to the listing-card-template
     */
    buildCardInfoForListing(from, addCardDescription=false) {

        const stackOwner = this.card.parent.stackOwner;
        const playerFlag = stackOwner.forPlayers ? stackOwner.playerId : 'gm';

        return {
            player: playerFlag,
            ref: this.card.name,
            icon: this.card.frontIcon,
            name: this.card.name,
            type: this.card.data.type,
            rotated: 0,
            description: []
        };
    }

    /**
     * Available actions when this card has been selected inside the main deck.
     * May be overriden
     * @param {boolean} detailsHaveBeenForced Normally, decks card are not visible. An action exist so that they become visible for gm.
     * @returns {CardActionData}  See constants.js
     */
    loadActionsWhileInDeck(detailsHaveBeenForced) {

        const actions = [];
        const def = game.modules.get('ready-to-use-cards').stacksDefinition;
        const cl = def.shared.actionCss;

        if( game.user.isGM ) { 
            actions.push({ 
                classes: cl.giveCard, 
                label: this.card.localizedLabel('sheet.actions.giveCard') 
            });
            actions.push({ 
                classes: cl.separator + ' ' + cl.discardCard, 
                label: this.card.localizedLabel('sheet.actions.discardCard') 
            });
        }

        if( detailsHaveBeenForced && this.canBeRotated ) {
            actions.push({ 
                classes: cl.separator + ' ' + cl.rotateCard, 
                label: this.card.localizedLabel('sheet.actions.rotateCard') 
            });
        }
        return actions;
    }

    /**
     * Available actions when this card has been selected inside a player hand
     * May be overriden
     * @param {boolean} stackOwnedByUser if this is the current user hand
     * @param {boolean} detailsHaveBeenForced Normally, decks card are not visible. An action exist so that they become visible for gm.
     * @returns {CardActionData}  See constants.js
     */
    loadActionsWhileInHand(stackOwnedByUser, detailsHaveBeenForced) {

        const actions = [];
        const def = game.modules.get('ready-to-use-cards').stacksDefinition;
        const cl = def.shared.actionCss;

        if( stackOwnedByUser ) {
            actions.push({ 
                classes: cl.playCard, 
                label: this.card.localizedLabel('sheet.actions.playCard') 
            });
            actions.push({ 
                classes: cl.revealCard, 
                label: this.card.localizedLabel('sheet.actions.revealCard') 
            });
            actions.push({ 
                classes: cl.separator + ' ' + cl.discardCard, 
                label: this.card.localizedLabel('sheet.actions.discardCard') 
            });
        }

        if( detailsHaveBeenForced && this.canBeRotated ) {
            actions.push({ 
                classes: cl.separator + ' ' + cl.rotateCard, 
                label: this.card.localizedLabel('sheet.actions.rotateCard') 
            });
        }
        return actions;
    }

    /**
     * Available actions when this card has been selected inside a player revealed cards
     * May be overriden
     * @param {boolean} stackOwnedByUser if this is the current user revealed cards
     * @returns {CardActionData}  See constants.js
     */
    loadActionsWhileInRevealedCards(stackOwnedByUser) {
        
        const actions = [];
        const def = game.modules.get('ready-to-use-cards').stacksDefinition;
        const cl = def.shared.actionCss;

        if( stackOwnedByUser ) {
            actions.push({ 
                classes: cl.playCard, 
                label: this.card.localizedLabel('sheet.actions.playCard') 
            });
            actions.push({ 
                classes: cl.backToHandCard, 
                label: this.card.localizedLabel('sheet.actions.backToHand') 
            });
            actions.push({ 
                classes: cl.separator + ' ' + cl.discardCard, 
                label: this.card.localizedLabel('sheet.actions.discardCard') 
            });
        }

        return actions;
    }

    /**
     * Available actions when this card has been selected inside the main discard.
     * May be overriden
     * @returns {CardActionData}  See constants.js
     */
     loadActionsWhileInDiscard() {
        const actions = [];
        const def = game.modules.get('ready-to-use-cards').stacksDefinition;
        const cl = def.shared.actionCss;

        if( this.canBeRotated ) {
            actions.push({ 
                classes: cl.separator + ' ' + cl.rotateCard, 
                label: this.card.localizedLabel('sheet.actions.rotateCard') 
            });
        }
    
        if( game.user.isGM ) { 
            actions.push({ 
                classes: cl.backToDeckCard, 
                label: this.card.localizedLabel('sheet.actions.backToDeck') 
            });
        }
        return actions;
    }

    /**
     * Triggered when CardActionsClasses.customAction is clicked
     * Shopuld be overriden. Do nothing in this implem
     * @param {string} action 
     */
    async onClickDoCustomAction(action) {
    }
}