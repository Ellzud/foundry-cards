import { CardActionParametersForCardSelection, CardActionParametersForPlayerSelection } from './CardActionParameters.js';
import { CustomCardGUIWrapper } from './CustomCardGUIWrapper.js';
import { CustomCardStack } from '../CustomCardStack.js';
import { CardActionsClasses, GlobalConfiguration } from '../constants.js';
import { deckBacksSettings } from '../tools.js';
import { ConfigSheetForActions } from '../config/ConfigSheetForActions.js';
import { ConfigSheetForBacks } from '../config/ConfigSheetForBacks.js';

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
        const resized = game.settings.get('ready-to-use-cards', GlobalConfiguration.smallDisplay);
        const configScale = resized ? 0.8 : 1;

        // Sheet options
        this.options.classes.push('rtucards');
        this.options.classes.push('cards');
        if( resized ) {
            this.options.classes.push('resized');
        }
        this.options.template = "modules/ready-to-use-cards/resources/sheet/card-display.hbs";
        this.options.scrollY = [".all-cards", ".parameters-stacks .stacks", ".parameters-cards .cards"];
        this.options.width = 1200 * configScale;
        this.options.height = 920 * configScale;
        this.position.width = 1200 * configScale;
        this.position.height = 920 * configScale;
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
                        const sheet = new ConfigSheetForActions();
                        sheet.object.stacks.forEach( s => {
                            s.gui.detailsDisplayed = ( s.key === coreKey );
                        });
                        // And render it
                        sheet.render(true);
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

    /**
     * I wish for players with only limited right to be able to see the sheet 
     * Bypassing SidebarSheet implem.
     * @override 
     * */
    render(force=false, options={}) {
        this._render(force, options).catch(err => {
          this._state = Application.RENDER_STATES.ERROR;
          Hooks.onError("Application#render", err, {
            msg: `An error occurred while rendering ${this.constructor.name} ${this.appId}`,
            log: "error",
            ...options
          });
        });
        return this;
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
            editBack : {
                displayed : game.user.isGM && this._custom.stackOwner.forNobody
            }
        };
        data.listing.cards = this._custom.sortedAvailableCards.map( c => {
            const cardInfo = this._buildCardInfo(c);
            if( cardInfo.id === this.currentSelection?.id ) {
                cardInfo.classes += ' selected';
            }
            return cardInfo;
        });

        const actions = this._loadAvailableActions();
        data.onLeft = {
            header: this._custom.localizedLabel('sheet.headers.defaultActions'),
            actions: actions.filter(a => a.onLeft)
        }
        data.onRight = {
            header: this._custom.localizedLabel('sheet.headers.selectedCardActions'),
            actions: actions.filter(a => !a.onLeft)
        }
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
            cardInfo.cardBg = wrapper.currentFace.img;

            const rotateAsked = this.forceRotate && card.id === this.currentSelection?.id;
            if( wrapper.shouldBeRotated( rotateAsked ) ) {
                cardInfo.classes += ' rotated'; // Also rotate the card if needed
            }

        } else {
            // Choosing background depending on the selected card. Or by default the one in xxx/background/back.webp
            let background = card?.data.back.img;
            if(!background) {
                const type = this._cards.type;
                const owner = this._custom.stackOwner;
                const coreRef = this._custom.coreStackRef;
                const def = game.modules.get('ready-to-use-cards').stacksDefinition;
                if( owner.forPlayers || owner.forGMs ) {
                    const base = owner.forPlayers ? def.playerStacks : def.gmStacks;
                    const baseDir = base.resourceBaseDir;
                    background = baseDir + '/background/' + (type=='pile'? 'front.webp' : 'back.webp');

                } else {
                    const backSettings = deckBacksSettings(coreRef);
                    background = type=='pile' ? backSettings.discardBg : backSettings.deckBg;
                }
            }

            cardInfo.classes = 'cardback';
            cardInfo.cardBg = background;
        }

        return cardInfo;
    }

    /* -------------------------------------------- */

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

    /**
     * Load available actions if the current stack is a deck
     * @returns {CardActionData[]}
     */
    _loadDeckActions() {
        const actions = [];
        this._loadDeckActionsForSelectedCard(actions);
        this._loadDeckActionsByDefault(actions);

        return actions;
    }

    /**
     * Add actions on the right side corresponding to the selected card in the deck
     * @param {object[]} actions Action list currently in built
     * @returns {CardActionData[]}
     */
     _loadDeckActionsForSelectedCard(actions) {

        if( this.currentSelection ) {
            const wrapper = new CustomCardGUIWrapper(this.currentSelection);
            const selectionActions = wrapper.loadActionsWhileInDeck(this.detailsForced);
            if( selectionActions.length > 0 ) { actions.push( ...selectionActions ); }
        }
    }

    
    /**
     * Default actions when handling decks
     * Overriden by SingleCardDisplay so that deck actions are not available when simply seeing a card
     * @param {object[]} actions Action list currently in built
     * @returns {CardActionData[]}
     */
     _loadDeckActionsByDefault(actions) {

        const deckKey = this._custom.coreStackRef;
        const prefix = this._custom.prefixForActions; // "DE"
        const service = game.modules.get('ready-to-use-cards').actionService;

        const possibilities = [];
        possibilities.push( ...service.getActionPossibilities(deckKey, ["peekOnCards"], {from: prefix}) );
        possibilities.push( ...service.getActionPossibilities(deckKey, ["dealCard", "shuffleDeck", "resetDeck"]) );

        const isOwner = this._cards.testUserPermission(game.user, "OWNER");
        const cardsLeft = this._cards.availableCards.length > 0;

        possibilities.forEach( p => {

            const guiAction = service.asGUIAction(p);
            switch( p.signature ) {

                case "peekOnCards-peek" : {
                    if( !isOwner || !cardsLeft ) { return; }
                    guiAction.classes += " red separator";
                    break;
                }

                case "dealCard-deal" :
                case "shuffleDeck-shuffle" : 
                case "resetDeck-reset" : {
                    if( !cardsLeft ) { return; }
                    break;
                }
            }
            actions.push(guiAction);
        });
    }

    /**
     * Load available actions if the current stack is a discard pile
     * @returns {CardActionData[]}
     */
     _loadDiscardActions() {
        const actions = [];
        this._loadDiscardActionsForSelectedCard(actions);
        this._loadDiscardActionsByDefault(actions);

        return actions;
    }

    /**
     * Add actions on the right side corresponding to the selected card in the discard
     * @param {object[]} actions Action list currently in built
     * @returns {CardActionData[]}
     */
     _loadDiscardActionsForSelectedCard(actions) {
        if( this.currentSelection ) {
            const wrapper = new CustomCardGUIWrapper(this.currentSelection);
            const selectionActions = wrapper.loadActionsWhileInDiscard();
            if( selectionActions.length > 0 ) { actions.push( ...selectionActions ); }
        }
    }

    /**
     * Default actions when handling discards
     * Overriden by SingleCardDisplay so that deck actions are not available when simply seeing a card
     * @param {object[]} actions Action list currently in built
     * @returns {CardActionData[]}
     */
     _loadDiscardActionsByDefault(actions) {

        const deckKey = this._custom.coreStackRef;
        const service = game.modules.get('ready-to-use-cards').actionService;

        const possibilities = service.getActionPossibilities(deckKey, ["shuffleDiscard", "resetDiscard"]);

        const isOwner = this._cards.testUserPermission(game.user, "OWNER");
        const cardsLeft = this._cards.availableCards.length > 0;

        possibilities.forEach( p => {

            const guiAction = service.asGUIAction(p);
            switch( p.signature ) {

                case "shuffleDiscard-shuffle" :
                case "resetDiscard-reset" : {
                    if( !isOwner || !cardsLeft ) { return; }
                    break;
                }
            }
            actions.push(guiAction);
        });
    }

    /**
     * Load available actions if the current stack is a player/gm hand
     * @returns {CardActionData[]}
     */
     _loadHandActions()  {
        const actions = [];
        this._loadHandActionsForSelectedCard(actions);
        this._loadHandActionsByDefault(actions);

        return actions;
    }

    /**
     * Add actions on the right side corresponding to the selected card in someone hand
     * @param {object[]} actions Action list currently in built
     * @returns {CardActionData[]}
     */
     _loadHandActionsForSelectedCard(actions) {

        const owned = this._custom.ownedByCurrentPlayer;
        if( this.currentSelection ) {
            const wrapper = new CustomCardGUIWrapper(this.currentSelection);
            const selectionActions = wrapper.loadActionsWhileInHand(owned, this.detailsForced);
            if( selectionActions.length > 0 ) { actions.push( ...selectionActions ); }
        }
    }

    /**
     * Default actions when handling player hands
     * Overriden by SingleCardDisplay so that deck actions are not available when simply seeing a card
     * @param {object[]} actions Action list currently in built
     * @returns {CardActionData[]}
     */
     _loadHandActionsByDefault(actions) {

        const prefix = this._custom.prefixForActions; // "GH" or "PH"
        const service = game.modules.get('ready-to-use-cards').actionService;

        const isOwned = this._custom.ownedByCurrentPlayer;
        const cardsLeft = this._cards.availableCards.length > 0;

        if( isOwned ) {
            // Drawing cards from each decks and discards
            Object.values(this._custom.cardStacks.decks).filter( deck => {
                return deck.stack.testUserPermission(game.user, "OBSERVER");
            }).forEach( deck => {
                const deckName = deck.retrieveStackBaseName();
                const deckPossibilities = service.getActionPossibilities(deck.coreStackRef, ["drawDeckCard", "drawDiscardCard"], {from: prefix});

                const guiActions = deckPossibilities.map( p => service.asGUIAction(p, {action: deck.coreStackRef}) );
                guiActions.forEach( a => a.label += ` (${deckName})` );
                actions.push(...guiActions);
            });

        } else if( game.user.isGM && cardsLeft ) {
            // Allow to peek on cards
            const possibilities = service.getActionPossibilities(deckKey, ["peekOnCards"], {from: prefix});
            const guiActions = possibilities.map( p => service.asGUIAction(p) );
            actions.push(...guiActions);
        }
    }


    /**
     * Load available actions if the current stack is a player/gm reveal cards stack
     * @returns {CardActionData[]}
     */
     _loadRevealedCardsActions()  {
        const actions = [];
        this._loadRevealedCardsActionsForSelectedCard(actions);
        this._loadRevealedCardsActionsByDefault(actions);

        return actions;
    }

    /**
     * Add actions on the right side corresponding to the selected card in someone revealed cards
     * @param {object[]} actions Action list currently in built
     * @returns {CardActionData[]}
     */
     _loadRevealedCardsActionsForSelectedCard(actions) {
        const owned = this._custom.ownedByCurrentPlayer;
        if( this.currentSelection ) {
            const wrapper = new CustomCardGUIWrapper(this.currentSelection);
            const selectionActions = wrapper.loadActionsWhileInRevealedCards(owned);
            if( selectionActions.length > 0 ) { actions.push( ...selectionActions ); }
        }
    }

    /**
     * Default actions when handling player revealed cards
     * Overriden by SingleCardDisplay so that deck actions are not available when simply seeing a card
     * @param {object[]} actions Action list currently in built
     * @returns {CardActionData[]}
     */
     _loadRevealedCardsActionsByDefault(actions) {

        const prefix = this._custom.prefixForActions; // "GR" or "PR"
        const service = game.modules.get('ready-to-use-cards').actionService;

        const isOwned = this._custom.ownedByCurrentPlayer;

        if( isOwned ) {
            // Drawing cards from each decks and discards
            Object.values(this._custom.cardStacks.decks).filter( deck => {
                return deck.stack.testUserPermission(game.user, "OBSERVER");
            }).forEach( deck => {
                const deckName = deck.retrieveStackBaseName();
                const deckPossibilities = service.getActionPossibilities(deck.coreStackRef, ["drawDeckCard", "drawDiscardCard"], {from: prefix});

                const guiActions = deckPossibilities.map( p => service.asGUIAction(p, {action: deck.coreStackRef}) );
                guiActions.forEach( a => a.label += ` (${deckName})` );
                actions.push(...guiActions);
            });

        }
    }

    
    /* -------------------------------------------- */

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

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
        html.find(css.drawCard).click(event => this._onClickDrawCard(event) );
        html.find(css.discardCard).click(event => this._onClickDiscardCard(event) );
        html.find(css.giveCard).click(event => this._onClickGiveCard(event) );
        html.find(css.exchangeCard).click(event => this._onClickExchangeCard(event) );
        html.find(css.exchangePlayer).click(event => this._onClickExchangePlayer(event) );
        html.find(css.loopFaces).click(event => this._onClickLoopThroughCardFaces(event) );
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
        html.find(".listing-panel .listing-icon.toggle").click(event => this._onClickDisplayListing(event) );
        html.find(".listing-panel .listing-icon.edit-backs").click(event => this._onClickDisplayBacksEdition(event) );
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

    async _onClickDisplayBacksEdition(event) {
        const sheet = new ConfigSheetForBacks(this._custom.coreStackRef);
        sheet.render(true);
    }

    async _onClickDrawCard(event) {
        event.preventDefault();
        const coreKey = event.currentTarget.dataset.action;

        const deck = this._custom.cardStacks.decks[coreKey];
        const deckCards = deck.sortedAvailableCards;

        const cardIds = deckCards.length > 0 ? [deckCards[0].id] : [];
        await deck.giveCards(this._custom, cardIds );
        this.render();
    }

    async _onClickDiscardCard(event) {
        event.preventDefault();
        await this._custom.discardCards([this.currentSelection.id]);

        this.render();
    }

    async _onClickDiscardHand(event) {
        event.preventDefault();

        const cardIds = this._cards.availableCards.map( c => c.id );
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

    /**
     * Exchange a card with the discard
     */
    async _onClickExchangeCard(event) {
        event.preventDefault();

        const cardStacks = game.modules.get('ready-to-use-cards').cardStacks;
        const custom = new CustomCardStack(this.currentSelection.source);
        const coreKey = custom.coreStackRef;
        const discard = cardStacks.piles[coreKey];

        const options = {
            fromStacks: [discard], 
            buttonLabel: this._custom.localizedLabel('sheet.actions.exchangeCard') 
        };

        options.criteria = (card) => { 
            const custom = new CustomCardStack(card.source);
            return custom.coreStackRef === coreKey; 
        };
        options.callBack = async (selection, from, additionalCards) => { 
            const stack = this._custom;
            await stack.exchangeCards(from, [selection.id], additionalCards.map( c => c.id ) );
        };

        const selectTitle = this._custom.localizedLabel('sheet.parameters.cards.exchangeTitle');
        this._actionParameters = new CardActionParametersForCardSelection(this, selectTitle, options );

        this.render();
    }

    /**
     * Exchange a card with another player
     */
     async _onClickExchangePlayer(event) {
        event.preventDefault();

        const cardStacks = game.modules.get('ready-to-use-cards').cardStacks;
        const deck = new CustomCardStack(this.currentSelection.source);
        const coreKey = deck.coreStackRef;

        // User will have to choose among all player stacks of the same type
        const isHand = this._cards.type == 'hand';
        const allStacks = [];
        if( isHand ) {
            allStacks.push(cardStacks.gmHand);
            allStacks.push(...cardStacks.allPlayerHands);
        } else {
            allStacks.push(cardStacks.gmRevealedCards);
            allStacks.push(...cardStacks.allPlayerRevealedCards);
        }

        const options = {
            fromStacks: allStacks.filter(s => s.stack.id != this._cards.id ), 
            buttonLabel: this._custom.localizedLabel('sheet.actions.exchangePlayer') 
        };

        options.criteria = (card) => { 
            const custom = new CustomCardStack(card.source);
            return custom.coreStackRef === coreKey; 
        };
        options.callBack = async (selection, from, additionalCards) => { 
            const stack = this._custom;
            await stack.exchangeCards(from, [selection.id], additionalCards.map( c => c.id ) );
        };

        const selectTitle = this._custom.localizedLabel('sheet.parameters.cards.exchangeTitle');
        this._actionParameters = new CardActionParametersForCardSelection(this, selectTitle, options );

        this.render();
    }

    async _onClickPeekOnStack(event) {
        event.preventDefault();

        const wasPeeking = this._peekOn;

        const labelKey = wasPeeking ? 'sheet.actions.peekStopWarning' : 'sheet.actions.peekOnWarning';
        const flavor = this._custom.localizedLabel(labelKey);
        await this._custom.sendMessageForStacks(flavor, []);

        this._peekOn = !wasPeeking;
        this.render();
    }

    async _onClickLoopThroughCardFaces(event) {
        event.preventDefault();

        try { 
            const wrapper = new CustomCardGUIWrapper(this.currentSelection);
            await wrapper.nextFace();
        } catch( e ) {
           console.error(e); // SHould not happen : Card making this action available will be wrappable
        }
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
        options.callBack = async (selection, from, additionalCards) => { 
            const cardIds = [selection.id];
            cardIds.push(...additionalCards.map(c => c.id));
            await this._custom.playCards(cardIds);
        };

        const selectTitle = this._custom.localizedLabel('sheet.parameters.cards.playTitle');
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
