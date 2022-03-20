import { cardFilterSettings, cardStackSettings, deckBacksSettings, updateCardStackSettings, updateDeckBacksSettings } from "./tools.js";
import { DeckParameters, GlobalConfiguration, StackConfiguration } from "./constants.js";
import { CustomCardGUIWrapper } from "./mainui/CustomCardGUIWrapper.js";
import { CARD_STACKS_DEFINITION } from "./StackDefinition.js";

const assertStackIsNotADiscardPile = ( customCardStack ) => {

    const discardPiles = Object.values(customCardStack.cardStacks.piles);
    if( discardPiles.find( p => p == customCardStack ) ) {
        throw 'Cards already in discard can\'t be discareded'; 
    }
}

const assertStackOwner = ( customCardStack, {forGMs=false, forPlayers=false, forNobody=false}={} ) => {

    const owner = customCardStack.stackOwner;
    if( !forGMs && owner.forGMs ) { 
        throw 'Card stacks forGMs can\'t do this action'; 
    }
    if( !forPlayers && owner.forPlayers )  { 
        throw 'Card stacks forPlayers can\'t do this action'; 
    }
    if( !forNobody && owner.forNobody )  { 
        throw 'Card stacks forNobody can\'t do this action'; 
    }
}

const assertStackType = ( customCardStack, {decks=false, hands=false, piles=false}={} ) => {

    if( !decks && customCardStack._stack.type == 'deck' ) { 
        throw 'Decks can\'t do this action'; 
    }
    if( !hands && customCardStack._stack.type == 'hand' ) { 
        throw 'Hands can\'t do this action'; 
    }
    if( !piles && customCardStack._stack.type == 'pile' ) { 
        throw 'Piles can\'t do this action'; 
    }
}

export class CustomCardStack {

    constructor(stack) {
        this._stack = stack;

        // Some actions calls a reset. Also reset our flags
        const resetingFlags = {};
        resetingFlags['flags.ready-to-use-cards.currentFace'] = 0;
        this._resetingOptions = {
            chatNotification: false,
            updateData: resetingFlags    
        };
    }

    get stack() { return this._stack; }

    /**
     * @param {string} [alternativeCoreKey] Which coreStack key should be used. By default will use this.coreStackRef
     * @returns {string} Stack base name (without suffix for deck and discard)
     */
    retrieveStackBaseName(alternativeCoreKey=null) {
        const coreKey = alternativeCoreKey ?? this.coreStackRef;
        const coreStack = CARD_STACKS_DEFINITION.core[coreKey];
        return coreStack?.customName ?? game.i18n.localize(coreStack?.labelBaseKey + 'title');
    }

    /**
     * Present in Decks and Discard piles.
     * Gives the unique reference key to this stack definition
     * @returns {string} One of the CARD_STACKS_DEFINITION.core keys
     */
    get coreStackRef() {
        return this.stack.getFlag("ready-to-use-cards", "core");
    }

    get backIcon() {
        return deckBacksSettings(this.coreStackRef).deckIcon;
    }

    get frontIcon() {
        return deckBacksSettings(this.coreStackRef).discardIcon;
    }

    get backDefaultImage() {
        return deckBacksSettings(this.coreStackRef).deckBg;
    }

    get frontDefaultImage() {
        return deckBacksSettings(this.coreStackRef).discardBg;
    }

    /**
     * Some actions loops through the cards.
     * If this is TRUE, the card back is added as the last face of the card.
     * It's true by default. You can change it inside the action config panel.
     * Is using DeckParameters.removeBackFace to see if it's true or not
     */
    get cardBackIsConsideredAsAFaceWhenLooping() {
        const coreRef = this.coreStackRef;
        const coreDef = CARD_STACKS_DEFINITION.core[coreRef];
        const removed = coreDef[DeckParameters.removeBackFace] ?? false;
        return !removed;
    }

    /**
     * Retrieve a translated label based on what was define as CARD_STACKS_DEFINITION.core.key.labelBaseKey
     * If not found, fallback to RTUCards.default.default.
     * @param {string} labelPath label suffix (will be completed for retrieve real label key)
     * @param {string} [alternativeCoreKey] Which coreStack key should be used. By default will use this.coreStackRef
     * @returns {string} A localized label
     */
    localizedLabel(labelPath, {alternativeCoreKey=null}={}) {
        const coreKey = alternativeCoreKey ?? this.coreStackRef;
        const coreStack = CARD_STACKS_DEFINITION.core[coreKey];
        const coreTitle = this.retrieveStackBaseName(alternativeCoreKey);

        let label;
        if(CARD_STACKS_DEFINITION.core.hasOwnProperty(coreKey) ) { 
            // Some stack have no coreKey stored. Such as player hands
            const fullPath = coreStack.labelBaseKey + labelPath;
            label = game.i18n.localize(fullPath);
            if( label === fullPath ) { label = null; }
        }

        if( !label ) { // Default translation
            const defaultPath = "RTUCards.default." + labelPath;
            label = game.i18n.localize(defaultPath);
            if( label === defaultPath ) { label = null; }
        }

        if( label == null ) { // No translation
            label = labelPath;
        }

        return label.replace('STACK', this.stack.name).replace('CORE', coreTitle);
    }
    
    get cardStacks() {
		return game.modules.get('ready-to-use-cards').cardStacks;
    }

    get stackOwner() {
        const value = this.stack.getFlag("ready-to-use-cards", "owner");
        const forGMs = value == 'gm';
        const forNobody = (value == 'none' || ! value );
        const forPlayers = !forGMs && !forNobody;

        const result = {
            forGMs: forGMs,
            forNobody: forNobody,
            forPlayers: forPlayers
        };
        if( forPlayers ) {
            result.playerId = value;
        }

        return result;
    }

    get stackConfig() {
        const coreKey = this.coreStackRef;
        if( coreKey ) {
            const config = duplicate(CARD_STACKS_DEFINITION.core[coreKey].config); // Do not directly edit config. Read only

            Object.values(StackConfiguration).forEach(confKey => { // By default all missing config are set to true
                if( !config.hasOwnProperty(confKey) ) {  config[confKey] = true;}
            });

            // If players hands have been removed, some confs are automatically set to false.
            if( !game.settings.get("ready-to-use-cards", GlobalConfiguration.stackForPlayerHand) ) {
                config[StackConfiguration.fromDeckDealCardsToHand] = false;
                config[StackConfiguration.fromRevealedBackToHand] = false;
            }

            if( !game.settings.get("ready-to-use-cards", GlobalConfiguration.stackForPlayerRevealedCards) ) {
                config[StackConfiguration.fromDeckDealRevealedCards] = false;
                config[StackConfiguration.fromHandRevealCard] = false;
            }
            return config;

        }
        return null;
    }

    get sortedAvailableCards() {
        const cards = this.stack.availableCards;
        cards.sort( (a,b) => {
            const aCore = ( new CustomCardStack(a.source) ).coreStackRef ?? '';
            const bCore = ( new CustomCardStack(b.source) ).coreStackRef ?? '';
            let sort = aCore.localeCompare(bCore);
            if(!sort) {
                sort = a.data.sort - b.data.sort;
            }
            return sort;
        });
        return cards;
    }

    get ownedByCurrentPlayer() {
        const owner = this.stack.getFlag('ready-to-use-cards','owner');

        if( game.user.isGM ) {
            return owner == 'gm';
        } else {
            return owner === game.user.id;
        }
    }

    /* -------------------------------------------- 
      Manual Registering management
    /* -------------------------------------------- */

    /**
     * Does the stack have the right flags to be handled correctly?
     * @returns {boolean} TRUE if the flags are here
     */
    get handledByModule() {
        return this.stack.getFlag("ready-to-use-cards", "owner") ? true : false;
    }

    /**
     * Some custom stacks can be added manually.
     * This is how we distinct them from others
     * @returns {boolean} TRUE if it is a custom stack
     */
    get manuallyRegistered() {
        return this.stack.getFlag("ready-to-use-cards", "registered-as") ? true : false;
    }

    /**
     * Add a new deck to the list of coreStacks handled by the module
     * Deck will be modified so that it has the right name and flags.
     * Then the related discard will be created.
     */
     async registerAsHandledByModule() {

        // 0: Verifs
        assertStackType(this, {decks:true});
        if( this.handledByModule ) { throw this.stack.name + ' is already handled by module'; }

        // 1: Edit the deck
        const updateData = {};
        updateData['name'] = this.stack.name + game.i18n.localize('RTUCards.coreStacks.suffix.deck');
        updateData['permission'] = {
            default: CONST.DOCUMENT_PERMISSION_LEVELS.OBSERVER
        };

        const flags = {};
        const defaultParameters = this.stack.getFlag('ready-to-use-cards', 'default-parameters');
        if(defaultParameters) {
            flags['default-parameters'] = defaultParameters;
        }

        flags['registered-as'] = {
            name: this.stack.name,
            desc: this.stack.data.description
        };

        flags['core'] = this.stack.id;
        flags['owner'] = 'none';
        updateData['flags.ready-to-use-cards'] = flags;
        await this.stack.update(updateData);

        // 2: Flag this coreStack as chosen in settings
        const stackSettings = cardFilterSettings();
        if(defaultParameters) {
            stackSettings['parameters'] = defaultParameters;
        }

        const chosenStacks = cardStackSettings();
        chosenStacks[this.stack.id] = stackSettings;
        await updateCardStackSettings(chosenStacks);

        // 3: Reload all stacks
        const cardStacks = game.modules.get('ready-to-use-cards').cardStacks;
        await cardStacks.loadCardStacks();
    }

    /**
     * Remove a maunally registered deck stack from the coreStacks handled by the module
     */
     async unregisterAsHandledByModule() {

        // 0: Verifs
        assertStackType(this, {decks:true});
        if( !this.manuallyRegistered ) { throw this.stack.name + ' was not manually registered'; }

        // 1: Reset the deck
        const coreKey = this.coreStackRef;
        await this.resetDeck();

        // 2: Rename deck and remove flag
        const chosenStacks = cardStackSettings();
        const updateData = {};
        const suffix = game.i18n.localize('RTUCards.coreStacks.suffix.deck');
        updateData['name'] = this.stack.name.replace(suffix, '');
        updateData['permission'] = {
            default: CONST.DOCUMENT_PERMISSION_LEVELS.NONE
        };

        updateData['flags.ready-to-use-cards'] = {
            core: null,
            'registered-as' : null,
            'owner' : null,
            'default-parameters' : chosenStacks[this.stack.id].parameters
        };
        await this.stack.update(updateData);

        // 3: Unflag this coreStack as chosen in settings
        delete chosenStacks[this.stack.id];
        await updateCardStackSettings(chosenStacks);
        await updateDeckBacksSettings(coreKey, null);

        // 4: Delete the related discard
        const cardStacks = game.modules.get('ready-to-use-cards').cardStacks;
        await cardStacks.piles[coreKey].stack.delete()

        // 5: Reload links
        await cardStacks.loadCardStacks();
    }

    /* -------------------------------------------- 
        Custom cardStack actions
    /* -------------------------------------------- */

    /**
     * 
     * @param {string} stackType 'deck', 'hand', or 'pile'
     * @param {string} action action name
     * @param {int} amount Amount of cards (will be used to define suffix)
     * @param {string} [alternativeCoreKey] Which coreStack key should be used. By default will use this.coreStackRef
     * @returns {string} The message label
     */
    getCardMessageFlavor(stackType, action, amount, {alternativeCoreKey=null}={}) { 
        
        const coreKey = alternativeCoreKey ?? this.coreStackRef;
        const amountSuffix = amount == 1 ? 'one' : 'many';
        
        const key = 'message.' + action + '.' + stackType + '.' +  amountSuffix;
        const label = this.localizedLabel(key, {alternativeCoreKey: coreKey});
        return label.replace('NB', '' + amount);
    }

    /**
     * Convenience method to send a message when stacks are modified
     * @param {string} flavor message flavor
     * @param {Cards[]} stacks List of stacks which should be listed
     */
     async sendMessageForStacks(flavor, stacks) {

        const preparedData = {
            from: {
                icon: this.stack.data.img,
                message: flavor
            },
            stacks: stacks.map( s => {

                const owner = s.stackOwner;
                const data = { id: s.stack.id, name: s.stack.name };

                if( owner.forGMs ) {
                    data.icon = game.settings.get("ready-to-use-cards", GlobalConfiguration.gmIcon);
                } else {
                    const user = game.users.get( s.stackOwner.playerId );
                    data.icon = user?.character?.img ?? 'icons/svg/mystery-man.svg';
                }
                return data;
            })
        };
        const template = 'modules/ready-to-use-cards/resources/sheet/card-dealing.hbs';
        const html = await renderTemplate(template, preparedData);

        // Send message
        const userName = game.user.character?.name ?? game.user.name;
        const alias = game.user.isGM ? game.settings.get("ready-to-use-cards", GlobalConfiguration.gmName) : userName;
        const msgData = {
            content: html,
            user: game.user.id,
            speaker: {
                alias: alias
            }
        }
        return ChatMessage.create(msgData);
    };

    /**
     * Convenience method to send a message when cards are gained or discarded
     * @param {string} flavor message flavor
     * @param {Card[]} cards List of cards which should be listed
     * @param {boolean} [addCardDescription] : If description should be added for each card
     * @param {boolean} [hideToStrangers] : If message should be hidden to strangers
     * @param {string} [sentToDiscard] : Discard stack id. When message is displayed, it will check if the player has enough rights to see the discard. If not, the card will be hidden
     * @param {boolean} [letGMSpeak] : If true, message will be formated as if it came from gmHand manipulaition
     */
     async sendMessageForCards(flavor, cards, {addCardDescription=false, hideToStrangers=false, sentToDiscard=null, letGMSpeak=false} = {}) {

        const from = letGMSpeak? this.cardStacks.gmHand : this;
        const data = { cards: [] };
        for( const card of cards ) {
            const wrapper = new CustomCardGUIWrapper(card);
            const line = wrapper.buildCardInfoForListing(from, addCardDescription);
            data.cards.push( line );
        }

        return from.sendMessageWithPreparedCardData(flavor, data, {hideToStrangers, sentToDiscard});
    };

    /**
     * Called inside sendMessageForCards once data have been prepared.
     * This method has been split into two in order to allow custom message from specific actions
     * @param {string} flavor message flavor
     * @param {object} preparedData Should contains a .cards[]
     * @param {boolean} [hideToStrangers] : If message should be hidden to strangers
     * @param {string} [sentToDiscard] : Discard stack id. When message is displayed, it will check if the player has enough rights to see the discard. If not, the card will be hidden
     * @returns 
     */
    async sendMessageWithPreparedCardData(flavor, preparedData, {hideToStrangers=false, sentToDiscard=null} = {} ) {

        const template = 'modules/ready-to-use-cards/resources/sheet/card-listing.hbs';
        const html = await renderTemplate(template, preparedData);

        const msgData = {
            flavor: flavor,
            content: html
        };

        // Who will speak ?
        msgData.speaker = {}
        const stackOwner = this.stackOwner;
        if( stackOwner.forPlayers ) { 
            const user = game.users.find( u => u.id === stackOwner.playerId );
            if( user ) {
                const speakerActor = user.character;
                if( speakerActor ) {
                    msgData.speaker.id = speakerActor?.id;
                    msgData.speaker.alias = speakerActor?.name;
                } else {
                    msgData.speaker.alias = user.name;
                }
            }
            
        } else {
            msgData.speaker.alias = game.settings.get("ready-to-use-cards", GlobalConfiguration.gmName);
        }
        msgData.user = game.user.id;

        // Flags used when handling click on this message
        msgData["flags.ready-to-use-cards.handleCards"] = {
            hideToStrangers: hideToStrangers,
            sentToDiscard: sentToDiscard,
            forGMs: stackOwner.forGMs,
            forPlayers: stackOwner.forPlayers,
            playerId: stackOwner.playerId
        };

        return ChatMessage.create(msgData);
    }


    /**
     * Draw some cards.
     * @param {CustomCardStack} from The deck you will draw from
     * @param {int} amount Amount of drawn cards. By default: 1
     * @returns {Card[]} The discarded cards
     */
     async drawCards(from, amount = 1) {

        assertStackOwner(this, {forGMs: true, forPlayers: true});

        const stackType = this.stack.type;
        const inHand = stackType == 'hand';

        const drawnCards = await this.stack.draw( from.stack, amount, {chatNotification: false} );

        const flavor = this.getCardMessageFlavor(stackType, 'draw', drawnCards.length);

        await this.sendMessageForCards(flavor, drawnCards, {hideToStrangers: inHand});

        return drawnCards;
    }

    /**
     * Give some cards to a player
     * @param {CustomCardStack} to The player which will receive the card
     * @param {string[]} cardIds The cards which should be transfered
     * @returns {Card[]} The transfered cards
     */
     async giveCards(to, cardIds) {

        assertStackOwner(this, {forNobody: true});
        assertStackType(this, {decks: true});

        const stackType = to.stack.type;
        const inHand = stackType == 'hand';

        const givenCards = await this.stack.pass( to.stack, cardIds, {chatNotification: false} );

        const flavor = to.getCardMessageFlavor(stackType, 'give', givenCards.length);

        await to.sendMessageForCards(flavor, givenCards, {hideToStrangers: inHand});

        return givenCards;
    }


    /**
     * Exchange some of your cards
     * @param {CustomCardStack} withStack Card stack which have the receivedCardsId
     * @param {string[]} myCardIds Cards you will be separated
     * @param {string[]} receivedCardsId Cards you will get
     * @param {string[]} receivedCardsId Cards you will get
     * @returns {Card[]} Received Cards
     */
     async exchangeCards(withStack, myCardIds, receivedCardsId) {

        assertStackOwner(this, {forGMs: true, forPlayers:true});
        assertStackType(this, {hands: true, piles:true});

        const stackType = this.stack.type;
        const inHand = stackType == 'hand';

        const target = withStack.stack;

        const givenCards = await this.stack.pass( target, myCardIds, {chatNotification: false} );
        const receivedCards = await target.pass( this.stack, receivedCardsId, {chatNotification: false} );

        const allCards = [];
        allCards.push(...givenCards);
        allCards.push(...receivedCards);

        let flavor = this.getCardMessageFlavor(stackType, 'exchange', givenCards.length);
        flavor = flavor.replace('FROM', target.name );

        await this.sendMessageForCards(flavor, allCards, {hideToStrangers: inHand});

        return givenCards;
    }

    /**
     * Discard some cards.
     * Message will be grouped for each card type
     * @param {string[]} cardsIds cards Ids
     * @returns {Card[]} The discarded cards
     */
     async discardCards(cardsIds) {

        assertStackIsNotADiscardPile(this);

        const stackType = this.stack.type;

        let discardCards = [];
        for( let [coreKey, pile] of Object.entries( this.cardStacks.piles ) ) {
            const ids = cardsIds.filter( id => {
                const card = this.stack.cards.get(id);
                if( card ) {
                    const custom = new CustomCardStack(card.source);
                    return custom.coreStackRef === coreKey;
                }
            });
            const cards = await this.stack.pass( pile.stack, ids, {chatNotification: false});

            if( cards.length > 0 ) {
                const flavor =  this.getCardMessageFlavor(stackType, 'discard', cards.length, {alternativeCoreKey: coreKey});
                await this.sendMessageForCards( flavor, cards, {sentToDiscard: pile.stack.id} );
        
                discardCards = discardCards.concat(cards);
            }
        }

        return discardCards;
    }


    /** 
     * Try to discarded a card by giving its id.
     * The card should be owner by this player.
     * Log in chat which card it was by linking to the Compendium ae-cards
     */
     async backToDeck(cardId) {

        assertStackOwner(this, {forNobody: true});
        assertStackType(this, {piles: true});

        const currentCard = this.stack.cards.get(cardId);
        const original = await currentCard?.reset(this._resetingOptions);

        const coreKey = this.coreStackRef;
        const deck = this.cardStacks.decks[coreKey]?.stack;
        if( deck.testUserPermission(game.user, "OWNER") ) {
            await deck.shuffle({chatNotification: false});
        } else {
            console.warn('RTUC-Actions | You didn\'t have enough permissions to shuffle the deck. Skipped.');
        }

        const flavor = this.getCardMessageFlavor('pile', 'backToDeck', 1);
        await this.sendMessageForCards(flavor,  [original], {letGMSpeak:true} );
    }

    /** 
     * Try to put some cards back in its hand.
     * Cards should currently be in revealed cards
     * @param {string[]} cardsIds cards Ids
     * @returns {Card[]} The returned cards
     */
     async backToHand(cardIds) {

        assertStackOwner(this, {forGMs: true, forPlayers: true});
        assertStackType(this, {piles: true});

        const owner = this.stackOwner;
        const hand = owner.forGMs ? this.cardStacks.gmHand
                                  : this.cardStacks.findPlayerHand( game.users.get(owner.playerId) );
        const cards = await this.stack.pass( hand.stack, cardIds, {chatNotification: false});

        const flavor = this.getCardMessageFlavor('pile', 'backToHand', cardIds.length);
        await this.sendMessageForCards(flavor,  cards );
        return cards;
    }


    /** 
     * All cards which were stored in the discard will be put back to their decks
     */
     async shuffleDiscardIntoDeck() {

        assertStackOwner(this, {forNobody: true});
        assertStackType(this, {piles: true});

        const amount = this.stack.availableCards.length;
        await this.stack.reset(this._resetingOptions);

        const coreKey = this.coreStackRef;
        const deck = this.cardStacks.decks[coreKey]?.stack;
        if( deck.testUserPermission(game.user, "OWNER") ) {
            await deck.shuffle({chatNotification: false});
        } else {
            console.warn('RTUC-Actions | You didn\'t have enough permissions to shuffle the deck. Skipped.');
        }
        

        const flavor = this.getCardMessageFlavor('pile', 'backToDeck', amount);
        await this.sendMessageForCards(flavor,  [], {letGMSpeak:true} );
    }

    /** 
     * Play some cards from your hand.
     * It will go to the discard pile.
     * @param {string[]} cardsIds cards Ids
     * @returns {Card[]} The played cards (now in discard pile)
     */
     async playCards(cardsIds) {

        assertStackOwner(this, {forGMs: true, forPlayers: true});
        assertStackType(this, {hands: true, piles: true});

        const playedCards = [];
        for( let [coreKey, pile] of Object.entries( this.cardStacks.piles ) ) {
            const ids = cardsIds.filter( id => {
                const card = this.stack.cards.get(id);
                if( card ) {
                    const custom = new CustomCardStack(card.source);
                    return custom.coreStackRef === coreKey;
                }
            });
            const cards = await this.stack.pass( pile.stack, ids, {action: 'play', chatNotification: false});

            if( cards.length > 0 ) {
                const flavor =  this.getCardMessageFlavor('hand', 'play', cards.length, {alternativeCoreKey: coreKey});
                await this.sendMessageForCards(flavor, cards, {addCardDescription: true});
        
                playedCards.push( ...cards);
            }
        }

        return playedCards;
    }

    /** 
     * Put some card in front of you. Visible to everybody
     * Cards should currently be in hand
     * @param {string[]} cardsIds cards Ids
     * @returns {Card[]} The revealed cards
     */
     async revealCards(cardIds) {

        assertStackOwner(this, {forGMs: true, forPlayers: true});
        assertStackType(this, {hands: true});

        const owner = this.stackOwner;
        const pile = owner.forGMs ? this.cardStacks.gmRevealedCards
                                  : this.cardStacks.findRevealedCards( game.users.get(owner.playerId) );
        const cards = await this.stack.pass( pile.stack, cardIds, {chatNotification: false});

        const flavor = this.getCardMessageFlavor('hand', 'reveal', cardIds.length);
        await this.sendMessageForCards(flavor, cards, {addCardDescription: true} );
        return cards;
    }

    /**
     * Deal some cards to player hands or revealed cards
     * @param {CustomCardStack[]} to Stack destinations
     * @param {int} amount  amount of cards which should be dealt
     */
    async dealCards(to, amount) {

        assertStackOwner(this, {forNobody: true});
        assertStackType(this, {decks: true});

        await this.stack.deal( to.map( ccs => ccs.stack ), amount, {chatNotification: false});

        const flavor = this.getCardMessageFlavor('deck', 'deal', amount);
        await this.sendMessageForStacks(flavor, to);
    }

    /** 
     * Shuffle a deck.
     */
     async shuffleDeck() {

        assertStackOwner(this, {forNobody: true});
        assertStackType(this, {decks: true});

        await this.stack.shuffle({chatNotification: false});

        const flavor = this.getCardMessageFlavor('deck', 'shuffle', 1);
        await this.sendMessageForStacks(flavor, []);
    }

    /** 
     * Reset a deck.
     */
     async resetDeck() {

        assertStackOwner(this, {forNobody: true});
        assertStackType(this, {decks: true});

        const resetingFlags = [];
        resetingFlags['flags.ready-to-user-cards.currentFace'] = 0;
        await this.stack.reset(this._resetingOptions);
        await this.stack.shuffle({chatNotification: false});

        const flavor = this.getCardMessageFlavor('deck', 'reset', 1);
        await this.sendMessageForStacks(flavor, []);
    }

}
