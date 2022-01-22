# CHANGELOG

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