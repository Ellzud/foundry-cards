import { CustomCardBase } from './CustomCardBase.js';
import { CustomCardSimple } from './CustomCardSimple.js';
import { CARD_STACKS_DEFINITION } from './StackDefinition.js';

/**
 * Try to find a card Pile.
 * @param {string} type 'deck' or 'pile'
 * @param {object} core See CARD_STACKS_DEFINITION
 * @returns The card stack if found
 */
const findCoreStack = ( type, core ) => {
    return findStack( type, {coreKey: core.key} );
}

/**
 * Try to find a player hand ot revealed cards.
 * @param {string} type 'hand' or 'pile'
 * @param {User} user Which player it is (can't be GMs)
 * @returns The card stack if found
 */
const findPlayerCardStack = ( type, user ) => {
    return findStack( type, {user: user} );
}

/**
 * Try to find a player hand ot revealed cards.
 * @param {string} type 'hand' or 'pile'
 * @param {User} user Which player it is (can't be GMs)
 * @returns The card stack if found
 */
 const findGMCardStack = ( type ) => {
    return findStack( type, {gmStack: true} );
}

/**
 * Try to find a card stack by checking its ready-to-use-cards flags
 * @param {string} type 'deck', 'pile', or 'hand'
 * @param {string} [coreKey] Which coreStack key it is. Useful when looking for decks or discard piles
 * @param {User} [user] If set, check a card stack owned by this user
 * @param {User} [gmStack] If set, check a card stack which store GM cards
 * @returns The card stack if found
 */
const findStack = ( type, {coreKey=null, user=null, gmStack=false} = {} ) => {

    let checkedOwner = 'none';
    if( user ) { checkedOwner = user.id; }
    else if( gmStack ) { checkedOwner = 'gm'; }

    return game.cards.find( stack => {
        const flag = stack.data.flags['ready-to-use-cards'] ?? {};

        if( flag['owner'] != checkedOwner ) { return false; }
        if( coreKey && flag.core != coreKey ) { return false; }

        return stack.type === type;
    });
}

/**
 * Prepare the preset for creating a core stack.
 * @param {string} type 'deck' or 'pile'
 * @param {object} coreStack See CARD_STACKS_DEFINITION
 * @returns {object} Preset data ready for creating a Cards document
 */
const initCoreStackPreset = async (type, coreStack) => {
    const name = game.i18n.localize(coreStack.labelBaseKey + type + '.title');
    const description = game.i18n.localize(coreStack.labelBaseKey + type + '.description');

    // Icon
    const imgPath = coreStack.resourceBaseDir + '/icons/';
    const imgFile = imgPath + (type == 'pile' ? 'front.png' : 'back.png' );

    // Flags
    const stackFlag = {};
    stackFlag["core"] = coreStack.key;
    stackFlag["owner"] = 'none';
    stackFlag["onHand"] = coreStack.availableOnHands;
    stackFlag["onRevealed"] = coreStack.availableOnRevealedCards;

    // Permissions
    const permission = {
        default: CONST.DOCUMENT_PERMISSION_LEVELS.OBSERVER
    };

    const preset = initPreset(type, name, description, imgFile, stackFlag, permission );
    if( type == 'deck' ) {
        preset.cards = await coreStack.cardsPreset();
    }
    return preset;
}

/**
 * Prepare the preset for creating a player stack.
 * @param {string} type 'hand' or 'pile'
 * @param {User} user This player definition
 * @param {Folder} folder Card Folder where the card stack will be created
 * @returns {object} Preset data ready for creating a Cards document
 */
 const initPlayerStackPreset = (type, user, folder) => {

    const base = CARD_STACKS_DEFINITION.playerStacks[type];
    const name = game.i18n.localize(base.titleKey).replace('USER', user.name );
    const description = game.i18n.localize(base.descriptionKey).replace('USER', user.name );

    // Icon
    const imgPath = CARD_STACKS_DEFINITION.playerStacks.resourceBaseDir + '/icons/';
    const imgFile = imgPath + (type == 'pile' ? 'front.png' : 'back.png' );

    // Flags
    const stackFlag = {};
    stackFlag["owner"] = user.id;

    // Permissions
    const permission = {
        default: CONST.DOCUMENT_PERMISSION_LEVELS.OBSERVER
    };
    permission[user.id] = CONST.DOCUMENT_PERMISSION_LEVELS.OWNER;

    return initPreset(type, name, description, imgFile, stackFlag, permission, {folder: folder} );
}


/**
 * Prepare the preset for creating the GMs stack.
 * @param {string} type 'hand' or 'pile'
 * @param {Folder} folder Card Folder where the card stack will be created
 * @returns {object} Preset data ready for creating a Cards document
 */
 const initGMStackPreset = (type, folder) => {

    const base = CARD_STACKS_DEFINITION.gmStacks[type];
    const name = game.i18n.localize(base.titleKey);
    const description = game.i18n.localize(base.descriptionKey);

    // Icon
    const imgPath = CARD_STACKS_DEFINITION.gmStacks.resourceBaseDir + '/icons/';
    const imgFile = imgPath + (type == 'pile' ? 'front.png' : 'back.png' );

    // Flags
    const stackFlag = {};
    stackFlag["owner"] = 'gm';

    // Permissions
    const permission = {
        default: CONST.DOCUMENT_PERMISSION_LEVELS.OBSERVER
    };

    return initPreset(type, name, description, imgFile, stackFlag, permission, {folder: folder} );
}

/**
 * Load necessary data to create a new card stack
 * @param {string} type 'deck', 'pile', or 'hand'
 * @param {string} name Card stack name
 * @param {string} description Card stack description
 * @param {string} img Path for card stack icon
 * @param {object} stackFlag Will be stored inside flags.ready-to-use-cards
 * @param {string} permission Permissions for this stack
 * @param {Folder} [folder] If set, the stack should be created iniside this folder
 * @returns CardStack data before creation
 */
const initPreset = ( type, name, description, img, stackFlag, permission, {folder=null}={} ) => {
    const preset = {
        type: type,
        name: name,
        description: description,
        img: img,
        data: {},
        cards: [],
        width: 2,
        height: 4,
        rotation: 0,
        displayCount: true,
        permission: permission,
        "flags.ready-to-use-cards": stackFlag
    };

    if(folder) { preset.folder = folder.id; }
    return preset;
}

/**
 * Folder for a player card stacks (not GMs)
 * @param {User} user the player data
 * @returns {Folder} The folder. Created if missing
 */
const loadPlayerFolder = async (user) => {
    const name = game.i18n.localize(CARD_STACKS_DEFINITION.playerStacks.folderNameKey).replace('USER', user.name );
    return loadFolder(user.id, name);
}

/**
 * Folder for GMs card stacks
 * @returns {Folder} The folder. Created if missing
 */
 const loadGMFolder = async () => {
    const name = game.i18n.localize(CARD_STACKS_DEFINITION.gmStacks.folderNameKey);
    return loadFolder('gm', name);
}

/**
 * Directorty are created for each player. And one for the GMs.
 * It will contains its card hand and pile.
 * You choose choose between user option and gmStack
 * @param {string} ownerId user.id or gm. User to find the right existing folder
 * @param {string} folderName The name to give to this folder if it should be created
 * @returns {Folder} The folder for this case. Creates it if needed
 */
const loadFolder = async (ownerId, folderName) => {

    // Flags which should be owned by the folder
    const folderFlag = { 
        owner: ownerId
    };

    // Does the folder already exists ?
    const existingFolder = game.folders.find(f => {
        if( f.data.type != "Cards" ) { return false;} 
        
        const flag = f.data.flags['ready-to-use-cards'] ?? {};
        return JSON.stringify(flag) == JSON.stringify(folderFlag);
    });
    if( existingFolder ) {
        return existingFolder;
    }

    // Create a new folder
    const newFolder = await Folder.create({
        name: folderName,
        type: 'Cards',
        sorting: 'm',
        "flags.ready-to-use-cards": folderFlag
    });
    return newFolder;
}

/**
 * Fill CARD_STACKS_DEFINITION with necessary data
 * Once it is initialized, trigger a hok so that other modules/systems can complete it
 */
const loadStackDefinition = () => {

    const def = CARD_STACKS_DEFINITION;

    // Add a default deck. FIXME : Should be configurable
    def.core.base = {
        cardClass: CustomCardSimple,
        labelBaseKey : 'RTUCards.base.',
        resourceBaseDir : 'modules/ready-to-use-cards/resources/base',
        availableOnHands: true,
        availableOnRevealedCards: true,
        cardsPreset: async () => {
            const data = await fetch(CONFIG.Cards.presets.pokerDark.src).then(r => r.json());
            return data.cards;
        }
    }

    def.shared.cardClasses = {
        base: CustomCardBase,
        simple: CustomCardSimple
    }

    Hooks.call("loadCardStacksDefinition", def);
}


export class CustomCardStackLoader {

    constructor() {
    }

    /**
     * Definition for creation all core stacks
     * @returns {object[]} See CARD_STACKS_DEFINITION.core
     */
    get coreStackDefinitions() {

        return Object.entries(CARD_STACKS_DEFINITION.core).map( ([coreKey, coreData]) => {
            const coreStack = {key: coreKey};
            foundry.utils.mergeObject(coreStack, coreData);
            return coreStack;
        });
    }

    async loadCardStacks() {
        
        loadStackDefinition();
        await this.initMissingStacks();
        await this.loadStackLinks();
    }

    async initMissingStacks() {

        // Only GMs can create stacks
        if( !game.user.isGM ) { return; }

        const cardStackPresets = [];

        // Card decks and discards
        for( const coreStack of this.coreStackDefinitions ) {

            if( !findCoreStack('deck', coreStack) ) {
                const preset = await initCoreStackPreset('deck', coreStack);
                cardStackPresets.push(preset);
            }

            if( !findCoreStack('pile', coreStack) ) {
                const preset = await initCoreStackPreset('pile', coreStack);
                cardStackPresets.push(preset);
            }
        }

        // For each player : One hand, and One pile
        for( const u of game.users.contents.filter( u => !u.isGM ) ) {

            const userFolder = await loadPlayerFolder(u);

            // The hand
            if( !findPlayerCardStack('hand', u) ) {
                const preset = initPlayerStackPreset('hand', u, userFolder);
                cardStackPresets.push(preset);
            }

            // The pile
            if( !findPlayerCardStack('pile', u) ) {
                const preset = initPlayerStackPreset('pile', u, userFolder);
                cardStackPresets.push(preset);
            }
        };

        // One hand and one stack shared by all GMs
        // - The GM hand
        const gmFolder = await loadGMFolder();
        if( !findGMCardStack('hand') ) {
            const preset = initGMStackPreset('hand', gmFolder);
            cardStackPresets.push(preset);
        }

        // - The GM pile
        if( !findGMCardStack('pile') ) {
            const preset = initGMStackPreset('pile', gmFolder);
            cardStackPresets.push(preset);
        }

        // Load missing card stacks
        if( cardStackPresets.length > 0 ) {
            const stacks = await Cards.createDocuments(cardStackPresets);
            for( const stack of stacks ) {
                await stack.shuffle({chatNotification: false});
            }
        }
    }

    async loadStackLinks() {

        // Load decks and discard piles
        this.decks = {};
        this.piles = {};
        for( const coreStack of this.coreStackDefinitions ) {
            this.decks[coreStack.key] = findCoreStack('deck', coreStack);
            this.piles[coreStack.key] = findCoreStack('pile', coreStack);
        }

        this._gmHand = findGMCardStack('hand');
        this._gmRevealedCards = findGMCardStack('pile');
    }

    get gmHand() {
        return this._gmHand;
    }

    get gmRevealedCards() {
        return this._gmRevealedCards;
    }

    findPlayerHand(user) {
        return findPlayerCardStack('hand', user);
    }

    findRevealedCards(user) {
        return findPlayerCardStack('pile', user);
    }

}
