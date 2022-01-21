import { CustomCardStackLoader } from './module/CardStackLoader.js';
import { CARD_STACKS_DEFINITION } from './module/StackDefinition.js';
import { RTUCardsConfig }  from './module/config.js';
import * as message  from './module/message.js';

/**
 * Initialization actions taken on Foundry Virtual Tabletop client init.
 */
 Hooks.once("init", () => {

  console.log('Ready-To-Use Cards | Module initializing ...');
  RTUCardsConfig.loadCardSettings();
  RTUCardsConfig.registerCardSystem();

  const module = game.modules.get('ready-to-use-cards');
  module.cardStacks = new CustomCardStackLoader();
  module.stacksDefinition = CARD_STACKS_DEFINITION;
});

/**
 * Initialization actions taken on Foundry Virtual Tabletop client init.
 */
Hooks.once("ready", async () => {

  const module = game.modules.get('ready-to-use-cards');
  await module.cardStacks.loadCardStacks();

  console.log('Ready-To-Use Cards | Module is ready');
});

Hooks.on("renderChatMessage", (chatMessage, html, messageData) => {

  if(message.isACardMessage(chatMessage) ) {
    message.alterCardMessage(chatMessage, html);
  }
});



