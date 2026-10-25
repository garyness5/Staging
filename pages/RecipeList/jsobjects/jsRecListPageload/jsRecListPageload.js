export default {
	async load() {
		await storeValue("recListPageReady", false);

		try {
			const ok = await jsAppInit.init();

			if (!ok) {
				console.error("RecipeList: initialization failed.");
				return false;
			}

			const result = await apiRecLstGetRecipes.run();

			if (
				result?.authenticated !== true ||
				!Array.isArray(result?.recipes)
			) {
				throw new Error("RecipeList records could not be loaded.");
			}

			// Core records are available: the list can be displayed.
			await storeValue("recListPageReady", true);

			// Categories are optional supporting data.
			try {
				const categoryResult = await apiRecLstGetCategories.run();

				if (
					categoryResult?.authenticated !== true ||
					!Array.isArray(categoryResult?.categories)
				) {
					console.warn(
						"RecipeList: Category reference data unavailable.",
						categoryResult
					);
				}
			} catch (categoryError) {
				console.warn(
					"RecipeList: Category loading failed.",
					categoryError
				);
			}

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
	},
};