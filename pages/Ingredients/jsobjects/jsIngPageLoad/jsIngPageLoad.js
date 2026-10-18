export default {
	async load() {
		const ok = await jsAppInit.init();
		if (!ok) return false;

		try {
			const lists = await apiIngGetHelperLists.run();

			if (lists?.authenticated !== true) {
				throw new Error("Unable to load helper lists.");
			}

			const results = await Promise.all([
				apiGetMyIngredients.run(),
				apiIngGetCategories.run(),
				apiIngGetSuppliers.run(),
				apiIngGetPackaging.run(),
				apiIngGetAllergens.run(),
				apiIngGetDietTags.run(),
				apiIngGetUnits.run()
			]);

			if (results.some(
				result => result?.authenticated !== true
			)) {
				throw new Error("One or more Ingredients requests failed.");
			}

			return true;

		} catch (error) {
			showAlert(
				"Unable to load Ingredients data. Please try again.",
				"error"
			);
			return false;
		}
	},
};