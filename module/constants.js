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
        labelKey: 'Actions on deck piles'
    },
    discardUsage: {
        labelKey: 'Actions on discard piles'
    },
    selectedCard: {
        labelKey: 'Actions after selecting a card'
    },
    other: {
        labelKey: 'Other actions'
    }
}


export const StackConfigurationGroup = {
    peekOnCards: {
        labelKey: 'Peeks on cards',
        descKey: 'By default, deck cards are not visible, only back is displayed. This is also the case for other player hands. Those options allow GM to peek on those cards. (A message will let everyone know he is doing it).',
        actionType: 'other',
        grid : {
            css: 'no-target',
            targets: ['DE', 'DI', 'GH', 'GR', 'PH', 'PR'],
            fromLabel: 'Peeking on',
            targetLabel: 'Only GMs'
        },
        available: [
            { from: 'DE', target: 'DE', nameKey: 'Peek on cards' },
            { from: 'PH', target: 'PH', nameKey: 'Peek on cards' }
        ]
    },
    dealCard: {
        labelKey: 'Deal a card',
        descKey: 'GM can give card to users when manipulating the deck. Action is available via the deck stack, on left side',
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
    drawDeckCard: {
        labelKey: 'Draw the top cards',
        descKey: 'Users can draw cards themself. Action is available via the user stacks, on left side',
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
    shuffleDeck: {
        labelKey: 'Shuffle the deck',
        descKey: 'GM can shuffle the remaining cards of the deck. Action is available via the deck stack, on left side',
        actionType: 'deckUsage',
        grid : {
            css: 'alone',
            targets: ['DE']
        },
        available: [
            { from: 'DE', target: 'DE', nameKey: 'Shuffle the deck' }
        ]
    },
    resetDeck: {
        labelKey: 'Reset the deck',
        descKey: 'GM can choose to take back all cards and shuffle them. Action is available via the deck stack, on left side',
        actionType: 'deckUsage',
        grid : {
            css: 'alone',
            targets: ['DE']
        },
        available: [
            { from: 'DE', target: 'DE', nameKey: 'Reset the deck' }
        ]
    },
    drawDiscardCard: {
        labelKey: 'Draw the top cards',
        descKey: 'Users can draw the top cards from the discard. Action is available via the user stacks, on left side',
        actionType: 'discardUsage',
        grid : {
            css: 'discard-only',
            targets: ['DI'],
            fromLabel: 'Drawer',
            targetLabel: 'From'
        },
        available: [
            { from: 'GH', target: 'DI', nameKey: 'Draw from discard' },
            { from: 'GR', target: 'DI', nameKey: 'Draw from discard' },
            { from: 'PH', target: 'DI', nameKey: 'Draw from discard' },
            { from: 'PR', target: 'DI', nameKey: 'Draw from discard' }
        ]
    },
    shuffleDiscard: {
        labelKey: 'Shuffle the discard',
        descKey: 'GM can shuffle the discard, changing the cards order. Action is available via the discard stack, on left side',
        actionType: 'discardUsage',
        grid : {
            css: 'alone',
            targets: ['DI']
        },
        available: [
            { from: 'DI', target: 'DI', nameKey: 'Shuffle the discard' }
        ]
    },
    resetDiscard: {
        labelKey: 'Reset the discard',
        descKey: 'GM can choose to take put all cards from the discard back to the deck. If deck shuffle is allowed, the deck will be shuffled.',
        actionType: 'discardUsage',
        grid : {
            css: 'alone',
            targets: ['DI']
        },
        available: [
            { from: 'DI', target: 'DI', nameKey: 'Reset the discard' }
        ]
    },
    playCard: {
        labelKey: 'Play a card (card effect is applied)',
        descKey: 'A user can play one of his cards. The displayed message will indicate that the card has been played',
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
        labelKey: 'Move a card through stacks',
        descKey: 'A user can transfer one of his cards to another stack. The displayed message will indicate that the card has been transfered',
        actionType: 'selectedCard',
        grid : {
            css: 'all-targets',
            targets: ['DE', 'DI', 'GH', 'GR', 'PH', 'PR']
        },
        available: [
            { from: 'DE', target: 'GH', nameKey: 'Give a card' },
            { from: 'DE', target: 'GR', nameKey: 'Give a card' },
            { from: 'DE', target: 'PH', nameKey: 'Give a card' },
            { from: 'DE', target: 'PR', nameKey: 'Give a card' },
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
        descKey: 'A user can exchange a card from one of this stacks with an other user stack',
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
        descKey: 'A user can swap a card between its two stacks',
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
        descKey: 'When manipulating his cards, a user can flip them',
        actionType: 'selectedCard',
        grid : {
            css: 'no-target',
            targets: ['DE', 'DI', 'GH', 'GR', 'PH', 'PR']
        },
        available: [
            { from: 'DE', target: 'DE', nameKey: 'Flip a card' },
            { from: 'DI', target: 'DI', nameKey: 'Flip a card' },
            { from: 'GH', target: 'GH', nameKey: 'Flip a card' },
            { from: 'GR', target: 'GR', nameKey: 'Flip a card' },
            { from: 'PH', target: 'PH', nameKey: 'Flip a card' },
            { from: 'PR', target: 'PR', nameKey: 'Flip a card' }
        ]
    },
    rotateCard: {
        labelKey: 'Rotate card',
        descKey: 'When manipulating his cards, a user can rotate them',
        actionType: 'selectedCard',
        grid : {
            css: 'no-target',
            targets: ['DE', 'DI', 'GH', 'GR', 'PH', 'PR']
        },
        available: [
            { from: 'DE', target: 'DE', nameKey: 'Rotate a card' },
            { from: 'DI', target: 'DI', nameKey: 'Rotate a card' },
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
    stackForPlayerRevealedCards: 'stackForPlayerRevealedCards',
    version: "version"
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
