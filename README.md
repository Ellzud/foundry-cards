# Ready To Use Cards Module

## Introduction

### The mindset
This module has been developped with the following mindset : 

- You don't need to edit your card deck during the game. Once set, you only need to have easy acces to your cards, related decks and discard piles.
- Each player should be able to have cards in his hands (Only visible by him. Even GMs can't see them) and cards in front of him, visible by everyone. When adding this module, those two card stacks will be created for each player. (It's still possible to remove the Hand or Revealed cards stack inside settings)
- GMs share only one Hand and Revealed cards stack
- Multiple decks can be used. Each one comes with its related discard pile.
- What is important is : For each card type, which action is available when handling decks, hands, revealed cards and discard piles. All this is customizable via settings.

### Invasive code - or not

![Invasive code](docs/README_invasive_code.webp?raw=true)

By default, this module override those two classes : 
~~~js
static registerCardSystem() {
    CONFIG.Cards.documentClass = CustomCards;
    CONFIG.ui.cards = CustomCardsDirectory;
}
~~~
It allows automatic detection of card stack handled by the module and switch to the right UI.

It also comes with a custom context menu when clicking on them inside the card stack list.

> If those overrides bother you or comes into conflict with your custom system, you can choose to uncheck it.

By doing so, the custom context becomes disabled and the card GUI will be registered as any other sheet. See next chapter for more details about those two functions.


### Supported languages

This module is currently available in French and in English.



## Choose the decks you want

### Comes with Ready to use decks

Inside the settings, you will be able to toggle those decks : 
- Poker deck, with golden cards (Thanks to Foundry beautiful card images)
- Poker deck, with red and grey cards (idem)
- Tarot deck, classic game (Spades, Hearts, Diamonds and Clubs. With Thrumps)
- Tarot deck, divinatory version (Swords, Cups, Money and Clubs. With major arcanas)
- Zodiac sign deck, a card for each zodiac sign. (Because I found beautiful free cards for it)

For those decks, on click in the settings and all is ready to use !
![Setting panel](docs/README_choosing_decks_button.webp?raw=true)

Alternative: 

![Regiter deck alternative](docs/README_choosing_action_alternative.webp?raw=true)

And then uncheck actions you don't want to have :

![Choosing decks](docs/README_choosing_decks.webp?raw=true)

### Add custom decks

You can still create other decks. The same way you did it before. 

> If you've chosen to keep the `Invasive code` setting, the GUI won't change as long as the stack is not registered inside this module decks.

> Otherwise, you will need to manually put the classic sheet back.

Once you're done, you can add the deck to the registered ones :

![Regiter deck](docs/README_register_deck.webp?raw=true)

Alternative: 

![Regiter deck alternative](docs/README_register_deck_alternative.webp?raw=true)

By doing so, a second stack for the discard will automatically be created. And now you will have access to this module GUI !

![Regiter deck result](docs/README_register_deck_result.webp?raw=true)

### Advanced method (only for developpers)

There exists an advanced method allowing you to do far more configuration for your custom decks. It uses a hooks named `loadCardStacksDefinition`. You will need to add some code in you custom module/system to manage it.

It can allow to automatically create decks without the need to have static preset files. But above all, it allows you to implement custom actions and custom display for your cards.

Since it's a little complicated, this will be described in details at the end of this readme.




## Choosing which actions you want for your cards

### The config panel

The conf panel for choosing them is available by two methods :
- Directly inside the Configure Settings window
- By a Right-click on a registered card stack

![Choosing actions access](docs/README_choosing_action_access.webp?raw=true)

If you choose the second method, config panel will directly be set on the click stack.

![Choosing actions result](docs/README_choosing_action_result.webp?raw=true)

Each checkbox is linked to a possible action in the main GUI.

### Filtering choice pool

There are many available actions. When you have many decks, it can becomes pretty difficult to see if you have done the right configuration for each one.

To solve this, a prior filtering is available. By using it, you can greatly reduce your choice pool inside each deck :

![Choosing actions filtering](docs/README_choosing_action_filtering.webp?raw=true)

### Other available parameters for the deck

Depending on how the deck was declared, you may have some additional parameters or informations in this section. Those are the most classic ones :

![Additional parameters](docs/README_choosing_action_parameters.webp?raw=true)

`Used prefix for labels` : Labels for deck name, actions or chat messages are constructed with a prefix depending from the deck. (It will try with the given prefix, and fallback to `RTUCards.default.` if not found ).

> If you want to change the name of some labels, you can put them inside a new [translation file](./lang/en.json) and change this prefix.

`Image root directory` : By default, deck icons and the card back are defined from this directory. It follows this structure : 

~~~sh
./background/back.webp
./background/front.webp
./icons/back.webp
./icons/front.webp
~~~

> If you want to change those images, you can create a new directory in your world and put the image you want by following the previous structure. Then edit this directory path.

> If the deck was already created in your world, the icon won't be changed. You will need to delete it, and recreate it with the correct value.

## Understanding the GUI

### Rules

**Player card stacks rules :**
- Hand is visible only by owner. Revealed cards are visible by everybody. It's the same for the GM card stacks.

**Decks and Discard piles rules :**
- Only the GM can do actions on them.

### Action example : GM peeks on a player card hands

Did I say otherwise just several lines earlier ? By default, GM can't see a player hand, but there are some cases where it can be useful. Mainly for assisting a player who hasn't understood one of its cards.

**If the GM choose to do so, players will be warned**

![Peeking on warning](docs/README_peek_on_hand_warning.webp?raw=true)

This is what he will see by default :
![Before peeking on](docs/README_peek_on_hand_default.webp?raw=true)

And once he clicks on the `Peek on content` button :
![After peeking on](docs/README_peek_on_hand_after.webp?raw=true)


### Action example : Dealing cards

For this action, destination targets will differ depending on what has been configured :

![Dealing cards](docs/README_deal_cards.webp?raw=true)

### Action example : Play multiple cards

For this action, you can select additionnal cards after selecting the first one :

![Playing multiple cards](docs/README_play_multiple.webp?raw=true)

### Action example : Exchanging card with another player

For this action, you need to choose two things :
- With who you want to exchange cards
- Selecting the card to exchange with inside his hand or revealed cards

![Exchange cards](docs/README_exchange_cards.webp?raw=true)

### Action example : Rotating selected card

This on is slightly different from the others : It actually doesn't add any changes to the card. Only the GUI is altered. The card is put upside down.
Mainly useful for cards who can be read from the two ways.


## Using the shortcuts

When you add the module, two panels will be displayed on your canvas :

![Shortcut display](docs/README_shortcut_display.webp?raw=true)

### Configuring your shortcuts

This configuration is available for each player.

The configure panel can be opened via the module settings panels, or directly via a right click on the left icon of one of the two shortcuts.

![Shortcut config](docs/README_shortcut_configuration.webp?raw=true)

In it, you can:
- Hide unwanted shortcuts
- Change their left icon
- Change the amount of displayed cards
- Make the shortcuts really small, or really big

If you choose to display 0 cards, the shortcut will instead display the summary of the stack :

![Shortcut zero cards](docs/README_shortcut_zero_cards.webp?raw=true)

### Moving your shortcuts

The left icon of each shortcut is draggable. Use them to move your shortcuts where you want.

### Available actions on shortcut

- Clicking on a card will make the stack display pop out, with the given card selected
- Left and right brackets can help you see what you have (Lopp through cards)
- The eye icon in the summary simply open the stack display


## Following the actions on the chat message

Each action comes with a message sent to the chat log.

Some messages such has the drawing card part are not displayed the same way depending on if you own the stack or not.

What the other player will see : 

![Draw seen by other](docs/README_draw_card_otherView.webp?raw=true)

What the player will see :

![Draw seen by player](docs/README_draw_card_playerView.webp?raw=true)

And when they clicks on the link : 
![Draw details](docs/README_draw_card_clicked.webp?raw=true)

## Additional configuration settings

![Configuration settings](docs/README_additional_configuration.webp?raw=true)

The first two ones are for the chatlog when GM is doing actions

`Smaller window` : Each player can choose if he wants the classic card stack display or if he prefers a smaller one. Smaller one may be mandatory if you use a laptop screen which is most of the time smaller.

`Cards in hands` and `Revealed cards` can be toggled to delete players hands or revealed cards. That way, Players will only have one stack to manage. But the related actions won't be available anymore.

`Peek on player's hand` : Uncheck it if you don't want to be tempted !

`Discard all hand` and `Discard all revealed cards` : Thoses actions do not depends on a specific deck and are present even if no cards are selected.

## Advanced method for configuring your decks (only for developpers)

### Where to add code

You need to add the following hooks
~~~js
Hooks.on("loadCardStacksDefinition", (cardStacksDefinition) => {
	// Alter cardStacksDefinition here
});
~~~

About `cardStacksDefinition`, you can have a complete detail [here](./module/StackDefinition.js).

### Adding new decks

You need to add childs to `cardStacksDefinition.core`. Make sur you don't use one of the values used by defaultCoreStacks.

Each child should follow the CoreStackDefinition format, described in the [same file](./module/StackDefinition.js).

Here is a summary of the default values :
~~~js
// Load default values
Object.values(def.core).forEach( coreStrackDefinition => {
    const c = coreStrackDefinition;
    if( !c.cardClass ) { c.cardClass = CustomCardSimple; }
    if( !c.labelBaseKey ) { c.labelBaseKey = 'RTUCards.default.'; }
    if( !c.resourceBaseDir ) { c.resourceBaseDir = 'modules/ready-to-use-cards/resources/default'; }
});
~~~

### Setting configuation

Those decks won't be available in the configuration settings panel. You will need to choose which basic actions you want directly inside code.

All basic action keys are referenced in `CardActionsClasses` decribed [here](./module/constants.js).

Inside your code, `CardActionsClasses` can be obtained via `cardStacksDefinition.shared.actionCss`.

You don't need to specify each actions, only those you don't wan't to have for your deck.

### Using labelBaseKey

The prefix can be pretty useful: It can help you redefine every labels for your custom decks.

You just need to the right translation key in your translation files.

Available keys can be deduced from all traslation key prefixed by `RTUCards.default.` in this module translation files

Example (`labelBaseKey` = `AESYSTEM.cards.event.`) : 
~~~json
{
    "AESYSTEM.cards.event.title": "Event & Spirit",
    "AESYSTEM.cards.event.description": "A 52 cards deck. Drawn as an event card or a spirit card",

    "AESYSTEM.cards.event.message.draw.hand.one":  "One event card has been drawn",
    "AESYSTEM.cards.event.message.draw.hand.many":  "NB event cards were drawn",
    "AESYSTEM.cards.event.message.draw.pile.one":  "One spirit is answering your call",
    "AESYSTEM.cards.event.message.draw.pile.many":  "NB spirits are answering your call",
    
    "AESYSTEM.cards.event.sheet.actions.playEvent.actionButton": "Play event",
    "AESYSTEM.cards.event.sheet.actions.playEvent.selectTitle": "Cards to discard",
}
~~~

### Using resourceBaseDir

Define the base directory for your deck icons, background image and front image.

Background image is used when no card are selected on the deck or if the selected card is not visible.

Front image is used when no card are selected on the discard pile.

Check `resources/default` for having more information on how it should be filled. 

Image files should be on the `.webp` format.


### Using cardClass

> This is where all the fun (or nightmare) begins !

By substituting the cardClass you can alter the default behavior and display.

[CustomCardSimple](./module/CustomCardSimple.js) decribe in details which methods you can add to your implementation.

You can find an example [here](https://gitlab.com/adrien.schiehle/acariaempire/-/tree/release-1.0.1/src/card) for a custom implementation

It's called inside my custom system via this: (Nothing more):
~~~js
Hooks.on("loadCardStacksDefinition", (cardStacksDefinition) => {

	alterCardStacksDefinition(cardStacksDefinition);
});
~~~


## Credits for card images used in the preconfigured decks : 

- Zodiac signs : Designed by rawpixel.com. Downloaded from fr.freepik.com
- Divine Tarot : Source : Tarot de Marseille
Edition Grimaud, Downloaded from https://insightfulvision.fr/gallery-arcanes1.php
- Classic Poker : LGPL, Downloaded from https://fr.wikipedia.org/wiki/Jeu_de_cartes_fran%C3%A7ais
- Classic Tarot : Designed by Edition Grimaud, Downloaded from https://commons.wikimedia.org/wiki/Category:Tarot_nouveau_-_Grimaud_-_1898
- Pixel Fantasy : Designed by Caz (https://cazwolf.itch.io/), Downloaded from https://cazwolf.itch.io/pixel-fantasy-cards?download 
- Shortcut icon for player hand : https://icon-library.com/icon/playing-cards-icon-0.html
- Shortcut icon for player revealed cards : https://icon-library.com/icon/playing-cards-icon-18.html
