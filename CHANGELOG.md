# CHANGELOG

## Release 1.4.0

### New actions
- Ability to exchange a card with another player

### Conf panel : 
- It's now possible to modify card back via the config panel. You can also modify labels for actions and messages

![Additional parameters](docs/README_choosing_action_parameters.webp?raw=true)

More details in the `README`, section `Other available parameters for the deck`

### Warning : API Change
> Signature of CardActionParametersForCardSelection class has changed. 

Now it takes a `CustomCardStack[] fromStacks` instead of a `CustomCardStack from` in its constructor. 

In addition, callback now has a `CustomCardStack from` additional argument.

This change was motivated by the need of selecting a card stack before choosing the card.


## Release 1.3.3

### Issue: 
- With smaller GUI, scale transformation on card display didn't work well for custom implem. (Only the background was correctly resized)
- Shortcuts panels are now moving in a better way and their configuration sliders are more easily useable.

## Release 1.3.2

### Issue: 
- Laptop form error:  https://gitlab.com/adrien.schiehle/ready-to-use-cards/-/issues/1

## Release 1.3.1

### Bugfix: 
- Player could not move their shortcuts

## Release 1.3.0

### GUI changes: 
- Now, the GUI remembers where you were inside scolls
- There was a problem while displaying a single card from the deck: Default deck actions were available.

### Shortcuts on canvas
This version comes with some new GUI for quick access of you hand card and your revealed cards.

![Shortcut display](docs/README_shortcut_display.webp?raw=true)

More details in the `README`, section `Using the shortcuts`


## Release 1.2.0

### GUI changes
Splitting action on card stack and on selected card:
- On the left side : Actions on card stack
- On the right side : Actions on selected card

### Actions modifications
- Rotating card action now only turn the selected card.
- Peeking action can now be stopped without having to press F5

### New actions
- Draw cards can now be done by player via their hand and revealed cards stack


## Release 1.1.0

Initially this module was part of my own system and I chose to split it to let other benefit from it.

During the split, I failed to see that class overrides will obviously be badly seen by most. Error fixed!

> No more overrides on the Card class. And the two other ones can be removed with new settings.

You won't loose much from the functionnalities if you choose to remove the overrides.

More details in the `README`, section `Invasive code - or not`

For those who started to implement custom actions : `impl.alterBuildCardInfoForListing` changed its signature. (it now pass a CustomCardStack in the `from` argument)
