import { DEFAULT_SHORTCUT_SETTINGS, GlobalConfiguration } from "./constants.js";
import { CustomCardGUIWrapper } from "./CustomCardGUIWrapper.js";

const HEIGHT_FOR_ONE_CARD = 772;
const WIDTH_FOR_ONE_CARD = 510;
const ADDTIONNAL_FRAME_WIDTH = 530;

/**
 * For hand and shortcut panels
 */
class ShortcutPanel extends Application {

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            template: 'modules/ready-to-use-cards/resources/sheet/shortcuts.hbs',
            popOut: false
        });
    }

    constructor(options = {}) {
        super(options);
		this.module = game.modules.get('ready-to-use-cards');
        this._currentSettings = this.loadSettings();
    }

    /**
     * Getter for retrieving related stack
     * Should be overriden
     */
    get customStack() {
        return null;
    }

    /**
     * Used to set this._currentSettings
     * Should be overriden
     * @returns {object}
     */
    loadSettings() {
        return {};
    }

    /**
     * Config has changed => See if there is a need to reload the sheet
     */
    someSettingsHaveChanged() {
        const newSettings = game.settings.get('ready-to-use-cards', GlobalConfiguration.shortcuts);
        if( JSON.stringify(this._currentSettings) != JSON.stringify(newSettings) ) {
            this._currentSettings = newSettings;
            this.reload();
        }
    }


    /**
     * Called each time a Cards stack changed
     * @param {Cards} changedCardStack 
     */
    someStacksHaveChanged(changedCardStack) {

        const myCustomStack = this.customStack;
        if( myCustomStack && myCustomStack.stack.id === changedCardStack.id ) {
            this.reload();
        }
    }

    /**
     * Reload the GUI.
     * Will close it if option unchecked
     */
    reload() {
        if( !this.customStack || !this._currentSettings.diplayed ) {
            this.close();
        } else {
            this.render(true);
        }
    }

    /**
     * @override
     */
    async getData() {

        const cards = this.customStack.sortedAvailableCards.map( card => {
            const wrapper = new CustomCardGUIWrapper(card);
            return  {
                id: card.id, 
                cardBg: card.data.faces[0].img,
                classes: 'display-content ' + (wrapper.shouldBeRotated( false ) ? 'rotated' : '')
             };
        });

        const data = {
            style: this._computeFrameStyle(),
            lineStyle: this._computeLineStyle(), 
            cards: cards,
            icon: this._currentSettings.icon
        };

        return data;
    }

    _computeFrameStyle() {
        const customStack = this.customStack;
        let height = HEIGHT_FOR_ONE_CARD;
        let width = ADDTIONNAL_FRAME_WIDTH + WIDTH_FOR_ONE_CARD * Math.min( customStack.stack.availableCards.length, this._currentSettings.maxPerLine );

        height = Math.ceil( this._currentSettings.scale * height ) + 14; // 14 : border and padding
        width = Math.ceil( this._currentSettings.scale * width ) + 14;

        let style = "left:" + this._currentSettings.left + "px; bottom:" + this._currentSettings.bottom + "px;";
        style += "height:" + height + "px; width:" + width + "px;";
        return style;
    }

    _computeLineStyle() {
        const customStack = this.customStack;
        const width = ADDTIONNAL_FRAME_WIDTH + WIDTH_FOR_ONE_CARD * Math.min( customStack.stack.availableCards.length, this._currentSettings.maxPerLine );

        let style = "transform: scale(" + this._currentSettings.scale + ");";
        style += "min-width: " + width + "px;";
        style += "max-width: " + width + "px;";
        return style;
    }

    /* -------------------------------------------- */

    /** @override */
    activateListeners(html) {
        // Before mapping listeners, add content inside each cardSlot
        this.addAdditionnalContentOnCards(html);
    }

    addAdditionnalContentOnCards(html) {
        const customStack = this.customStack;

        // Loop on every card which should have its content displayed
        const cardSlots = html.find(".card-slot");
        for( let index = 0; index < cardSlots.length; index++ ) {
            const htmlDiv = cardSlots[index];
            const cardId = htmlDiv.dataset.key;
            if(cardId) { 
                const card = customStack.stack.cards.get(cardId);
                if( card ) {
                    const wrapper = new CustomCardGUIWrapper(card);
                    wrapper.fillCardContent(htmlDiv);
                }
                
            }
        }
    
    }
}

/**
 * Shortcut for the player hand
 */
export class ShortcutForHand extends ShortcutPanel {

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "rtucards-shortcut-hand"
        });
    }

    /**
     * @override
     */
     get customStack() {
        if( game.user.isGM ) {
            return this.module.cardStacks.gmHand;
        } else {
            return this.module.cardStacks.findPlayerHand(game.user);
        }
    }

    /**
     * @override
     */
     loadSettings() {
        const wholeSettings = game.settings.get('ready-to-use-cards', GlobalConfiguration.shortcuts);
        if( !wholeSettings || wholeSettings == '') {
            return DEFAULT_SHORTCUT_SETTINGS.hands;
        } else {
            return wholeSettings.hands;
        }
    }
}

/**
 * Shortcut for the player revealed cards
 */
 export class ShortcutForRevealedCards extends ShortcutPanel {

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "rtucards-shortcut-revealed"
        });
    }

    /**
     * @override
     */
     get customStack() {
        if( game.user.isGM ) {
            return this.module.cardStacks.gmRevealedCards;
        } else {
            return this.module.cardStacks.findRevealedCards(game.user);
        }
    }

    /**
     * @override
     */
     loadSettings() {
        const wholeSettings = game.settings.get('ready-to-use-cards', GlobalConfiguration.shortcuts);
        if( !wholeSettings || wholeSettings == '') {
            return DEFAULT_SHORTCUT_SETTINGS.revealed;
        } else {
            return wholeSettings.revealed;
        }
    }
}

