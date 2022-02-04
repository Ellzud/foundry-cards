import { CustomCardStack } from "./CustomCardStack.js";
import { ConfigSheetForActions } from "./ConfigSheetForActions.js";

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
            const custom = new CustomCardStack(stack);
            if( flagShouldBeHere ) { return custom.handledByModule; }
            return !custom.handledByModule;
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
                const custom = new CustomCardStack(stack);
                return custom.stackOwner.forNobody;
            },
            callback: li => {
                const stack = this.constructor.collection.get(li.data("documentId"));
                const custom = new CustomCardStack(stack);
                const coreKey = custom.coreStackRef;
                // Prepare the sheet
                const sheet = new ConfigSheetForActions();
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
                const custom = new CustomCardStack(stack);
                await custom.registerAsHandledByModule();
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
                const custom = new CustomCardStack(stack);
                return stack.type == 'deck' && custom.manuallyRegistered;
            },
            callback: async li => {
                console.log('RTU-Cards | Unregistering ' + document.name);
                const stack = this.constructor.collection.get(li.data("documentId"));
                const custom = new CustomCardStack(stack);
                await custom.unregisterAsHandledByModule();
            }
        };
        entry.condition = this._appendRTUCardsFlagCondition(entry.condition, true);
        allEntries.push(entry);
    }

    
}