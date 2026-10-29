export default {
	async load() {
		await storeValue("recListPageReady", false);
		await removeValue("RecListBatchPending");

		try {
			const ok = await jsAppInit.init();

			if (!ok) {
				console.error("RecipeList: initialization failed.");
				return false;
			}

			const [recipesResult, categoriesResult] = await Promise.allSettled([
				apiRecLstGetRecipes.run(),
				apiRecLstGetCategories.run()
			]);

			if (
				recipesResult.status !== "fulfilled" ||
				recipesResult.value?.authenticated !== true ||
				!Array.isArray(recipesResult.value?.recipes)
			) {
				throw new Error("RecipeList records could not be loaded.");
			}

			await storeValue("RecListConfirmedActive", {}, false);
			await storeValue("RecListStatusSaving", {}, false);

			if (
				categoriesResult.status !== "fulfilled" ||
				categoriesResult.value?.authenticated !== true ||
				!Array.isArray(categoriesResult.value?.categories)
			) {
				console.warn(
					"RecipeList: Category reference data unavailable.",
					categoriesResult
				);
			}

			await storeValue("recListPageReady", true);

			return true;

		} catch (error) {
			await storeValue("recListPageReady", false);

			console.error("RecipeList initialization failed:", error);

			showAlert(
				"Unable to load RecipeList data. Please try again.",
				"error"
			);

			return false;
		}
	}
};