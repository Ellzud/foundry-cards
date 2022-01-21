import { CardActionParametersForCardSelection, CardActionParametersForPlayerSelection } from './CardActionParameters.js';
import { CustomCardStack } from './cards.js';
import { RTUCardsConfig } from './config.js';
import { CardActionsClasses, GlobalConfiguration } from './constants.js';
import { CustomCardGUIWrapper } from './CustomCardGUIWrapper.js';

export class CustomCardsDisplay extends CardsConfig {

    constructor(cards, options) {
        super(cards, options);

        this._cards = cards;
        this._custom = new CustomCardStack(cards);
        this._currentSelection = null;
        this._listingOpened = true;
        this._forceRotate = false;
        this._peekOn = false;

        this._actionParameters = null;

        // Sheet options
        this.options.classes.push('rtucards');
        this.options.classes.push('cards');
        this.options.template = "modules/ready-to-use-cards/resources/sheet/card-display.hbs";
        this.options.width = 1200;
        this.options.height = 920;
        this.position.width = 1200;
        this.position.height = 920;
    }

    /** @override */
    get title() {

        let result = this._cards.name;
        const cards = this._custom.sortedAvailableCards;
        if( this.currentSelection && cards.length != 0 ) {
            const readableIndex = cards.findIndex( c => c.id === this.currentSelection.id ) + 1;
            result += ' ' + readableIndex + ' / ' + cards.length;
        }
        return result;
    }

    get currentSelection() {
        return this._currentSelection;
    }

    /**
     * Select a card among the available ones
     * If the card has been passed to another crd stack, it won't be selected
     * @param {string} cardId The card Id
     */
     selectAvailableCard( cardId ){
        this._currentSelection =  this._cards.availableCards.find( c => c.id === cardId );
    }

    get listingAllowed() {
        return !this._actionParameters;
    }

    get detailsForced() {
        return this._peekOn;
    }

    get listingOpened() {
        return this._listingOpened;
    }

    get forceRotate() {
        return this._forceRotate;
    }

    set forceRotate(value) {
        this._forceRotate = value;
    }

    /* -------------------------------------------- */

    /**
     * This allow to register / unregister the stacks inside the module
     * Same method as the one triggered inside CustomCardsDirectory. 
     * But only available one for those who have unchecked the 'Invasive code' settings
     * @override 
     * */
    _getHeaderButtons() {
        const buttons = super._getHeaderButtons();

        // Only GM Actions
        if( game.user.isGM ) {

            // Access to action configuration
            if( this._custom.handledByModule && this._custom.stackOwner.forNobody ) {
                buttons.unshift({
                    label: "RTUCards.sidebar.context.configActions",
                    class: "configure-actions",
                    icon: "fas fa-cog",
                    onclick: async () => {
                        const coreKey = this._custom.coreStackRef;
                        // Prepare the sheet
                        const sheet = new RTUCardsConfig();
                        sheet.object.stacks.forEach( s => {
                            s.gui.detailsDisplayed = ( s.key === coreKey );
                        });
                        // And render it
                        sheet.render(true);
                        this.close();
                    }
                });
            }

            // Allow registering of new modules
            if( this._cards.type == 'deck' && !this._custom.handledByModule ) {
                buttons.unshift({
                    label: "RTUCards.sidebar.context.registerDeck",
                    class: "register-deck",
                    icon: "far fa-plus-square",
                    onclick: async () => {
                        await this._custom.registerAsHandledByModule();
                        this.close();
                    }
                });
            }

            // Allow unregistering of custom modules
            if( this._cards.type == 'deck' && this._custom.manuallyRegistered ) {
                buttons.unshift({
                    label: "RTUCards.sidebar.context.unregisterDeck",
                    class: "unregister-deck",
                    icon: "far fa-minus-square",
                    onclick: async () => {
                        await this._custom.unregisterAsHandledByModule();
                        this.close();
                    }
                });
            }
        }

        return buttons
    }

    /* -------------------------------------------- */

    /** @override */
    getData() {
        const data = super.getData();
        this._refreshCurrentSelection();

        data.currentSelection = this._buildCardInfo(this.currentSelection);
        if( !data.currentSelection.contentDisplayed ) {
            const msg = this._custom.localizedLabel('sheet.contentHidden').replace('NB', '' + this._cards.availableCards.length);
            data.currentSelection.summary = msg;
        }

        data.listing = {
            allowed: this.listingAllowed,
            opened: this.listingOpened,
        };
        data.listing.cards = this._custom.sortedAvailableCards.map( c => {
            const cardInfo = this._buildCardInfo(c);
            if( cardInfo.id === this.currentSelection?.id ) {
                cardInfo.classes += ' selected';
            }
            return cardInfo;
        });

        data.actions = this._loadAvailableActions();
        data.parameters = this._actionParameters?.loadParameters() ?? {none: true};
        return data;
    }

    /**
     * Make sure the card is still present on this card stack
     * This check is only done if there is no actionParameters currently in place
     */
    _refreshCurrentSelection() {
        if( !this._actionParameters ) {
            this.selectAvailableCard(this.currentSelection?.id);
        }
    }


    _buildCardInfo(card) {

        const cardInfo = {};
        let wrapper;
        try { 
            wrapper = new CustomCardGUIWrapper(card);
        } catch( e ) {
            // Either : No cards, or an unregistered card stack
            wrapper = null;
        }

        // Check if the content should be displayed or hidden
        if( card ) {
            cardInfo.id = card.id;
            cardInfo.displayed = this.detailsForced || wrapper?.detailsCanBeDisplayed;

        } else {
            cardInfo.displayed = false;
        }

        // Add custom data for display
        if( cardInfo.displayed ) {

            cardInfo.classes = 'display-content';
            cardInfo.cardBg = card.data.faces[0].img;

            if( wrapper.shouldBeRotated( this.forceRotate ) ) {
                cardInfo.classes += ' rotated'; // Also rotate the card if needed
            }

        } else {
            // Choosing background depending on the selected card. Or by default the one in xxx/background/back.webp
            let background = card?.data.back.img;
            if(!background) {
                const owner = this._custom.stackOwner;
                const coreRef = this._custom.coreStackRef;
                const def = game.modules.get('ready-to-use-cards').stacksDefinition;
                let baseDir;
                if( owner.forPlayers ) {
                    baseDir = def.playerStacks.resourceBaseDir;

                } else if (owner.forGMs ) {
                    baseDir = def.gmStacks.resourceBaseDir;

                } else if( def.core.hasOwnProperty(coreRef) ) { // Registered decks and discard piles
                    baseDir = def.core[coreRef].resourceBaseDir;

                } else {
                    baseDir = 'modules/ready-to-use-cards/resources/default';
                }
                
                const type = this._cards.type;
                background = baseDir + '/background/' + (type=='pile'? 'front.webp' : 'back.webp');
            }

            cardInfo.classes = 'cardback';
            cardInfo.cardBg = background;
        }

        return cardInfo;
    }

    /**
     * Load available actions if the current stack is a deck
     * @returns {CardActionData[]}
     */
    _loadDeckActions() {
        const actions = [];

        const def = game.modules.get('ready-to-use-cards').stacksDefinition;
        const css = def.shared.actionCss;

        const deckConfig = this._custom.stackConfig;
        const keys = def.shared.configKeys;
        const tools = def.shared.actionTools;

        if( this.currentSelection ) {
            const wrapper = new CustomCardGUIWrapper(this.currentSelection);
            const selectionActions = wrapper.loadActionsWhileInDeck(this.detailsForced);
            if( selectionActions.length > 0 ) { actions.push( ...selectionActions ); }
        }

        // On decks, default actions are reserved to the GM
        if( game.user.isGM ) {

            if( !this.detailsForced ) {
                const cssAction = css.peekOnDeck + ' ' + css.coloredInRed + ' ' + css.separator;
                tools.addAvailableAction(actions, deckConfig, this._custom, cssAction, 'sheet.actions.peekOn', {allKeys:[keys.fromDeckPeekOn]});
            }

            tools.addAvailableAction(actions, deckConfig, this._custom, css.dealCards, 'sheet.actions.dealCards', {atLeastOne:[keys.fromDeckDealCardsToHand, keys.fromDeckDealRevealedCards]});
            tools.addAvailableAction(actions, deckConfig, this._custom, css.shuffleDeck, 'sheet.actions.shuffleCards', {allKeys:[keys.fromDeckShuffleRemainingCards]});
            tools.addAvailableAction(actions, deckConfig, this._custom, css.recallCards, 'sheet.actions.recallCards', {allKeys:[keys.fromDeckResetAll]});
            tools.addCssOnLastAction(actions, css.separator);
        }

        return actions;
    }

    /**
     * Load available actions if the current stack is a discard pile
     * @returns {CardActionData[]}
     */
     _loadDiscardActions() {
        const actions = [];

        const def = game.modules.get('ready-to-use-cards').stacksDefinition;
        const css = def.shared.actionCss;

        const deckConfig = this._custom.stackConfig;
        const keys = def.shared.configKeys;
        const tools = def.shared.actionTools;

        if( this.currentSelection ) {
            const wrapper = new CustomCardGUIWrapper(this.currentSelection);
            const selectionActions = wrapper.loadActionsWhileInDiscard();
            if( selectionActions.length > 0 ) { actions.push( ...selectionActions ); }
        }

        // On main discards, default actions are reserved to the GM
        if( game.user.isGM ) {
            tools.addAvailableAction(actions, deckConfig, this._custom, css.shuffleDiscard, 'sheet.actions.shuffleDiscard', {allKeys:[keys.fromDiscardResetAll]});
            tools.addCssOnLastAction(actions, css.separator);
        }

        return actions;
    }

    /**
     * Load available actions if the current stack is a player/gm hand
     * @returns {CardActionData[]}
     */
     _loadHandActions() {
        const actions = [];
        const owned = this._custom.ownedByCurrentPlayer;

        const def = game.modules.get('ready-to-use-cards').stacksDefinition;
        const css = def.shared.actionCss;

        const tools = def.shared.actionTools;

        if( this.currentSelection ) {
            const wrapper = new CustomCardGUIWrapper(this.currentSelection);
            const selectionActions = wrapper.loadActionsWhileInHand(owned, this.detailsForced);
            if( selectionActions.length > 0 ) { actions.push( ...selectionActions ); }
        }

        // GM can peek on player hand. But they will be informed he is doing it
        if( !owned && game.user.isGM && !this.detailsForced ) {

            if( game.settings.get("ready-to-use-cards", GlobalConfiguration.everyHandsPeekOn)  ) {
                const cssAction = css.peekOnDeck + ' ' + css.separator + ' ' + css.coloredInRed;
                tools.addAvailableAction(actions, null, this._custom, cssAction, 'sheet.actions.peekOn'); // No deckConfig condition needed
            }
        }

        // The hand can be totally discarded
        if( owned ) {
            if( game.settings.get("ready-to-use-cards", GlobalConfiguration.everyHandsDiscardAll)  ) {
                tools.addAvailableAction(actions, null, this._custom, css.discardHand, 'sheet.actions.discardHand'); // No deckConfig condition needed
            }
        }

        return actions;
    }

    /**
     * Load available actions if the current stack is a player/gm reveal cards stack
     * @returns {CardActionData[]}
     */
     _loadRevealedCardsActions() {
        const actions = [];
        const owned = this._custom.ownedByCurrentPlayer;

        const def = game.modules.get('ready-to-use-cards').stacksDefinition;
        const css = def.shared.actionCss;

        const tools = def.shared.actionTools;

        if( this.currentSelection ) {
            const wrapper = new CustomCardGUIWrapper(this.currentSelection);
            const selectionActions = wrapper.loadActionsWhileInRevealedCards(owned);
            if( selectionActions.length > 0 ) { actions.push( ...selectionActions ); }
        }

        // The revealed cards be totally discarded
        if( owned ) {
            if( game.settings.get("ready-to-use-cards", GlobalConfiguration.everyRevealedDiscardAll)  ) {
                tools.addAvailableAction(actions, null, this._custom, css.discardRevealedCards, 'sheet.actions.discardRevealedCards'); // No deckConfig condition needed
            }
        }


        return actions;
    }


    /**
     * Load available actions wich will be displayed inside GUI.
     * Those will differ with the stack type and the current selection.
     * @returns {CardActionData[]}
     */
     _loadAvailableActions() {
		const cardStacks = game.modules.get('ready-to-use-cards').cardStacks;
        const mainDecks = Object.values( cardStacks.decks );
        const mainDiscards = Object.values( cardStacks.piles );

        // Main decks specificactions
        if( mainDecks.find( d => d.stack == this._custom.stack ) ) {
            return this._loadDeckActions();

        // Discard piles
        } else if( mainDiscards.find( d => d.stack == this._custom.stack ) ) { 
            return this._loadDiscardActions();

        // For player and GM hands
        } else if( this._cards.type == 'hand' ) { 
            return this._loadHandActions();

        // For player and GM revealed cards
        } else {
            return this._loadRevealedCardsActions();
        }
    }
    
    /* -------------------------------------------- */

    /** @override */
    activateListeners(html) {

        // Before mapping listeners, add content inside each cardSlot
        this.addAdditionnalContentOnCards(html);

        // Mapping every actions
        //-------------------------
        const css = Object.entries(CardActionsClasses).reduce( (_css, entry) => {
            const key = entry[0];
            const cssPath = '.card-action.' + entry[1];
            _css[key] = cssPath;
            return _css;
        }, {});

        html.find(css.backToDeckCard).click(event => this._onClickBackToDeck(event) );
        html.find(css.backToHandCard).click(event => this._onClickBackToHand(event) );
        html.find(css.discardCard).click(event => this._onClickDiscardCard(event) );
        html.find(css.giveCard).click(event => this._onClickGiveCard(event) );
        html.find(css.exchangeCard).click(event => this._onClickExchangeCard(event) );
        html.find(css.playCard).click(event => this._onClickPlayCard(event) );
        html.find(css.playMultiple).click(event => this._onClickPlayMultipleCards(event) );
        html.find(css.revealCard).click(event => this._onClickRevealCard(event) );
        html.find(css.rotateCard).click(event => this._onClickRotateCard(event) );
        html.find(css.customAction).click(event => this._onClickCustomAction(event) );

        html.find(css.dealCards).click(event => this._onClickDealCards(event) );
        html.find(css.recallCards).click(event => this._onClickRecallAllCards(event) );
        html.find(css.peekOnDeck).click(event => this._onClickPeekOnStack(event) );
        html.find(css.shuffleDeck).click(event => this._onClickShuffleDeck(event) );
        html.find(css.shuffleDiscard).click(event => this._onClickShuffleDiscard(event) );
        html.find(css.discardHand).click(event => this._onClickDiscardHand(event) );
        html.find(css.discardRevealedCards).click(event => this._onClickDiscardRevealedCards(event) );

        // Parameters clicks
        //-------------------------
        this._actionParameters?.addListeners(html);

        // Listing panel clicks
        //-------------------------
        html.find(".listing-panel .listing-toggle").click(event => this._onClickDisplayListing(event) );
        html.find(".listing-panel .card-slot").click(event => this._onClickToggleSelection(event) );
    }

    addAdditionnalContentOnCards(html) {
        // Loop on every card which should have its content displayed
        const cardSlots = html.find(".card-slot.display-content");
        for( let index = 0; index < cardSlots.length; index++ ) {
            const htmlDiv = cardSlots[index];
            const cardId = htmlDiv.dataset.key;
            if(cardId) { 
                const card = this._cards.cards.get(cardId);
                if( card ) {
                    const wrapper = new CustomCardGUIWrapper(card);
                    wrapper.fillCardContent(htmlDiv);
                }
                
            }
        }
    
    }

    async _onClickBackToDeck(event) {
        event.preventDefault();
        await this._custom.backToDeck(this.currentSelection?.id);
        this.selectAvailableCard(null);

        this.render();
    }

    async _onClickBackToHand(event) {
        event.preventDefault();
        await this._custom.backToHand([this.currentSelection?.id]);
        this.selectAvailableCard(null);

        this.render();
    }

    async _onClickDealCards(event) {
        event.preventDefault();

        const options = {
            specifyAmount: true,
            buttonLabel: this._custom.localizedLabel('sheet.actions.dealCards')
        };

        const selectTitle = this._custom.localizedLabel('sheet.parameters.players.dealTitle');
        this._actionParameters = new CardActionParametersForPlayerSelection(this, selectTitle, options );
        this.render(true);
    }

    async _onClickDisplayListing(event) {
        event.preventDefault();
        this._listingOpened = !this._listingOpened;
        this.render();
    }

    async _onClickDiscardCard(event) {
        event.preventDefault();
        await this._custom.discardCards([this.currentSelection.id]);

        this.render();
    }

    async _onClickDiscardHand(event) {
        event.preventDefault();

        const cardIds = this._custom.availableCards.map( c => c.id );
        await this._custom.discardCards(cardIds),

        this.render();
    }

    async _onClickDiscardRevealedCards(event) {
        event.preventDefault();

        const cardIds = this._cards.availableCards.map( c => c.id );
        await this._custom.discardCards(cardIds),

        this.render();
    }

    async _onClickGiveCard(event) {
        event.preventDefault();

        const options = {
            onlyOne: true,
            buttonLabel: this._custom.localizedLabel('sheet.actions.giveCard') 
        };

        options.callBack = async (selection, selectedStacks, amount) => { 
            const deck = this._custom;
            const receiver = selectedStacks[0];
            await deck.giveCards(receiver, [selection.id] );
        };

        const selectTitle = this._custom.localizedLabel('sheet.parameters.players.giveTitle');
        this._actionParameters = new CardActionParametersForPlayerSelection(this, selectTitle, options );

        this.render();
    }

    async _onClickExchangeCard(event) {
        event.preventDefault();

        const cardStacks = game.modules.get('ready-to-use-cards').cardStacks;
        const custom = new CustomCardStack(this.currentSelection.source);
        const coreKey = custom.coreStackRef;
        const discard = cardStacks.piles[coreKey];

        const options = {
            from: discard, 
            buttonLabel: this._custom.localizedLabel('sheet.actions.exchangeCard') 
        };

        options.criteria = (card) => { 
            const custom = new CustomCardStack(card.source);
            return custom.coreStackRef === coreKey; 
        };
        options.callBack = async (selection, additionalCards) => { 
            const stack = this._custom;
            await stack.exchangeCards(discard, [selection.id], additionalCards.map( c => c.id ) );
        };

        const selectTitle = this._custom.localizedLabel('sheet.parameters.stacks.exchangeTitle');
        this._actionParameters = new CardActionParametersForCardSelection(this, selectTitle, options );

        this.render();
    }

    async _onClickPeekOnStack(event) {
        event.preventDefault();

        const flavor = this._custom.localizedLabel('sheet.actions.peekOnWarning').replace('STACK', this._cards.name);
        await this._custom.sendMessageForStacks(flavor, []);

        this._peekOn = true;
        this.render();
    }

    async _onClickPlayCard(event) {
        event.preventDefault();
        await this._custom.playCards([this.currentSelection.id]);
        this.render();
    }

    async _onClickPlayMultipleCards(event) {
        event.preventDefault();

        const custom = new CustomCardStack(this.currentSelection.source);
        const coreKey = custom.coreStackRef;
        const maxCards = this._custom.sortedAvailableCards.filter(c => {
            const ccs = new CustomCardStack(c.source);
            return ccs.coreStackRef == coreKey;
        }).length;
        const options = {
            maxAmount: Math.max(1, maxCards-1),
            buttonLabel: this._custom.localizedLabel('sheet.actions.playMultiple') 
        };

        options.criteria = (card) => { 
            const ccs = new CustomCardStack(card.source);
            return ccs.coreStackRef === coreKey; 
        };
        options.callBack = async (selection, additionalCards) => { 
            const cardIds = [selection.id];
            cardIds.push(...additionalCards.map(c => c.id));
            await this._custom.playCards(cardIds);
        };

        const selectTitle = this._custom.localizedLabel('sheet.parameters.stacks.playTitle');
        this._actionParameters = new CardActionParametersForCardSelection(this, selectTitle, options );

        this.render();
    }

    async _onClickRevealCard(event) {
        event.preventDefault();
        await this._custom.revealCards([this.currentSelection.id]);
        this.render();
    }

    async _onClickShuffleDeck(event) {
        event.preventDefault();
        this.selectAvailableCard(null);
        await this._custom.shuffleDeck();
    }

    async _onClickToggleSelection(event) {
        event.preventDefault();
        const key = event.currentTarget.dataset.key;
        
        const unselect = key === this.currentSelection?.id;
        this.selectAvailableCard( unselect ? null : key);
        this.render();
    }

    async _onClickCustomAction(event) {
        event.preventDefault();
        const action = event.currentTarget.dataset.action;
        const wrapper = new CustomCardGUIWrapper(this.currentSelection);
        await wrapper.onClickDoCustomAction(action);
    }

    async _onClickRecallAllCards(event) {
        event.preventDefault();
        this.selectAvailableCard(null);
        await this._custom.resetDeck();
    }

    async _onClickRotateCard(event) {
        event.preventDefault();
        this.forceRotate = !this.forceRotate;
        this.render();
    }

    async _onClickShuffleDiscard(event) {
        event.preventDefault();
        await this._custom.shuffleDiscardIntoDeck();
    }

}
