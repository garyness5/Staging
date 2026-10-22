export default {
  async load() {
    await storeValue("recListPageReady", false);

    try {
      const ok = await jsAppInit.init();

      if (!ok) {
        console.error("RecipeList: jsAppInit.init() returned false.");
        return false;
      }

      const [result, categoryResult] = await Promise.all([
        apiRecLstGetRecipes.run(),
        apiRecLstGetCategories.run()
      ]);

      if (
        result?.authenticated !== true ||
        !Array.isArray(result?.recipes)
      ) {
        console.error("RecipeList: Recipes response invalid.", result);
        throw new Error("RecipeList data request failed.");
      }

      if (
        categoryResult?.authenticated !== true ||
        !Array.isArray(categoryResult?.categories)
      ) {
        console.error(
          "RecipeList: Categories response invalid.",
          categoryResult
        );
        throw new Error("RecipeList categories request failed.");
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
  },

  isReady() {
    return appsmith.store.recListPageReady === true;
  }
};