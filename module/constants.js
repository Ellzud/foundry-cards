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
    exchangePlayer: 'exchange-player',
    discardCard: 'discard-card',
    giveCard: 'give-card',
    loopFaces : 'loop-faces',
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
    fromDeckDealCardsToHand: 'fromDeckDealCardsToHand',//
    fromDeckDealRevealedCards: 'fromDeckDealRevealedCards',//
    fromDeckDiscardDirectly: 'fromDeckDiscardDirectly',//
    fromDeckResetAll: 'fromDeckResetAll',
    fromDeckShuffleRemainingCards: 'fromDeckShuffleRemainingCards',
    fromDeckLoopThroughFaces: 'fromDeckLoopThroughFaces',
    fromDeckRotateCard: 'fromDeckRotateCard',
    fromHandDrawCard: 'fromHandDrawCard',
    fromHandPlayCard: 'fromHandPlayCard',//
    fromHandPlayMultiple: 'fromHandPlayMultiple',
    fromHandRevealCard: 'fromHandRevealCard',//
    fromHandExchangeCard: 'fromHandExchangeCard',//
    fromHandExchangeWithPlayer: 'fromHandExchangeWithPlayer',//
    fromHandDiscardCard: 'fromHandDiscardCard',//
    fromHandRotateCard: 'fromHandRotateCard',
    fromHandLoopThroughFaces: 'fromHandLoopThroughFaces',
    fromRevealedDrawCard: 'fromRevealedDrawCard',
    fromRevealedPlayCard: 'fromRevealedPlayCard',//
    fromRevealedPlayMultiple: 'fromRevealedPlayMultiple',
    fromRevealedBackToHand: 'fromRevealedBackToHand',//
    fromRevealedDiscardCard: 'fromRevealedDiscardCard', //
    fromRevealedRotateCard: 'fromRevealedRotateCard',
    fromRevealedLoopThroughFaces: 'fromRevealedLoopThroughFaces',
    fromRevealedExchangeCard: 'fromRevealedExchangeCard',//
    fromRevealedExchangeWithPlayer: 'fromRevealedExchangeWithPlayer',//
    fromDiscardBackToDeck: 'fromDiscardBackToDeck',//
    fromDiscardRotateCard: 'fromDiscardRotateCard',
    fromDiscardLoopThroughFaces: 'fromDiscardLoopThroughFaces',
    fromDiscardResetAll: 'fromDiscardResetAll'
};

/**
 * All target possibilities.
 * Values are also used inside a css grid (Source x Target)
 */
export const StackTargetPossibilities = {
    DE: 'DE', // DEck
    DI: 'DI', // DIscard
    GH: 'GH', // Gm Hand
    GR: 'GR', // Gm Revelead cards
    PH: 'PH', // Player Hand
    PR: 'PR' // Player Revelead cards
}

/**
 * All target possibilities.
 * Values are also used inside a css grid (Source x Target)
 */
 export const StackActionTypes = {
    deckUsage: {
        labelKey: 'Available actions directly on deck'
    },
    selectedCard: {
        labelKey: 'Available actions on a selected card'
    }
}


export const StackConfigurationGroup = {
    dealCard: {
        labelKey: 'Deal a card',
        actionType: 'deckUsage',
        grid : {
            css: 'deck-only',
            targets: ['DE'],
            fromLabel: 'To',
            targetLabel: 'From'
        },
        available: [
            { from: 'GH', target: 'DE', nameKey: 'Deal a card' },
            { from: 'GR', target: 'DE', nameKey: 'Deal a card' },
            { from: 'PH', target: 'DE', nameKey: 'Deal a card' },
            { from: 'PR', target: 'DE', nameKey: 'Deal a card' }
        ]
    },
    drawCard: {
        labelKey: 'Draw a card',
        actionType: 'deckUsage',
        grid : {
            css: 'deck-only',
            targets: ['DE'],
            fromLabel: 'Drawer',
            targetLabel: 'From'
        },
        available: [
            { from: 'GH', target: 'DE', nameKey: 'Draw a card' },
            { from: 'GR', target: 'DE', nameKey: 'Draw a card' },
            { from: 'PH', target: 'DE', nameKey: 'Draw a card' },
            { from: 'PR', target: 'DE', nameKey: 'Draw a card' }
        ]
    },
    playCard: {
        labelKey: 'Play a card (card effect is applied)',
        actionType: 'selectedCard',
        grid : {
            css: 'discard-only',
            targets: ['DI']
        },
        available: [
            { from: 'GH', target: 'DI', nameKey: 'Play a card' },
            { from: 'GR', target: 'DI', nameKey: 'Play a card' },
            { from: 'PH', target: 'DI', nameKey: 'Play a card' },
            { from: 'PR', target: 'DI', nameKey: 'Play a card' }
        ]
    },
    moveCard: {
        labelKey: 'Move a card through stacks (card effect isn\'t applied)',
        actionType: 'selectedCard',
        grid : {
            css: 'all-targets',
            targets: ['DE', 'DI', 'GH', 'GR', 'PH', 'PR']
        },
        available: [
            { from: 'DE', target: 'GH', nameKey: 'Deal a card' },
            { from: 'DE', target: 'GR', nameKey: 'Deal a card' },
            { from: 'DE', target: 'PH', nameKey: 'Deal a card' },
            { from: 'DE', target: 'PR', nameKey: 'Deal a card' },
            { from: 'DE', target: 'DI', nameKey: 'Discard a card' },
            
            { from: 'GH', target: 'PH', nameKey: 'Give a card' },
            { from: 'GH', target: 'PR', nameKey: 'Give a card' },
            { from: 'GH', target: 'DI', nameKey: 'Discard a card' },
            { from: 'GH', target: 'GR', nameKey: 'Reveal a card' },

            { from: 'GR', target: 'PH', nameKey: 'Give a card' },
            { from: 'GR', target: 'PR', nameKey: 'Give a card' },
            { from: 'GR', target: 'DI', nameKey: 'Discard a card' },
            { from: 'GR', target: 'GH', nameKey: 'Back to hand' },
            
            { from: 'PH', target: 'GH', nameKey: 'Give a card' },
            { from: 'PH', target: 'GR', nameKey: 'Give a card' },
            { from: 'PH', target: 'DI', nameKey: 'Discard a card' },
            { from: 'PH', target: 'PR', nameKey: 'Reveal a card' },

            { from: 'PR', target: 'GH', nameKey: 'Give a card' },
            { from: 'PR', target: 'GR', nameKey: 'Give a card' },
            { from: 'PR', target: 'DI', nameKey: 'Discard a card' },
            { from: 'PR', target: 'PH', nameKey: 'Back to hand' },

            { from: 'DI', target: 'DE', nameKey: 'Back to deck' }
        ]
    },
    exchangeCard: {
        labelKey: 'Exchange a card with another user',
        actionType: 'selectedCard',
        grid : {
            css: 'no-deck',
            targets: ['DI', 'GH', 'GR', 'PH', 'PR']
        },
        available: [
            { from: 'GH', target: 'PH', nameKey: 'Exchange with player' },
            { from: 'GH', target: 'PR', nameKey: 'Exchange with player' },
            { from: 'GH', target: 'DI', nameKey: 'Exchange with discard' },

            { from: 'GR', target: 'PH', nameKey: 'Exchange with player' },
            { from: 'GR', target: 'PR', nameKey: 'Exchange with player' },
            { from: 'GR', target: 'DI', nameKey: 'Exchange with discard' },

            { from: 'PH', target: 'GH', nameKey: 'Exchange with gm' },
            { from: 'PH', target: 'GR', nameKey: 'Exchange with gm' },
            { from: 'PH', target: 'DI', nameKey: 'Exchange with discard' },
            { from: 'PH', target: 'PH', nameKey: 'Exchange with another player' },
            { from: 'PH', target: 'PR', nameKey: 'Exchange with another player' },

            { from: 'PR', target: 'GH', nameKey: 'Exchange with gm' },
            { from: 'PR', target: 'GR', nameKey: 'Exchange with gm' },
            { from: 'PR', target: 'DI', nameKey: 'Exchange with discard' },
            { from: 'PR', target: 'PH', nameKey: 'Exchange with another player' },
            { from: 'PR', target: 'PR', nameKey: 'Exchange with another player' },
        ]
    },
    swapCards: {
        labelKey: 'Swap cards between a user two stacks',
        actionType: 'selectedCard',
        grid : {
            css: 'user-only',
            targets: ['GH', 'GR', 'PH', 'PR']
        },
        available: [
            { from: 'GH', target: 'GR', nameKey: 'Swap with a revealed card' },
            { from: 'GR', target: 'GH', nameKey: 'Swap with a card in hand' },

            { from: 'PH', target: 'PR', nameKey: 'Swap with a revealed card' },
            { from: 'PR', target: 'PH', nameKey: 'Swap with a card in hand' },
        ]
    },
    flipCard: {
        labelKey: 'Loop through card faces',
        actionType: 'selectedCard',
        grid : {
            css: 'no-target',
            targets: ['DE', 'DI', 'GH', 'GR', 'PH', 'PR']
        },
        available: [
            { from: 'GH', target: 'GH', nameKey: 'Flip a card' },
            { from: 'GR', target: 'GR', nameKey: 'Flip a card' },
            { from: 'PH', target: 'PH', nameKey: 'Flip a card' },
            { from: 'PR', target: 'PR', nameKey: 'Flip a card' }
        ]
    },
    rotateCard: {
        labelKey: 'Rotate card',
        actionType: 'selectedCard',
        grid : {
            css: 'no-target',
            targets: ['DE', 'DI', 'GH', 'GR', 'PH', 'PR']
        },
        available: [
            { from: 'GH', target: 'GH', nameKey: 'Rotate a card' },
            { from: 'GR', target: 'GR', nameKey: 'Rotate a card' },
            { from: 'PH', target: 'PH', nameKey: 'Rotate a card' },
            { from: 'PR', target: 'PR', nameKey: 'Rotate a card' }
        ]
    },

}

/**
 * Other parameters for each deck, outside available action configuration
 */
export const DeckParameters = {
	overrideConf : 'overrideConf',
	labelBaseKey: 'labelBaseKey',
	resourceBaseDir: 'resourceBaseDir',
    removeBackFace: 'removeBackFace',
}

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
    smallDisplay: 'smallDisplay',
    stacks: 'stacks',
    filter: 'filter',
    backs: 'backs',
    stackForPlayerHand: 'stackForPlayerHand',
    stackForPlayerRevealedCards: 'stackForPlayerRevealedCards'
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
