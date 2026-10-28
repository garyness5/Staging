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
		const recipeId = Number(row?.id || 0);

		if (!Number.isSafeInteger(recipeId) || recipeId <= 0) {
			showAlert("Invalid Recipe ID.", "error");
			return false;
		}

		return await jsRecListBatch.stage(recipeId, {
			active: active === true
		});
	},

	setCategoryFromTable() {
		const row = tblRecipeList.updatedRow;

		if (!row || row.id == null) return;

		return this.setCategory(
			row,
			row.category_id === "" || row.category_id == null
			? null
			: Number(row.category_id)
		);
	},

	async setCategory(row, categoryId) {
		const recipeId = Number(row?.id);

		if (!Number.isSafeInteger(recipeId) || recipeId <= 0) {
			showAlert("Invalid Recipe ID.", "error");
			return false;
		}

		const normalizedCategoryId =
					categoryId === null ||
					categoryId === undefined ||
					categoryId === ""
		? null
		: Number(categoryId);

		if (
			normalizedCategoryId !== null &&
			(!Number.isSafeInteger(normalizedCategoryId) ||
			 normalizedCategoryId <= 0)
		) {
			showAlert("Invalid Recipe Category.", "error");
			return false;
		}

		return await jsRecListBatch.stage(recipeId, {
			category_id: normalizedCategoryId
		});
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

		return jsRecListBatch.workingRows()
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