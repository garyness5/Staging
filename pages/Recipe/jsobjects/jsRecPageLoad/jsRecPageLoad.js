export default {
	async load() {
		const ok = await jsAppInit.init();

		if (!ok) {
			return false;
		}

		await Promise.all([
			qryRecGetCategories.run(),
			qryRecGetDietTagsHeader.run(),
			qryRecGetComponentItems.run()
		]);

		const mode =
					String(
						appsmith.store.Recipe_open_mode ||
						appsmith.store.Recipe_mode ||
						"edit"
					);

		await jsRecWorkspace.clear();

		if (mode === "add") {
			await jsRecWorkspace.initializeNew();
			await jsRecCompTable.clearRows();

			await removeValue(
				"Recipe_open_mode"
			);

			return true;
		}

		const recipeId =
					Number(
						appsmith.store.current_recipe_id || 0
					);

		if (!recipeId) {
			await jsRecWorkspace.initializeNew();
			await jsRecCompTable.clearRows();

			await removeValue(
				"Recipe_open_mode"
			);

			return true;
		}

		await Promise.all([
			qryRecGetItemById.run(),
			qryRecGetSelectedDietTags.run(),
			qryRecGetComponents.run()
		]);

		await jsRecWorkspace.initializeFromSaved();

		await jsRecCompTable.loadFromQuery();

		if (mode === "duplicate") {
			await removeValue(
				"Recipe_open_mode"
			);

			await resetWidget("inpRecName", true);
			await resetWidget("selRecCategory", true);
			await resetWidget("chkRecActive", true);
			await resetWidget("inpRecYieldQty", true);
			await resetWidget("selRecYieldUnit", true);
			await resetWidget("inpRecExtraPercent", true);
			await resetWidget("msRecDietTags", true);
			await resetWidget("rteRecNotes", true);

			return await jsRecSave.duplicateRecipe();
		}

		await removeValue(
			"Recipe_open_mode"
		);

		await storeValue(
			"Recipe_mode",
			"edit"
		);

		return true;
	}
};