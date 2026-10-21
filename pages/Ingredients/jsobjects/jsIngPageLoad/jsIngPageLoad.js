export default {
	async load() {
		await storeValue("ingPageReady", false);

		try {
			const ok = await jsAppInit.init();
			if (!ok) return false;

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

			if (results.some(result => result?.authenticated !== true)) {
				throw new Error("Ingredients data request failed.");
			}

			await storeValue("ingPageReady", true);
			return true;

		} catch (error) {
			await storeValue("ingPageReady", false);
			console.error("Ingredients initialization failed:", error);

			showAlert(
				"Unable to load Ingredients data. Please try again.",
				"error"
			);

			return false;
		}
	},

	isReady() {
		return appsmith.store.ingPageReady === true;
	}
};