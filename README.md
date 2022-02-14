# Ready To Use Cards Module

## Introduction

### The mindset
This module has been developped with the following mindset : 

- You don't need to edit your card deck during the game. Once set, you only need to have easy acces to your cards, related decks and discard piles.
- Each player should be able to have cards in his hands (Only visible by him. Even GMs can't see them) and cards in front of him, visible by everyone. When adding this module, those two card stacks will be created for each player. (It's still possible to remove the Hand or Revealed cards stack inside settings)
- GMs share only one Hand and Revealed cards stack
- Multiple decks can be used. Each one comes with its related discard pile.
- What is important is : For each card type, which action is available when handling decks, hands, revealed cards and discard piles. All this is customizable via settings.

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

> The GUI won't change as long as the stack is not registered inside this module decks.

You can still create other decks. The same way you did it before. 

Once you're done, you can add the deck to the registered ones :

![Regiter deck](docs/README_register_deck.webp?raw=true)

By doing so, a second stack for the discard will automatically be created. And now you will have access to this module GUI !

![Regiter deck result](docs/README_register_deck_result.webp?raw=true)

If you want to make slight changes (like adding Jokers) from preconfigured decks, presets are available :

![Available presets](docs/README_register_deck_presets.webp?raw=true)


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

### Other parameters

There exists other parameters linked to each decks. If you use pre-generated decks or decks issued from RTUC presets, you won't need to change those :

![Additional parameters](docs/README_choosing_action_parameters.webp?raw=true)

But if you're creating you're own custom decks, you may want to check what those parameters does :

`Used prefix for labels` : Labels for deck name, actions or chat messages are constructed with a prefix depending from the deck. (It will try with the given prefix, and fallback to `RTUCards.default.` if not found ).

You will have more details on how this works inside [README LABELS](./README_DEVELOPERS.md)

`Image root directory` : By default, deck icons and the card back are defined from this directory. It follows this structure : 

~~~sh
./background/back.webp
./background/front.webp
./icons/back.webp
./icons/front.webp
~~~

> If you want to change those images, you need create a new directory in your world and put the image you want by following the previous structure. Then edit this directory path.

> For now, if the deck was already created in your world, the icon won't be changed. You will need to delete it, and recreate it with the correct value.

**Why two images?**

Be it Actors, Items, or Card stacks, their are represented inside Chat or Right panel via a square. That's not the ideal format for cards. So I'm using two different images: 

![Additional parameters](docs/README_icons_and_back.webp?raw=true)


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


## Using Hand and Revealed cards summary

When you add the module, two panels will be displayed on your canvas :

![Shortcut display](docs/README_shortcut_display.webp?raw=true)

### Configuring your panels

This configuration is available for each player.

The configure panel can be opened via the module settings panels, or directly via a right click on the left icon of one of the two panels.

![Shortcut config](docs/README_shortcut_configuration.webp?raw=true)

In it, you can:
- Hide unwanted panel
- Change their left icon
- Change the amount of displayed cards
- Make the panels really small, or really big

If you choose to display 0 cards, the panel will instead display the summary of the stack :

![Shortcut zero cards](docs/README_shortcut_zero_cards.webp?raw=true)

### Moving your panels

The left icon of each shortcut is draggable. Use them to move your shortcuts where you want.

### Available actions on panels

- Clicking on a card will make the stack display pop out, with the given card selected
- Left and right brackets can help you see what you have (Loop through cards)
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

## Playing with card stack permissions

Once registered, decks and discard piles are set with default permissions to OBSERVER.

You can alter those permissions for each players if you want to change the default behavior :

![Playing with permissions](docs/README_permissions.webp?raw=true)

> You don't have access to this panel for player hands and revealed cards. What can be done for there are directly managed by code and you should not alter the default permissions put on these.

### Changing decks permissions

By default, permissions are set to OBSERVER to everyone.

If you change it to :
- OWNER : 
  - Players with this permission will have access to almost all available GM actions on the deck.
  - The only missing action is ***Recall all cards***, since it needs to own every stacks to be performed.
- LIMITED :
  - Players with this permission won't be able to draw cards from this deck, even if the ***Draw card*** action is allowed in settings.
  - The deck can still be viewed by players with this permission. Allowing them to know how many cards are left in the drawing pile.
- NONE :
  - Same restrictions as above.
  - Players can't see the deck anymore and won't be able to know hom many cards are left.

### Changing discards permissions

By default, permissions are set to OBSERVER to everyone.

If you change it to :
- OWNER : 
  - Players with this permission will have access to all available GM actions on the discard pile.
- LIMITED :
  - Players with this permission won't see the card details when other players use the ***Discard card*** action.
  - The discard can still be viewed by players with this permission. But they can only see how many cards have been discarded. Cards contents are hidden.
- NONE :
  - Same restrictions as above.
  - Players can't see the discard anymore and won't be able to know hom many cards are left.

> Warning : If you choose to give OWNER rights to players, they will have access to the actions ***Put it back in the deck*** and ***Shuffle all discard inside deck***. Those actions usually shuffle the deck after putting the cards inside it. If the player doing it doesn't have the OWNER rights on the deck, the shuffle step will be ignored and the cards will be put on the top of the deck. (`card.data.sort` remained unchanged)

## Additional configuration settings

![Configuration settings](docs/README_additional_configuration.webp?raw=true)

The first two ones are for the chatlog when GM is doing actions

`Smaller window` : Each player can choose if he wants the classic card stack display or if he prefers a smaller one. Smaller one may be mandatory if you use a laptop screen which is most of the time smaller.

`Cards in hands` and `Revealed cards` can be toggled to delete players hands or revealed cards. That way, Players will only have one stack to manage. But the related actions won't be available anymore.

`Peek on player's hand` : Uncheck it if you don't want to be tempted !

`Discard all hand` and `Discard all revealed cards` : Thoses actions do not depends on a specific deck and are present even if no cards are selected.

## For advanced users

There are some more stuff that can be done. Since it can be a little complicated, I've stored those feature description in a separated file : [README DEVELOPERS](./README_DEVELOPERS.md)

Here is a summaray of what can be done : 
- Adding other language support.
- Changing labels for action names and messages when actions are done.
- Making more complex card display (not just an image) which can change after some actions
- Making your custom actions when cards are on the deck / inside your hands or revealed cards / inside discard.

## Credits for card images used in the preconfigured decks : 

- Zodiac signs : Designed by rawpixel.com. Downloaded from fr.freepik.com
- Divine Tarot : Source : Tarot de Marseille
Edition Grimaud, Downloaded from https://insightfulvision.fr/gallery-arcanes1.php
- Classic Poker : LGPL, Downloaded from https://fr.wikipedia.org/wiki/Jeu_de_cartes_fran%C3%A7ais
- Classic Tarot : Designed by Edition Grimaud, Downloaded from https://commons.wikimedia.org/wiki/Category:Tarot_nouveau_-_Grimaud_-_1898
- Pixel Fantasy : Designed by Caz (https://cazwolf.itch.io/), Downloaded from https://cazwolf.itch.io/pixel-fantasy-cards?download 
- Shortcut icon for player hand : https://icon-library.com/icon/playing-cards-icon-0.html
- Shortcut icon for player revealed cards : https://icon-library.com/icon/playing-cards-icon-18.html
