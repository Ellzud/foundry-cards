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


    get forGUI() {
        return new CustomCardGUIWrapper(this);
    }


    get ownedByCurrentPlayer() {
        return this._currently.ownedByCurrentPlayer;
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

        const result = {
            player: playerFlag,
            ref: this.name,
            icon: this._custom.frontIcon,
            name: this.name,
            type: this._custom.coreStackRef,
            rotated: 0,
            description: []
        };

        if( addCardDescription && this._card.data.description ) {
            result.description.push(this._card.data.description);
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

        if( detailsHaveBeenForced ) {
            tools.addAvailableAction(actions, deckConfig, this._custom, css.rotateCard, 'sheet.actions.rotateCard', {allKeys:[keys.fromDeckRotateCard]} );
            tools.addCssOnLastAction(actions, css.separator);
        }

        if( game.user.isGM ) { 
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

        if( game.user.isGM ) { 
            tools.addAvailableAction(actions, deckConfig, this._custom, css.backToDeckCard, 'sheet.actions.backToDeck', {allKeys:[keys.fromDiscardBackToDeck]});
            tools.addCssOnLastAction(actions, css.separator);
        }

        tools.addAvailableAction(actions, deckConfig, this._custom, css.rotateCard, 'sheet.actions.rotateCard', {allKeys:[keys.fromDiscardRotateCard]});
        tools.addCssOnLastAction(actions, css.separator);
    
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