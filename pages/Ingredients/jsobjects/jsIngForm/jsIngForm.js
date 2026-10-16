export default {
	CONTEXT_ADD_INGREDIENTS: "addFromIngredients",
	CONTEXT_EDIT_INGREDIENTS: "editFromIngredients",


	// ============================================================
	// OPEN ADD
	// ============================================================

	async openAddFromIngredients() {
		await storeValue(
			"IngForm_context",
			this.CONTEXT_ADD_INGREDIENTS
		);

		await storeValue(
			"IngForm_mode",
			"add"
		);

		await storeValue(
			"IngForm_edit_id",
			null
		);

		await storeValue(
			"IngForm_edit_row",
			null
		);

		await removeValue(
			"IngForm_duplicate_allergens"
		);

		await removeValue(
			"IngForm_duplicate_diet_tags"
		);

		await removeValue(
			"IngForm_duplicate_row"
		);

		await removeValue(
			"IngForm_saved_id"
		);

		await removeValue(
			"IngForm_pending_action"
		);

		await resetWidget(
			"mdlAddIng",
			true
		);

		showModal(
			mdlAddIng.name
		);

		await this.captureBaseline();

		return true;
	},


	// ============================================================
	// OPEN EDIT
	// ============================================================

	async openEditFromIngredients(row = null) {
		const requestedId =
					Number(
						row?.id ||
						tblIngList.selectedRow?.id ||
						0
					);

		if (!requestedId) {
			showAlert(
				"Select an ingredient to edit.",
				"warning"
			);

			return false;
		}

		const editRow =
					(qryIngGetIngredients.data || [])
		.find(r =>
					Number(r.id) === requestedId
				 );

		if (!editRow?.id) {
			showAlert(
				"Ingredient could not be identified.",
				"error"
			);

			return false;
		}

		await storeValue(
			"IngForm_context",
			this.CONTEXT_EDIT_INGREDIENTS
		);

		await storeValue(
			"IngForm_mode",
			"edit"
		);

		await storeValue(
			"IngForm_edit_id",
			editRow.id
		);

		await storeValue(
			"IngForm_edit_row",
			editRow
		);

		await removeValue(
			"IngForm_duplicate_allergens"
		);

		await removeValue(
			"IngForm_duplicate_diet_tags"
		);

		await removeValue(
			"IngForm_duplicate_row"
		);

		await removeValue(
			"IngForm_saved_id"
		);

		await removeValue(
			"IngForm_pending_action"
		);

		await qryIngGetClassifications.run();

		await resetWidget(
			"mdlAddIng",
			true
		);

		showModal(
			mdlAddIng.name
		);

		await this.captureBaseline();

		return true;
	},


	// ============================================================
	// MODE / ROW
	// ============================================================

	isEdit() {
		return (
			appsmith.store.IngForm_mode === "edit" ||
			appsmith.store.IngForm_mode === "duplicate"
		);
	},


	editRow() {
		if (
			appsmith.store.IngForm_mode === "duplicate"
		) {
			return (
				appsmith.store.IngForm_duplicate_row || {}
			);
		}

		return (
			appsmith.store.IngForm_edit_row || {}
		);
	},


	// ============================================================
	// CURRENT WORKING STATE
	// ============================================================

	currentState() {
		const allergens =
					(msIngAllergens.selectedOptionValues || [])
		.map(String)
		.sort();

		const dietTags =
					(msIngDietTags.selectedOptionValues || [])
		.map(String)
		.sort();

		return {
			name:
			inpIngIngredient.text?.trim() || "",

			category_id:
			selIngCategory.selectedOptionValue
			? String(
				selIngCategory.selectedOptionValue
			)
			: null,

			purchase_qty:
			inpIngQuantity.text || "",

			purchase_unit_id:
			selIngPurchaseUnit.selectedOptionValue
			? String(
				selIngPurchaseUnit.selectedOptionValue
			)
			: null,

			total_cost:
			inpIngPurchaseCost.text || "",

			wastage_percent:
			inpIngWastage.text || "",

			supplier_id:
			selIngSupplier.selectedOptionValue
			? String(
				selIngSupplier.selectedOptionValue
			)
			: null,

			packaging_id:
			selIngPackaging.selectedOptionValue
			? String(
				selIngPackaging.selectedOptionValue
			)
			: null,

			item_code:
			inpIngSupplierCode.text?.trim() || "",

			notes:
			rteIngNotes.text || "",

			active:
			chkIngActive.isChecked !== false,

			allergens,

			diet_tags: dietTags
		};
	},


	async captureBaseline() {
		await storeValue(
			"IngForm_baseline",
			JSON.stringify(
				this.currentState()
			)
		);

		return true;
	},


	isDirty() {
		/*
			A duplicate is always a new unsaved Ingredient
			until its first Save.
		*/
		if (
			appsmith.store.IngForm_mode === "duplicate"
		) {
			return true;
		}

		const baseline =
					appsmith.store.IngForm_baseline;

		if (!baseline) {
			return false;
		}

		return (
			JSON.stringify(
				this.currentState()
			) !== baseline
		);
	},


	canSave() {
		const name =
					inpIngIngredient.text?.trim() || "";

		return (
			!!name &&
			this.isDirty()
		);
	},


	// ============================================================
	// SAVE
	// Name is the only required field.
	// ============================================================

	async save(closeAfterSave = true) {
		const name =
					inpIngIngredient.text
		? inpIngIngredient.text.trim()
		: "";

		if (!name) {
			showAlert(
				"Ingredient Name is required.",
				"warning"
			);

			return false;
		}

		try {
			const result =
						await qryIngSave.run();

			const savedId =
						Number(
							result?.[0]?.ingredient_id || 0
						);

			if (!savedId) {
				showAlert(
					"Ingredient was not saved.",
					"error"
				);

				return false;
			}

			await storeValue(
				"IngForm_saved_id",
				savedId
			);

			await qryIngGetIngredients.run();

			showAlert(
				"Ingredient saved.",
				"success"
			);

			if (closeAfterSave) {
				closeModal(
					mdlIngUnsaved.name
				);

				closeModal(
					mdlAddIng.name
				);

				return true;
			}

			await this.captureBaseline();

			return true;

		} catch (error) {
			jsUserErrors.show(
				error,
				"Ingredient could not be saved."
			);

			return false;
		}
	},

	async saveAndNew() {
		const saved =
					await this.save(false);

		if (!saved) {
			return false;
		}

		await this.openAddFromIngredients();

		return true;
	},


	// ============================================================
	// CLOSE / UNSAVED GUARD
	// ============================================================

	async cancel() {
		if (this.isDirty()) {
			await storeValue(
				"IngForm_pending_action",
				"close"
			);

			showModal(
				mdlIngUnsaved.name
			);

			return false;
		}

		closeModal(
			mdlAddIng.name
		);

		return true;
	},


	async requestAdd() {
		if (this.isDirty()) {
			await storeValue(
				"IngForm_pending_action",
				"add"
			);

			showModal(
				mdlIngUnsaved.name
			);

			return false;
		}

		await this.openAddFromIngredients();

		return true;
	},


	async saveFromUnsaved() {
		const action =
					appsmith.store.IngForm_pending_action ||
					"close";

		const saved =
					await this.save(false);

		if (!saved) {
			return false;
		}

		closeModal(
			mdlIngUnsaved.name
		);

		if (action === "add") {
			await this.openAddFromIngredients();
		} else {
			closeModal(
				mdlAddIng.name
			);
		}

		await removeValue(
			"IngForm_pending_action"
		);

		return true;
	},


	async discardChanges() {
		const action =
					appsmith.store.IngForm_pending_action ||
					"close";

		closeModal(
			mdlIngUnsaved.name
		);

		if (action === "add") {
			await this.openAddFromIngredients();
		} else {
			closeModal(
				mdlAddIng.name
			);
		}

		await removeValue(
			"IngForm_pending_action"
		);

		return true;
	},


	async cancelDiscard() {
		closeModal(
			mdlIngUnsaved.name
		);

		await removeValue(
			"IngForm_pending_action"
		);

		return true;
	},


	// ============================================================
	// DELETE
	// ============================================================

	async openDeleteConfirm() {
		const id =
					Number(
						appsmith.store.IngForm_edit_id || 0
					);

		if (!id) {
			showAlert(
				"This Ingredient has not been saved yet.",
				"warning"
			);

			return false;
		}

		await qryIngGetImpactCount.run({
			ingredient_id: id
		});

		showModal(
			mdlIngDelete.name
		);

		return true;
	},


	async confirmDelete() {
		const id =
					Number(
						appsmith.store.IngForm_edit_id || 0
					);

		if (!id) {
			showAlert(
				"No Ingredient selected.",
				"warning"
			);

			return false;
		}

		try {
			const result =
						await qryIngDelete.run({
							ingredient_id: id
						});

			const deletedId =
						Number(
							result?.[0]?.ingredient_id || 0
						);

			if (!deletedId) {
				showAlert(
					"Ingredient was not deleted.",
					"error"
				);

				return false;
			}

			await qryIngGetIngredients.run();

			closeModal(
				mdlIngDelete.name
			);

			closeModal(
				mdlAddIng.name
			);

			showAlert(
				"Ingredient deleted.",
				"success"
			);

			return true;

		} catch (error) {
			jsUserErrors.show(
				error,
				"Ingredient could not be deleted."
			);

			return false;
		}
	},


	cancelDelete() {
		closeModal(
			mdlIngDelete.name
		);

		return true;
	},


	async deleteFromList() {
		const row =
					tblIngList.selectedRow;

		if (!row?.id) {
			showAlert(
				"Select an ingredient to delete.",
				"warning"
			);

			return false;
		}

		await storeValue(
			"IngForm_context",
			this.CONTEXT_EDIT_INGREDIENTS
		);

		await storeValue(
			"IngForm_mode",
			"edit"
		);

		await storeValue(
			"IngForm_edit_id",
			row.id
		);

		await storeValue(
			"IngForm_edit_row",
			row
		);

		await qryIngGetImpactCount.run({
			ingredient_id: Number(row.id)
		});

		showModal(
			mdlIngDelete.name
		);

		return true;
	},


	// ============================================================
	// DUPLICATE NAME
	// Same standard as Recipe / Dish / Menu:
	// Source
	// Source - copy
	// Source - copy 2
	// Source - copy 3
	//
	// Existing suffixes are not parsed.
	// ============================================================

	duplicateName(sourceName) {
		const baseName =
					String(sourceName || "").trim();

		if (!baseName) {
			return "";
		}

		const escapedName =
					baseName.replace(
						/[.*+?^${}()|[\]\\]/g,
						"\\$&"
					);

		const copyRegex =
					new RegExp(
						`^${escapedName} - copy(?: (\\d+))?$`,
						"i"
					);

		const usedNumbers =
					(qryIngGetIngredients.data || [])
		.map(r =>
				 String(r.name || "")
				)
		.map(name => {
			const match =
						name.match(
							copyRegex
						);

			if (!match) {
				return 0;
			}

			return match[1]
				? Number(match[1])
			: 1;
		})
		.filter(n => n > 0);

		const nextNumber =
					usedNumbers.length === 0
		? 1
		: Math.max(
			...usedNumbers
		) + 1;

		return nextNumber === 1
			? `${baseName} - copy`
		: `${baseName} - copy ${nextNumber}`;
	},


	// ============================================================
	// SHARED DUPLICATE WORKSPACE
	// ============================================================

	async beginDuplicate(
		sourceRow,
		allergens = [],
		dietTags = []
	) {
		if (!sourceRow?.name) {
			showAlert(
				"Ingredient could not be duplicated.",
				"warning"
			);

			return false;
		}

		const duplicateRow = {
			...sourceRow,

			id: null,

			name:
			this.duplicateName(
				sourceRow.name
			)
		};

		await storeValue(
			"IngForm_duplicate_allergens",
			(allergens || []).map(String)
		);

		await storeValue(
			"IngForm_duplicate_diet_tags",
			(dietTags || []).map(String)
		);

		await storeValue(
			"IngForm_duplicate_row",
			duplicateRow
		);

		await storeValue(
			"IngForm_context",
			this.CONTEXT_ADD_INGREDIENTS
		);

		await storeValue(
			"IngForm_mode",
			"duplicate"
		);

		await storeValue(
			"IngForm_edit_id",
			null
		);

		await storeValue(
			"IngForm_edit_row",
			duplicateRow
		);

		await removeValue(
			"IngForm_saved_id"
		);

		await removeValue(
			"IngForm_pending_action"
		);

		await resetWidget(
			"mdlAddIng",
			true
		);

		return true;
	},


	// ============================================================
	// DUPLICATE FROM OPEN MODAL
	// Carries current unsaved working state into the duplicate.
	// Source itself is NOT saved.
	// Duplicate replaces source as open workspace.
	// ============================================================

	async openDuplicateFromIngredients() {
		const sourceId =
					Number(
						appsmith.store.IngForm_edit_id || 0
					);

		if (!sourceId) {
			showAlert(
				"This Ingredient has not been saved yet.",
				"warning"
			);

			return false;
		}

		const current =
					this.currentState();

		const sourceRow = {
			...(
				appsmith.store.IngForm_edit_row || {}
			),

			...current
		};

		return this.beginDuplicate(
			sourceRow,
			current.allergens || [],
			current.diet_tags || []
		);
	},

	// ============================================================
	// DUPLICATE FROM LIST
	// Uses saved Ingredient state.
	// ============================================================

	async duplicateFromList() {
		const row =
					tblIngList.selectedRow;

		if (!row?.id) {
			showAlert(
				"Select an ingredient to duplicate.",
				"warning"
			);

			return false;
		}

		/*
			qryIngGetClassifications uses IngForm_edit_id,
			so temporarily point it at the selected Ingredient.
		*/

		await storeValue(
			"IngForm_edit_id",
			row.id
		);

		const classificationRows =
					await qryIngGetClassifications.run();

		const allergenRows =
					(classificationRows || []).filter(
						x => x.classification_type === "allergen"
					);

		const dietTagRows =
					(classificationRows || []).filter(
						x => x.classification_type === "diet_tag"
					);

		const allergens =
					(allergenRows || [])
		.map(r =>
				 String(
			r.helper_list_item_id
		)
				);

		const dietTags =
					(dietTagRows || [])
		.map(r =>
				 String(
			r.helper_list_item_id
		)
				);

		const started =
					await this.beginDuplicate(
						row,
						allergens,
						dietTags
					);

		if (!started) {
			return false;
		}

		showModal(
			mdlAddIng.name
		);

		return true;
	},

	// ============================================================
	// ALLERGEN / DIET TAG DEFAULTS
	// ============================================================

	allergenDefaultValues() {
		if (
			appsmith.store.IngForm_mode === "duplicate"
		) {
			return (
				appsmith.store.IngForm_duplicate_allergens ||
				[]
			);
		}

		if (
			appsmith.store.IngForm_mode === "edit"
		) {
			return (
				qryIngGetClassifications.data || []
			)
				.filter(
				x => x.classification_type === "allergen"
			)
				.map(
				x => String(x.helper_list_item_id)
			);
		}

		return [];
	},

	dietTagDefaultValues() {
		if (
			appsmith.store.IngForm_mode === "duplicate"
		) {
			return (
				appsmith.store.IngForm_duplicate_diet_tags ||
				[]
			);
		}

		if (
			appsmith.store.IngForm_mode === "edit"
		) {
			return (
				qryIngGetClassifications.data || []
			)
				.filter(
				x => x.classification_type === "diet_tag"
			)
				.map(
				x => String(x.helper_list_item_id)
			);
		}

		return [];
	},

	// ============================================================
	// DISPLAY / CALCULATION
	// User-facing Yield terminology retired.
	// ============================================================

	purchaseUnitText() {
		return (
			selIngPurchaseUnit
			.selectedOptionLabel || ""
		);
	},
	usableQtyText() {
		const qty =
					Number(
						inpIngQuantity.text || 0
					);

		const wastage =
					Number(
						inpIngWastage.text || 0
					);

		if (!qty) {
			return "Usable qty: ";
		}

		const usableQty =
					qty *
					(1 - wastage / 100);

		const value =
					jsFmt.number(
						usableQty
					);

		const unit =
					this.purchaseUnitText();

		return unit
			? `Usable qty:    ${value} ${unit}`
		: `Usable qty:    ${value}`;
	},

	netCostText() {
		const qty =
					Number(
						inpIngQuantity.text || 0
					);

		const cost =
					Number(
						inpIngPurchaseCost.text || 0
					);

		const wastage =
					Number(
						inpIngWastage.text || 0
					);

		if (!qty || !cost) {
			return "Net cost: ";
		}

		const usableQty =
					qty *
					(1 - wastage / 100);

		if (
			!usableQty ||
			usableQty <= 0
		) {
			return "Net cost: ";
		}

		const price =
					cost / usableQty;

		const formattedPrice =
					jsFmt.currency(
						price
					);

		const unit =
					this.purchaseUnitText();

		return unit
			? `Net cost:    ${formattedPrice} / ${unit}`
		: `Net cost:    ${formattedPrice}`;
	},

	purchaseUnitOptions() {
		return (
			qryIngGetUnits.data || []
		).map(u => ({
			label:
			u.abbreviation,

			value:
			String(u.id)
		}));
	},

	// ============================================================
	// UNSAVED MODAL TEXT
	// ============================================================

	unsavedTitle() {
		switch (
			appsmith.store.IngForm_mode
		) {
			case "add":
				return "Unsaved Ingredient";

			case "duplicate":
				return "Unsaved Duplicate";

			default:
				return "Unsaved Changes";
		}
	},

	unsavedWarning() {
		switch (
			appsmith.store.IngForm_mode
		) {
			case "add":
				return "This new Ingredient has not been saved. Save it before closing?";

			case "duplicate":
				return "This duplicated Ingredient has not been saved. Save it before closing?";

			default:
				return "This Ingredient has unsaved changes. Save them before closing?";
		}
	}
};