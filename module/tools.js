import { GlobalConfiguration, StackConfiguration } from "./constants.js";

export const cardStackSettings = () => {
	let chosenStacks = game.settings.get('ready-to-use-cards', GlobalConfiguration.stacks);
	if( !chosenStacks || chosenStacks == '' ) { chosenStacks = {}; }
	return chosenStacks;
}

export const updateCardStackSettings = async (newSettings) => {
	const result = await game.settings.set('ready-to-use-cards', GlobalConfiguration.stacks, newSettings ?? {} );
	return result;
}


export const cardFilterSettings = () => {
	let filter = game.settings.get('ready-to-use-cards', GlobalConfiguration.filter);
	if( !filter || filter == '' ) { filter = {}; }

	Object.values(StackConfiguration).forEach( key => {
		if( !filter.hasOwnProperty(key) ) {
			filter[key] = true;
		}
	});
	
	return filter;
}

export const updateCardFilterSettings = async (newFilter) => {
	const result = await game.settings.set('ready-to-use-cards', GlobalConfiguration.filter, newFilter ?? {} );
	return result;
}
