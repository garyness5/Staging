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
			showAlert(
				"Select a Recipe first.",
				"warning"
			);

			return false;
		}

		await qryRecListGetImpactCount.run();

		showModal(
			mdlRecLstDelete.name
		);

		return true;
	},

	async deleteSelectedRecipeConfirm() {
		if (!this.hasSelection()) {
			showAlert(
				"Select a Recipe first.",
				"warning"
			);

			return false;
		}

		try {
			const result =
						await qryRecListDelete.run();

			const deletedId =
						Number(
							result?.[0]?.id || 0
						);

			if (
				!deletedId ||
				deletedId !== this.selectedRecipeId()
			) {
				showAlert(
					"Recipe was not deleted.",
					"error"
				);

				return false;
			}

			await removeValue(
				"current_recipe_id"
			);

			closeModal(
				mdlRecLstDelete.name
			);

			await qryRecListGetRecipes.run();

			showAlert(
				"Recipe deleted.",
				"success"
			);

			return true;

		} catch (error) {
			showAlert(
				error?.message ||
				"Recipe could not be deleted.",
				"error"
			);

			return false;
		}
	},

	impactRecipeCount() {
		return Number(
			qryRecListGetImpactCount.data?.[0]?.recipe_count || 0
		);
	},

	impactDishCount() {
		return Number(
			qryRecListGetImpactCount.data?.[0]?.dish_count || 0
		);
	},

	impactMenuCount() {
		return Number(
			qryRecListGetImpactCount.data?.[0]?.menu_count || 0
		);
	},

	impactEventCount() {
		return Number(
			qryRecListGetImpactCount.data?.[0]?.event_count || 0
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
		const recipeId =
					Number(row?.id || 0);

		if (!recipeId) {
			return false;
		}

		try {
			await qryRecListSetActive.run({
				recipe_id: recipeId,
				active: active === true
			});

			await qryRecListGetRecipes.run();

			return true;

		} catch (error) {
			showAlert(
				error?.message ||
				"Recipe Active status could not be changed.",
				"error"
			);

			await qryRecListGetRecipes.run();

			return false;
		}
	},

	async setCategory(recipeId, newCategoryId) {
		const id =
					Number(recipeId || 0);

		const categoryId =
					Number(newCategoryId || 0) || null;

		if (!id) {
			return false;
		}

		try {
			await qryRecListSetCategory.run({
				recipe_id: id,
				category_id: categoryId
			});

			await qryRecListGetRecipes.run();

			return true;

		} catch (error) {
			showAlert(
				error?.message ||
				"Recipe Category could not be changed.",
				"error"
			);

			await qryRecListGetRecipes.run();

			return false;
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
		const search =
					this.searchText();

		const status =
					this.statusFilter();

		return (qryRecListGetRecipes.data || [])
			.filter(row => {
			if (
				status === "active" &&
				row.active !== true
			) {
				return false;
			}

			if (
				status === "inactive" &&
				row.active !== false
			) {
				return false;
			}

			return true;
		})
			.filter(row => {
			if (!search) {
				return true;
			}

			const haystack = [
				row.name,
				row.category_name,
				row.yield_unit,
				row.diet_tag_names,
				row.derived_allergens
			]
			.map(x =>
					 String(x || "")
					 .toLowerCase()
					)
			.join(" ");

			return haystack.includes(search);
		});
	}
};