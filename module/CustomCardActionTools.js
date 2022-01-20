/**
 * Class storing common methods for managing actions inside a CustomCardDisplay
 */
export class CustomCardActionTools {
    /**
     * Convenience function mainly used to add a css separator on the currenly last added action
     * If no actions or if last one already has the css value : Do nothing
     * @param {object[]} actions Actions which will be available when the card is selected in its current stack
     * @param {string} css The css value which should be added on currently last action.
     */
    addCssOnLastAction(actions, css) {
        if(actions.length == 0 ) { return; }
        const lastAction = actions[actions.length-1];
        const toAdd = ' ' + css;
        if(! lastAction.classes.includes(toAdd) ) {
            lastAction.classes += toAdd;
        }
    }

    /**
     * Add an action the the list of available actions for this card.
     * Action will be added only if the corresponding deck config value is TRUE
     * @param {object[]} actions Actions which will be available when the card is selected in its current stack
     * @param {object} deckConfig Store all configs for this deck. One key for each one.
     * @param {CustomCards} translator For translating he label
     * @param {string} cssAction css which will be captured onClick and trigger an action
     * @param {string} labelKey The localized label key
     * @param {string[]} [allKeys] If set, ask that all included keys have to be flagged to TRUE inside deckConfig
     * @param {string[]} [atLeastOne] If set, ask that at least one of the included keys have to be flagged to TRUE
     * @param {string} [action] Add an addtionnal parameter to the action data (for custom actions)
     */
    addAvailableAction(actions, deckConfig, translator, cssAction, labelKey, {allKeys=null, atLeastOne=null, action=null}={} ) {

        if( allKeys != null ) { // Check all given keys. If one is false : exit
            for( const key of allKeys ) { 
                if( !deckConfig[key] ) { return; }
            }
        }

        if( atLeastOne != null ) { // If at least one of the keys is ok, continue
            const some = atLeastOne.some( key => deckConfig[key] );
            if( !some ) { return; }
        }

        actions.push({ 
            classes: cssAction, 
            label: translator.localizedLabel(labelKey), 
            action: action
        });
    }
    
}