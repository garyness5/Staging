export default {
	selectedRecipeId() {
		return Number(
			tblRecipeList.selectedRow?.id || 0
		);
	},

	hasSelection() {
		return this.selectedRecipeId() > 0;
	},

	async addRecipe() {
		await storeValue(
			"current_recipe_id",
			0
		);

		await storeValue(
			"Recipe_mode",
			"add"
		);

		await removeValue(
			"Recipe_open_mode"
		);

		await removeValue(
			"recipe_workspace"
		);

		await removeValue(
			"recipe_baseline"
		);

		await removeValue(
			"rec_components_local_rows"
		);

		navigateTo(
			"Recipe",
			{},
			"SAME_WINDOW"
		);

		return true;
	},

	async editSelectedRecipe() {
		if (!this.hasSelection()) {
			showAlert(
				"Select a Recipe first.",
				"warning"
			);

			return false;
		}

		await storeValue(
			"current_recipe_id",
			this.selectedRecipeId()
		);

		await storeValue(
			"Recipe_mode",
			"edit"
		);

		await removeValue(
			"Recipe_open_mode"
		);

		await removeValue(
			"recipe_workspace"
		);

		await removeValue(
			"recipe_baseline"
		);

		await removeValue(
			"rec_components_local_rows"
		);

		navigateTo(
			"Recipe",
			{},
			"SAME_WINDOW"
		);

		return true;
	},

	async duplicateSelectedRecipe() {
		if (!this.hasSelection()) {
			showAlert(
				"Select a Recipe first.",
				"warning"
			);

			return false;
		}

		await removeValue(
			"recipe_workspace"
		);

		await removeValue(
			"recipe_baseline"
		);

		await removeValue(
			"rec_components_local_rows"
		);

		await removeValue(
			"Recipe_open_mode"
		);

		await storeValue(
			"current_recipe_id",
			this.selectedRecipeId()
		);

		await storeValue(
			"Recipe_mode",
			"duplicate"
		);

		navigateTo(
			"Recipe",
			{},
			"SAME_WINDOW"
		);

		return true;
	},

	async deleteSelectedRecipeStart() {
		if (!this.hasSelection()) {
			showAlert("Select a Recipe first.", "warning");
			return false;
		}

		const recipeId = this.selectedRecipeId();

		try {
			const result = await apiRecLstGetImpactCount.run({
				recipe_id: recipeId
			});

			if (
				result?.authenticated !== true ||
				!result?.impact
			) {
				throw new Error("Unable to check Recipe impact.");
			}

			showModal(mdlRecLstDelete.name);
			return true;

		} catch (error) {
			showAlert(
				"Unable to check Recipe impact. No changes were made.",
				"error"
			);
			return false;
		}
	},

	async deleteSelectedRecipeConfirm() {
		if (!this.hasSelection()) {
			showAlert("Select a Recipe first.", "warning");
			return false;
		}

		const recipeId = this.selectedRecipeId();

		try {
			const result = await apiRecLstDelete.run({
				recipe_id: recipeId
			});

			if (
				result?.authenticated !== true ||
				Number(result.recipe_id) !== recipeId
			) {
				throw new Error("Recipe deletion was not confirmed.");
			}

			await removeValue("current_recipe_id");

			closeModal(mdlRecLstDelete.name);

			const refreshed = await apiRecLstGetRecipes.run();

			if (
				refreshed?.authenticated !== true ||
				!Array.isArray(refreshed?.recipes)
			) {
				throw new Error("Recipe deleted, but the list could not be refreshed.");
			}

			showAlert("Recipe deleted.", "success");
			return true;

		} catch (error) {
			showAlert(
				error?.message || "Recipe could not be deleted.",
				"error"
			);
			return false;
		}
	},

	impactRecipeCount() {
		return Number(
			apiRecLstGetImpactCount.data?.impact?.recipe_count || 0
		);
	},

	impactDishCount() {
		return Number(
			apiRecLstGetImpactCount.data?.impact?.dish_count || 0
		);
	},

	impactMenuCount() {
		return Number(
			apiRecLstGetImpactCount.data?.impact?.menu_count || 0
		);
	},

	impactEventCount() {
		return Number(
			apiRecLstGetImpactCount.data?.impact?.event_count || 0
		);
	},

	deleteImpactText() {
		return `This will impact
    Recipes: ${this.impactRecipeCount()}
    Dishes: ${this.impactDishCount()}
    Menus: ${this.impactMenuCount()}`;
	},

	showDeleteImpact() {
		return (
			this.impactRecipeCount() +
			this.impactDishCount() +
			this.impactMenuCount()
		) > 0;
	},

	async setActive(row, active) {
		const recipeId = Number(row?.id);

		if (!Number.isSafeInteger(recipeId) || recipeId <= 0) {
			showAlert("Invalid Recipe ID.", "error");
			return false;
		}

		const savedRow = (apiRecLstGetRecipes.data?.recipes || [])
		.find(r => Number(r.id) === recipeId);

		if (!savedRow) {
			showAlert("Recipe could not be identified.", "error");
			return false;
		}

		const requestedActive = active === true;

		if (typeof active !== "boolean") {
			showAlert("Invalid Recipe Status.", "error");
			return false;
		}

		const key = String(recipeId);
		const confirmed = appsmith.store.RecListConfirmedActive || {};
		const previousActive =
					Object.prototype.hasOwnProperty.call(confirmed, key)
		? confirmed[key]
		: savedRow.active;

		if (requestedActive === previousActive) {
			return true;
		}

		if (appsmith.store.RecListRefreshing === true) {
			showAlert(
				"Please wait for RecipeList to finish refreshing.",
				"warning"
			);
			return false;
		}

		const pending = appsmith.store.RecListStatusSaving || {};

		if (pending[key]) {
			showAlert("This Recipe is already being updated.", "warning");
			return false;
		}

		await storeValue(
			"RecListStatusSaving",
			{ ...pending, [key]: true },
			false
		);

		try {
			const result = await apiRecLstSetActive.run({
				recipe_id: recipeId,
				active: requestedActive
			});

			if (
				result?.authenticated !== true ||
				Number(result.recipe_id) !== recipeId ||
				typeof result.active !== "boolean"
			) {
				throw new Error("Recipe Status was not confirmed.");
			}

			await storeValue(
				"RecListConfirmedActive",
				{
					...(appsmith.store.RecListConfirmedActive || {}),
					[key]: result.active
				},
				false
			);

			return true;

		} catch (error) {
			showAlert(
				"Recipe Status could not be saved. The previous Status has been restored.",
				"error"
			);

			return false;

		} finally {
			const current = {
				...(appsmith.store.RecListStatusSaving || {})
			};

			delete current[key];

			await storeValue(
				"RecListStatusSaving",
				current,
				false
			);
		}
	},

	async refresh() {
		const saving = appsmith.store.RecListStatusSaving || {};

		if (Object.values(saving).some(value => value === true)) {
			showAlert(
				"Please wait for the Recipe Status update to finish.",
				"warning"
			);
			return false;
		}

		if (appsmith.store.RecListRefreshing === true) {
			return false;
		}

		await storeValue("RecListRefreshing", true, false);

		try {
			const result = await apiRecLstGetRecipes.run();

			if (
				result?.authenticated !== true ||
				!Array.isArray(result?.recipes)
			) {
				throw new Error("RecipeList refresh failed.");
			}

			await storeValue("RecListConfirmedActive", {}, false);

			showAlert("RecipeList refreshed.", "success");
			return true;

		} catch (error) {
			console.error("RecipeList refresh failed:", error);

			showAlert(
				"Unable to refresh RecipeList. Please try again.",
				"error"
			);

			return false;

		} finally {
			await storeValue("RecListRefreshing", false, false);
		}
	},

	searchText() {
		return String(
			inpRecLstSearch.text || ""
		)
			.trim()
			.toLowerCase();
	},

	statusFilter() {
		return String(
			selRecLstFilter.selectedOptionValue || "all"
		).toLowerCase();
	},

	filteredRows() {
		const search = this.searchText();
		const status = this.statusFilter();

		return (apiRecLstGetRecipes.data?.recipes || [])
			.map(row => {
			const confirmed =
						appsmith.store.RecListConfirmedActive || {};

			const key = String(row.id);

			return {
				...row,
				active: Object.prototype.hasOwnProperty.call(
					confirmed,
					key
				)
				? confirmed[key]
				: row.active
			};
		})
			.filter(row => {
			if (status === "active" && row.active !== true) return false;
			if (status === "inactive" && row.active !== false) return false;
			return true;
		})
			.filter(row => {
			if (!search) return true;

			const haystack = [
				row.name,
				row.category_name,
				row.yield_unit,
				row.diet_tag_names,
				row.derived_allergens
			]
			.map(x => String(x || "").toLowerCase())
			.join(" ");

			return haystack.includes(search);
		});
	}
};