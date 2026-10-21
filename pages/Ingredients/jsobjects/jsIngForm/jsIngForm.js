export default {
	CONTEXT_ADD_INGREDIENTS: "addFromIngredients",
	CONTEXT_EDIT_INGREDIENTS: "editFromIngredients",

	// ============================================================
	// OPEN ADD
	// ============================================================

	async openAddFromIngredients() {
		await storeValue("IngForm_context", this.CONTEXT_ADD_INGREDIENTS);
		await storeValue("IngForm_mode", "add");
		await storeValue("IngForm_edit_id", null);
		await storeValue("IngForm_edit_row", null);

		await removeValue("IngForm_duplicate_allergens");
		await removeValue("IngForm_duplicate_diet_tags");
		await removeValue("IngForm_duplicate_row");
		await removeValue("IngForm_saved_id");
		await removeValue("IngForm_pending_action");

		await resetWidget("mdlAddIng", true);
		showModal(mdlAddIng.name);
		await this.captureBaseline();

		return true;
	},

	// ============================================================
	// OPEN EDIT
	// ============================================================

	async openEditFromIngredients(row = null) {
		const id = Number(
			row?.id || tblIngList.selectedRow?.id || 0
		);

		if (!id) {
			showAlert("Select an ingredient to edit.", "warning");
			return false;
		}

		const editRow = (
			apiGetMyIngredients.data?.ingredients || []
		).find(r => Number(r.id) === id);

		if (!editRow?.id) {
			showAlert("Ingredient could not be identified.", "error");
			return false;
		}

		try {
			const response = await apiIngGetClassifications.run({
				ingredient_id: id
			});

			if (!response?.authenticated ||
					!Array.isArray(response.classifications)) {
				throw new Error("Ingredient classifications could not be loaded.");
			}

			await storeValue("IngForm_context", this.CONTEXT_EDIT_INGREDIENTS);
			await storeValue("IngForm_mode", "edit");
			await storeValue("IngForm_edit_id", id);
			await storeValue("IngForm_edit_row", editRow);

			await removeValue("IngForm_duplicate_allergens");
			await removeValue("IngForm_duplicate_diet_tags");
			await removeValue("IngForm_duplicate_row");
			await removeValue("IngForm_saved_id");
			await removeValue("IngForm_pending_action");

			await resetWidget("mdlAddIng", true);
			showModal(mdlAddIng.name);
			await this.captureBaseline();

			return true;
		} catch (error) {
			jsUserErrors.show(error, "Ingredient could not be opened.");
			return false;
		}
	},

	// ============================================================
	// MODE AND ROW
	// ============================================================

	isEdit() {
		return (
			appsmith.store.IngForm_mode === "edit" ||
			appsmith.store.IngForm_mode === "duplicate"
		);
	},

	editRow() {
		if (appsmith.store.IngForm_mode === "duplicate") {
			return appsmith.store.IngForm_duplicate_row || {};
		}

		return appsmith.store.IngForm_edit_row || {};
	},

	// ============================================================
	// WORKING STATE
	// ============================================================

	currentState() {
		const valueOrNull = value =>
		value === undefined || value === null || value === ""
		? null
		: String(value);

		return {
			name: inpIngIngredient.text?.trim() || "",

			category_id: valueOrNull(
				selIngCategory.selectedOptionValue
			),

			purchase_qty: inpIngQuantity.text || "",

			purchase_unit_id: valueOrNull(
				selIngPurchaseUnit.selectedOptionValue
			),

			total_cost: inpIngPurchaseCost.text || "",

			wastage_percent: inpIngWastage.text || "",

			supplier_id: valueOrNull(
				selIngSupplier.selectedOptionValue
			),

			packaging_id: valueOrNull(
				selIngPackaging.selectedOptionValue
			),

			item_code: inpIngSupplierCode.text?.trim() || "",
			notes: rteIngNotes.text || "",
			active: chkIngActive.isChecked !== false,

			allergens: (
				msIngAllergens.selectedOptionValues || []
			).map(String).sort(),

			diet_tags: (
				msIngDietTags.selectedOptionValues || []
			).map(String).sort()
		};
	},

	async captureBaseline() {
		await storeValue(
			"IngForm_baseline",
			JSON.stringify(this.currentState())
		);

		return true;
	},

	isDirty() {
		if (appsmith.store.IngForm_mode === "duplicate") {
			return true;
		}

		const baseline = appsmith.store.IngForm_baseline;

		if (!baseline) {
			return false;
		}

		return JSON.stringify(this.currentState()) !== baseline;
	},

	canSave() {
		return Boolean(
			inpIngIngredient.text?.trim() && this.isDirty()
		);
	},

	// ============================================================
	// SAVE
	// Name is the only required field.
	// ============================================================

	async save(closeAfterSave = true, stateOverride = null) {
		const state = stateOverride || this.currentState();

		if (!state.name) {
			showAlert("Ingredient Name is required.", "warning");
			return false;
		}

		const numericOrNull = value => {
			if (value === "" || value === null || value === undefined) {
				return null;
			}

			const cleaned = String(value)
			.trim()
			.replace(/,/g, "")
			.replace(/\s/g, "");

			return cleaned === "" ? null : Number(cleaned);
		};

		const purchaseQty = numericOrNull(state.purchase_qty);
		const totalCost = numericOrNull(state.total_cost);
		const waste = numericOrNull(state.wastage_percent);

		if (
			(purchaseQty !== null &&
			 (!Number.isFinite(purchaseQty) || purchaseQty < 0)) ||
			(totalCost !== null &&
			 (!Number.isFinite(totalCost) || totalCost < 0)) ||
			(waste !== null &&
			 (!Number.isFinite(waste) || waste < 0 || waste >= 100))
		) {
			showAlert(
				"Check Purchase Qty, Purchase Cost and Waste %. Values must be nonnegative, and Waste must be below 100%.",
				"warning"
			);
			return false;
		}

		const payload = {
			name: state.name,
			category_id: state.category_id,
			purchase_qty: purchaseQty,
			purchase_unit_id: state.purchase_unit_id,
			total_cost: totalCost,
			wastage_percent: waste,
			supplier_id: state.supplier_id,
			packaging_id: state.packaging_id,
			item_code: state.item_code,
			notes: state.notes,
			active: state.active,
			allergen_ids: state.allergens.map(Number),
			diet_tag_ids: state.diet_tags.map(Number)
		};

		const ingredientId =
					appsmith.store.IngForm_mode === "edit"
		? Number(appsmith.store.IngForm_edit_id) || null
		: null;

		try {
			const result = await apiIngSave.run({
				ingredient_id: ingredientId,
				payload
			});

			const savedId = Number(result?.ingredient_id || 0);

			if (
				result?.authenticated !== true ||
				!savedId ||
				(ingredientId !== null && savedId !== ingredientId)
			) {
				throw new Error(
					"Ingredient Save returned an invalid or unexpected response."
				);
			}

			await storeValue("IngForm_saved_id", savedId);
			await apiGetMyIngredients.run();

			if (!closeAfterSave) {
				const refreshed = (
					apiGetMyIngredients.data?.ingredients || []
				).find(r => Number(r.id) === savedId);

				await storeValue("IngForm_mode", "edit");
				await storeValue("IngForm_edit_id", savedId);
				await storeValue(
					"IngForm_edit_row",
					refreshed || { ...payload, id: savedId }
				);
			}

			showAlert("Ingredient saved.", "success");

			if (closeAfterSave) {
				closeModal(mdlIngUnsaved.name);
				closeModal(mdlAddIng.name);
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
		const saved = await this.save(false);

		if (!saved) {
			return false;
		}

		await this.openAddFromIngredients();
		return true;
	},

	// ============================================================
	// CLOSE AND UNSAVED GUARD
	// ============================================================

	async cancel() {
		if (this.isDirty()) {
			const snapshot = this.currentState();

			await storeValue("IngForm_pending_state", snapshot);
			await storeValue("IngForm_pending_action", "close");

			showModal(mdlIngUnsaved.name);
			return false;
		}

		closeModal(mdlAddIng.name);
		return true;
	},

	async requestAdd() {
		if (this.isDirty()) {
			const snapshot = this.currentState();

			await storeValue("IngForm_pending_state", snapshot);
			await storeValue("IngForm_pending_action", "add");

			showModal(mdlIngUnsaved.name);
			return false;
		}

		await this.openAddFromIngredients();
		return true;
	},

	async saveFromUnsaved() {
		const action =
					appsmith.store.IngForm_pending_action || "close";

		const snapshot = appsmith.store.IngForm_pending_state;

		if (!snapshot) {
			showAlert(
				"Unsaved Ingredient values could not be recovered.",
				"error"
			);
			return false;
		}

		const saved = await this.save(false, snapshot);

		if (!saved) {
			return false;
		}

		closeModal(mdlIngUnsaved.name);

		if (action === "add") {
			await this.openAddFromIngredients();
		} else {
			closeModal(mdlAddIng.name);
		}

		await removeValue("IngForm_pending_state");
		await removeValue("IngForm_pending_action");

		return true;
	},

	async discardChanges() {
		const action =
					appsmith.store.IngForm_pending_action || "close";

		closeModal(mdlIngUnsaved.name);

		if (action === "add") {
			await this.openAddFromIngredients();
		} else {
			closeModal(mdlAddIng.name);
		}

		await removeValue("IngForm_pending_state");
		await removeValue("IngForm_pending_action");
		return true;
	},

	async cancelDiscard() {
		closeModal(mdlIngUnsaved.name);

		await removeValue("IngForm_pending_state");
		await removeValue("IngForm_pending_action");

		return true;
	},

	// ============================================================
	// DELETE
	// ============================================================

	async openDeleteConfirm() {
		const id = Number(
			appsmith.store.IngForm_edit_id || 0
		);

		if (!id) {
			showAlert(
				"This Ingredient has not been saved yet.",
				"warning"
			);
			return false;
		}

		try {
			const response = await apiIngGetImpactCount.run({
				ingredient_id: id
			});

			if (!response?.authenticated || !response.impact) {
				throw new Error("Ingredient impact could not be loaded.");
			}

			showModal(mdlIngDelete.name);
			return true;

		} catch (error) {
			jsUserErrors.show(
				error,
				"Ingredient impact could not be checked."
			);
			return false;
		}
	},

	async confirmDelete() {
		const id = Number(
			appsmith.store.IngForm_edit_id || 0
		);

		if (!id) {
			showAlert("No Ingredient selected.", "warning");
			return false;
		}

		try {
			const result = await apiIngDelete.run({
				ingredient_id: id
			});

			const deletedId = Number(result?.ingredient_id || 0);

			if (
				result?.authenticated !== true ||
				deletedId !== id
			) {
				throw new Error(
					"Ingredient Delete returned an invalid or unexpected response."
				);
			}

			await apiGetMyIngredients.run();

			closeModal(mdlIngDelete.name);
			closeModal(mdlAddIng.name);

			showAlert("Ingredient deleted.", "success");
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
		closeModal(mdlIngDelete.name);
		return true;
	},

	async deleteFromList() {
		const row = tblIngList.selectedRow;

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
		await storeValue("IngForm_mode", "edit");
		await storeValue("IngForm_edit_id", row.id);
		await storeValue("IngForm_edit_row", row);

		return this.openDeleteConfirm();
	},

	// ============================================================
	// DUPLICATE NAME
	// ============================================================

	duplicateName(sourceName) {
		const baseName = String(sourceName || "").trim();

		if (!baseName) {
			return "";
		}

		const escapedName = baseName.replace(
			/[.*+?^${}()|[\]\\]/g,
			"\\$&"
		);

		const copyRegex = new RegExp(
			`^${escapedName} - copy(?: (\\d+))?$`,
			"i"
		);

		const usedNumbers = (
			apiGetMyIngredients.data?.ingredients || []
		)
		.map(r => String(r.name || ""))
		.map(name => {
			const match = name.match(copyRegex);

			if (!match) {
				return 0;
			}

			return match[1] ? Number(match[1]) : 1;
		})
		.filter(n => n > 0);

		const nextNumber = usedNumbers.length === 0
		? 1
		: Math.max(...usedNumbers) + 1;

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
			name: this.duplicateName(sourceRow.name)
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

		await storeValue("IngForm_mode", "duplicate");
		await storeValue("IngForm_edit_id", null);
		await storeValue("IngForm_edit_row", duplicateRow);

		await removeValue("IngForm_saved_id");
		await removeValue("IngForm_pending_action");

		await resetWidget("mdlAddIng", true);
		return true;
	},

	// ============================================================
	// DUPLICATE FROM OPEN MODAL
	// Includes unsaved changes; does not save source.
	// ============================================================

	async openDuplicateFromIngredients() {
		const sourceId = Number(
			appsmith.store.IngForm_edit_id || 0
		);

		if (!sourceId) {
			showAlert(
				"This Ingredient has not been saved yet.",
				"warning"
			);
			return false;
		}

		const current = this.currentState();

		const sourceRow = {
			...(appsmith.store.IngForm_edit_row || {}),
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
	// ============================================================

	async duplicateFromList() {
		const row = tblIngList.selectedRow;

		if (!row?.id) {
			showAlert(
				"Select an ingredient to duplicate.",
				"warning"
			);
			return false;
		}

		try {
			const response = await apiIngGetClassifications.run({
				ingredient_id: Number(row.id)
			});

			if (!response?.authenticated ||
					!Array.isArray(response.classifications)) {
				throw new Error("Ingredient classifications could not be loaded.");
			}

			const classifications = response.classifications;

			const allergens = classifications
			.filter(x => x.classification_type === "allergen")
			.map(x => String(x.helper_list_item_id));

			const dietTags = classifications
			.filter(x => x.classification_type === "diet_tag")
			.map(x => String(x.helper_list_item_id));

			const source = (
				apiGetMyIngredients.data?.ingredients || []
			).find(r => Number(r.id) === Number(row.id));

			if (!source) {
				throw new Error("Original Ingredient data could not be loaded.");
			}

			const duplicateSource = {
				...source,
				wastage_percent: source.wastage_percent
			};

			const started = await this.beginDuplicate(
				duplicateSource,
				allergens,
				dietTags
			);

			if (!started) {
				return false;
			}

			showModal(mdlAddIng.name);
			return true;

		} catch (error) {
			jsUserErrors.show(
				error,
				"Ingredient could not be duplicated."
			);
			return false;
		}
	},

	// ============================================================
	// ALLERGEN / DIET TAG DEFAULTS
	// ============================================================

	allergenDefaultValues() {
		if (appsmith.store.IngForm_mode === "duplicate") {
			return appsmith.store.IngForm_duplicate_allergens || [];
		}

		if (appsmith.store.IngForm_mode === "edit") {
			return (
				apiIngGetClassifications.data?.classifications || []
			)
				.filter(x => x.classification_type === "allergen")
				.map(x => String(x.helper_list_item_id));
		}

		return [];
	},

	dietTagDefaultValues() {
		if (appsmith.store.IngForm_mode === "duplicate") {
			return appsmith.store.IngForm_duplicate_diet_tags || [];
		}

		if (appsmith.store.IngForm_mode === "edit") {
			return (
				apiIngGetClassifications.data?.classifications || []
			)
				.filter(x => x.classification_type === "diet_tag")
				.map(x => String(x.helper_list_item_id));
		}

		return [];
	},

	// ============================================================
	// DISPLAY / CALCULATION
	// ============================================================

	purchaseUnitText() {
		return selIngPurchaseUnit.selectedOptionLabel || "";
	},

	usableQtyText() {
		const qty = Number(inpIngQuantity.text || 0);
		const wastage = Number(inpIngWastage.text || 0);

		if (!qty) {
			return "Usable qty: ";
		}

		const usableQty = qty * (1 - wastage / 100);
		const value = jsFmt.number(usableQty);
		const unit = this.purchaseUnitText();

		return unit
			? `Usable qty:    ${value} ${unit}`
		: `Usable qty:    ${value}`;
	},

	netCostText() {
		const qty = Number(inpIngQuantity.text || 0);
		const cost = Number(inpIngPurchaseCost.text || 0);
		const wastage = Number(inpIngWastage.text || 0);

		if (!qty || !cost) {
			return "Net cost: ";
		}

		const usableQty = qty * (1 - wastage / 100);

		if (!usableQty || usableQty <= 0) {
			return "Net cost: ";
		}

		const price = cost / usableQty;
		const formattedPrice = jsFmt.currency(price);
		const unit = this.purchaseUnitText();

		return unit
			? `Net cost:    ${formattedPrice} / ${unit}`
		: `Net cost:    ${formattedPrice}`;
	},

	purchaseUnitOptions() {
		return (
			apiIngGetUnits.data?.units || []
		).map(u => ({
			label: u.abbreviation,
			value: String(u.id)
		}));
	},

	// ============================================================
	// UNSAVED MODAL TEXT
	// ============================================================

	unsavedTitle() {
		switch (appsmith.store.IngForm_mode) {
			case "add":
				return "Unsaved Ingredient";

			case "duplicate":
				return "Unsaved Duplicate";

			default:
				return "Unsaved Changes";
		}
	},

	unsavedWarning() {
		switch (appsmith.store.IngForm_mode) {
			case "add":
				return "This new Ingredient has not been saved. Save it before closing?";

			case "duplicate":
				return "This duplicated Ingredient has not been saved. Save it before closing?";

			default:
				return "This Ingredient has unsaved changes. Save them before closing?";
		}
	}
};
