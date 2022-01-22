import { GlobalConfiguration, StackConfiguration } from "./constants.js";
import { CARD_STACKS_DEFINITION } from "./StackDefinition.js";

/**
 * A configuration sheet FormApplication to configure the Ready To Use Cards module
 * @extends {FormApplication}
 */
export class ConfigSheetForActions extends FormApplication {


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
		this.initFilter();
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
	
	initFilter() {
		this.filter = {
			detailsDisplayed: false,
			title: game.i18n.localize('RTUCards.settings.sheet.filter.title'),
			details: game.i18n.localize('RTUCards.settings.sheet.filter.details'),
			configUsage: []
		};
		this.reloadFilter();
	}

	reloadFilter() {
		const usedStacks = this.object.stacks.filter( stack => stack.gui.toggled );
		this.filter.configUsage = this.configBoxes.map( key => {
			const used = usedStacks.some( stack => {
				return stack.config[key];
			});

			return {
				config: key,
				toggled: used,
				label: game.i18n.localize('RTUCards.settings.sheet.labels.' + key)
			};
		});
	}

	_addHeadersToConfigBoxes(configBoxes) {

		const result = [];
		['fromDeck', 'fromHand', 'fromRevealed', 'fromDiscard'].forEach( header => {

			const relatedConfs = configBoxes.filter( cb => cb.config.startsWith(header) );
			if( relatedConfs.length > 0 ) {

				result.push({ // Header line
					isHeader: true, 
					label: game.i18n.localize('RTUCards.settings.sheet.headers.' + header) 
				});

				relatedConfs.sort( (a,b) => a.label.localeCompare(b.label) );
				result.push(...relatedConfs);
			}
		});
		return result;
	}

	_prepareStackList() {

		const mapConfigLabels = (stack, configName) => {
			return {
				config: configName,
				toggled: stack.config[configName],
				label: stack.gui.labels[configName]
			};
		};

		// Add confboxes information for each stack
		const stacks = this.object.stacks.map( stack => {
			const data = {
				configBoxes: this.configBoxes.map( confKey => mapConfigLabels( stack, confKey ) )
			}
			return foundry.utils.mergeObject( data, stack );
		});
		return stacks;
	}

	_prepareFilteringWithStacks(stacks) {

		// Retrieve confs which are never used
		const unusedKeys = this.filter.configUsage.filter( c => !c.toggled).map( c => c.config );

		// Reduce confboxes on each stack by removing those elements
		stacks.forEach( stack => {
			stack.configBoxes = stack.configBoxes.filter( cb => cb.isHeader || !unusedKeys.includes(cb.config) );
		});

		const result = { configBoxes: this.filter.configUsage };
		return foundry.utils.mergeObject(result, this.filter);
	}

	/** @override */
	async getData() {

		const stacks = this._prepareStackList();
		const filter = this._prepareFilteringWithStacks(stacks);

		// Add headers at the end (wait until entries have been filtered)
		stacks.forEach(stack => {
			stack.configBoxes = this._addHeadersToConfigBoxes(stack.configBoxes);
		});
		filter.configBoxes = this._addHeadersToConfigBoxes(filter.configBoxes);

		return {
			stacks: stacks,
			filter: filter
		};
	}

	/** @override */
    activateListeners(html) {
		html.find('.filter .toggle-button.show').click(event => this._onClickToggleFilter(event) );
		html.find('.filter .toggle-button.config').click(event => this._onClickToggleFilterBox(event) );

		html.find('.declared-deck .toggle-button.deck').click(event => this._onClickToggleDeck(event) );
		html.find('.declared-deck .toggle-button.show').click(event => this._onClickToggleDetails(event) );
		html.find('.declared-deck .toggle-button.config').click(event => this._onClickToggleConfigBox(event) );
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

	async _onClickToggleFilter(event) {
		event.preventDefault();
		this.filter.detailsDisplayed = !this.filter.detailsDisplayed;
		this.render();
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

	async _onClickToggleFilterBox(event) {
		const a = event.currentTarget;
		const configKey = a.dataset.config;

		const relatedConfig = this.filter.configUsage.find( c => c.config === configKey );
		const wasChecked = relatedConfig.toggled;
		relatedConfig.toggled = !wasChecked;

		if( wasChecked ) { // Uncheck box on all stacks
			this.object.stacks.forEach( stack => {
				stack.config[configKey] = false;
			});
		}
		this.render();
	}
}

