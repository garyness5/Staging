export default {


	async loadSecureHelpers() {
		const response = await qryRecGetLookups.run();



		if (
			response?.authenticated !== true ||
			!Array.isArray(response.recipe_categories) ||
			!Array.isArray(response.diet_tags) ||
			!Array.isArray(response.ingredient_categories) ||
			!Array.isArray(response.allergens) ||
			!Array.isArray(response.suppliers) ||
			!Array.isArray(response.packaging) ||
			!Array.isArray(response.units)
		) {
			throw new Error("Unable to load Recipe lookups");
		}

		const activeItems = rows =>
		rows
		.filter(row => row.active === true)
		.map(row => ({
			id: Number(row.id),
			name: row.name
		}));

		await Promise.all([
			storeValue("rec_categories", activeItems(response.recipe_categories)),
			storeValue("rec_diet_tags", activeItems(response.diet_tags)),
			storeValue("rec_ing_categories", activeItems(response.ingredient_categories)),
			storeValue("rec_ing_allergens", activeItems(response.allergens)),
			storeValue("rec_ing_diet_tags", activeItems(response.diet_tags)),
			storeValue("rec_ing_suppliers", activeItems(response.suppliers)),
			storeValue("rec_ing_packaging", activeItems(response.packaging)),
			storeValue("rec_units", response.units)
		]);

		return true;
	},

	async load() {
		await storeValue("recPageReady", false);

		try {
			const ok = await jsAppInit.init();

			if (!ok) {
				return false;
			}

			const mode = String(
				appsmith.store.Recipe_open_mode ||
				appsmith.store.Recipe_mode ||
				"edit"
			);

			const recipeId = Number(
				appsmith.store.current_recipe_id || 0
			);

			const needsDetail =
						mode !== "add" && recipeId > 0;

			let detail = null;

			try {
				const [helpersLoaded, components, recipeDetail] = await Promise.all([
					this.loadSecureHelpers(),
					apiRecGetComponentItems.run(),
					needsDetail ? apiRecGetDetail.run() : Promise.resolve(null)
				]);

				if (
					helpersLoaded !== true ||
					components?.authenticated !== true ||
					!Array.isArray(components.component_items)
				) {
					throw new Error("Invalid Recipe reference data");
				}

				detail = recipeDetail;

			} catch (error) {
				console.error(
					"Recipe reference data loading failed:",
					error
				);

				showAlert(
					"Unable to load Recipe reference data.",
					"error"
				);

				return false;
			}

			await jsRecWorkspace.clear();

			if (mode === "add") {
				await jsRecWorkspace.initializeNew();
				await jsRecCompTable.clearRows();

				await removeValue("Recipe_open_mode");
				await storeValue("recPageReady", true);

				return true;
			}

			if (!recipeId) {
				await jsRecWorkspace.initializeNew();
				await jsRecCompTable.clearRows();

				await removeValue("Recipe_open_mode");
				await storeValue("recPageReady", true);

				return true;
			}

			if (
				detail?.authenticated !== true ||
				!detail?.recipe ||
				Number(detail.recipe.id) !== recipeId
			) {
				showAlert(
					"Recipe could not be loaded.",
					"error"
				);

				return false;
			}

			await jsRecWorkspace.initializeFromSaved();
			await jsRecCompTable.loadFromQuery();

			if (mode === "duplicate") {
				await removeValue("Recipe_open_mode");

				await resetWidget("inpRecName", true);
				await resetWidget("selRecCategory", true);
				await resetWidget("chkRecActive", true);
				await resetWidget("inpRecYieldQty", true);
				await resetWidget("selRecYieldUnit", true);
				await resetWidget("inpRecExtraPercent", true);
				await resetWidget("msRecDietTags", true);
				await resetWidget("rteRecNotes", true);

				const duplicated =
							await jsRecSave.duplicateRecipe();

				if (duplicated !== true) {
					return false;
				}

				await storeValue("recPageReady", true);

				return true;
			}

			await removeValue("Recipe_open_mode");
			await storeValue("Recipe_mode", "edit");
			await storeValue("recPageReady", true);

			return true;

		} catch (error) {
			console.error(
				"Recipe initialization failed:",
				error
			);

			showAlert(
				"Unable to initialize Recipe.",
				"error"
			);

			return false;
		}
	}
};