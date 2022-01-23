/**
 * A configuration sheet to configure shortcuts GUI
 * @extends {FormApplication}
 */
export class ConfigSheetForShortcuts extends FormApplication {


	/** @override */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			id: "rtucards-config-shortcuts",
			classes: ["rtucards-config-shortcuts"],
			template: "modules/ready-to-use-cards/resources/config-shortcuts.hbs",
			width: 600,
			height: "auto",
			closeOnSubmit: false
		});
	}

	/* -------------------------------------------- */

	/** @override */
	get title() {
		return game.i18n.localize("RTUCards.settings.config-shortcuts.menu");
	}

	/* -------------------------------------------- */

	constructor(object={}, options={}) {
		super(object, options);
		this.module = game.modules.get('ready-to-use-cards');
		if(!this.object || this.object == '') {
			this.object = duplicate(DEFAULT_SHORTCUT_SETTINGS);

			this.undo = duplicate(this.object);
		}
	}


	/** @override */
	async getData() {
		return {}
	}

	/** @override */
    activateListeners(html) {
	}

	/** @override */
	_updateObject(event, formData) {
		// Not used
	}

	/* -------------------------------------------- */

	async _onClickSaveConfig(event) {
		this.close();
	}
}

