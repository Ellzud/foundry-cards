
export const isACardMessage = (message) => {
    const flags = message.data.flags;
    return flags['ready-to-use-cards']?.handleCards ? true : false;
}

export const alterCardMessage = (message, html) => {
    
    const needToHideContent = (flag) => {
        if( !flag.hideToStrangers ) { return false; }
        if( game.user.isGM && flag.forGMs ) { return false; }
        if( !game.user.isGM && flag.forPlayers ) {
            return flag.playerId != game.user.id;
        }
        return true;
    }

    const onClickShowCard = async (event) => {
        event.preventDefault();
        const a = event.currentTarget;
        const playerId = a.dataset.player;
        const cardName = a.dataset.ref;

        const cardStacks = game.modules.get('ready-to-use-cards').cardStacks;
        const rotated = parseInt(a.dataset.rotated) == 1;
        const cardType = a.dataset.type;

        const player = game.users.find( u => u.id === playerId);
        const isGMCard = playerId == 'gm';

        // First :Try to look inside player hand and revealed cards
        const userStacks = isGMCard ? [cardStacks.gmHand, cardStacks.gmRevealedCards]
                                    : [cardStacks.findPlayerHand(player), cardStacks.findRevealedCards(player) ];

        let card = null;
        let stack = null;
        for( const userStack of userStacks ) {
            if(card) { continue; }
            stack = userStack;
            card = stack.cards.find(c => c.name === cardName);
        }

        // Second : Card wasn't found on stack. Maybe it has already been played?
        // => Check the discard pile
        if(!card) {
            stack = cardStacks.piles[cardType];
            card = stack?.cards.find(c => c.name === cardName);
        }


        // Lastly : Fallback on card definition (stack won't be navigated)
        if(!card) {
            stack = cardStacks.decks[cardType];
            card = stack?.cards.find(c => c.name === cardName);
        }

        // If found, display the stack GUI and select current card
        if( card ) {
            const sheet = card.parent.sheet;
            sheet._currentSelection = card;
            sheet.forceRotate = rotated;
            sheet.render(true);
        }
    };

    const hideContent = needToHideContent(message.data.flags['ready-to-use-cards']?.handleCards);
    if( hideContent ) {
        html.find('.rtucards-message')[0].outerHTML= '';
    } else {
        html.find('.rtucards-message .card-link').click(event => onClickShowCard(event));
    }
}

