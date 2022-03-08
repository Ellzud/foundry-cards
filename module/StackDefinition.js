import { CardActionParametersBase, CardActionParametersForCardSelection, CardActionParametersForPlayerSelection } from './CardActionParameters.js';
import { CardActionsClasses, StackConfiguration } from './constants.js';


/* -------------------------------------------- */
/*   Type Definitions                           */
/* -------------------------------------------- */

/**
 * @typedef {Object} CoreStackDefinition Each coreStackDefinition will result in a deck and a discard pile in the game
 * @property {class} cardClass          What should be used for the deck card implementation. The basic impl is CustomCardSimple and could be retrieved via cardStacksDefinition.shared.cardClasses.simple
 * @property {string} [labelBaseKey]    The translation prefix. While translating all action names, parameters, and messages, the module will try to use this prefix. If the translation is not found, it will fallback to 'RTUCards.default.'
 * @property {string} [resourceBaseDir] Base directory for this deck images. If not set, 'modules/ready-to-use-cards/resources/default' will be used
 * @property {string} [customName]      Name for this deck and discard pile. If not set, name will be retrieved from a subkey of labelBaseKey
 * @property {string} [customDesc]      Description for this deck and discard pile. If not set, descirption will be retrieved from a subkey of labelBaseKey
 * @property {string} [preset]          Either preset or presetLoader should be present. Path to this deck preset.
 * @property {function} [presetLoader]  Should be an async function taking no parameters and return à list of cardData. Will be used to fill the deck
 * @property {object} [config]          Each child has for key one of the CardActionsClasses. As for value, its a boolean. True means the option is taken. Missing configs will be considered as taken.
 */


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
        // childs will be added during load. Each child should follow the CoreStackDefinition
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
            simple: CustomCardSimple
            customCardStack: CustomCardStack
        } */
    }
};
