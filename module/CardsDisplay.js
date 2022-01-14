import { CardActionParametersForPlayerSelection } from './CardActionParameters.js';
import { CardActionsClasses } from './constants.js';

export class CustomCardsDisplay extends CardsConfig {

    constructor(cards, options) {
        super(cards, options);

        this._cards = cards;
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
        const cards = this._cards.sortedAvailableCards;
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

    /** @override */
    getData() {
        const data = super.getData();
        this._refreshCurrentSelection();

        data.currentSelection = this._buildCardInfo(this.currentSelection);
        if( !data.currentSelection.contentDisplayed ) {
            const msg = this._cards.localizedLabel('sheet.contentHidden').replace('NB', '' + this._cards.availableCards.length);
            data.currentSelection.summary = msg;
        }

        data.listing = {
            allowed: this.listingAllowed,
            opened: this.listingOpened,
        };
        data.listing.cards = this._cards.sortedAvailableCards.map( c => {
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

        // Check if the content should be displayed or hidden
        if( card ) {
            cardInfo.id = card.id;
            cardInfo.displayed = this.detailsForced || card.impl.detailsCanBeDisplayed;

        } else {
            cardInfo.displayed = false;
        }

        // Add custom data for display
        if( cardInfo.displayed ) {

            cardInfo.classes = 'display-content';
            cardInfo.cardBg = card.data.faces[0].img;

            if( card.impl.shouldBeRotated( this.forceRotate ) ) {
                cardInfo.classes += ' rotated'; // Also rotate the card if needed
            }

        } else {
            // Choosing background depending on the selected card. Or by default the one in xxx/background/back.webp
            let background = card?.data.back.img;
            if(!background) {
                const owner = this._cards.stackOwner;
                const def = game.modules.get('ready-to-use-cards').stacksDefinition;
                let baseDir;
                if( owner.forPlayers ) {
                    baseDir = def.playerStacks.resourceBaseDir;

                } else if (owner.forGMs ) {
                    baseDir = def.gmStacks.resourceBaseDir;

                } else {
                    const coreRef = this._cards.coreStackRef;
                    baseDir = def.core[coreRef].resourceBaseDir;
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
        const cl = CardActionsClasses;

        if( this.currentSelection ) {
            const selectionActions = this.currentSelection.impl.loadActionsWhileInDeck(this.detailsForced);
            if( selectionActions.length > 0 ) { actions.push( ...selectionActions ); }
        }

        // On decks, default actions are reserved to the GM
        if( game.user.isGM ) {

            if( !this.detailsForced ) {
                actions.push({ 
                    classes: cl.coloredInRed + ' ' + cl.separator + ' ' + cl.peekOnDeck, 
                    label: this._cards.localizedLabel('sheet.actions.peekOn') 
                });
            }

            actions.push({ 
                classes: cl.dealCards, 
                label: this._cards.localizedLabel('sheet.actions.dealCards') 
            });
            actions.push({ 
                classes: cl.recallCards, 
                label: this._cards.localizedLabel('sheet.actions.recallCards') 
            });
            actions.push({ 
                classes: cl.separator + ' ' + cl.shuffleDeck, 
                label: this._cards.localizedLabel('sheet.actions.shuffleCards') 
            });
        }

        return actions;
    }

    /**
     * Load available actions if the current stack is a discard pile
     * @returns {CardActionData[]}
     */
     _loadDiscardActions() {
        const actions = [];
        const cl = CardActionsClasses;

        if( this.currentSelection ) {
            const selectionActions = this.currentSelection.impl.loadActionsWhileInDiscard();
            if( selectionActions.length > 0 ) { actions.push( ...selectionActions ); }
        }

        // On main discards, default actions are reserved to the GM
        if( game.user.isGM ) {
            actions.push({ 
                classes: cl.separator + ' ' + cl.shuffleDiscard, 
                label: this._cards.localizedLabel('sheet.actions.shuffleDiscard') 
            });
        }

        return actions;
    }

    /**
     * Load available actions if the current stack is a player/gm hand
     * @returns {CardActionData[]}
     */
     _loadHandActions() {
        const actions = [];
        const cl = CardActionsClasses;
        const owned = this._cards.ownedByCurrentPlayer;

        if( this.currentSelection ) {
            const selectionActions = this.currentSelection.impl.loadActionsWhileInHand(owned, this.detailsForced);
            if( selectionActions.length > 0 ) { actions.push( ...selectionActions ); }
        }

        // GM can peek on player hand. But they will be informed he is doing it
        if( !owned && game.user.isGM && !this.detailsForced ) {
            actions.push({ 
                classes: cl.coloredInRed + ' ' + cl.separator + ' ' + cl.peekOnDeck, 
                label: this._cards.localizedLabel('sheet.actions.peekOn') 
            });
        }

        // The hand can be totally discarded
        if( owned ) {
            actions.push({ 
                classes: cl.discardHand, 
                label: this._cards.localizedLabel('sheet.actions.discardHand') 
            });
        }

        return actions;
    }

    /**
     * Load available actions if the current stack is a player/gm reveal cards stack
     * @returns {CardActionData[]}
     */
     _loadRevealedCardsActions() {
        const actions = [];
        const owned = this._cards.ownedByCurrentPlayer;

        if( this.currentSelection ) {
            const selectionActions = this.currentSelection.impl.loadActionsWhileInRevealedCards(owned);
            if( selectionActions.length > 0 ) { actions.push( ...selectionActions ); }
        }

        // No default actions for this stack

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
        if( mainDecks.find( d => d == this._cards ) ) {
            return this._loadDeckActions();

        // Discard piles
        } else if( mainDiscards.find( d => d == this._cards ) ) { 
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
        html.find(css.playCard).click(event => this._onClickPlayCard(event) );
        html.find(css.revealCard).click(event => this._onClickRevealCard(event) );
        html.find(css.rotateCard).click(event => this._onClickRotateCard(event) );
        html.find(css.customAction).click(event => this._onClickCustomAction(event) );

        html.find(css.dealCards).click(event => this._onClickDealCards(event) );
        html.find(css.recallCards).click(event => this._onClickRecallAllCards(event) );
        html.find(css.peekOnDeck).click(event => this._onClickPeekOnSack(event) );
        html.find(css.shuffleDeck).click(event => this._onClickShuffleDeck(event) );
        html.find(css.shuffleDiscard).click(event => this._onClickShuffleDiscard(event) );
        html.find(css.discardHand).click(event => this._onClickDiscardHand(event) );

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
                card?.impl.fillCardContent(htmlDiv);
            }
        }
    
    }

    async _onClickBackToDeck(event) {
        event.preventDefault();
        await this._cards.backToDeck(this.currentSelection?.id);
        this.selectAvailableCard(null);

        this.render();
    }

    async _onClickBackToHand(event) {
        event.preventDefault();
        await this._cards.backToHand([this.currentSelection?.id]);
        this.selectAvailableCard(null);

        this.render();
    }

    async _onClickDealCards(event) {
        event.preventDefault();

        const options = {
            specifyAmount: true,
            buttonLabel: this._cards.localizedLabel('sheet.actions.dealCards')
        };

        const selectTitle = this._cards.localizedLabel('sheet.parameters.players.dealTitle');
        this._actionParameters = new CardActionParametersForPlayerSelection(this, selectTitle, options );
        this.render();
    }

    async _onClickDisplayListing(event) {
        event.preventDefault();
        this._listingOpened = !this._listingOpened;
        this.render();
    }

    async _onClickDiscardCard(event) {
        event.preventDefault();
        await this._cards.discardCards([this.currentSelection.id]);

        this.render();
    }

    async _onClickDiscardHand(event) {
        event.preventDefault();

        // For now, only events are stored in hands.
        const cardIds = this._cards.availableCards.map( c => c.id );
        await this._cards.discardCards(cardIds),

        this.render();
    }

    async _onClickGiveCard(event) {
        event.preventDefault();

        const options = {
            onlyOne: true,
            buttonLabel: this._cards.localizedLabel('sheet.actions.giveCard') 
        };

        options.callBack = async (selection, selectedStacks, amount) => { 
            const deck = this._cards;
            const receiver = selectedStacks[0];
            await deck.giveCards(receiver, [selection.id] );
        };

        const selectTitle = this._cards.localizedLabel('sheet.parameters.players.giveTitle');
        this._actionParameters = new CardActionParametersForPlayerSelection(this, selectTitle, options );

        this.render();
    }

    async _onClickPeekOnSack(event) {
        event.preventDefault();

        const flavor = this._cards.localizedLabel('sheet.actions.peekOnWarning').replace('STACK', this._cards.name);
        await this._cards.sendMessageForStacks(flavor, []);

        this._peekOn = true;
        this.render();
    }

    async _onClickPlayCard(event) {
        event.preventDefault();
        await this._cards.playCards([this.currentSelection.id]);
        this.render();
    }

    async _onClickRevealCard(event) {
        event.preventDefault();
        await this._cards.revealCards([this.currentSelection.id]);
        this.render();
    }

    async _onClickShuffleDeck(event) {
        event.preventDefault();
        this.selectAvailableCard(null);
        await this._cards.shuffleDeck();
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
        await this.currentSelection.impl.onClickDoCustomAction(action);
    }

    async _onClickRecallAllCards(event) {
        event.preventDefault();
        this.selectAvailableCard(null);
        await this._cards.resetDeck();
    }

    async _onClickRotateCard(event) {
        event.preventDefault();
        this.forceRotate = !this.forceRotate;
        this.render();
    }

    async _onClickShuffleDiscard(event) {
        event.preventDefault();
        await this._cards.shuffleDiscardIntoDeck();
    }

}
