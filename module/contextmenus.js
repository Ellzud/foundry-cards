import { CustomCardStack } from "./CustomCardStack.js";
import { ConfigSheetForActions } from "./ConfigSheetForActions.js";

/**
 * Add some entries for the contextMenu
 * @override
 */
export const onGetCardsDirectoryEntryContext = (html, options) => {

    const hiddenActionNames = ["FOLDER.Clear", "SIDEBAR.Delete", "SIDEBAR.Duplicate", "PERMISSION.Configure", "SIDEBAR.Export", "SIDEBAR.Import"];
    // Classic entries are only available for decks with no rtucards flag
    options.filter( o => hiddenActionNames.includes(o.name) ).forEach( option => {
        option.condition = appendRTUCardsFlagCondition(option.condition, false);
    });

    addConfigureActionsEntry(options);
    addRegisterEntry(options);
    addUnregisterEntry(options);
}

const appendRTUCardsFlagCondition = (currentCondition, flagShouldBeHere) => {
    const newCondition = (li) => {
        if( currentCondition && !currentCondition(li) ) { return false; }

        const stack = game.cards.get(li.data("documentId"));
        const custom = new CustomCardStack(stack);
        if( flagShouldBeHere ) { return custom.handledByModule; }
        return !custom.handledByModule;
    }
    return newCondition;
}

const addConfigureActionsEntry = (allEntries) => {
    const entry = {
        name: "RTUCards.sidebar.context.configActions",
        icon: '<i class="fas fa-cog"></i>',
        condition: li => {
            if( !game.user.isGM ) { return false; }
            
            const stack = game.cards.get(li.data("documentId"));
            const custom = new CustomCardStack(stack);
            return custom.stackOwner.forNobody;
        },
        callback: li => {
            const stack = game.cards.get(li.data("documentId"));
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
    entry.condition = appendRTUCardsFlagCondition(entry.condition, true);
    allEntries.push(entry);
}

const addRegisterEntry = (allEntries) => {
    const entry = {
        name: "RTUCards.sidebar.context.registerDeck",
        icon: '<i class="far fa-plus-square"></i>',
        condition: li => {
            if( !game.user.isGM ) { return false; }
            const document = game.cards.get(li.data("documentId"));
            return document.type == 'deck';
        },
        callback: async li => {
            console.log('RTU-Cards | Registering ' + document.name + ' as a deck handled inside the Ready-To-Use-Cards module');
            const stack = game.cards.get(li.data("documentId"));
            const custom = new CustomCardStack(stack);
            await custom.registerAsHandledByModule();
        }
    };
    entry.condition = appendRTUCardsFlagCondition(entry.condition, false);
    allEntries.push(entry);
}

const addUnregisterEntry = (allEntries) => {
    const entry = {
        name: "RTUCards.sidebar.context.unregisterDeck",
        icon: '<i class="far fa-minus-square"></i>',
        condition: li => {
            if( !game.user.isGM ) { return false; }
            const stack = game.cards.get(li.data("documentId"));
            const custom = new CustomCardStack(stack);
            return stack.type == 'deck' && custom.manuallyRegistered;
        },
        callback: async li => {
            console.log('RTU-Cards | Unregistering ' + document.name);
            const stack = game.cards.get(li.data("documentId"));
            const custom = new CustomCardStack(stack);
            await custom.unregisterAsHandledByModule();
        }
    };
    entry.condition = appendRTUCardsFlagCondition(entry.condition, true);
    allEntries.push(entry);
}
