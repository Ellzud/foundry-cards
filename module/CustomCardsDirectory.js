import { RTUCardsConfig } from "./config.js";

/**
 * Extends CardsDirectory by having different context menu choices for the decks
 */
export class CustomCardsDirectory extends CardsDirectory {
    constructor(...args) {
        super(...args);
    }
    
    /**
     * Add some entries for the contextMenu
     * @override
     */
    _getEntryContextOptions() {
        const classicEntries = super._getEntryContextOptions();

        // Classic entries are only available for decks with no rtucards flag
        classicEntries.forEach( entry => {
            entry.condition = this._appendRTUCardsFlagCondition(entry.condition, false);
        });

        const allEntries = [];
        this._addConfigureActionsEntry(allEntries);
        this._addRegisterEntry(allEntries);
        this._addUnregisterEntry(allEntries);
        allEntries.push(...classicEntries);
        return allEntries;
    }

    _appendRTUCardsFlagCondition(currentCondition, flagShouldBeHere) {

        const newCondition = (li) => {
            if( currentCondition && !currentCondition(li) ) { return false; }
    
            const stack = this.constructor.collection.get(li.data("documentId"));
            if( flagShouldBeHere ) { return stack.handledByModule; }
            return !stack.handledByModule;
        }
        return newCondition;
    }

    _addConfigureActionsEntry(allEntries) {
        const entry = {
            name: "RTUCards.sidebar.context.configActions",
            icon: '<i class="fas fa-cog"></i>',
            condition: li => {
                if( !game.user.isGM ) { return false; }
                
                const stack = this.constructor.collection.get(li.data("documentId"));
                if( !stack.stackOwner.forNobody ) { return false; }

                // Do not allow this action for stacks which have been loaded by code via the custom hook 'loadCardStacksDefinition'
                const coreKey = stack.coreStackRef;
                const cardStacks = game.modules.get('ready-to-use-cards').cardStacks;
                return cardStacks.defaultCoreStacks.hasOwnProperty(coreKey);
            },
            callback: li => {
                const stack = this.constructor.collection.get(li.data("documentId"));
                const coreKey = stack.coreStackRef;
                // Prepare the sheet
                const sheet = new RTUCardsConfig();
                sheet.object.stacks.forEach( s => {
                    s.gui.detailsDisplayed = ( s.key === coreKey );
                });
                // And render it
                sheet.render(true);
            }
        };
        entry.condition = this._appendRTUCardsFlagCondition(entry.condition, true);
        allEntries.push(entry);
    }

    _addRegisterEntry(allEntries) {
        const entry = {
            name: "RTUCards.sidebar.context.registerDeck",
            icon: '<i class="far fa-plus-square"></i>',
            condition: li => {
                if( !game.user.isGM ) { return false; }
                const document = this.constructor.collection.get(li.data("documentId"));
                return document.type == 'deck';
            },
            callback: async li => {
                console.log('RTU-Cards | Registering ' + document.name + ' as a deck handled inside the Ready-To-Use-Cards module');
                const stack = this.constructor.collection.get(li.data("documentId"));
                await stack.registerAsHandledByModule();
            }
        };
        entry.condition = this._appendRTUCardsFlagCondition(entry.condition, false);
        allEntries.push(entry);
    }

    _addUnregisterEntry(allEntries) {
        const entry = {
            name: "RTUCards.sidebar.context.unregisterDeck",
            icon: '<i class="far fa-minus-square"></i>',
            condition: li => {
                if( !game.user.isGM ) { return false; }
                const stack = this.constructor.collection.get(li.data("documentId"));
                return stack.type == 'deck' && stack.manuallyRegistered;
            },
            callback: async li => {
                console.log('RTU-Cards | Unregistering ' + document.name);
                const stack = this.constructor.collection.get(li.data("documentId"));
                await stack.unregisterAsHandledByModule();
            }
        };
        entry.condition = this._appendRTUCardsFlagCondition(entry.condition, true);
        allEntries.push(entry);
    }

    
}