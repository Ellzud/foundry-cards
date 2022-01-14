import { CustomCard } from "./card.js";
import { CustomCards } from "./cards.js";
import { CustomCardsDisplay } from "./CardsDisplay.js";
import { CARD_STACKS_DEFINITION } from "./StackDefinition.js";


/**
 * A configuration sheet FormApplication to configure the Ready To Use Cards module
 * @extends {FormApplication}
 */
export class RTUCardsConfig extends FormApplication {

	static registerCardSystem() {

		CONFIG.Cards.documentClass = CustomCards;
		CONFIG.Card.documentClass = CustomCard;
	
		DocumentSheetConfig.unregisterSheet(Cards, "core", CardsConfig);
		DocumentSheetConfig.unregisterSheet(Cards, "core", CardsHand);
		DocumentSheetConfig.unregisterSheet(Cards, "core", CardsPile);
		DocumentSheetConfig.registerSheet(Cards, "ReadyToUseCards", CustomCardsDisplay, {
			label: "RTUCards.sheet.template",
			types: ["deck", "hand", "pile"],
			makeDefault: true
		});
	}
	
	/* -------------------------------------------- */

	/**
     * Register game settings and menus for managing the Ready To Use Cards module
     */
	static loadCardSettings() {

		// A separate window to define decks
		game.settings.registerMenu("ready-to-use-cards", "config", {
			name: "RTUCards.settings.sheet.menu",
			label: "RTUCards.settings.sheet.title",
			hint: "RTUCards.settings.sheet.hint",
			icon: "fas fa-user-lock",
			type: RTUCardsConfig,
			restricted: true
		});

		// Data will be stored inside 'stacks'
		game.settings.register("ready-to-use-cards", "stacks", {
			scope: "world",
			config: false,
			default: null,
			type: Object,
			onChange: async c => {
				const app = Object.values(ui.windows).find(a => a.constructor === RTUCardsConfig);
				if ( app ) app.render();
			}
		});
	
		game.settings.register("ready-to-use-cards", "gmName", {
			name: "RTUCards.settings.gm.nameLabel",
			hint: "RTUCards.settings.gm.nameHint",
			scope: "world",
			type: String,
			default: 'GM',
			config: true
		});
	  
		game.settings.register("ready-to-use-cards", "gmIcon", {
			name: "RTUCards.settings.gm.iconLabel",
			hint: "RTUCards.settings.gm.iconHint",
			scope: "world",
			type: String,
			default: 'modules/ready-to-use-cards/resources/gmIcon.png',
			config: true
		});
	  
	}

	/* -------------------------------------------- */

	/** @override */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			id: "rtucards-config",
			classes: ["config-panel", "rtucards-config"],
			template: "modules/ready-to-use-cards/resources/config.hbs",
			width: 600,
			height: "auto",
			closeOnSubmit: false
		});
	}

	/* -------------------------------------------- */

	/** @override */
	get title() {
		return game.i18n.localize("RTUCards.settings.sheet.menu");
	}

	/* -------------------------------------------- */

	constructor(object={}, options={}) {
		super(object, options);
		this.module = game.modules.get('ready-to-use-cards');
		this.initStacks();
	}

	initStacks( ) {

		this.configBoxes = ['availableOnHands', 'availableOnRevealedCards'];

		const labelBase = 'RTUCards.settings.sheet.labels.';
		const labels = {};
		this.configBoxes.forEach( key => {
			labels[key] = game.i18n.localize(labelBase + key);
		});

		const cardStacks = this.module.cardStacks;

		const actualDefinition = CARD_STACKS_DEFINITION;

		this.object.stacks = Object.entries(cardStacks.defaultCoreStacks).map( ([key, stackDef]) => {

			const config = actualDefinition.core.hasOwnProperty(key) ? actualDefinition.core[key].config : stackDef.config;

			const data = {};
			data.key = key;
			data.config = duplicate(config);
			data.gui = {
				toggled: cardStacks.decks.hasOwnProperty( key ),
				detailsDisplayed: false,
				deck: {
					name: game.i18n.localize(stackDef.labelBaseKey + 'deck.title'),
					desc: game.i18n.localize(stackDef.labelBaseKey + 'deck.description')
				},
				labels: labels
			};
			return data;
		});
	}

	/** @override */
	async getData() {

		const mapConfigLabels = (stack, configName) => {
			return {
				config: configName,
				toggled: stack.config[configName],
				label: stack.gui.labels[configName]
			};
		};

		return {
			stacks: this.object.stacks.map( stack => {
				const data = {
					configBoxes: this.configBoxes.map( key => mapConfigLabels( stack, key ) )
				}
				return foundry.utils.mergeObject( data, stack );
			})
		};
	}

	/** @override */
    activateListeners(html) {
		html.find('.toggle-button.deck').click(event => this._onClickToggleDeck(event) );
		html.find('.toggle-button.show').click(event => this._onClickToggleDetails(event) );
		html.find('.toggle-button.config').click(event => this._onClickToggleConfigBox(event) );
		html.find('.save-stacks').click(event => this._onClickSaveConfig(event) );
	}

	/** @override */
	_updateObject(event, formData) {
		// Not used
	}

	/* -------------------------------------------- */

	async _onClickSaveConfig(event) {
		const decks = {};
		this.object.stacks.filter( s => s.gui.toggled ).forEach( stack => {
			decks[stack.key] = stack.config;
		});
		await game.settings.set("ready-to-use-cards", "stacks", decks);
		await this.module.cardStacks.loadCardStacks();
		this.close();
	}

	async _onClickToggleDeck(event) {
		event.preventDefault();
		const a = event.currentTarget;
		const key = a.parentElement.parentElement.dataset.key;

		const stack = this.object.stacks.find( s =>s.key === key );
		const wasToggled = stack.gui.toggled;
		stack.gui.toggled = !wasToggled;
		stack.gui.detailsDisplayed = !wasToggled;
		this.render();
	}

	async _onClickToggleDetails(event) {
		event.preventDefault();
		const a = event.currentTarget;
		const key = a.parentElement.parentElement.dataset.key;

		const stack = this.object.stacks.find( s =>s.key === key );
		stack.gui.detailsDisplayed = !stack.gui.detailsDisplayed;
		this.render();
	}

	async _onClickToggleConfigBox(event) {
		event.preventDefault();
		const a = event.currentTarget;
		const deckKey = a.parentElement.parentElement.dataset.key;
		const configKey = a.dataset.config;

		const stack = this.object.stacks.find( s =>s.key === deckKey );
		stack.config[configKey] = !stack.config[configKey];
		this.render();
	}
}

