export default {
	pendingAction: null,

	async safeReset(widgetName) {
		try {
			await resetWidget(widgetName, true);
		} catch (e) {
			return null;
		}
	},

	saveSnapshot() {
		return (
			appsmith.store.recipe_save_snapshot ||
			jsRecWorkspace.current()
		);
	},

	headerPayload() {
		return {
			...this.saveSnapshot().header
		};
	},

	dietTagsPayload() {
		return (
			this.saveSnapshot().diet_tags || []
		).map(id => ({
			tag_id: Number(id)
		}));
	},

	componentsPayload() {
		return (
			this.saveSnapshot().components || []
		).map(row => ({
			item_type:
			row.item_type || null,

			ingredient_id:
			row.item_type === "ingredient"
			? Number(row.ingredient_id) || null
			: null,

			child_recipe_id:
			row.item_type === "recipe"
			? Number(row.child_recipe_id) || null
			: null,

			qty:
			row.qty == null
			? null
			: Number(row.qty),

			unit_id:
			row.unit_id == null
			? null
			: Number(row.unit_id),

			apply_wastage:
			row.apply_wastage !== false,

			active:
			row.active !== false
		}));
	},

	requiredSaveMessage(snapshot) {
		const name =
					String(
						snapshot?.header?.name || ""
					).trim();

		return name
			? null
		: "Recipe Name is required before you can save.";
	},

	validateBeforeSave(snapshot) {
		const message =
					this.requiredSaveMessage(snapshot);

		if (message) {
			showAlert(
				message,
				"warning"
			);

			return false;
		}

		return true;
	},

	isDirty() {
		return jsRecWorkspace.isDirty();
	},

	yieldUnitChanged(snapshot) {
		const baseline =
					jsRecWorkspace.baseline();

		const oldUnitId =
					Number(
						baseline?.header?.yield_unit_id || 0
					);

		const newUnitId =
					Number(
						snapshot?.header?.yield_unit_id || 0
					);

		return oldUnitId !== newUnitId;
	},

	impactCount() {
		const impact =
					qryRecGetImpactCount.data?.[0] || {};

		return (
			Number(impact.recipe_count || 0) +
			Number(impact.dish_count || 0) +
			Number(impact.menu_count || 0)
		);
	},

	async checkYieldUnitChange(snapshot) {
		const recipeId =
					Number(
						appsmith.store.current_recipe_id || 0
					);

		if (!recipeId) {
			return false;
		}

		if (!this.yieldUnitChanged(snapshot)) {
			return false;
		}

		/*
	 * Preserve the exact current Recipe state
	 * before running the impact query.
	 *
	 * The query can cause Appsmith widgets to
	 * re-evaluate their defaults.
	 */
		await jsRecWorkspace.setWorkspace(
			snapshot
		);

		await storeValue(
			"recipe_save_snapshot",
			snapshot
		);

		await qryRecGetImpactCount.run();

		if (this.impactCount() === 0) {
			return false;
		}

		await storeValue(
			"recipe_impact_mode",
			"unit_change"
		);

		showModal(
			mdlRecDeleteConfirm.name
		);

		return true;
	},

	async saveRecipe() {
		try {
			const wasNew =
						Number(
							appsmith.store.current_recipe_id || 0
						) === 0;

			await jsRecCompTable.syncFromTable();

			const snapshot =
						jsRecWorkspace.current();

			if (!this.validateBeforeSave(snapshot)) {
				return false;
			}

			/*
		 * Before saving an existing Recipe,
		 * check whether its Yield Unit changed.
		 *
		 * If the Recipe has downstream impact,
		 * checkYieldUnitChange() opens the warning
		 * modal and pauses this Save.
		 */
			if (
				!appsmith.store.recipe_unit_change_confirmed &&
				await this.checkYieldUnitChange(snapshot)
			) {
				return false;
			}

			/*
		 * Freeze ONE exact Recipe snapshot.
		 * qrySaveRecipe reads all three payloads
		 * from this same object.
		 */
			await storeValue(
				"recipe_save_snapshot",
				snapshot
			);

			const result =
						await qryRecSaveRecipe.run();

			const savedId =
						Number(
							result?.[0]?.recipe_id || 0
						);

			if (!savedId) {
				showAlert(
					"Recipe was not saved.",
					"error"
				);

				return false;
			}

			await storeValue(
				"current_recipe_id",
				savedId
			);

			if (wasNew) {
				await qryRecGetComponentItems.run();
			}

			await Promise.all([
				qryRecGetItemById.run(),
				qryRecGetSelectedDietTags.run(),
				qryRecGetComponents.run()
			]);

			await jsRecCompTable.loadFromQuery();

			await jsRecWorkspace
				.initializeFromSaved();

			await removeValue(
				"recipe_save_snapshot"
			);

			/*
		 * Clear any completed Unit-change
		 * confirmation state.
		 */
			await removeValue(
				"recipe_unit_change_confirmed"
			);

			await removeValue(
				"recipe_impact_mode"
			);

			await storeValue(
				"Recipe_mode",
				"edit"
			);

			await removeValue(
				"Recipe_open_mode"
			);

			showAlert(
				"Recipe saved.",
				"success"
			);

			return true;

		} catch (error) {
			await removeValue(
				"recipe_save_snapshot"
			);

			await removeValue(
				"recipe_unit_change_confirmed"
			);

			showAlert(
				jsUserErrors.friendly(error),
				"error"
			);

			return false;
		}
	},

	async closeRecipe() {
		await jsRecWorkspace.capture();

		if (this.isDirty()) {
			this.pendingAction = "close";

			showModal(
				mdlRecUnsavedChanges.name
			);

			return false;
		}

		navigateTo("RecipeList");
		return true;
	},

	async saveAndCloseRecipe() {
		const saved =
					await this.saveRecipe();

		if (!saved) {
			return false;
		}

		closeModal(
			mdlRecUnsavedChanges.name
		);

		navigateTo(
			"RecipeList"
		);

		return true;
	},

	async closeWithoutSaving() {
		closeModal(
			mdlRecUnsavedChanges.name
		);

		navigateTo(
			"RecipeList"
		);

		return true;
	},

	async startNewRecipe() {
		await storeValue(
			"current_recipe_id",
			0
		);

		await storeValue(
			"Recipe_mode",
			"add"
		);

		await jsRecCompTable.clearRows();

		await jsRecWorkspace
			.initializeNew();

		await this.safeReset("inpRecName");
		await this.safeReset("selRecCategory");
		await this.safeReset("chkRecActive");
		await this.safeReset("inpRecYieldQty");
		await this.safeReset("selRecYieldUnit");
		await this.safeReset("inpRecExtraPercent");
		await this.safeReset("msRecDietTags");
		await this.safeReset("rteRecNotes");
		await this.safeReset("tblRecComponents");

		return true;
	},

	async addRecipe() {
		await jsRecWorkspace.capture();

		if (this.isDirty()) {
			this.pendingAction = "add";

			showModal(
				mdlRecUnsavedChanges.name
			);

			return false;
		}

		return await this.startNewRecipe();
	},

	async saveAndAddRecipe() {
		const saved =
					await this.saveRecipe();

		if (!saved) {
			return false;
		}

		closeModal(
			mdlRecUnsavedChanges.name
		);

		return await this.startNewRecipe();
	},

	async addWithoutSaving() {
		closeModal(
			mdlRecUnsavedChanges.name
		);

		return await this.startNewRecipe();
	},

	async nextDuplicateName(sourceName) {
		const baseName =
					String(sourceName || "").trim();

		await qryRecGetNames.run();

		const existing =
					new Set(
						(qryRecGetNames.data || [])
						.map(x =>
								 String(x.name || "")
								 .trim()
								 .toLowerCase()
								)
					);

		let candidate =
				`${baseName} - copy`;

		let number = 2;

		while (
			existing.has(candidate.toLowerCase())
		) {
			candidate =
				`${baseName} - copy ${number}`;

			number++;
		}

		return candidate;
	},

	async duplicateRecipe() {
		const sourceId =
					Number(
						appsmith.store.current_recipe_id || 0
					);

		if (!sourceId) {
			showAlert(
				"This Recipe has not been saved yet.",
				"warning"
			);

			return false;
		}

		/*
	Capture exactly what is currently
	in front of the user.
	*/
		const source =
					await jsRecWorkspace.capture();

		const currentName =
					String(
						source.header.name || ""
					).trim();

		const duplicateName =
					await this.nextDuplicateName(currentName);

		const duplicate = {
			header: {
				...source.header,
				name:
				duplicateName
			},

			diet_tags: [
				...(source.diet_tags || [])
			],

			components:
			(source.components || [])
			.map(row => ({
				...row,

				id:
				null,

				recipe_id:
				0,

				draft_row_id:
				jsRecCompTable.makeDraftId()
			}))
		};

		await storeValue(
			"current_recipe_id",
			0
		);

		await storeValue(
			"Recipe_mode",
			"duplicate"
		);

		await jsRecWorkspace
			.initializeDuplicate(
			duplicate
		);

		await jsRecCompTable.setRows(
			duplicate.components
		);

		await this.safeReset("inpRecName");
		await this.safeReset("selRecCategory");
		await this.safeReset("chkRecActive");
		await this.safeReset("inpRecYieldQty");
		await this.safeReset("selRecYieldUnit");
		await this.safeReset("inpRecExtraPercent");
		await this.safeReset("msRecDietTags");
		await this.safeReset("rteRecNotes");
		await this.safeReset("tblRecComponents");

		showAlert(
			"Recipe duplicated. Save it before making changes to enable all Recipe features.",
			"success"
		);

		return true;
	},

	async deleteRecipeStart() {
		await jsRecWorkspace.capture();

		await storeValue(
			"recipe_impact_mode",
			"delete"
		);

		await qryRecGetImpactCount.run();

		showModal(mdlRecDeleteConfirm.name);

		return true;
	},

	async confirmImpactAction() {
		const mode =
					String(
						appsmith.store.recipe_impact_mode || "delete"
					);

		if (mode === "unit_change") {
			await storeValue(
				"recipe_unit_change_confirmed",
				true
			);

			closeModal(
				mdlRecDeleteConfirm.name
			);

			return await this.saveRecipe();
		}

		return await this.deleteRecipeConfirm();
	},

	async deleteRecipeConfirm() {
		try {
			const result =
						await qryRecDeleteRecipe.run();

			const deletedId =
						Number(
							result?.[0]?.id || 0
						);

			const currentId =
						Number(
							appsmith.store.current_recipe_id || 0
						);

			if (
				!deletedId ||
				deletedId !== currentId
			) {
				showAlert(
					"Recipe was not deleted.",
					"error"
				);

				return false;
			}

			closeModal(
				mdlRecDeleteConfirm.name
			);

			await storeValue(
				"current_recipe_id",
				0
			);

			await jsRecCompTable.clearRows();
			await jsRecWorkspace.clear();

			showAlert(
				"Recipe deleted.",
				"success"
			);

			navigateTo(
				"RecipeList"
			);

			return true;

		} catch (error) {
			showAlert(
				jsUserErrors.friendly(error),
				"error"
			);

			return false;
		}
	},

impactRecipeCount() {
	return Number(
		qryRecGetImpactCount.data?.[0]?.recipe_count || 0
	);
},

impactDishCount() {
	return Number(
		qryRecGetImpactCount.data?.[0]?.dish_count || 0
	);
},

impactMenuCount() {
	return Number(
		qryRecGetImpactCount.data?.[0]?.menu_count || 0
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
		appsmith.store.recipe_impact_mode !== "unit_change" &&
		(
			this.impactRecipeCount() +
			this.impactDishCount() +
			this.impactMenuCount()
		) > 0
	);
},

	async unsavedYes() {
		switch (this.pendingAction) {
			case "close":
				return await this.saveAndCloseRecipe();

			case "add":
				return await this.saveAndAddRecipe();

			default:
				return false;
		}
	},

	async unsavedNo() {
		switch (this.pendingAction) {
			case "close":
				return await this.closeWithoutSaving();

			case "add":
				return await this.addWithoutSaving();

			default:
				return false;
		}
	}
};