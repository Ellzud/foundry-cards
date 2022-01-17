# Ready To Use Cards Module

## Introduction

This module has been developped with the following mindset : 

> You don't need to edit your card deck during the game. Once set, you only need to have easy acces to your cards and the related decks and discard piles.

> Each player should be able to have cards in his hands (Only visible by him. Even GMs can't see them) and cards on front of him, visible by everyone. When adding this module, those two card stacks will be created for each player. (It's still possible to remove the Hand or Revealed cards stack inside settings)

> GMs share only one Hand and Revealed cards stack

> Multiple decks can be used. Each one comes with its related discard pile.

> What is important is : For each card type, which action is available when handling decks, hands, revealed cards and discard piles. All this is customizable via settings.

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

![Choosing decks](docs/README_choosing_decks.webp?raw=true)

### Add custom decks

You can still create other decks. The same way you did it before. GUI won't change as long as the stack is not registered inside this module decks.

Once you're done, you can add the deck to the registered ones :

![Regiter deck](docs/README_register_deck.webp?raw=true)

By doing so, a second stack for the discard will automatically be created. And now you will have access to this module GUI !

![Regiter deck result](docs/README_register_deck_result.webp?raw=true)

### Advanced method (only for developpers)

There exists an advanced method allowing you to do far more configuration for your custom decks. It uses a hooks named `loadCardStacksDefinition`. You will need to add some code in you custom module/system to manage it.

It can allow to automatically create decks without the need to have static preset files. But above all, it allows you to implement custom actions and custom display for your cards.

Since it's a little complicated, this will be described in details at the end of this readme.


## Choose which actions you want for your cards

The conf panel for choosing them is available by two methods :
- Directly inside the Configure Settings window
- By a Right-click on a registered card stack

![Choosing actions access](docs/README_choosing_action_access.webp?raw=true)

If you choose the second method, config panel will directly be set on the click stack.

![Choosing actions access](docs/README_choosing_action_result.webp?raw=true)

Each checkbox allow an action from the main GUI.

## Understanding the GUI

**One rule for player card stacks :**
- Hand is visible only by owner. Revealed cards are visible by everybody. It's the same for the GM card stacks.

**One rule for decks and discard piles :**
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

### Action example : Rotating selected card

This on is slightly different from the others : It actually doesn't add any changes to the card. Only the GUI is altered. The card is put upside down.
Mainly useful for cards who can be read from the two ways.

## Following the actions on the chat message

Each action comes with a message sent to the chat log.

Some messages such has the drawing card part are not displayed the same way depending on if you own the stack or not.

What the other player will see : 

![Draw seen by other](docs/README_draw_card_otherView.webp?raw=true)

What the player will see :

![Draw seen by player](docs/README_draw_card_playerView.webp?raw=true)

And when he clicks on the link : 
![Draw details](docs/README_draw_card_clicked.webp?raw=true)

## Advanced method for configuring your decks (only for developpers)
TODO

## Credits for card images used in the preconfigured decks : 

- Zodiac signs : Designed by rawpixel.com. Downloaded from fr.freepik.com
- Divine Tarot : Source : Tarot de Marseille
Edition Grimaud, Downloaded from https://insightfulvision.fr/gallery-arcanes1.php
- Classic Tarot : Designed by Edition Grimaud, Downloaded from https://commons.wikimedia.org/wiki/Category:Tarot_nouveau_-_Grimaud_-_1898
