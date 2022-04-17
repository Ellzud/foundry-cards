import { DeckParameters, StackActionTypes, StackConfiguration, StackTargetPossibilities } from "../constants.js";
import { CARD_STACKS_DEFINITION } from "../StackDefinition.js";

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
	const computeDisplayedOptions = (groupDef) => {
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

	const computeDisplayedGridLines = (groupDef) => {
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

	const computeDisplayedActionParameters = (groupDef) => {
		const params = groupDef.labels.filter( l => {
			// Action which have not been selected won't be displayed
			return groupDef.actions.some( a => a.action === l.action && a.available);

		}).map( l => {
			return {
				action: l.action,
				label: {
					default: l.default,
					current: l.default != l.current ? l.current : ""
				}
			};
		});
		params.sort( (a,b) => a.label.default.localeCompare(b.label.default) );
		return params;
	}

	const computeDisplayedGuiTabs = (groupDef, gridLines, actionParameters) => {
		
		// Build tab list
		const guiTabs = { list: [] };
		if( !gridLines.alone ) {
			guiTabs.list.push({ id: "grid", header: "Action grid" });
		}
		if( actionParameters.length > 0 ) {
			guiTabs.list.push({ id: "params", header: "Related parameters" });
		}
		
		// Add radio button selection
		guiTabs.displayed = guiTabs.list.length > 0;
		if( guiTabs.displayed ) {

			// /!\ May update groupDef.currentTab
			if( ! guiTabs.list.some( t => t.id === groupDef.currentTab ) ) {
				groupDef.currentTab = guiTabs.list[0].id;
			}
			
			guiTabs.list.forEach( t => {
				t.selected = ( t.id === groupDef.currentTab );
			});
		}
		guiTabs.gridDisplayed = guiTabs.list.find( t => t.id === "grid" )?.selected ?? false;
		guiTabs.paramDisplayed = guiTabs.list.find( t => t.id === "params" )?.selected ?? false;
		return guiTabs;
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
				lines: computeDisplayedGridLines(groupDef)
			}, 
			toggle: {
			}
		};

		// Add data used by toggle icons
		// used and fullyUsed were re
        const used = groupDef.actions.some( a => a.available );
        const fullyUsed = used && !groupDef.actions.some( a => !a.available );
		groupGui.toggle.checkCss = used ? ( fullyUsed ? 'far fa-check-square' : 'far fa-minus-square' ) : 'far fa-square';
		groupGui.toggle.foldCss = groupDef.unfolded ? 'far fa-folder-open' : 'far fa-folder';

		if( !locked ) {
			groupGui.toggle.checkCss += ' active';
			groupGui.toggle.foldCss += ' active';
		}

		// Action list displays chosen ones, as well as invalid or not chosen
		groupGui.actions = computeDisplayedOptions(groupDef).map( option => {
			return mapStackActionForGui(option, groupDef);
		});

		// Parameters for each action
		groupGui.actionParameters = computeDisplayedActionParameters(groupDef);
		
		// Check if there is a need to update currentTab
		groupGui.guiTabs = computeDisplayedGuiTabs(groupDef, groupGui.grid.lines, groupGui.actionParameters);

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
	}

	initStacks( ) {

		// Create this.object.stacks
		const cardStacks = this.module.cardStacks;
		this.object.stacks = computeAllPossibleStackList().map( s => {

			const data = {};
			data.key = s.key;
			data.isDefaultStack = s.default;
			data.useCustomCardImpl = s.useCustomCardImpl;
			data.gui = {
				toggled: s.toggled,
				toggleLocked: s.toggleLocked,
				detailsDisplayed: false,
				deck: s.deck
			};

			// actionGroups : actions are grouped by category. (Move, Exchance, Deal, Rotate, ...)
			//---------------
			data.groups = this.module.actionService.getAllActionsDetailsMap(s.key);
			Object.values(data.groups).forEach( g => {
				g.unfolded = false;
				g.currentTab = null; // Once unfolded, tab will be deduced
				return g;
			});

			// parameters : Additional info on deck, like image path or translation prefix
			//---------------
			const declared = CARD_STACKS_DEFINITION.core[s.key];
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
	
	_prepareStackList() {

		// Add confboxes information for each stack
		const stacks = this.object.stacks.map( stack => {
			const data = {
				actions: buildStackActions(stack),
				groupsGui: actionGroupsForGUI(stack)
			};

			return foundry.utils.mergeObject( data, stack );
		});
		return stacks;
	}

	/** @override */
	async getData() {

		const stacks = this._prepareStackList();

		return {
			stacks: stacks
		};
	}

	/** @override */
    activateListeners(html) {
		html.find('.declared-deck .toggle-button.deck.active').click(event => this._onClickToggleDeck(event) );
		html.find('.declared-deck .toggle-button.show.active').click(event => this._onClickToggleDetails(event) );
		
		html.find('.declared-deck .group-action.toggle-button.active').click(event => this._onClickToggleActionChoice(event) );
		html.find('.declared-deck .group-check.toggle-button.active').click(event => this._onClickToggleWholeActionGroup(event) );
		html.find('.declared-deck .group-fold.toggle-button.active').click(event => this._onClickFoldActionGroup(event) );
		html.find('.declared-deck .group-tab').click(event => this._onClickChangeActionGroupTab(event) );

        html.find('.declared-deck .param-input.button-text').change(event => this._onChangeActionButtonText(event) );

		html.find('.declared-deck .toggle-button.action.active').click(event => this._onClickToggleStackParameter(event) );
        //html.find('.declared-deck .param-input').change(event => this._onChangeParameterValue(event) );

		html.find('.save-stacks').click(event => this._onClickSaveConfig(event) );
	}

	/** @override */
	_updateObject(event, formData) {
		// Not used
	}

	/* -------------------------------------------- */

	async _onClickToggleActionChoice(event) {
		const checkboxInGrid = event.currentTarget;
		const groupDiv = checkboxInGrid.parentElement.parentElement.parentElement;

		const configKey = checkboxInGrid.dataset.config;
		const deckKey = groupDiv.dataset.key;
		const groupId = groupDiv.dataset.group;

		const stack = this.object.stacks.find( s => s.key === deckKey);
		const group = stack.groups[groupId];
		const action = group.actions.find( a => a.confKey === configKey);

		action.available = !action.available;
		this.render();
	}

	async _onClickToggleWholeActionGroup(event) {
		const checkboxIcon = event.currentTarget;
		const groupDiv = checkboxIcon.parentElement.parentElement;

		const deckKey = groupDiv.dataset.key;
		const groupId = groupDiv.dataset.group;

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
		const folderIcon = event.currentTarget;
		const groupDiv = folderIcon.parentElement.parentElement;

		const deckKey = groupDiv.dataset.key;
		const groupId = groupDiv.dataset.group;

		const stack = this.object.stacks.find( s => s.key === deckKey);
		const group = stack.groups[groupId];
		group.unfolded = !group.unfolded;
		this.render();
	}

	async _onClickChangeActionGroupTab(event) {
		const tabDiv = event.currentTarget;
		const groupDiv = tabDiv.parentElement.parentElement;

		const tab = tabDiv.dataset.tab;
		const deckKey = groupDiv.dataset.key;
		const groupId = groupDiv.dataset.group;

		const stack = this.object.stacks.find( s => s.key === deckKey);
		const group = stack.groups[groupId];
		group.currentTab = tab;
		this.render();		
	}

	async _onChangeActionButtonText(event) {
		const input = event.currentTarget;
		const paramDiv = input.parentElement.parentElement; 
		const groupDiv = paramDiv.parentElement;

		const action = paramDiv.dataset.action;
		const deckKey = groupDiv.dataset.key;
		const groupId = groupDiv.dataset.group;

		const stack = this.object.stacks.find( s => s.key === deckKey);
		const group = stack.groups[groupId];
		const label = group.labels.find(l => l.action === action);
		label.current = input.value;
		this.render();
	}


	async _onClickSaveConfig(event) {

		const wholeDetails = this.object.stacks.filter( s => {
			return s.gui.toggled;

		}).map( s => {
			return { key: s.key, details: s.groups };
		});
		await this.module.actionService.updateSettingsWithCurrentActionDetails(wholeDetails);
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

	async _onClickToggleStackParameter(event) {
		event.preventDefault();
		const a = event.currentTarget;
		const deckKey = a.parentElement.parentElement.dataset.key;
		const paramKey = a.parentElement.dataset.param;

		const stack = this.object.stacks.find( s =>s.key === deckKey );
		stack.parameters[paramKey] = !stack.parameters[paramKey];
		this.render();
	}

}

