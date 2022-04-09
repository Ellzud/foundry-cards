import { StackConfigurationGroup } from "./constants.js";
import { cardStackSettings } from "./tools.js";


/**
 * Service manipulating StackConfigurationGroup structure and flags to know which actions are available
 */
export class AvailableActionService {

    /**
     * List all action settings for a stack
     * @param {string} stackKey stack key in the flags
     * @returns {object} One child for each setting, with boolean value
     */
    stackConfig(stackKey) {
        const settings = cardStackSettings();
        if( !settings.hasOwnProperty( stackKey ) ) { return {}; }

        return settings[stackKey].actions ?? {}; // Could be undefined, if migration fails
    }

    /**
     * List of all possible actions for an actionGroup
     * For each action, see if it as been enabled for this stack
     * @param {string} stackKey The stack key, as defined in flags
     * @param {string} actionGroupId The actionGroup id, as defined in StackConfigurationGroup
     * @returns {object[]} Data for each action. See structure bellow
     */
    stackActionGroupDetails(stackKey, actionGroupId) {

        const actionGroup = StackConfigurationGroup[actionGroupId];
        if( !actionGroup ) { return null; }

        const result = {};
        foundry.utils.mergeObject(result, actionGroup);
        result.name = game.i18n.localize(result.labelKey);
        result.description = game.i18n.localize(result.descKey);
        
        // Add action list:  available ones with added info if it has been toggled or not
        const stackConfs = this.stackConfig(stackKey);
        result.actions = (actionGroup.available ?? []).map( action => {
            const data = {
                actionGroupId: actionGroupId,
                from: action.from,
                target: action.target,
                confKey: action.from + action.target + '-' + actionGroupId,
                name: game.i18n.localize(action.nameKey ?? actionGroup.labelKey)
            };
            data.available = stackConfs[data.confKey] ?? false;
            return data;
        });

        // Is it used ?
        result.used = result.actions.some( a => a.available );

        return result;
    }

    /**
     * Summary of all action group for a given stack
     * @param {string} stackKey The stack key, as defined in flags
     * @returns {object} Each child represents one of the action group. Action details are in subchild 'actions'
     */
    stackAllActionsDetailsMap(stackKey) {
        const result = Object.keys(StackConfigurationGroup).reduce( (_result, key) => {
            _result[key] = this.stackActionGroupDetails(stackKey, key);
            return _result;
        }, {});
        return result;
    }
}