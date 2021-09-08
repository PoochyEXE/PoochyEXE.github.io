function CostToMax(id) {
	const upgrade = ActiveMachine(state).upgrades[id];
	let total = 0;
	if (upgrade.max_level < 99999) {
		for (let level = 0; level < upgrade.max_level; ++level) {
			total += upgrade.cost_func(level);
		}
	}
	return total;
}

function CostToMaxAll() {
	const upgrades = ActiveMachine(state).upgrades;
	let total = 0;
	for (id in upgrades) {
		total += CostToMax(id);
	}
	return total;
}

function CostToMaxMap() {
	const upgrades = ActiveMachine(state).upgrades;
	let result = {};
	for (id in upgrades) {
		result[id] = CostToMax(id);
	}
	return result;
}
