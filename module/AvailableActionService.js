import { StackConfigurationGroup } from "./constants.js";
import { cardStackSettings } from "./tools.js";


/**
 * List all action settings for a stack
 * @param {string} stackKey stack key in the flags
 * @returns {object} One child for each action. key: {groupId}-{from}{target}
 */
const settings_allActions = (stackKey) => {
    const settings = cardStackSettings();
    if( !settings.hasOwnProperty( stackKey ) ) { return {}; }

    return settings[stackKey].actions ?? {};
}

/**
 * List all label settings for a stack
 * @param {string} stackKey stack key in the flags
 * @returns {object} One child for each label. key: {groupId}-{action}
 */
const settings_allLabels = (stackKey) => {
    const settings = cardStackSettings();
    if( !settings.hasOwnProperty( stackKey ) ) { return {}; }

    return settings[stackKey].labels ?? {};
}

/**
 * Retrieve the constant definition of an action group.
 * This service is the only one parsing the complex StackConfigurationGroup object.
 * The StackConfigurationGroup structure is abstracted via the AvailableActionService methods
 * @param {string} actionGroupId As defined in StackConfigurationGroup
 * @returns {object} See StackConfigurationGroup for its structure.
 */
const definition_actionGroup = (actionGroupId) => {
    const result = duplicate( StackConfigurationGroup[actionGroupId] );
    result.id = actionGroupId;
    return result;
}

/**
 * Each action have a label that will be displayed in GUI button.
 * A label have a default value and a current value that can be overriden by user settings (otherwise, its the same as the default one)
 * @param {string} stackKey The stack key, as defined in flags
 * @param {object} actionGroup See StackConfigurationGroup for its structure.
 * @returns {object[]} A list of labels, one for each action
 */
const buildActionGroupDetailsLabels = (stackKey, actionGroup) => {
    const allLabelSettings = settings_allLabels(stackKey);
    const defaultLabels = actionGroup.labels.map( l => {
        return {
            action: l.action,
            default: game.i18n.localize(l.default)
        };
    });
    return defaultLabels.map( l => {
        const data = {
            action: l.action,
            default: l.default,
            current: l.default
        };

        const keyInSettings = actionGroup.id + "-" + l.action;
        const label = allLabelSettings[keyInSettings];
        if( label ) {
            data.current = label;
        }
        return data;
    });
}

/**
 * Complete actionGroup.available by adding data related to user settings.
 * Meaning : if it is used, and the action name
 * @param {string} stackKey The stack key, as defined in flags
 * @param {object} actionGroup See StackConfigurationGroup for its structure.
 * @param {object[]} labels See buildActionGroupDetailsLabels
 * @returns {object[]} A list of available actions. Action is repeated each time it is useable for a {from, target} couple
 */
const buildActionGroupDetailsActions = (stackKey, actionGroup, labels) => {

    const allActionSettings = settings_allActions(stackKey);
    return actionGroup.available.map( a => {

        // Toggling action in settings are stored this way
        const confKey = actionGroup.id + "-" + a.from + a.target;

        // Custom labels are stored in settings this way
        const action = a.action;
        const label = labels.find( l => l.action === action );

        const data = {
            actionGroupId: actionGroup.id,
            action: action,
            from: a.from,
            target: a.target,
            confKey: confKey,
            available: allActionSettings[confKey] ?? false,
            name: {
                default: label.default,
                current: label.current
            }
        };
        return data;
    });
}

/**
 * Service manipulating StackConfigurationGroup structure and flags to know which actions are available
 */
export class AvailableActionService {

    /**
     * List of all possible actions for an actionGroup
     * For each action, see if it as been enabled for this stack
     * @param {string} stackKey The stack key, as defined in flags
     * @param {string} actionGroupId The actionGroup id, as defined in StackConfigurationGroup
     * @returns {object[]} Data for each action. See structure bellow
     */
    getActionGroupDetails(stackKey, actionGroupId) {

        const actionGroup = definition_actionGroup(actionGroupId);
        if( !actionGroup ) { return null; }

        const result = {
            name: game.i18n.localize(actionGroup.labelKey),
            description: game.i18n.localize(actionGroup.descKey),
            actionType: actionGroup.actionType, // Retrieved as it is
            grid: actionGroup.grid // Retrieved as it is
        };

        result.labels = buildActionGroupDetailsLabels(stackKey, actionGroup);
        result.actions = buildActionGroupDetailsActions(stackKey, actionGroup, result.labels);

        return result;
    }

    /**
     * Summary of all action group for a given stack
     * @param {string} stackKey The stack key, as defined in flags
     * @returns {object} Each child represents one of the action group. Action details are in subchild 'actions'
     */
     getAllActionsDetailsMap(stackKey) {
        const result = Object.keys(StackConfigurationGroup).reduce( (_result, key) => {
            _result[key] = this.getActionGroupDetails(stackKey, key);
            return _result;
        }, {});
        return result;
    }
    
    
    /**
     * Reduce the whole list by taking only the available actions.
     * Actions are then filtered by .action and formated in an easy way to be processes
     * @param {string} stackKey The stack key, as defined in flags
     * @param {string} actionGroupId The actionGroup id, as defined in StackConfigurationGroup
     * @param {string} [from] Allow to filter on a .from
     * @param {string} [target] Allow to filter on a .target
     * @returns {object[]} One line for each action, with available possibilities in .possibilites
     */
    getActionPossibilities(stackKey, actionGroups, {from=null, target=null}={}) {

        const flatList = actionGroups.reduce( (_result, actionGroup) => {
            _result.push( ...this.getActionGroupDetails(stackKey, actionGroup).actions );
            return _result;
        }, []);

        const filteredList = flatList.filter( action => {
            return action.available;
        }).filter( action => {
            return !from || action.from === from;
        }).filter( action => {
            return !target || action.target === target;
        });

        return filteredList.reduce( (_results, _current) => {

            const result = _results.find( r => r.action === _current.action );
            if( result ) {
                result.possibilities.push( {from: _current.from, target: _current.target} );
            } else {
                _results.push({
                    actionGroupId: _current.actionGroupId,
                    action: _current.action,
                    signature: _current.actionGroupId + "-" + _current.action,
                    name: _current.name.current,
                    possibilities: [{from: _current.from, target: _current.target}]
                });
            }
            return _results;

        }, []);
    }

    /**
     * DiscardAll slightly differs from other actions.
     * It's discard from discardOne actions, and only available if the parameter allowAllDiscard is true
     * @param {string} stackKey The stack key, as defined in flags
     * @param {string} [from] Allow to filter on a .from
     * @returns {object[]} Same structure as getActionPossibilities
     */
    getDiscardAllPossibilities(stackKey, {from=null}={}) {

        const moveCardDetails = this.getActionGroupDetails(stackKey, "moveCard");
        const allowAllDiscard = true; // FIXME Need to add something like : moveCardDetails.parameters.allowAllDiscard;
        const discardActions = moveCardDetails.actions.filter( a => {
            if( !a.available ) { return false; }
            if( from && from != a.from ) { return false; }
            return a.action === "discardOne";
        });

        if( !allowAllDiscard || discardActions.length == 0 ) {
            return [];
        }

        const discardAll = {
            actionGroupId: "moveCard",
            action: "discardAll",
            signature: "moveCard-discardAll",
            name: moveCardDetails.labels.find( l => l.action === "discardAll").current
        };
        discardAll.possibilities = discardActions.map( a => {
            return { from: a.from, target: a.target };
        });

        return [discardAll];
    }

    asGUIAction(possibility, {action=null} = {}) {

        let onLeftSide = [
            "peekOnCards", "dealCard", "drawDeckCard", 
            "shuffleDeck", "resetDeck", "drawDiscardCard", 
            "shuffleDiscard", "resetDiscard"].includes( possibility.actionGroupId );

        onLeftSide = onLeftSide || possibility.signature === "moveCard-discardAll";

        return {
            classes: possibility.signature,
            label: possibility.name,
            action: action,
            onLeft: onLeftSide
        }
    }

    /**
     * Convenience function allowing to add css classes on one of the element of the guiActions list
     * Only the last on in the list correspong to afterClasses criteria will be modified.
     * If no element match the critera, nothing is done.
     * 
     * @param {object[]} guiActions See asGUIAction for structure
     * @param {string[]} afterClasses When looking for the element wich will be modified, wll only consider the one having on of the list classes. (Can be partial: xxx- or xxx-yy)
     * @param {string[]} [classesToAdd] By default, will add "separator" to the element. Can be used to changed what will be added
     */
    addCssAfterSomeGuiActions(guiActions, afterClasses, {classesToAdd=["separator"]} = {}) {

        // Find last related element
        const lastIndex = guiActions.reduce( (_lastIndex, _action, _actionIndex) => {
            const isRelated = afterClasses.some( cl => _action.classes.includes(cl));
            return isRelated ? _actionIndex : _lastIndex;
        }, -1);

        const nothingToDo = lastIndex < 0 || lastIndex >= guiActions.length;
        if( nothingToDo ) { return; }

        // Only add classes that haven't already been added
        const action = guiActions[lastIndex];
        classesToAdd.filter( css => {
            return !action.classes.includes( " " + css);
        }).forEach( css => {
            action.classes += " " + css;
        });
    }
}