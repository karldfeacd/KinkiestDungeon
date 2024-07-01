
interface RecyclerResource {
	/** Number is base yield, minimum 1 */
	Yield: number,
	/** Processed per floor, per servant */
	Rate: number,
}

let RecyclerResources: Record<string, RecyclerResource> = {
	Rope: {
		Yield: 20,
		Rate: 100,
	},
	Leather: {
		Yield: 12,
		Rate: 25,
	},
	Metal: {
		Yield: 5,
		Rate: 8,
	},
	Latex: {
		Yield: 12,
		Rate: 30,
	},
	Rune: {
		Yield: 0.0001,
		Rate: 4,
	},
}

interface RecyclerOutputs {
	Rope: number,
	Leather: number,
	Metal: number,
	Latex: number,
	Rune: number,
}

function KDGetRecyclerRate(Servants: number[]): Record<string, number> {
	let output = {};
	let mult = 0.5;
	for (let id of Servants) {
		let servant = KDGetServantEnemy(KDGameData.Collection["" + id]);
		if (servant) {
			mult += 0.8 + KDEnemyTypeRank(servant);
		}
	}
	for (let resource of Object.keys(RecyclerResources)) {
		let resourceInput = KDGameData.FacilitiesData["RecyclerInput_" + resource];
		let resourceRate = Math.min(resourceInput, mult * RecyclerResources[resource].Rate);
		output[resource] = Math.ceil(resourceRate);
	}
	return output;
}

function KDRecycleItem(item: item, count: number = 0) : RecyclerOutputs {
	let outputs: RecyclerOutputs = {
		Latex: 0,
		Metal: 0,
		Rune: 0,
		Leather: 0,
		Rope: 0,
	};

	let type = KDRestraint(item);
	let variant = KinkyDungeonRestraintVariants[item.inventoryVariant || item.name];
	let mult = 1 + Math.max(0, type.power * 0.5);

	if (variant) {
		// TODO add an actual event
		outputs.Rune += Math.ceil(RecyclerResources.Rune.Yield * mult);
	}

	for (let shrine of type.shrine) {
		if (RecyclerResources[shrine]) {
			outputs[shrine] = (outputs[shrine] || 0) + Math.ceil(RecyclerResources[shrine].Yield * mult);
		}
	}

	if (count > 0) {
		for (let i = 0; i < count; i++) {
			if (KinkyDungeonInventoryGetSafe(item.inventoryVariant || item.name)) {
				let inv = KinkyDungeonInventoryGetSafe(item.inventoryVariant || item.name);
				if (inv.quantity > 1) {
					inv.quantity -= 1;
				} else {
					KinkyDungeonInventoryRemoveSafe(inv);
				}
			}
		}
	}

	return outputs;
}

function KDChangeRecyclerInput(amount: RecyclerOutputs) {
	for (let entry of Object.entries(amount)) {
		KDGameData.FacilitiesData["RecyclerInput_" + entry[0]] = Math.max(0,
			KDGameData.FacilitiesData["RecyclerInput_" + entry[0]] + entry[1]
		);
	}
}
function KDChangeRecyclerResources(amount: RecyclerOutputs) {
	for (let entry of Object.entries(amount)) {
		KDGameData.FacilitiesData["Recycler_" + entry[0]] = Math.max(0,
			KDGameData.FacilitiesData["Recycler_" + entry[0]] + entry[1]
		);
	}
}

function KDRecycleString(item: item, quantity: number) : string {
	let temp = "";
	let outputs = KDRecycleItem(item, 0);

	for (let output of Object.entries(outputs)) {
		if (output[1] > 0) {
			let str = Math.round(quantity * output[1]) + TextGet("KDRecycleOutput_" + output[0]);
			if (temp.length > 0) temp = temp + "";
			temp = temp + str;
		}
	}

	return temp;
}