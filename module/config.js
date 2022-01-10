import { CustomCard } from "./card.js";
import { CustomCards } from "./cards.js";
import { CustomCardsDisplay } from "./CardsDisplay.js";

export const registerCardSystem = () => {

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

export const loadCardSettings = () => {

    game.settings.register("ready-to-use-cards", "gmName", {
		name: "WA.GmNameLabel",
		hint: "WA.GmNameHint",
		scope: "world",
		type: String,
		default: 'GM',
		config: true
	});
  
    game.settings.register("ready-to-use-cards", "gmIcon", {
		name: "WA.GmIconLabel",
		hint: "WA.GmIconHint",
		scope: "world",
		type: String,
		default: 'modules/ready-to-use-cards/resources/gmIcon.png',
		config: true
	});
  
}