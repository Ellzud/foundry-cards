/* --------------------------------------------------------------------------------
         This class can be copied from ready-to-use-cards module
   It handle basic CustomCard behavior and can be extends for additional features
-----------------------------------------------------------------------------------*/

import { CustomCardStack } from "./CustomCardStack.js";
import { CARD_STACKS_DEFINITION } from "./StackDefinition.js";


export class CustomCardGUIWrapper {

    constructor(card) {
        this._card = card;
        this._custom = new CustomCardStack(card.source);
        this._currently = new CustomCardStack(card.parent);

        const coreKey = this._custom.coreStackRef;
        const cls = CARD_STACKS_DEFINITION.core[coreKey].cardClass;
        this._wrapped = new cls(card);
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
        // WARNING : this._card.name exists but change depending on the current card face.
        // Since we are not using the face system, directly take the base card name
        return this._card.data.name;
    }

    get img() {
        return this._card.img;
    }


    /**
     * Manage all faces with default values.
     * If settings says so, alos add the back as the last face
     */
    get allFaces() {

        if( !this._allFaces ) {
            this._allFaces = this._card.data.faces.map(f => {
                const data = {
                    name: f.name,
                    text: f.text,
                    img : f.img
                };
                if( !data.name || data.name == '' ) { data.name = this.name ?? ''; }
                if( !data.text || data.text == '' ) { data.text = this._card.data.description ?? ''; }
                if( !data.img  || data.img == '' ) { data.img = this._custom.frontDefaultImage; }
                return data;
            });
    
            const setting = this._custom.cardBackIsConsideredAsAFaceWhenLooping;
            if( setting ) {
                const back = {
                    name: this._card.data.back?.name,
                    text: this._card.data.back?.text,
                    img : this._card.data.back?.img
                };
                if( !back.name || back.name == '' ) { back.name = this.name ?? ''; }
                if( !back.text || back.text == '' ) { back.text = this._card.data.description ?? ''; }
                if( !back.img  || back.img == '' ) { back.img = this._custom.backDefaultImage; }
    
                this._allFaces.push(back);
            }
        }
        return this._allFaces;
    }

    /**
     * Return the current face for this card.
     * I chose to store face index in my flags instead of the data._source.face to keep usual card data without changes
     * Used flag : this._card.getFlag('ready-to-use-cards', 'currentFace')
     */
    get currentFace() {
        let faceIndex = this._card.getFlag('ready-to-use-cards', 'currentFace') ?? 0;
        const allFaces = this.allFaces;
        if( faceIndex >= allFaces.length ) { faceIndex = allFaces.length -1; }
        return allFaces[faceIndex];
    }

    /**
     * Loop through faces. When reaching the end, it goes back to the first one
     * @returns the current face after change
     */
    async nextFace() {
        let faceIndex = this._card.getFlag('ready-to-use-cards', 'currentFace') ?? 0;
        faceIndex++;

        const allFaces = this.allFaces;
        if( faceIndex >= allFaces.length ) { faceIndex = 0; }
        await this._card.setFlag('ready-to-use-cards', 'currentFace', faceIndex);
        return this.currentFace;
    }


    get ownedByCurrentPlayer() {
        return this._currently.ownedByCurrentPlayer;
    }

    get detailsCanBeDisplayed() {
        
        const cardType = this._currently.stack.type;
        const owner = this._currently.stackOwner;
        if( owner.forNobody ) {

            // Deck : Hidden to everybody
            if( cardType == 'deck' ) {
                return false;
            }
            
            // Discard : Visible only to those having enough rights
            if( cardType == 'pile' ) {
                return this._currently.stack.testUserPermission(game.user, "OBSERVER");
            }
        }

        // Hand and Revealed card of current player
        if( this.ownedByCurrentPlayer ) {
            return true;
        }

        // Card or Revealed cards of other players/GM
        return cardType == 'pile';
    }

    /**
     * May be overriden
     */
    shouldBeRotated( rotatingAsked ) {

        const def = game.modules.get('ready-to-use-cards').stacksDefinition;
        const keys = def.shared.configKeys;
        
        // Choose the right rotate conf key
        const stackOwner = this._currently.stackOwner;
        let configKey;
        if( stackOwner.forNobody ) {
            if( this.card.parent.type == 'deck' ) {
                configKey =  keys.fromDeckRotateCard;
            } else {
                configKey =  keys.fromDiscardRotateCard;
            }
        } else if( this.card.parent.type == 'hand' ) {
            configKey =  keys.fromHandRotateCard;
        } else {
            configKey =  keys.fromRevealedRotateCard;
        }

        const allowed = this._custom.stackConfig[configKey];
        const result = allowed && rotatingAsked;

        // Call the potential implementation inside wrapped impl
        if( this._wrapped.alterShouldBeRotated ) {
            return this._wrapped.alterShouldBeRotated(result, rotatingAsked);
        }
        return result;
    }

    /**
     * Will fill the div with whatever the cards wants
     * @param {HTMLElement} htmlDiv 
     */
    fillCardContent(htmlDiv) {

        const guiClass = this._wrapped.guiClass ?? 'basecard';
        // By default, card content only have its background. You can add additional content by overriding this method
        htmlDiv.classList.replace('display-content', guiClass);

        // Call the potential implementation inside wrapped impl
        if( this._wrapped.alterFillCardContent ) {
            this._wrapped.alterFillCardContent(htmlDiv);
        }
    }

    /**
     * Used when lisiting cards inside chat message.
     * Those info will be added inside the listing-card template
     * @param {CustomCardStack} from : Where the card was previously
     * @param {boolean} addCardDescription : If description should be added for each card
     * @returns {object} Card data wich will be added to the listing-card-template
     */
    buildCardInfoForListing(from, addCardDescription=false) {

        const stackOwner = this._currently.stackOwner;
        const playerFlag = stackOwner.forPlayers ? stackOwner.playerId : 'gm';

        const face = this.currentFace;
        const result = {
            player: playerFlag,
            ref: face.name,
            icon: this._custom.frontIcon,
            name: this._custom.localizedLabel(face.name),
            type: this._custom.coreStackRef,
            rotated: 0,
            description: []
        };

        if( addCardDescription && face.text != "" ) {
            const desc = this._custom.localizedLabel(face.text);
            if( desc != "" ) {
                result.description.push(desc);
            }
        }

        // Call the potential implementation inside wrapped impl
        if( this._wrapped.alterBuildCardInfoForListing ) {
            this._wrapped.alterBuildCardInfoForListing(result, from, addCardDescription);
        }
        return result;
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
        const css = def.shared.actionCss;

        const deckConfig = this._custom.stackConfig;
        const keys = def.shared.configKeys;
        const tools = def.shared.actionTools;

        const owner = this.card.parent.testUserPermission(game.user, "OWNER");

        if( detailsHaveBeenForced ) {
            if( owner && this.allFaces.length > 1 ) { // Need edit rights for this action
                tools.addAvailableAction(actions, deckConfig, this._custom, css.loopFaces, 'sheet.actions.loopFaces', {allKeys:[keys.fromDeckLoopThroughFaces]});
            }
            tools.addAvailableAction(actions, deckConfig, this._custom, css.rotateCard, 'sheet.actions.rotateCard', {allKeys:[keys.fromDeckRotateCard]} );
            tools.addCssOnLastAction(actions, css.separator);
        }

        if( owner ) {
            tools.addAvailableAction(actions, deckConfig, this._custom, css.giveCard, 'sheet.actions.giveCard', {atLeastOne:[keys.fromDeckDealCardsToHand ,keys.fromDeckDealRevealedCards]} );
            tools.addAvailableAction(actions, deckConfig, this._custom, css.discardCard, 'sheet.actions.discardCard', {allKeys:[keys.fromDeckDiscardDirectly]} );
            tools.addCssOnLastAction(actions, css.separator);
        }

        // Call the potential implementation inside wrapped impl
        if( this._wrapped.alterLoadActionsWhileInDeck ) {
            this._wrapped.alterLoadActionsWhileInDeck(actions, detailsHaveBeenForced);
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
        const css = def.shared.actionCss;

        const deckConfig = this._custom.stackConfig;
        const keys = def.shared.configKeys;
        const tools = def.shared.actionTools;

        const cardsAreVisible = detailsHaveBeenForced || stackOwnedByUser;
        if( cardsAreVisible ) {
            if( this.allFaces.length > 1 ) {
                tools.addAvailableAction(actions, deckConfig, this._custom, css.loopFaces, 'sheet.actions.loopFaces', {allKeys:[keys.fromHandLoopThroughFaces]});
            }
            tools.addAvailableAction(actions, deckConfig, this._custom, css.rotateCard, 'sheet.actions.rotateCard', {allKeys:[keys.fromHandRotateCard]});
            tools.addCssOnLastAction(actions, css.separator);
        }

        if( stackOwnedByUser ) {
            tools.addAvailableAction(actions, deckConfig, this._custom, css.playCard, 'sheet.actions.playCard', {allKeys:[keys.fromHandPlayCard]} );
            tools.addAvailableAction(actions, deckConfig, this._custom, css.playMultiple, 'sheet.actions.playMultiple', {allKeys:[keys.fromHandPlayMultiple]} );
            tools.addAvailableAction(actions, deckConfig, this._custom, css.revealCard, 'sheet.actions.revealCard', {allKeys:[keys.fromHandRevealCard]});
            tools.addAvailableAction(actions, deckConfig, this._custom, css.exchangeCard, 'sheet.actions.exchangeCard', {allKeys:[keys.fromHandExchangeCard]});
            tools.addAvailableAction(actions, deckConfig, this._custom, css.exchangePlayer, 'sheet.actions.exchangePlayer', {allKeys:[keys.fromHandExchangeWithPlayer]});
            tools.addAvailableAction(actions, deckConfig, this._custom, css.discardCard, 'sheet.actions.discardCard', {allKeys:[keys.fromHandDiscardCard]});
            tools.addCssOnLastAction(actions, css.separator);
        }

        // Call the potential implementation inside wrapped impl
        if( this._wrapped.alterLoadActionsWhileInHand ) {
            this._wrapped.alterLoadActionsWhileInHand(actions, stackOwnedByUser, detailsHaveBeenForced);
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
        const css = def.shared.actionCss;

        const deckConfig = this._custom.stackConfig;
        const keys = def.shared.configKeys;
        const tools = def.shared.actionTools;

        if( stackOwnedByUser && this.allFaces.length > 1 ) {
            tools.addAvailableAction(actions, deckConfig, this._custom, css.loopFaces, 'sheet.actions.loopFaces', {allKeys:[keys.fromRevealedLoopThroughFaces]});
        }
        tools.addAvailableAction(actions, deckConfig, this._custom, css.rotateCard, 'sheet.actions.rotateCard', {allKeys:[keys.fromRevealedRotateCard]});
        tools.addCssOnLastAction(actions, css.separator);

        if( stackOwnedByUser ) {
            tools.addAvailableAction(actions, deckConfig, this._custom, css.playCard, 'sheet.actions.playCard', {allKeys:[keys.fromRevealedPlayCard]} );
            tools.addAvailableAction(actions, deckConfig, this._custom, css.playMultiple, 'sheet.actions.playMultiple', {allKeys:[keys.fromRevealedPlayMultiple]} );
            tools.addAvailableAction(actions, deckConfig, this._custom, css.backToHandCard, 'sheet.actions.backToHand', {allKeys:[keys.fromRevealedBackToHand]});
            tools.addAvailableAction(actions, deckConfig, this._custom, css.exchangeCard, 'sheet.actions.exchangeCard', {allKeys:[keys.fromRevealedExchangeCard]});
            tools.addAvailableAction(actions, deckConfig, this._custom, css.exchangePlayer, 'sheet.actions.exchangePlayer', {allKeys:[keys.fromRevealedExchangeWithPlayer]});
            tools.addAvailableAction(actions, deckConfig, this._custom, css.discardCard, 'sheet.actions.discardCard', {allKeys:[keys.fromRevealedDiscardCard]});
            tools.addCssOnLastAction(actions, css.separator);
        }

        // Call the potential implementation inside wrapped impl
        if( this._wrapped.alterLoadActionsWhileInRevealedCards ) {
            this._wrapped.alterLoadActionsWhileInRevealedCards(actions, stackOwnedByUser);
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
        const css = def.shared.actionCss;

        const deckConfig = this._custom.stackConfig;
        const keys = def.shared.configKeys;
        const tools = def.shared.actionTools;

        const owner = this.card.parent.testUserPermission(game.user, "OWNER");
        const observer = this.card.parent.testUserPermission(game.user, "OBSERVER");

        if( owner && this.allFaces.length > 1 ) {
            tools.addAvailableAction(actions, deckConfig, this._custom, css.loopFaces, 'sheet.actions.loopFaces', {allKeys:[keys.fromDiscardLoopThroughFaces]});
        }
        if( observer ) {
            tools.addAvailableAction(actions, deckConfig, this._custom, css.rotateCard, 'sheet.actions.rotateCard', {allKeys:[keys.fromDiscardRotateCard]});
        }
        tools.addCssOnLastAction(actions, css.separator);
    

        if( this.card.parent.testUserPermission(game.user, "OWNER") ) {
            tools.addAvailableAction(actions, deckConfig, this._custom, css.backToDeckCard, 'sheet.actions.backToDeck', {allKeys:[keys.fromDiscardBackToDeck]});
            tools.addCssOnLastAction(actions, css.separator);
        }

        // Call the potential implementation inside wrapped impl
        if( this._wrapped.alterLoadActionsWhileInDiscard ) {
            this._wrapped.alterLoadActionsWhileInDiscard(actions);
        }

        return actions;
    }

    /**
     * Triggered when CardActionsClasses.customAction is clicked
     * Shopuld be overriden. Do nothing in this implem
     * @param {string} action 
     */
    async onClickDoCustomAction(action) {
        if( this._wrapped.onClickDoCustomAction ) {
            return this._wrapped.onClickDoCustomAction(action);
        }
    }
}