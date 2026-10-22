export default {
	async load() {
		const ok = await jsAppInit.init();

		if (!ok) {
			return false;
		}

		await Promise.all([
			qryRecListGetCategories.run(),
			apiRecLstGetRecipes.run()
		]);

		return true;
	}
};