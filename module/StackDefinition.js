import { CardActionParametersBase, CardActionParametersForCardSelection, CardActionParametersForPlayerSelection } from './CardActionParameters.js';
import { CardActionsClasses, StackConfiguration } from './constants.js';

export const CARD_STACKS_DEFINITION = {
    playerStacks: {
        folderNameKey: 'RTUCards.user.folder',
        resourceBaseDir : 'modules/ready-to-use-cards/resources/pokerDark',
        hand: {
            titleKey: 'RTUCards.user.hand.title',
            descriptionKey: 'RTUCards.user.hand.description'
        },
        pile: {
            titleKey: 'RTUCards.user.pile.title',
            descriptionKey: 'RTUCards.user.pile.description'
        }
    },
    gmStacks: {
        folderNameKey: 'RTUCards.gm.folder',
        resourceBaseDir : 'modules/ready-to-use-cards/resources/pokerDark',
        hand: {
            titleKey: 'RTUCards.gm.hand.title',
            descriptionKey: 'RTUCards.gm.hand.description'
        },
        pile: {
            titleKey: 'RTUCards.gm.pile.title',
            descriptionKey: 'RTUCards.gm.pile.description'
        }
    },
    core: {
        // base: [...] Will be added during load
    },
    shared: { // To share some const enums and some basic implems
        actionCss: CardActionsClasses,
        configKeys: StackConfiguration,
        actionParametersClasses: {
            base: CardActionParametersBase,
            cardSelection: CardActionParametersForCardSelection,
            playerSelection: CardActionParametersForPlayerSelection
        },
        /** Will be added during load
        cardClasses: {
            base: CustomCardBase,
            simple: CustomCardSimple
        } */
    }
};
