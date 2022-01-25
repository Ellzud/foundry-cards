import { CustomCards } from "./cards.js";
import { CustomCardsDisplay } from "./CardsDisplay.js";
import { ConfigSheetForActions } from "./ConfigSheetForActions.js";
import { ConfigSheetForShortcuts } from "./ConfigSheetForShortcuts.js";
import { GlobalConfiguration } from "./constants.js";
import { CustomCardsDirectory } from "./CustomCardsDirectory.js";


export const registerCardSystem = () => {
	if( game.settings.get("ready-to-use-cards", GlobalConfiguration.invasiveCode ) ) {
		CONFIG.Cards.documentClass = CustomCards;
		CONFIG.ui.cards = CustomCardsDirectory;
	} else {
		DocumentSheetConfig.registerSheet(Cards, "ready-to-use-cards", CustomCardsDisplay, {
			label: "RTUCards.card.sheet.name",
			types: ["deck", "hand", "pile"],
			makeDefault: true
		});
	}
}

/* -------------------------------------------- */

/**
 * Register game settings and menus for managing the Ready To Use Cards module
 */
export const loadCardSettings = () => {

	// First menu : Choose your decks!
	//------------------------------------
	game.settings.registerMenu("ready-to-use-cards", "config-actions", {
		name: "RTUCards.settings.config-actions.menu",
		label: "RTUCards.settings.config-actions.title",
		hint: "RTUCards.settings.config-actions.hint",
		icon: "fas fa-cog",
		type: ConfigSheetForActions,
		restricted: true
	});

	// Data will be stored inside 'stacks'
	game.settings.register("ready-to-use-cards", GlobalConfiguration.stacks, {
		scope: "world",
		config: false,
		default: null,
		type: Object,
		onChange: async c => {
			const app = Object.values(ui.windows).find(a => a.constructor === ConfigSheetForActions);
			if ( app ) app.render();
		}
	});

	// Second menu : Configure your shortcuts
	//--------------------------------------
	game.settings.registerMenu("ready-to-use-cards", "config-shortcuts", {
		name: "RTUCards.settings.config-shortcuts.menu",
		label: "RTUCards.settings.config-shortcuts.title",
		hint: "RTUCards.settings.config-shortcuts.hint",
		icon: "fas fa-mouse-pointer",
		type: ConfigSheetForShortcuts,
		restricted: false
	});

	// Data will be stored inside 'shortcuts'
	game.settings.register("ready-to-use-cards", GlobalConfiguration.shortcuts, {
		scope: "client",
		config: false,
		default: null,
		type: Object,
		onChange: async c => {
			const app = Object.values(ui.windows).find(a => a.constructor === ConfigSheetForShortcuts);
			if ( app ) app.render();
		},
		config: false
	});



	game.settings.register("ready-to-use-cards", GlobalConfiguration.invasiveCode, {
		name: "RTUCards.settings.invasiveCode.label",
		hint: "RTUCards.settings.invasiveCode.hint",
		scope: "world",
		type: Boolean,
		default: true,
		config: true
	});
  
	game.settings.register("ready-to-use-cards", GlobalConfiguration.smallDisplay, {
		name: "RTUCards.settings.smallDisplay.label",
		hint: "RTUCards.settings.smallDisplay.hint",
		scope: "client",
		type: Boolean,
		default: false,
		config: true,
		onChange: () => window.location.reload()
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
		config: true,
		onChange: () => game.modules.get('ready-to-use-cards').cardStacks.loadCardStacks()
	});
  
	game.settings.register("ready-to-use-cards", GlobalConfiguration.stackForPlayerRevealedCards, {
		name: "RTUCards.settings.stackForPlayerRevealedCards.label",
		hint: "RTUCards.settings.stackForPlayerRevealedCards.hint",
		scope: "world",
		type: Boolean,
		default: true,
		config: true,
		onChange: () => game.modules.get('ready-to-use-cards').cardStacks.loadCardStacks()
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
