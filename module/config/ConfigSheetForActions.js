import { DeckParameters, StackActionTypes, StackConfiguration, StackTargetPossibilities } from "../constants.js";
import { CARD_STACKS_DEFINITION } from "../StackDefinition.js";
import { cardFilterSettings, updateCardFilterSettings, updateCardStackSettings } from "../tools.js";


/**
 * During configBox creation for each stack.
 * Map stack config value and labels for a given conf key
 * @param {object} stack a stack from this.object.stacks
 * @param {string} configName The conf key
 * @returns {object} will be stored as a configBoxes element
 */
const mapConfBoxForStack = (stack, configName) => {

	const toggled = stack.config[configName];
	let classes = toggled ? 'far fa-check-square' : 'far fa-square';

	const key = DeckParameters.overrideConf;
	if( !stack.parameters.hasOwnProperty(key) || stack.parameters[key] ) {
		classes += ' active';
	}

	return {
		config: configName,
		classes: classes,
		label: stack.gui.labels[configName]
	};
};

/**
 * Go through all declared and default stack, even if they haven't been chosen
 * Extract all necessay metadata from them to be able to create this.object.stacks
 * @returns {object[]} Necessay metadata for all stacks
 */
const computeAllPossibleStackList = () => {

	const cardStacks = game.modules.get('ready-to-use-cards').cardStacks;
	const actualDefinition = CARD_STACKS_DEFINITION;

	const list = Object.entries(cardStacks.defaultCoreStacks).map( ([key, stackDef]) => {
		const registeredSuffix = game.i18n.localize('RTUCards.coreStacks.suffix.manuallyRegistered');;
		const deckName = stackDef.customName ?? game.i18n.localize(stackDef.labelBaseKey + 'title');
		const deckDesc = stackDef.customDesc ?? game.i18n.localize(stackDef.labelBaseKey + 'description');

		return {
			key: key,
			default: true,
			useCustomCardImpl: false,
			toggled: cardStacks.decks.hasOwnProperty( key ),
			toggleLocked: stackDef.isManuallyRegistered ?? false,
			deck : {
				name: deckName + (stackDef.isManuallyRegistered ? registeredSuffix : '' ),
				desc: deckDesc
			}
		};
	});

	const viaHooksSuffix = game.i18n.localize('RTUCards.coreStacks.suffix.viaCode');;
	const addedViaHooks = Object.entries(actualDefinition.core).filter( ([key, coreDef]) => {
		return !list.find(s => s.key === key) 

	}).map(([key, coreDef]) => {

		return {
			key: key,
			default: false,
			useCustomCardImpl: coreDef.cardClass != actualDefinition.shared.cardClasses.simple,
			overrideConf: coreDef.overrideConf,
			toggled: true,
			toggleLocked: true,
			deck : {
				name: game.i18n.localize(coreDef.labelBaseKey + 'title') + viaHooksSuffix,
				desc: game.i18n.localize(coreDef.labelBaseKey + 'description')
			}
		};
	});
	list.push( ...addedViaHooks);
	return list;
}

/**
 * Augment stack.groups by adding CSS info
 * @param {object} stack As defined in this.object.stacks
 * @returns {object[]} groupsGui, grouped by actionType
 */
const actionGroupsForGUI = (stack) => {

	// Convenience functions
	//-------------------------
	const computeDisplayedOptionsforActionGroup = (groupDef) => {
		const noTarget = groupDef.grid.css == 'no-target';

		let allOptions;
		if( noTarget ) {
			allOptions= groupDef.grid.targets.map( t => {
				return {from: t, target: t};
			});
		} else {
			allOptions = [];
			Object.values(StackTargetPossibilities).forEach( from => {
				Object.values(groupDef.grid.targets).forEach( target => {
					allOptions.push({from: from, target: target});
				});
			});

		}
		return allOptions;
	}

	const computeDisplayedLinesForActionGroup = (groupDef) => {
		const noTarget = groupDef.grid.css == 'no-target';
		const alone = groupDef.grid.css == 'alone';
		return {
			alone: alone,
			noTarget: noTarget,
			deck : !noTarget && groupDef.grid.targets.includes('DE'),
			discard : !noTarget && groupDef.grid.targets.includes('DI'),
			gm : !noTarget && groupDef.grid.targets.includes('GH'),
			players : !noTarget && groupDef.grid.targets.includes('PH'),
		};
	}

	const mapStackActionForGui = (option, groupDef) => {
		const from = option.from;
		const target = option.target;

		const item = {
			area: from + target,
			classes : 'toggle-button',
			active: false
		};

		const declaredAction = groupDef.actions.find( a => a.from === from && a.target === target );
		if(declaredAction) {
			item.active = !locked;
			item.classes += declaredAction.available ? ' far fa-check-square' : ' far fa-square';
			foundry.utils.mergeObject(item, declaredAction);

		} else {
			item.classes += ' fas fa-ban';
		}

		item.classes += item.active ? ' active' : '';

		return item;
	}

	// Prepare groups so that they can be used inside hbs
	//------------------------
	const lockKey = DeckParameters.overrideConf;
	const locked = stack.parameters.hasOwnProperty(lockKey) && !stack.parameters[lockKey];

	// Prepare all groups
	const allGuiGroups = Object.entries(stack.groups).map( ([groupId, groupDef]) => {

		const groupGui = {
			topLevel: groupDef.actionType,
			stackId: stack.key,
			groupId: groupId,
			name: groupDef.name,
			description: groupDef.description,
			unfolded: groupDef.unfolded,
			grid: {
				css: groupDef.grid.css,
				from: game.i18n.localize( groupDef.grid.fromLabel ?? 'From' ),
				target: game.i18n.localize( groupDef.grid.targetLabel ?? 'Targets' ),
			}, 
			toggle: {
			}
		};

		// Add data used by toggle icons
		const used = groupDef.actions.some( a => a.available );
		const notAll = groupDef.actions.some( a => !a.available );
		groupGui.toggle.checkCss = used ? ( notAll ? 'far fa-minus-square' : 'far fa-check-square' ) : 'far fa-square';
		groupGui.toggle.foldCss = groupDef.unfolded ? 'far fa-folder-open' : 'far fa-folder';

		if( !locked ) {
			groupGui.toggle.checkCss += ' active';
			groupGui.toggle.foldCss += ' active';
		}

		// Action list displays chosen ones, as well as invalid or not chosen
		groupGui.actions = computeDisplayedOptionsforActionGroup(groupDef).map( option => {
			return mapStackActionForGui(option, groupDef);
		});

		// Also add information on displayed lines (to removed unsed header from grid)
		groupGui.lines = computeDisplayedLinesForActionGroup(groupDef);

		return groupGui;
	});

	// Gui groups are grouped by actionTypes 
	const topLevelGroups = Object.entries(StackActionTypes).map( ([key, value]) => {
		return {
			header: game.i18n.localize(value.labelKey),
			list: allGuiGroups.filter( g => g.topLevel === key )
		};
	})
	return topLevelGroups;
}

/**
 * During configBox creation for the filter.
 * @param {object} configUsage The conf key
 * @returns {object} will be stored as a configBoxes element
 */
 const mapConfBoxForFilter = (confUsage) => {

	let classes = confUsage.toggled ? 'far fa-check-square' : 'far fa-square';
	classes += ' active';

	return {
		config: confUsage.config,
		classes: classes,
		label: game.i18n.localize('RTUCards.settings.sheet.labels.' + confUsage.config)
	};
};

const buildStackActions = (stack) => {
	const actions = [];

	// Deck desc
	const desc = stack.gui.deck.desc;
	if( desc && desc != '' ) {
		actions.push(
			createActionLine({ icon: 'fas fa-info', clickable: false, labelKey: stack.gui.deck.desc })
		);
	}

	// Deck edition
	[DeckParameters.labelBaseKey, DeckParameters.resourceBaseDir].forEach( key => {
		if( stack.parameters.hasOwnProperty(key) ) {
			actions.push(
				createActionLine({ 
					icon: 'far fa-edit', clickable: false, param: key, 
					labelKey: 'RTUCards.settings.config-actions.additionalData.' + key,
					editText: stack.parameters[key]
				})
			);
		}
	})

	// Some stacks may have some custom card implem. Warn the user that the action listing may not be used
	if( stack.useCustomCardImpl ) {
		actions.push(
			createActionLine({ icon: 'fas fa-exclamation', clickable: false, labelKey: 'RTUCards.settings.config-actions.additionalData.warnImplem' })
		);
	}

	// For stack generated by code : See if the user can override conf values
	const overrideKey = DeckParameters.overrideConf;
	if( stack.parameters.hasOwnProperty(overrideKey) ) {
		const icon = stack.parameters[overrideKey] ? 'fas fa-lock-open' : 'fas fa-lock';
		actions.push(
			createActionLine({ icon: icon, param: overrideKey, labelKey: 'RTUCards.settings.config-actions.additionalData.overrideConf' })
		);
	}


	// Back inside card faces ?
	const removeBackKey = DeckParameters.removeBackFace;
	if( stack.parameters.hasOwnProperty(removeBackKey) ) {
		const removed = stack.parameters[removeBackKey];
		const icon = removed ? 'far fa-check-square' : 'far fa-square';
		actions.push(
			createActionLine({ icon: icon, param: removeBackKey, labelKey: 'RTUCards.settings.config-actions.additionalData.removeBackFace' })
		);
	}

	// Only add the header is there are some actions
	const result = [];
	if( actions.length > 0 ) {
		result.push({isHeader:true, label: game.i18n.localize('RTUCards.settings.config-actions.additionalData.headerDeck') });
		result.push(...actions);
	}

	return result;
}

const createActionLine = ({icon='', clickable=true, labelKey='', param='', editText=null} = {}) => {
	const result = {};
	result.classes = icon;
	if( clickable ) { result.classes += ' active'; }

	result.label = game.i18n.localize(labelKey);
	result.param = param;

	result.input = {
		displayed: (editText != null),
		text: editText
	};

	return result;
}

/**
 * A configuration sheet to configure available actions for each declared deck
 * @extends {FormApplication}
 */
export class ConfigSheetForActions extends FormApplication {


	/** @override */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			id: "rtucards-config-actions",
			classes: ["rtucards-config-actions"],
			template: "modules/ready-to-use-cards/resources/config-actions.hbs",
			width: 600,
			height: "auto",
			closeOnSubmit: false,
            scrollY: [".deck-list"]
		});
	}

	/* -------------------------------------------- */

	/** @override */
	get title() {
		return game.i18n.localize("RTUCards.settings.config-actions.menu");
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

		// Create this.object.stacks
		const cardStacks = this.module.cardStacks;
		const actualDefinition = CARD_STACKS_DEFINITION;
		this.object.stacks = computeAllPossibleStackList().map( s => {

			const data = {};
			data.key = s.key;
			data.isDefaultStack = s.default;
			data.useCustomCardImpl = s.useCustomCardImpl;
			data.gui = {
				toggled: s.toggled,
				toggleLocked: s.toggleLocked,
				detailsDisplayed: false,
				deck: s.deck,
				labels: configLabels
			};

			// actionGroups : actions are grouped by category. (Move, Exchance, Deal, Rotate, ...)
			//---------------
			data.groups = this.module.actionService.stackAllActionsDetailsMap(s.key);
			Object.values(data.groups).forEach( g => {
				g.unfolded = false;
				return g;
			});

			// config : Used to define which actions are available once a card stack is opened
			//---------------
			data.config = duplicate(defaultStackConfig);
			const declared = actualDefinition.core[s.key];
			if( declared ) { // Substitute current config values
				Object.entries( declared.config ).forEach( ([key, confValue]) => {
					data.config[key] = confValue;
				});
			}

			// parameters : Additional info on deck, like image path or translation prefix
			//---------------
			const stackDef = cardStacks.defaultCoreStacks[s.key];
			data.parameters = {
				labelBaseKey: declared?.labelBaseKey ?? stackDef.labelBaseKey,
				removeBackFace: declared?.removeBackFace ?? stackDef.removeBackFace,
			};
			if( s.hasOwnProperty('overrideConf')) { 
				data.parameters.overrideConf = s.overrideConf;
			}

			return data;
		});
	}
	
	initFilter() {

		const configUsage = Object.entries(cardFilterSettings()).map( ([key, value]) => {
			return {
				config: key,
				toggled: value
			};
		});

		this.filter = {
			detailsDisplayed: false,
			title: game.i18n.localize('RTUCards.settings.config-actions.filter.title'),
			configUsage: configUsage
		};
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

		// Add confboxes information for each stack
		const stacks = this.object.stacks.map( stack => {
			const data = {
				configBoxes: this.configBoxes.map( confKey => mapConfBoxForStack( stack, confKey ) ),
				actions: buildStackActions(stack),
				groupsGui: actionGroupsForGUI(stack)
			};

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

		const result = { 
			configBoxes: this.filter.configUsage.map( cu => mapConfBoxForFilter(cu) ) ,
			actions: [
				{isHeader:true, label: game.i18n.localize('RTUCards.settings.config-actions.additionalData.headerFilter')},
				createActionLine({ icon: 'fas fa-info', clickable: false, labelKey: 'RTUCards.settings.config-actions.filter.details' }),
				createActionLine({ icon: 'fas fa-retweet', param: 'rebuild', labelKey: 'RTUCards.settings.config-actions.filter.rebuild' })
			]
		};
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
		html.find('.filter .toggle-button.action.active').click(event => this._onClickToggleFilterParameter(event) );

		html.find('.declared-deck .toggle-button.deck.active').click(event => this._onClickToggleDeck(event) );
		html.find('.declared-deck .toggle-button.show.active').click(event => this._onClickToggleDetails(event) );
		html.find('.declared-deck .config.toggle-button.active').click(event => this._onClickToggleConfigBox(event) );
		
		html.find('.declared-deck .group-action.toggle-button.active').click(event => this._onClickToggleActionChoice(event) );
		html.find('.declared-deck .group-check.toggle-button.active').click(event => this._onClickToggleWholeActionGroup(event) );
		html.find('.declared-deck .group-fold.toggle-button.active').click(event => this._onClickFoldActionGroup(event) );

		html.find('.declared-deck .toggle-button.action.active').click(event => this._onClickToggleStackParameter(event) );
        html.find('.declared-deck .param-input').change(event => this._onChangeParameterValue(event) );

		html.find('.save-stacks').click(event => this._onClickSaveConfig(event) );
	}

	/** @override */
	_updateObject(event, formData) {
		// Not used
	}

	/* -------------------------------------------- */

	async _onClickToggleActionChoice(event) {
		const a = event.currentTarget;
		const configKey = a.dataset.config;
		const deckKey = a.parentElement.parentElement.dataset.key;
		const groupId = a.parentElement.parentElement.dataset.group;

		const stack = this.object.stacks.find( s => s.key === deckKey);
		const group = stack.groups[groupId];
		const action = group.actions.find( a => a.confKey === configKey);

		action.available = !action.available;
		this.render();
	}

	async _onClickToggleWholeActionGroup(event) {
		const a = event.currentTarget;
		const deckKey = a.parentElement.dataset.key;
		const groupId = a.parentElement.dataset.group;

		const stack = this.object.stacks.find( s => s.key === deckKey);
		const group = stack.groups[groupId];
		const used = group.actions.some( a => a.available );
		group.unfolded = !used;
		group.actions.forEach( a => {
			a.available = !used;
		});
		
		this.render();
	}

	async _onClickFoldActionGroup(event) {
		const a = event.currentTarget;
		const deckKey = a.parentElement.dataset.key;
		const groupId = a.parentElement.dataset.group;

		const stack = this.object.stacks.find( s => s.key === deckKey);
		const group = stack.groups[groupId];
		group.unfolded = !group.unfolded;
		this.render();
	}







	async _onClickSaveConfig(event) {
		// Filter
		const confFilter = this.filter.configUsage.reduce( (_result, _val) => {
			_result[_val.config] = _val.toggled;
			return _result;
		}, {});

		await updateCardFilterSettings(confFilter),

		// Each stack
		await this.module.cardStacks.loadCardStacks();
		const decks = {};
		this.object.stacks.filter( s => s.gui.toggled ).forEach( stack => {

			const configUsage = duplicate(stack.config);
			this.filter.configUsage.filter( c => !c.toggled ).forEach( c => {
				// Make sure filtered actions are correctly removed
				configUsage[c.config] = false;
			});
			decks[stack.key] = configUsage;
			decks[stack.key].parameters = stack.parameters;
		});

        await updateCardStackSettings(decks);
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

	async _onClickToggleStackParameter(event) {
		event.preventDefault();
		const a = event.currentTarget;
		const deckKey = a.parentElement.parentElement.dataset.key;
		const paramKey = a.parentElement.dataset.param;

		const stack = this.object.stacks.find( s =>s.key === deckKey );
		stack.parameters[paramKey] = !stack.parameters[paramKey];
		this.render();
	}

	async _onChangeParameterValue(event) {
		event.preventDefault();
		const a = event.currentTarget;
		const deckKey = a.parentElement.parentElement.dataset.key;
		const paramKey = a.parentElement.dataset.param;

		const stack = this.object.stacks.find( s =>s.key === deckKey );
		stack.parameters[paramKey] = a.value;
		this.render();
	}

	async _onClickToggleFilterBox(event) {
		event.preventDefault();
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

	async _onClickToggleFilterParameter(event) {
		event.preventDefault();
		const a = event.currentTarget;
		const param = a.parentElement.dataset.param;

		if( param == 'rebuild' ) {
			// Recreate config usage from current choices in current decks
			const usedStacks = this.object.stacks.filter( stack => stack.gui.toggled );
			this.filter.configUsage = this.configBoxes.map( key => {
				const used = usedStacks.some( stack => {
					return stack.config[key];
				});
	
				return {
					config: key,
					toggled: used
				};
			});
		}
		this.render();
	}

}

