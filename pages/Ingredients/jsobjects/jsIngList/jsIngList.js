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
			await qryIngUpdateInline.run({
				ingredient_id:
				Number(row.id),

				changes
			});

			await qryIngGetIngredients.run();

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
			await qryIngGetIngredients.run();

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
			await qryIngGetIngredients.run();
			resetWidget("tblIngList", true);

			showAlert(
				"Ingredient Name is required.",
				"warning"
			);

			return false;
		}

		try {
			await qryIngRename.run({
				ingredient_id: ingredientId,
				new_name: newName
			});

			await qryIngGetIngredients.run();
			resetWidget("tblIngList", true);

			showAlert(
				"Ingredient updated.",
				"success"
			);

			return true;

		} catch (e) {
			await qryIngGetIngredients.run();

			// Reject the optimistic table edit and reconstruct
			// from durable Published State.
			resetWidget("tblIngList", true);

			showAlert(
				e?.message ||
				"Ingredient Name could not be updated.",
				"error"
			);

			return false;
		}
	},


	// ============================================================
	// PURCHASE UNIT
	// ============================================================

	unitOptions(unitType) {
		return (
			qryIngGetUnits.data || []
		)
			.filter(u =>
							u.unit_type === unitType
						 )
			.map(u => ({
			label:
			u.abbreviation,

			value:
			String(u.id)
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
			await qryIngUpdateInline.run({
				ingredient_id:
				Number(ingredientId),

				changes: {
					purchase_unit_id:
					Number(newUnitId)
				}
			});

			await qryIngGetIngredients.run();

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
			await qryIngGetIngredients.run();

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
			await qryIngUpdateInline.run({
				ingredient_id: Number(ingredientId),
				changes: {
					category_id:
					newCategoryId
					? Number(newCategoryId)
					: null
				}
			});

			await qryIngGetIngredients.run();
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
			await qryIngUpdateInline.run({
				ingredient_id:
				Number(ingredientId),

				changes: {
					supplier_id:
					newSupplierId
					? Number(newSupplierId)
					: null
				}
			});

			await qryIngGetIngredients.run();

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
			await qryIngGetIngredients.run();

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
			await qryIngUpdateInline.run({
				ingredient_id:
				Number(ingredientId),

				changes: {
					packaging_id:
					newPackagingId
					? Number(newPackagingId)
					: null
				}
			});

			await qryIngGetIngredients.run();

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
			await qryIngGetIngredients.run();

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
			await qryIngUpdateInline.run({
				ingredient_id:
				ingredientId,

				changes: {
					active:
					row.active === false
					? false
					: true
				}
			});

			await qryIngGetIngredients.run();

			resetWidget(
				"tblIngList",
				true
			);

			return true;

		} catch (e) {
			await qryIngGetIngredients.run();

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
		const rows =
					qryIngGetIngredients.data || [];

		const status =
					String(
						selIngListFilter
						.selectedOptionValue ||
						"all"
					)
		.trim()
		.toLowerCase();

		const search =
					String(
						inpIngListSearch.text || ""
					)
		.trim()
		.toLowerCase();

		return rows.filter(row => {
			const statusOk =
						status === "all" ||
						(
							status === "active" &&
							row.active === true
						) ||
						(
							status === "inactive" &&
							row.active === false
						);

			if (!statusOk) {
				return false;
			}

			if (!search) {
				return true;
			}

			return [
				row.name,
				row.category_name,
				row.supplier_name,
				row.packaging_name,
				row.item_code
			]
				.filter(Boolean)
				.some(value =>
							String(value)
							.toLowerCase()
							.includes(search)
						 );
		});
	}
};