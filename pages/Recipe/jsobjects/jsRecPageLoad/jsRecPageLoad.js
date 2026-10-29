export default {

	async getHelperItems(listCode) {
		const lists =
			apiRecGetHelperLists.data?.helper_lists || [];

		const list = lists.find(
			row => row.list_code === listCode
		);

		if (!list) {
			throw new Error(
				`Missing helper list: ${listCode}`
			);
		}

		const response = await apiRecGetHelperItems.run({
			list_id: Number(list.id)
		});

		if (
			response?.authenticated !== true ||
			!Array.isArray(response.helper_items)
		) {
			throw new Error(
				`Unable to load ${listCode}`
			);
		}

		return response.helper_items
			.filter(row => row.active === true)
			.map(row => ({
				id: Number(row.id),
				name: row.name
			}));
	},

	async loadSecureHelpers() {
		const lists = await apiRecGetHelperLists.run();

		if (
			lists?.authenticated !== true ||
			!Array.isArray(lists.helper_lists)
		) {
			throw new Error(
				"Unable to load Recipe helper lists"
			);
		}

		const [
			categories,
			dietTags,
			ingCategories,
			ingAllergens,
			ingSuppliers,
			ingPackaging
		] = await Promise.all([
			this.getHelperItems("recipe_category"),
			this.getHelperItems("diet_tag"),
			this.getHelperItems("ingredient_category"),
			this.getHelperItems("allergen"),
			this.getHelperItems("supplier"),
			this.getHelperItems("packaging")
		]);

		await Promise.all([
			storeValue("rec_categories", categories),
			storeValue("rec_diet_tags", dietTags),
			storeValue("rec_ing_categories", ingCategories),
			storeValue("rec_ing_allergens", ingAllergens),
			storeValue("rec_ing_diet_tags", dietTags),
			storeValue("rec_ing_suppliers", ingSuppliers),
			storeValue("rec_ing_packaging", ingPackaging)
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
				const [
					helpersLoaded,
					components,
					units,
					recipeDetail
				] = await Promise.all([
					this.loadSecureHelpers(),
					apiRecGetComponentItems.run(),
					apiRecGetUnits.run(),
					needsDetail
						? apiRecGetDetail.run()
						: Promise.resolve(null)
				]);

				if (
					helpersLoaded !== true ||
					components?.authenticated !== true ||
					!Array.isArray(components.component_items) ||
					units?.authenticated !== true ||
					!Array.isArray(units.units)
				) {
					throw new Error(
						"Invalid Recipe reference data"
					);
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