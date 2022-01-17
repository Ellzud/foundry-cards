import { CustomCardsDisplay } from "./CardsDisplay.js";
import { GlobalConfiguration, StackConfiguration } from "./constants.js";
import { CARD_STACKS_DEFINITION } from "./StackDefinition.js";

const assertStackIsNotADiscardPile = ( parent ) => {

    const discardPiles = Object.values(parent.cardStacks.piles);
    if( discardPiles.find( p => p == parent ) ) {
        throw 'Cards already in discard can\'t be discareded'; 
    }
}

const assertStackOwner = ( parent, {forGMs=false, forPlayers=false, forNobody=false}={} ) => {

    const owner = parent.stackOwner;
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

const assertStackType = ( parent, {decks=false, hands=false, piles=false}={} ) => {

    if( !decks && parent.type == 'deck' ) { 
        throw 'Decks can\'t do this action'; 
    }
    if( !hands && parent.type == 'hand' ) { 
        throw 'Hands can\'t do this action'; 
    }
    if( !piles && parent.type == 'pile' ) { 
        throw 'Piles can\'t do this action'; 
    }
}

export class CustomCards extends Cards {

    /**
     * Present in Decks and Discard piles.
     * Gives the unique reference key to this stack definition
     * @returns {string} One of the CARD_STACKS_DEFINITION.core keys
     */
    get coreStackRef() {
        return this.getFlag("ready-to-use-cards", "core");
    }

    get backIcon() {
        const coreRef = this.coreStackRef;
        const coreDef = CARD_STACKS_DEFINITION.core[coreRef];
        return coreDef.customIcon ?? (coreDef.resourceBaseDir + '/icons/back.webp');
    }

    get frontIcon() {
        const coreRef = this.coreStackRef;
        const coreDef = CARD_STACKS_DEFINITION.core[coreRef];
        return coreDef.customIcon ?? (coreDef.resourceBaseDir + '/icons/front.webp');
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
        if(coreKey) { 
            // Some stack have no coreKey stored. Such as player hands
            const fullPath = CARD_STACKS_DEFINITION.core[coreKey].labelBaseKey + labelPath;
            const label = game.i18n.localize(fullPath);
            if( label != fullPath ) { return label; }
        }
        return game.i18n.localize("RTUCards.default." + labelPath);
    }
    
    get cardStacks() {
		return game.modules.get('ready-to-use-cards').cardStacks;
    }

    get stackOwner() {
        const value = this.getFlag("ready-to-use-cards", "owner");
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
        const cards = this.availableCards;
        cards.sort( (a,b) => {
            if( a.data.type === b.data.type ) {
                return a.data.sort - b.data.sort;
            }
            return a.data.type.localeCompare(b.data.type);
        });
        return cards;
    }

    get ownedByCurrentPlayer() {
        const owner = this.getFlag('ready-to-use-cards','owner');

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
     * For cards handled by module, GUI is always CustomCardsDisplay
     * Other stacks still can use other GUI
     * @override
     */
    get sheet() {
        if(!this.handledByModule) {
            return super.sheet;
        }

        if ( !this._customSheet ) {
            this._customSheet = new CustomCardsDisplay(this, {editable: this.isOwner});
        }        
        return this._customSheet;
    }

    /**
     * Does the stack have the right flags to be handled correctly?
     * @returns {boolean} TRUE if the flags are here
     */
    get handledByModule() {
        return this.data.flags['ready-to-use-cards'] ? true : false;
    }

    /**
     * Some custom stacks can be added manually.
     * This is how we distinct them from others
     * @returns {boolean} TRUE if it is a custom stack
     */
    get manuallyRegistered() {
        return this.getFlag("ready-to-use-cards", "registered-as") ? true : false;
    }

    /**
     * Add a new deck to the list of coreStacks handled by the module
     * Deck will be modified so that it has the right name and flags.
     * Then the related discard will be created.
     */
     async registerAsHandledByModule() {

        // 0: Verifs
        assertStackType(this, {decks:true});
        if( this.handledByModule ) { throw this.name + ' is already handled by module'; }

        // 1: Edit the deck
        const updateData = {};
        updateData['name'] = this.name + game.i18n.localize('RTUCards.pokerDark.coreStacks.suffix.deck');
        updateData['permission'] = {
            default: CONST.DOCUMENT_PERMISSION_LEVELS.OBSERVER
        };

        const flags = {};
        flags['registered-as'] = {
            name: this.name,
            desc: this.data.description,
            icon: this.data.img
        };

        flags['core'] = this.id;
        flags['owner'] = 'none';
        updateData['flags.ready-to-use-cards'] = flags;
        await this.update(updateData);

        // 2: Flag this coreStack as chosen in settings
        const chosenStacks = game.settings.get('ready-to-use-cards', GlobalConfiguration.stacks);
        chosenStacks[this.id] = {};
        await game.settings.set('ready-to-use-cards', GlobalConfiguration.stacks, chosenStacks);

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
        if( !this.manuallyRegistered ) { throw this.name + ' was not manually registered'; }

        // 1: Reset the deck
        const coreKey = this.coreStackRef;
        await this.resetDeck();

        // 2: Rename deck and remove flag
        const updateData = {};
        const suffix = game.i18n.localize('RTUCards.pokerDark.coreStacks.suffix.deck');
        updateData['name'] = this.name.replace(suffix, '');
        updateData['permission'] = {
            default: CONST.DOCUMENT_PERMISSION_LEVELS.NONE
        };

        updateData['flags.ready-to-use-cards'] = null;
        await this.update(updateData);

        // 3: Unflag this coreStack as chosen in settings
        const chosenStacks = game.settings.get('ready-to-use-cards', GlobalConfiguration.stacks);
        delete chosenStacks[this.id];
        await game.settings.set('ready-to-use-cards', GlobalConfiguration.stacks, chosenStacks);

        // 4: Delete the related discard
        const cardStacks = game.modules.get('ready-to-use-cards').cardStacks;
        await cardStacks.piles[coreKey].delete()

        // 5: Reload links
        await cardStacks.loadCardStacks();
    }

    /* -------------------------------------------- 
      Capture cards movements and trigger custom hook
    /* -------------------------------------------- */

    /** @override */
    _onUpdate(data, options, userId) {
        super._onUpdate(data, options, userId);
        Hooks.call('updateCustomCardsContent', this, options, userId);
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
        return label.replace('NB', '' + amount).replace('STACK', this.name);
    }

    /**
     * Convenience method to send a message when stacks are modified
     * @param {string} flavor message flavor
     * @param {CustomCards[]} stacks List of stacks which should be listed
     */
     async sendMessageForStacks(flavor, stacks) {

        const preparedData = {
            from: {
                icon: this.data.img,
                message: flavor
            },
            stacks: stacks.map( s => {

                const owner = s.stackOwner;
                const data = { id: s.id, name: s.name };

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
        const msgData = {
            content: html,
            user: game.user.id,
            speaker: {
                alias: game.settings.get("ready-to-use-cards", GlobalConfiguration.gmName)
            }
        }
        return ChatMessage.create(msgData);
    };

    /**
     * Convenience method to send a message when cards are gained or discarded
     * @param {string} flavor message flavor
     * @param {CustomCard[]} cards List of cards which should be listed
     * @param {boolean} [addCardDescription] : If description should be added for each card
     * @param {boolean} [hideToStrangers] : If message should be hidden to strangers
     * @param {boolean} [letGMSpeak] : If true, message will be formated as if it came from gmHand manipulaition
     */
     async sendMessageForCards(flavor, cards, {addCardDescription=false, hideToStrangers=false, letGMSpeak=false} = {}) {

        const from = letGMSpeak? this.cardStacks.gmHand : this;
        const data = { cards: [] };
        for( const card of cards ) {
            const line = card.forGUI.buildCardInfoForListing(from, addCardDescription);
            data.cards.push( line );
        }

        return from.sendMessageWithPreparedCardData(flavor, data, {hideToStrangers});
    };

    /**
     * Called inside sendMessageForCards once data have been prepared.
     * This method has been split into two in order to allow custom message from specific actions
     * @param {string} flavor message flavor
     * @param {object} preparedData Should contains a .cards[]
     * @param {boolean} [hideToStrangers] : If message should be hidden to strangers
     * @returns 
     */
    async sendMessageWithPreparedCardData(flavor, preparedData, {hideToStrangers=false} = {} ) {

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
            const speakerActor = game.users.find( u => u.id === stackOwner.playerId )?.character;
            msgData.speaker.id = speakerActor?.id;
            msgData.speaker.alias = speakerActor?.name;
        } else {
            msgData.speaker.alias = game.settings.get("ready-to-use-cards", GlobalConfiguration.gmName);
        }
        msgData.user = game.user.id;

        // Flags used when handling click on this message
        msgData["flags.ready-to-use-cards.handleCards"] = {
            hideToStrangers: hideToStrangers,
            forGMs: stackOwner.forGMs,
            forPlayers: stackOwner.forPlayers,
            playerId: stackOwner.playerId
        };

        return ChatMessage.create(msgData);
    }


    /**
     * Draw some cards.
     * @param {CustomCards} from The deck you will draw from
     * @param {int} amount Amount of drawn cards. By default: 1
     * @returns {CustomCard[]} The discarded cards
     */
     async drawCards(from, amount = 1) {

        assertStackOwner(this, {forGMs: true, forPlayers: true});

        const stackType = this.type;
        const inHand = stackType == 'hand';

        const drawnCards = await this.draw( from, amount, {chatNotification: false} );

        const flavor = this.getCardMessageFlavor(stackType, 'draw', drawnCards.length);

        await this.sendMessageForCards(flavor, drawnCards, {hideToStrangers: inHand});

        return drawnCards;
    }

    /**
     * Give some cards to a player
     * @param {CustomCards} to The player which will receive the card
     * @param {string[]} cardIds The cards which should be transfered
     * @returns {CustomCard[]} The transfered cards
     */
     async giveCards(to, cardIds) {

        assertStackOwner(this, {forNobody: true});
        assertStackType(this, {decks: true});

        const stackType = to.type;
        const inHand = stackType == 'hand';

        const givenCards = await this.pass( to, cardIds, {chatNotification: false} );

        const flavor = to.getCardMessageFlavor(stackType, 'give', givenCards.length);

        await to.sendMessageForCards(flavor, givenCards, {hideToStrangers: inHand});

        return givenCards;
    }


    /**
     * Discard some cards.
     * Message will be grouped for each card type
     * @param {string[]} cardsIds cards Ids
     * @returns {CustomCard[]} The discarded cards
     */
     async discardCards(cardsIds) {

        assertStackIsNotADiscardPile(this);

        const stackType = this.type;

        let discardCards = [];
        for( let [coreKey, pile] of Object.entries( this.cardStacks.piles ) ) {
            const ids = cardsIds.filter( id => {
                const card = this.cards.get(id);

                return card?.source.coreStackRef === coreKey;
            });
            const cards = await this.pass( pile, ids, {chatNotification: false});

            if( cards.length > 0 ) {
                const flavor =  this.getCardMessageFlavor(stackType, 'discard', cards.length, {alternativeCoreKey: coreKey});
                await this.sendMessageForCards( flavor, cards );
        
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

        const currentCard = this.cards.get(cardId);
        const original = await currentCard?.reset({chatNotification: false});

        const coreKey = this.coreStackRef;
        await this.cardStacks.decks[coreKey]?.shuffle({chatNotification: false});

        const flavor = this.getCardMessageFlavor('pile', 'backToDeck', 1);
        await this.sendMessageForCards(flavor,  [original], {letGMSpeak:true} );
    }

    /** 
     * Try to put some cards back in its hand.
     * Cards should currently be in revealed cards
     * @param {string[]} cardsIds cards Ids
     * @returns {CustomCard[]} The returned cards
     */
     async backToHand(cardIds) {

        assertStackOwner(this, {forGMs: true, forPlayers: true});
        assertStackType(this, {piles: true});

        const owner = this.stackOwner;
        const hand = owner.forGMs ? this.cardStacks.gmHand
                                  : this.cardStacks.findPlayerHand( game.users.get(owner.playerId) );
        const cards = await this.pass( hand, cardIds, {chatNotification: false});

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

        const amount = this.availableCards.length;
        await this.reset({chatNotification: false});

        const coreKey = this.coreStackRef;
        await this.cardStacks.decks[coreKey]?.shuffle({chatNotification: false});

        const flavor = this.getCardMessageFlavor('pile', 'backToDeck', amount);
        await this.sendMessageForCards(flavor,  [], {letGMSpeak:true} );
    }

    /** 
     * Play some cards from your hand.
     * It will go to the discard pile.
     * @param {string[]} cardsIds cards Ids
     * @returns {CustomCard[]} The played cards (now in discard pile)
     */
     async playCards(cardsIds) {

        assertStackOwner(this, {forGMs: true, forPlayers: true});
        assertStackType(this, {hands: true, piles: true});

        const playedCards = [];
        for( let [coreKey, pile] of Object.entries( this.cardStacks.piles ) ) {
            const ids = cardsIds.filter( id => {
                const card = this.cards.get(id);
                return card?.source.coreStackRef === coreKey;
            });
            const cards = await this.pass( pile, ids, {action: 'play', chatNotification: false});

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
     * @returns {CustomCard[]} The revealed cards
     */
     async revealCards(cardIds) {

        assertStackOwner(this, {forGMs: true, forPlayers: true});
        assertStackType(this, {hands: true});

        const owner = this.stackOwner;
        const pile = owner.forGMs ? this.cardStacks.gmRevealedCards
                                  : this.cardStacks.findRevealedCards( game.users.get(owner.playerId) );
        const cards = await this.pass( pile, cardIds, {chatNotification: false});

        const flavor = this.getCardMessageFlavor('hand', 'reveal', cardIds.length);
        await this.sendMessageForCards(flavor, cards, {addCardDescription: true} );
        return cards;
    }

    /**
     * Deal some cards to player hands or revealed cards
     * @param {CustomCards[]} to Stack destinations
     * @param {int} amount  amount of cards which should be dealt
     */
    async dealCards(to, amount) {

        assertStackOwner(this, {forNobody: true});
        assertStackType(this, {decks: true});

        await this.deal(to, amount, {chatNotification: false});

        const label = this.getCardMessageFlavor('deck', 'deal', amount);
        const flavor = label.replace('AMOUNT', '' + amount);
        await this.sendMessageForStacks(flavor, to);
    }

    /** 
     * Shuffle a deck.
     */
     async shuffleDeck() {

        assertStackOwner(this, {forNobody: true});
        assertStackType(this, {decks: true});

        await this.shuffle({chatNotification: false});

        const flavor = this.getCardMessageFlavor('deck', 'shuffle', 1);
        await this.sendMessageForStacks(flavor, []);
    }

    /** 
     * Reset a deck.
     */
     async resetDeck() {

        assertStackOwner(this, {forNobody: true});
        assertStackType(this, {decks: true});

        await this.reset({chatNotification: false});
        await this.shuffle({chatNotification: false});

        const flavor = this.getCardMessageFlavor('deck', 'reset', 1);
        await this.sendMessageForStacks(flavor, []);
    }

}
