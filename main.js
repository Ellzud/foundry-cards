import { CustomCardStackLoader } from './module/CustomCardStackLoader.js';
import { CARD_STACKS_DEFINITION } from './module/StackDefinition.js';
import * as config  from './module/config.js';
import * as message  from './module/message.js';
import { ShortcutForHand, ShortcutForRevealedCards } from './module/ShortcutPanels.js';
import { GlobalConfiguration } from './module/constants.js';

/**
 * Initialization actions taken on Foundry Virtual Tabletop client init.
 */
 Hooks.once("init", () => {

  console.log('Ready-To-Use Cards | Module initializing ...');
  config.loadCardSettings();
  config.registerCardSystem();

  const module = game.modules.get('ready-to-use-cards');
  module.cardStacks = new CustomCardStackLoader();
  module.stacksDefinition = CARD_STACKS_DEFINITION;
  module.shortcuts = {
    hand: new ShortcutForHand(),
    revealed: new ShortcutForRevealedCards()
  };
});

/**
 * Initialization actions taken on Foundry Virtual Tabletop client init.
 */
Hooks.once("ready", async () => {

  const module = game.modules.get('ready-to-use-cards');
  await module.cardStacks.loadCardStacks();

  module.shortcuts.hand.reload();
  module.shortcuts.revealed.reload();
  console.log('Ready-To-Use Cards | Module is ready');
});

Hooks.on("renderChatMessage", (chatMessage, html, messageData) => {

  if(message.isACardMessage(chatMessage) ) {
    message.alterCardMessage(chatMessage, html);
  }
});

Hooks.on("updateCustomCardsContent", (cards, options, user) => {
  const module = game.modules.get('ready-to-use-cards');
  module.shortcuts.hand.someStacksHaveChanged(cards);
  module.shortcuts.revealed.someStacksHaveChanged(cards);
});


// -----------------------------------------------------------
// Those next hooks are here for those who unchecked invasive code
// It has lesser performance than calling it only once by change inside CustomCards
// But only available method for those who have unchecked invasive code settings
// -----------------------------------------------------------
Hooks.on("createCard", (card, options, userId) => {
  if( !game.settings.get("ready-to-use-cards", GlobalConfiguration.invasiveCode ) ) {
    Hooks.call('updateCustomCardsContent', card.parent, options, userId);
  }
});

Hooks.on("updateCard", (card, change, options, userId) => {
  if( !game.settings.get("ready-to-use-cards", GlobalConfiguration.invasiveCode ) ) {
    Hooks.call('updateCustomCardsContent', card.parent, options, userId);
  }
});

Hooks.on("deleteCard", (card, options, userId) => {
  if( !game.settings.get("ready-to-use-cards", GlobalConfiguration.invasiveCode ) ) {
    Hooks.call('updateCustomCardsContent', card.parent, options, userId);
  }
});



