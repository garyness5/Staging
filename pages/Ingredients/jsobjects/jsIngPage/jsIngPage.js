export default {
	async load() {
		const ok = await jsAppInit.init();

		if (!ok) {
			return false;
		}

		await Promise.all([
			qryIngGetIngredients.run(),
			qryIngGetCategories.run(),
			qryIngGetSuppliers.run(),
			qryIngGetPackaging.run(),
			qryIngGetUnits.run(),
			qryIngGetAllergens.run(),
			qryIngGetDietTags.run()
		]);

		return true;
	}
};