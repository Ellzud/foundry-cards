/* -------------------------------------------- */
/*   Type Definitions                           */
/* -------------------------------------------- */

/**
 * @typedef {Object} CardActionData Necessary data to create an action inside the rendered template
 * @property {string} classes         Will be added as css class. Can contain multiple ones. See CardActionsClasses
 * @property {string} label           The action label.
 * @property {number} action          Optional. Will be added inside action div as data-action. Can then be retrieved when performing the action
 * 
 * The action mapping will be done via the classes and not the action parameter.
 * A custom class is mapped named 'custom-action'.
 * When called, it will trigger this.currentSelection.onClickDoCustomAction(action)
 */

 export const CardActionsClasses = {
    separator: 'separator', // If added, it will add a bottom margin before displaying the next one.
    coloredInRed: 'red',    // If added, the frame will be red when hovering it
    backToDeckCard: 'back-to-deck',
    backToHandCard: 'back-to-hand',
    drawCard: 'draw-card',
    exchangeCard: 'exchange-card',
    discardCard: 'discard-card',
    giveCard: 'give-card',
    playCard: 'play-card',
    playMultiple: 'play-multiple',
    revealCard: 'reveal-card',
    rotateCard: 'rotate-card',
    dealCards: 'deal-cards',
    recallCards: 'recall-cards',
    peekOnDeck: 'peek-on-deck',
    shuffleDeck: 'shuffle-deck',
    shuffleDiscard: 'shuffle-discard',
    discardHand: 'discard-hand',
    discardRevealedCards: 'discard-revealed-cards',
    customAction: 'custom-action'
};



/**
 * Config stored for core stack definition.
 */
export const StackConfiguration = {
    fromDeckPeekOn: 'fromDeckPeekOn',
    fromDeckDealCardsToHand: 'fromDeckDealCardsToHand',
    fromDeckDealRevealedCards: 'fromDeckDealRevealedCards',
    fromDeckDiscardDirectly: 'fromDeckDiscardDirectly',
    fromDeckResetAll: 'fromDeckResetAll',
    fromDeckShuffleRemainingCards: 'fromDeckShuffleRemainingCards',
    fromDeckRotateCard: 'fromDeckRotateCard',
    fromHandDrawCard: 'fromHandDrawCard',
    fromHandPlayCard: 'fromHandPlayCard',
    fromHandPlayMultiple: 'fromHandPlayMultiple',
    fromRevealedPlayMultiple: 'fromRevealedPlayMultiple',
    fromHandRevealCard: 'fromHandRevealCard',
    fromHandExchangeCard: 'fromHandExchangeCard',
    fromHandDiscardCard: 'fromHandDiscardCard',
    fromHandRotateCard: 'fromHandRotateCard',
    fromRevealedDrawCard: 'fromRevealedDrawCard',
    fromRevealedPlayCard: 'fromRevealedPlayCard',
    fromRevealedBackToHand: 'fromRevealedBackToHand',
    fromRevealedDiscardCard: 'fromRevealedDiscardCard', 
    fromRevealedRotateCard: 'fromRevealedRotateCard',
    fromDiscardBackToDeck: 'fromDiscardBackToDeck',
    fromDiscardRotateCard: 'fromDiscardRotateCard',
    fromDiscardResetAll: 'fromDiscardResetAll'
};

/**
 * Configuration which is not link to a specific core stack
 */
export const GlobalConfiguration = {
    gmName: 'gmName',
    gmIcon: 'gmIcon',
    everyHandsPeekOn: 'everyHandsPeekOn',
    everyHandsDiscardAll: 'everyHandsDiscardAll',
    everyRevealedDiscardAll : 'everyRevealedDiscardAll',
    shortcuts: 'shortcuts',
    stacks: 'stacks',
    stackForPlayerHand: 'stackForPlayerHand',
    stackForPlayerRevealedCards: 'stackForPlayerRevealedCards',
    invasiveCode: 'invasiveCode'
};

export const DEFAULT_SHORTCUT_SETTINGS = {
    hands: {
        displayed: true,
        scale: 0.1,
        left: 800,
        bottom: 110, 
        maxPerLine: 5,
        icon: 'modules/ready-to-use-cards/resources/hands-icon.webp'
    },
    revealed: {
        displayed: true,
        scale: 0.1,
        left: 800,
        bottom: 8,
        maxPerLine: 5,
        icon: 'modules/ready-to-use-cards/resources/revealed-icon.webp'
    }
};
