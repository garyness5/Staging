export default {

	// ============================================================
	// GENERIC INLINE CHANGES
	// Qty / Cost / Waste / Code
	// ============================================================

	inlineChanges() {
		const row =
					tblIngList.updatedRow || {};

		const changes = {};


		const numericValue = value => {
			if (
				value === null ||
				value === undefined ||
				value === ""
			) {
				return null;
			}

			const cleaned =
						String(value)
			.replaceAll(",", "")
			.replace("$", "")
			.replace("%", "")
			.trim();

			if (cleaned === "") {
				return null;
			}

			const number =
						Number(cleaned);

			return Number.isFinite(number)
				? number
			: null;
		};


		if (
			row.purchase_qty !== undefined
		) {
			changes.purchase_qty =
				numericValue(
				row.purchase_qty
			);
		}


		if (
			row.total_cost !== undefined
		) {
			changes.total_cost =
				numericValue(
				row.total_cost
			);
		}


		if (
			row.wastage_percent !== undefined
		) {
			changes.wastage_percent =
				numericValue(
				row.wastage_percent
			) ?? 0;
		}


		if (
			row.item_code !== undefined
		) {
			changes.item_code =
				String(
				row.item_code || ""
			).trim() || null;
		}


		return changes;
	},


	async saveInline() {
		const row =
					tblIngList.updatedRow || {};

		if (!row.id) {
			showAlert(
				"Ingredient could not be identified.",
				"error"
			);

			return false;
		}

		const changes =
					this.inlineChanges();

		if (
			Object.keys(changes).length === 0
		) {
			return true;
		}

		try {
			await apiIngUpdateInline.run({
				ingredient_id:
				Number(row.id),

				changes
			});

			await apiGetMyIngredients.run();

			resetWidget(
				"tblIngList",
				true
			);

			showAlert(
				"Ingredient updated.",
				"success"
			);

			return true;

		} catch (e) {
			await apiGetMyIngredients.run();

			resetWidget(
				"tblIngList",
				true
			);

			showAlert(
				e?.message ||
				"Ingredient could not be updated.",
				"error"
			);

			return false;
		}
	},

	// ============================================================
	// INGREDIENT NAME
	// ============================================================

	async saveNameInline() {
		const row = tblIngList.updatedRow || {};

		const ingredientId = Number(row.id || 0);
		const newName = String(row.name || "").trim();

		if (!ingredientId) {
			showAlert(
				"Ingredient could not be identified.",
				"error"
			);
			return false;
		}

		if (!newName) {
			await apiGetMyIngredients.run();
			resetWidget("tblIngList", true);

			showAlert(
				"Ingredient Name is required.",
				"warning"
			);
			return false;
		}

		try {
			const response = await apiIngRename.run({
				ingredient_id: ingredientId,
				name: newName
			});

			if (!response?.authenticated) {
				throw new Error("Ingredient rename was not confirmed.");
			}

			await apiGetMyIngredients.run();
			resetWidget("tblIngList", true);

			showAlert(
				"Ingredient updated.",
				"success"
			);

			return true;

		} catch (e) {
			await apiGetMyIngredients.run();

			// Reject the optimistic table edit and restore
			// the last saved database state.
			resetWidget("tblIngList", true);

			jsUserErrors.show(
				e,
				"Ingredient Name could not be updated."
			);

			return false;
		}
	},


	// ============================================================
	// PURCHASE UNIT
	// ============================================================

	unitOptions(unitType) {
		const type = String(unitType || "").trim().toLowerCase();

		return (apiIngGetUnits.data?.units || [])
			.filter(u =>
							String(u.unit_type || "").trim().toLowerCase() === type
						 )
			.map(u => ({
			label: u.abbreviation,
			value: String(u.id)
		}));
	},


	async saveUnitInline(
		ingredientId,
		newUnitId
	) {
		if (
			!ingredientId ||
			!newUnitId
		) {
			showAlert(
				"Ingredient Unit could not be identified.",
				"error"
			);

			return false;
		}

		try {
			await apiIngUpdateInline.run({
				ingredient_id:
				Number(ingredientId),

				changes: {
					purchase_unit_id:
					Number(newUnitId)
				}
			});

			await apiGetMyIngredients.run();

			resetWidget(
				"tblIngList",
				true
			);

			showAlert(
				"Ingredient updated.",
				"success"
			);

			return true;

		} catch (e) {
			await apiGetMyIngredients.run();

			resetWidget(
				"tblIngList",
				true
			);

			showAlert(
				e?.message ||
				"Ingredient Unit could not be updated.",
				"error"
			);

			return false;
		}
	},


	async openSetUnit(row) {
		if (!row?.id) {
			showAlert(
				"Ingredient could not be identified.",
				"error"
			);

			return false;
		}

		return jsIngForm
			.openEditFromIngredients(row);
	},


	// ============================================================
	// CATEGORY
	// ============================================================

	async saveCategoryInline(ingredientId, newCategoryId) {
		try {
			await apiIngUpdateInline.run({
				ingredient_id: Number(ingredientId),
				changes: {
					category_id:
					newCategoryId
					? Number(newCategoryId)
					: null
				}
			});

			await apiGetMyIngredients.run();
			resetWidget("tblIngList", true);

		} catch (e) {
			showAlert(e?.message || String(e), "error");
		}
	},


	// ============================================================
	// SUPPLIER
	// ============================================================

	async saveSupplierInline(
		ingredientId,
		newSupplierId
	) {
		if (!ingredientId) {
			showAlert(
				"Ingredient Supplier could not be identified.",
				"error"
			);

			return false;
		}

		try {
			await apiIngUpdateInline.run({
				ingredient_id:
				Number(ingredientId),

				changes: {
					supplier_id:
					newSupplierId
					? Number(newSupplierId)
					: null
				}
			});

			await apiGetMyIngredients.run();

			resetWidget(
				"tblIngList",
				true
			);

			showAlert(
				"Ingredient updated.",
				"success"
			);

			return true;

		} catch (e) {
			await apiGetMyIngredients.run();

			resetWidget(
				"tblIngList",
				true
			);

			showAlert(
				e?.message ||
				"Ingredient Supplier could not be updated.",
				"error"
			);

			return false;
		}
	},


	// ============================================================
	// PACKAGING
	// ============================================================

	async savePackagingInline(
		ingredientId,
		newPackagingId
	) {
		if (!ingredientId) {
			showAlert(
				"Ingredient Packaging could not be identified.",
				"error"
			);

			return false;
		}

		try {
			await apiIngUpdateInline.run({
				ingredient_id:
				Number(ingredientId),

				changes: {
					packaging_id:
					newPackagingId
					? Number(newPackagingId)
					: null
				}
			});

			await apiGetMyIngredients.run();

			resetWidget(
				"tblIngList",
				true
			);

			showAlert(
				"Ingredient updated.",
				"success"
			);

			return true;

		} catch (e) {
			await apiGetMyIngredients.run();

			resetWidget(
				"tblIngList",
				true
			);

			showAlert(
				e?.message ||
				"Ingredient Packaging could not be updated.",
				"error"
			);

			return false;
		}
	},


	// ============================================================
	// ACTIVE
	// ============================================================

	async saveActiveInline() {
		const row =
					tblIngList.updatedRow || {};

		const ingredientId =
					Number(
						row.id || 0
					);

		if (!ingredientId) {
			showAlert(
				"Ingredient could not be identified.",
				"error"
			);

			return false;
		}

		try {
			await apiIngUpdateInline.run({
				ingredient_id:
				ingredientId,

				changes: {
					active:
					row.active === false
					? false
					: true
				}
			});

			await apiGetMyIngredients.run();

			resetWidget(
				"tblIngList",
				true
			);

			return true;

		} catch (e) {
			await apiGetMyIngredients.run();

			resetWidget(
				"tblIngList",
				true
			);

			showAlert(
				e?.message ||
				"Ingredient Status could not be updated.",
				"error"
			);

			return false;
		}
	},


	// ============================================================
	// LIST FILTERING
	// ============================================================

	filteredRows() {
		const rows = apiGetMyIngredients.data?.ingredients ?? [];

		const status = selIngListFilter.selectedOptionValue || "all";

		const search = String(inpIngListSearch.text || "")
		.trim()
		.toLowerCase();

		return rows.filter(row => {
			const statusOk =
						status === "all" ||
						row.active === (status === "active");

			if (!statusOk) return false;
			if (!search) return true;

			return [
				row.name,
				row.category_name,
				row.supplier_name,
				row.packaging_name,
				row.item_code
			]
				.filter(Boolean)
				.some(value =>
							String(value).toLowerCase().includes(search)
						 );
		});
	},
};