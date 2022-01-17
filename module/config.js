import { CustomCard } from "./card.js";
import { CustomCards } from "./cards.js";
import { CustomCardsDisplay } from "./CardsDisplay.js";
import { GlobalConfiguration, StackConfiguration } from "./constants.js";
import { CustomCardsDirectory } from "./CustomCardsDirectory.js";
import { CARD_STACKS_DEFINITION } from "./StackDefinition.js";


/**
 * A configuration sheet FormApplication to configure the Ready To Use Cards module
 * @extends {FormApplication}
 */
export class RTUCardsConfig extends FormApplication {

	static registerCardSystem() {
		CONFIG.Cards.documentClass = CustomCards;
		CONFIG.Card.documentClass = CustomCard;
		CONFIG.ui.cards = CustomCardsDirectory;
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
			icon: "fas fa-cog",
			type: RTUCardsConfig,
			restricted: true
		});

		// Data will be stored inside 'stacks'
		game.settings.register("ready-to-use-cards", GlobalConfiguration.stacks, {
			scope: "world",
			config: false,
			default: null,
			type: Object,
			onChange: async c => {
				const app = Object.values(ui.windows).find(a => a.constructor === RTUCardsConfig);
				if ( app ) app.render();
			}
		});
	
		game.settings.register("ready-to-use-cards", GlobalConfiguration.gmName, {
			name: "RTUCards.settings.gmName.label",
			hint: "RTUCards.settings.gmName.hint",
			scope: "world",
			type: String,
			default: 'GM',
			config: true
		});
	  
		game.settings.register("ready-to-use-cards", GlobalConfiguration.gmIcon, {
			name: "RTUCards.settings.gmIcon.label",
			hint: "RTUCards.settings.gmIcon.hint",
			scope: "world",
			type: String,
			default: 'modules/ready-to-use-cards/resources/gmIcon.png',
			config: true
		});
	  
		game.settings.register("ready-to-use-cards", GlobalConfiguration.stackForPlayerHand, {
			name: "RTUCards.settings.stackForPlayerHand.label",
			hint: "RTUCards.settings.stackForPlayerHand.hint",
			scope: "world",
			type: Boolean,
			default: true,
			config: true
		});
	  
		game.settings.register("ready-to-use-cards", GlobalConfiguration.stackForPlayerRevealedCards, {
			name: "RTUCards.settings.stackForPlayerRevealedCards.label",
			hint: "RTUCards.settings.stackForPlayerRevealedCards.hint",
			scope: "world",
			type: Boolean,
			default: true,
			config: true
		});
	  
		game.settings.register("ready-to-use-cards", GlobalConfiguration.everyHandsPeekOn, {
			name: "RTUCards.settings.everyHandsPeekOn.label",
			hint: "RTUCards.settings.everyHandsPeekOn.hint",
			scope: "world",
			type: Boolean,
			default: true,
			config: true
		});
	  
		game.settings.register("ready-to-use-cards", GlobalConfiguration.everyHandsDiscardAll, {
			name: "RTUCards.settings.everyHandsDiscardAll.label",
			hint: "RTUCards.settings.everyHandsDiscardAll.hint",
			scope: "world",
			type: Boolean,
			default: true,
			config: true
		});
	  
		game.settings.register("ready-to-use-cards", GlobalConfiguration.everyRevealedDiscardAll, {
			name: "RTUCards.settings.everyRevealedDiscardAll.label",
			hint: "RTUCards.settings.everyRevealedDiscardAll.hint",
			scope: "world",
			type: Boolean,
			default: true,
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

		// Prepare configBoxes
		const configLabels = {};
		this.configBoxes = Object.values(StackConfiguration);
		this.configBoxes.forEach( key => {
			configLabels[key] = game.i18n.localize('RTUCards.settings.sheet.labels.' + key);
		});

		// List of the available configuration settings.
		const defaultStackConfig = this.configBoxes.reduce( (_config, confKey) => {
			_config[confKey] = true;
			return _config;
		}, {});

		const cardStacks = this.module.cardStacks;
		const actualDefinition = CARD_STACKS_DEFINITION;

		this.object.stacks = Object.entries(cardStacks.defaultCoreStacks).map( ([key, stackDef]) => {

			const config = duplicate(defaultStackConfig);
			if( actualDefinition.core.hasOwnProperty(key) ) {
				Object.entries( actualDefinition.core[key].config ).forEach( ([key, confValue]) => {
					config[key] = confValue;
				});
			}

			const registeredSuffix = game.i18n.localize('RTUCards.pokerDark.coreStacks.suffix.manuallyRegistered');;
			const deckName = stackDef.customName ?? game.i18n.localize(stackDef.labelBaseKey + 'title');
			const deckDesc = stackDef.customDesc ?? game.i18n.localize(stackDef.labelBaseKey + 'description');

			const data = {};
			data.key = key;
			data.config = config;
			data.gui = {
				toggled: cardStacks.decks.hasOwnProperty( key ),
				toggleLocked: stackDef.isManuallyRegistered ?? false,
				detailsDisplayed: false,
				deck: {
					name: deckName + (stackDef.isManuallyRegistered ? registeredSuffix : '' ),
					desc: deckDesc
				},
				labels: configLabels
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

		// Add confboxes information for each stack
		const stacks = this.object.stacks.map( stack => {

			const headerParts = ['fromDeck', 'fromHand', 'fromRevealed', 'fromDiscard'].map( prefix => {
				const relatedConfKeys = this.configBoxes.filter( key => key.startsWith(prefix) );
				const confBoxes = relatedConfKeys.map( key => mapConfigLabels( stack, key ) );
				confBoxes.sort( (a,b) => a.label.localeCompare(b.label) );
				return {
					header: { isHeader: true, label: game.i18n.localize('RTUCards.settings.sheet.headers.' + prefix) },
					confBoxes: confBoxes
				};
			});

			const allBoxes = headerParts.reduce( (_allBoxes, current) => {
				_allBoxes.push(current.header);
				_allBoxes.push(...current.confBoxes);
				return _allBoxes;
			}, []);

			const data = {
				configBoxes: allBoxes
			}
			return foundry.utils.mergeObject( data, stack );
		});

		return {
			stacks: stacks
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
		await game.settings.set("ready-to-use-cards", GlobalConfiguration.stacks, decks);
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

