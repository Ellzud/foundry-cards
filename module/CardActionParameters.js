import { CustomCardStack } from "./cards.js";
import { GlobalConfiguration, StackConfiguration } from "./constants.js";

export class CardActionParametersBase {
    
    constructor( sheet, actionTitle ) {
        this.sheet = sheet;
        this.actionTitle = actionTitle;
    }
    /**
     * What will actually be loaded will depend on this._actionParameters.type
     * @returns {object} will be stored inside data.parameters
     */
    loadParameters() { 
        return {
            title: this.actionTitle
        }; 
    }

    addListeners(html) {
        html.find(".parameters-panel .cancel").click(event => this.resumeAction() );

    }

    resumeAction() {
        this.sheet._actionParameters = null;
        this.sheet.render();
    }
}

export class CardActionParametersForCardSelection extends CardActionParametersBase {

    /**
     * Used to inform the GUI that the user needs to select some additional cards
     * @param {CustomCardsDisplay} sheet The sheet where those paramters will be chosen
     * @param {string} actionTitle What will be displayed on top of the selection
     * @param {CustomCardStack} [from] From which stack, the cards would be displayed
     * @param {int} [minAmount] min amount of cards which needs to be selected before the 'OK' button becomes available
     * @param {int} [maxAmount] max amount
     * @param {string} [buttonLabel] What the say inside the ok button.
     * @param {*} [criteria] Applied to availableCards for filter. If null, all cards will be available
     * @param {*} [callBack] What to call once cards have been selected. If null, it will call playCards with all ids.
     */
    constructor( sheet, actionTitle, {from=null, minAmount=1, maxAmount=1, buttonLabel = 'ok', criteria = null, callBack = null}={} ) {
        super(sheet, actionTitle);

        const defaultCriteria = (c) => { return true; };
        const defaultCallback = async (selection, additionalCards) => { 
            const cardIds = [selection.id];
            additionalCards.forEach( c => cardIds.push(c.id) );
            return this.sheet.cards.playCards(cardIds);
        };

        this.from = from ?? new CustomCardStack(this.sheet._cards);
        this.minAmount = minAmount;
        this.maxAmount = maxAmount;
        this.buttonLabel = buttonLabel;
        this.selectedCardIds = [];
        this.criteria = criteria ?? defaultCriteria;
        this.callBack = callBack ?? defaultCallback;
    }

    get filteredCards() {
        return this.from.sortedAvailableCards.filter( c => {
            return c.id != this.sheet.currentSelection?.id;
        }).filter( c => {
            return this.criteria(c);
        });
    }

    /**
     * Prepare data to display other available cards for selection
     * @override
     */
    loadParameters() { 
        const parameters = super.loadParameters();
        parameters.needCards = true;
        parameters.buttonLabel = this.buttonLabel;

        let selectedAmount = 0;
        const availableCardsInfo = this.filteredCards.map(c => {
            const cardInfo = this.sheet._buildCardInfo(c);
            if( this.selectedCardIds.includes(c.id) ) {
                cardInfo.classes += ' selected';
                selectedAmount++;
            }
            return cardInfo;
        });
        parameters.availableCards = availableCardsInfo;

        const suffix = ' (' + selectedAmount + '/' + this.maxAmount + ')';
        parameters.title = parameters.title + suffix;

        parameters.isReady =   selectedAmount >= this.minAmount 
                            && selectedAmount <= this.maxAmount;
        
        return parameters;
    }

    /**
     * @override
     */
    addListeners(html) {
        super.addListeners(html);
        html.find(".parameters-panel .cards .card-slot").click(event => this.onClickToggleSelection(event) );
        html.find(".parameters-panel .selection-ok").click(event => this.onClickPerformAction(event) );
    }

    async onClickToggleSelection(event) {
        event.preventDefault();
        const key = event.currentTarget.dataset.key;
        
        const unselect = this.selectedCardIds.includes(key);
        if( unselect ) {
            this.selectedCardIds = this.selectedCardIds.filter( id => id != key );
        } else {
            this.selectedCardIds.push( key );
        }

        this.sheet.render();
    }

    async onClickPerformAction(event) {
        event.preventDefault();
        const selectedCards = this.filteredCards.filter( c => this.selectedCardIds.includes(c.id) );
        await this.callBack(this.sheet.currentSelection, selectedCards);
        this.resumeAction();
    }
}

export class CardActionParametersForPlayerSelection extends CardActionParametersBase {

    /**
     * Used to inform the GUI that the user needs to select players
     * Commonly used while dealing or giving cards
     * @param {CustomCardsDisplay} sheet The sheet where those paramters will be chosen
     * @param {string} actionTitle What will be displayed on top of the selection
     * @param {boolean} [specifyAmount] If the user should specifiy an mount on top of selecting users
     * @param {boolean} [onlyOne] If only one stack can be selected. In that case, selection will remove previous one
     * @param {boolean} [gmIncluded] If gm piles should be displayed
     * @param {string} [buttonLabel] What the say inside the ok button.
     * @param {*} [criteria] Applied to stacks for filter. If null, all player stacks will be available
     * @param {*} [callBack] What to call once cards have been selected. If null, it will call dealCards to all selected players
     */
    constructor( sheet, actionTitle, {specifyAmount = false, onlyOne = false, gmIncluded = true, buttonLabel = 'ok', criteria = null, callBack = null}={} ) {
        super(sheet, actionTitle);

        const deck = new CustomCardStack( this.sheet._cards );
        const deckConfig = deck.stackConfig;
        const keys = StackConfiguration;
    
        const defaultCriteria = (ccs) => { 

            const isHandStack = ccs.stack.type == 'hand';
            if( isHandStack ) { return deckConfig[keys.fromDeckDealCardsToHand]; }
            return deckConfig[keys.fromDeckDealRevealedCards]; ;
        };
        const defaultCallback = async (selection, selectedStacks, amount) => { 
            await deck.dealCards(selectedStacks, amount);
        };

        this.buttonLabel = buttonLabel;
        
        this.specifyAmount = specifyAmount;
        this.onlyOne = onlyOne;
        this.amount = 1;

        this.gmIncluded = gmIncluded;
        this.selectedStackIds = [];
        this.gmSelected = false;

        this.criteria = criteria ?? defaultCriteria;
        this.callBack = callBack ?? defaultCallback;
    }

    get filteredStacks() {

        const result = game.cards.map( stack => {
            return new CustomCardStack(stack);

        }).filter( ccs => {
            const owner = ccs.stackOwner;

            if( owner.forGMs ) {
                if( !this.gmIncluded ) { 
                    return false; 
                }

            } else if( owner.forPlayers ) {
                const user = game.users.get(owner.playerId);
                if(!user) { 
                    return false; 
                }

            } else { // Deck and discard piles are not available here
                return false; 
            }

            return this.criteria(ccs);
        });

        return result;
    }

    _loadStackData(ccs) {

        const result = {
            id: ccs.stack.id,
            classes: ''
        };

        let isHere;
        const owner = ccs.stackOwner;
        if( owner.forGMs ) {
            isHere = game.users.some( u => u.isGM && u.active );
            result.name = game.settings.get("ready-to-use-cards", GlobalConfiguration.gmName);
            result.icon = game.settings.get("ready-to-use-cards", GlobalConfiguration.gmIcon);
        } else {
            const user = game.users.get(ccs.stackOwner.playerId);
            isHere = user.active ?? false;
            result.name = user.name;
            result.icon = user.character?.img ?? 'icons/svg/mystery-man.svg';
        };

        if( !isHere ) { 
            result.classes += ' not-here';
        }

        const selected = this.selectedStackIds.includes(ccs.stack.id);
        if( selected ) { 
            result.classes += ' selected';
        }

        return result;
    }

    /**
     * Prepare data to display other available cards for selection
     * @override
     */
    loadParameters() { 
        const parameters = super.loadParameters();
        parameters.needStacks = true;
        parameters.specifyAmount = this.specifyAmount;
        parameters.amount = this.amount;
        
        const custom = new CustomCardStack(this.sheet._cards);
        parameters.labels = {
            headerHands: custom.localizedLabel('sheet.parameters.stacks.hands'),
            headerRevealed: custom.localizedLabel('sheet.parameters.stacks.revealed'),
            headerAmount: custom.localizedLabel('sheet.parameters.stacks.amount'),
            button: this.buttonLabel
        };

        const base = this.filteredStacks;

        const handsInfo = base.filter( ccs => ccs.stack.type == 'hand' ).map( ccs => this._loadStackData(ccs) );
        handsInfo.sort( (a,b) => a.name.localeCompare(b.name) );
        parameters.hands = handsInfo;
        parameters.handsDisplayed = handsInfo.length > 0;

        const revealedCardsInfo = base.filter( ccs => ccs.stack.type == 'pile' ).map( ccs => this._loadStackData(ccs) );
        revealedCardsInfo.sort( (a,b) => a.name.localeCompare(b.name) );
        parameters.revealedCards = revealedCardsInfo;
        parameters.revealedCardsDisplayed = revealedCardsInfo.length > 0;

        parameters.isReady = this.selectedStackIds.length > 0;
        return parameters;
    }

    /**
     * @override
     */
    addListeners(html) {
        super.addListeners(html);
        html.find(".parameters-stacks .stacks .stack").click(event => this.onClickToggleSelection(event) );
        html.find(".parameters-stacks .amount-edit").click(event => this.onClickModifyAmount(event) );
        html.find(".parameters-stacks .selection-ok").click(event => this.onClickPerformAction(event) );
    }

    async onClickToggleSelection(event) {
        event.preventDefault();
        const key = event.currentTarget.dataset.key;
        
        const unselect = this.selectedStackIds.includes(key);
        if( unselect ) {
            this.selectedStackIds = this.selectedStackIds.filter( id => id != key );
        } else if( this.onlyOne ) {
            this.selectedStackIds = [key];
        } else {
            this.selectedStackIds.push( key );
        }

        this.sheet.render();
    }

    async onClickModifyAmount(event) {
        event.preventDefault();
        const action = event.currentTarget.dataset.action;

        if( action == 'minus' ) {
            this.amount = Math.max(1, this.amount-1);
        } else {
            this.amount++;
        }
        this.sheet.render();
    }

    async onClickPerformAction(event) {
        event.preventDefault();
        const selectedStacks = this.filteredStacks.filter( c => this.selectedStackIds.includes(c.stack.id) );
        await this.callBack(this.sheet.currentSelection, selectedStacks, this.amount);
        this.resumeAction();
    }
}
