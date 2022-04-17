import { cardStackSettings, updateCardStackSettings } from "../tools.js";
import { VERSION_KEYS } from "./MigrationConstants.js";

export const migrateFromV1 = async () => {

    // Old stack values, need to transfer them into new storage system
    const stacks = cardStackSettings();
    const newStackConfig = {};
    const registeredDecksKeys = Object.keys(stacks);
    for( const deckKey of registeredDecksKeys ) {

        const deck = stacks[deckKey];
        const newDeckConfig = {
            actions: {},
            parameters: {}
        };
        newStackConfig[deckKey] = newDeckConfig;

        // Parsing V1 data
        //--------------------
        const v1Confs = Object.entries(deck).filter( ([key, used]) => {
            const validKey = ! ["parameters", "actions", "rollback"].includes(key);
            return validKey && used;
        }).map( ([key, ]) => {
            return key;
        });
        const v1Params = deck.parameters;

        // Rollback management
        //---------------------------
        newDeckConfig.rollback = deck.rollback ?? {};
        newDeckConfig.rollback[VERSION_KEYS.V1] = { confs: {}, parameters: v1Params };
        for( const conf of v1Confs ) {
            newDeckConfig[conf] = true; //FIXME : Keeping existing conf for now. Should be removed once all done
            newDeckConfig.rollback[VERSION_KEYS.V1].confs[conf] = true;
        }

        // Transfering actions on new structure
        //----------------------------
        const actions = newDeckConfig.actions;
        for( const conf of v1Confs ) {
            switch(conf) {
                case "fromDeckPeekOn": {
                    actions["peekOnCards-DEDE"] = true;
                    break;
                }
                case "fromDeckDealCardsToHand": {
                    actions["dealCard-GHDE"] = true;
                    actions["dealCard-PHDE"] = true;
                    actions["moveCard-DEGH"] = true;
                    actions["moveCard-DEPH"] = true;
                    break;
                }
                case "fromDeckDealRevealedCards": {
                    actions["dealCard-GRDE"] = true;
                    actions["dealCard-PRDE"] = true;
                    actions["moveCard-DEGR"] = true;
                    actions["moveCard-DEPR"] = true;
                    break;
                }
                case "fromDeckDiscardDirectly": {
                    actions["moveCard-DEDI"] = true;
                    break;
                }
                case "fromDeckResetAll": {
                    actions["resetDeck-DEDE"] = true;
                    break;
                }
                case "fromDeckShuffleRemainingCards": {
                    actions["shuffleDeck-DEDE"] = true;
                    break;
                }
                case "fromDeckLoopThroughFaces": {
                    actions["flipCard-DEDE"] = true;
                    break;
                }
                case "fromDeckRotateCard": {
                    actions["rotateCard-DEDE"] = true;
                    break;
                }
                case "fromHandDrawCard": {
                    actions["drawDeckCard-GHDE"] = true;
                    actions["drawDeckCard-PHDE"] = true;
                    break;
                }
                case "fromHandPlayCard": {
                    actions["playCard-GHDI"] = true;
                    actions["playCard-PHDI"] = true;
                    break;
                }
                case "fromHandPlayMultiple": {  // FIXME : Will need to add parameters for that
                    actions["playCard-GHDI"] = true;
                    actions["playCard-PHDI"] = true;
                    break;
                }
                case "fromHandRevealCard": {
                    actions["transferCards-GHGR"] = true;
                    actions["transferCards-PHPR"] = true;
                    break;
                }
                case "fromHandExchangeCard": {
                    actions["exchangeCard-GHDI"] = true;
                    actions["exchangeCard-PHDI"] = true;
                    break;
                }
                case "fromHandExchangeWithPlayer": {
                    actions["exchangeCard-GHPH"] = true;
                    actions["exchangeCard-PHGH"] = true;
                    actions["exchangeCard-PHPH"] = true;
                    break;
                }
                case "fromHandDiscardCard": {
                    actions["moveCard-GHDI"] = true;
                    actions["moveCard-PHDI"] = true;
                    break;
                }
                case "fromHandRotateCard": {
                    actions["rotateCard-GHGH"] = true;
                    actions["rotateCard-PHPH"] = true;
                    break;
                }
                case "fromHandLoopThroughFaces": {
                    actions["flipCard-GHGH"] = true;
                    actions["flipCard-PHPH"] = true;
                    break;
                }
                case "fromRevealedDrawCard": {
                    actions["drawDeckCard-GRDE"] = true;
                    actions["drawDeckCard-PRDE"] = true;
                    break;
                }
                case "fromRevealedPlayCard": {
                    actions["playCard-GRDI"] = true;
                    actions["playCard-PRDI"] = true;
                    break;
                }
                case "fromRevealedPlayMultiple": {  // FIXME : Will need to add parameters for that
                    actions["playCard-GRDI"] = true;
                    actions["playCard-PRDI"] = true;
                    break;
                }
                case "fromRevealedBackToHand": {
                    actions["transferCards-GRGH"] = true;
                    actions["transferCards-PRPH"] = true;
                    break;
                }
                case "fromRevealedDiscardCard": {
                    actions["moveCard-GRDI"] = true;
                    actions["moveCard-PRDI"] = true;
                    break;
                }
                case "fromRevealedRotateCard": {
                    actions["rotateCard-GRGR"] = true;
                    actions["rotateCard-PRPR"] = true;
                    break;
                }
                case "fromRevealedLoopThroughFaces": {
                    actions["flipCard-GRGR"] = true;
                    actions["flipCard-PRPR"] = true;
                    break;
                }
                case "fromRevealedExchangeCard": {
                    actions["exchangeCard-GRDI"] = true;
                    actions["exchangeCard-PRDI"] = true;
                    break;
                }
                case "fromRevealedExchangeWithPlayer": {
                    actions["exchangeCard-GRPR"] = true;
                    actions["exchangeCard-PRGR"] = true;
                    actions["exchangeCard-PRPR"] = true;
                    break;
                }
                case "fromDiscardBackToDeck": {
                    actions["moveCard-DIDE"] = true;
                    break;
                }
                case "fromDiscardRotateCard": {
                    actions["rotateCard-DIDI"] = true;
                    break;
                }
                case "fromDiscardLoopThroughFaces": {
                    actions["flipCard-DIDI"] = true;
                    break;
                }
                case "fromDiscardResetAll": {
                    actions["resetDiscard-DIDI"] = true;
                    break;
                }
                default: {
                    console.warn("RTUC - MigrationService | V1 : unknwon conf: " + conf );
                }
            }
        }

        // Transfering parameters on new structure
        //----------------------------
        const parameters = newDeckConfig.parameters;
        Object.entries(v1Params).forEach( ([key, value]) => {
            parameters[key] = value;
        });
    }

    await updateCardStackSettings(newStackConfig);
    return VERSION_KEYS.V2;
}
