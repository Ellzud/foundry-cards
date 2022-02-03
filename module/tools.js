import { GlobalConfiguration } from "./constants.js";

export const cardStackSettings = () => {
	let chosenStacks = game.settings.get('ready-to-use-cards', GlobalConfiguration.stacks);
	if( chosenStacks == '' ) { chosenStacks = {}; }
	return chosenStacks;
}

export const updateCardStackSettings = async (newSettings) => {
	const result = await game.settings.set('ready-to-use-cards', GlobalConfiguration.stacks, newSettings ?? {} );
	return result;
}
