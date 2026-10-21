export default {
	numericValue(value) {
		if (
			value === null ||
			value === undefined ||
			value === ""
		) return null;

		const n = Number(
			String(value)
			.replaceAll(",", "")
			.replace("$", "")
			.replace("%", "")
			.trim()
		);

		return Number.isFinite(n) ? n : null;
	},

	async stageField(id, field, value) {
		if (!id) {
			showAlert(
				"Ingredient could not be identified.",
				"error"
			);
			return false;
		}

		return jsIngBatch.stage(
			Number(id),
			{ [field]: value }
		);
	},

	async stageName() {
		const row = tblIngList.updatedRow || {};
		const name = String(row.name ?? "").trim();

		if (!name) {
			showAlert(
				"Ingredient Name is required.",
				"warning"
			);
			return false;
		}

		return this.stageField(row.id, "name", name);
	},

	async stageQty() {
		const row = tblIngList.updatedRow || {};

		return this.stageField(
			row.id,
			"purchase_qty",
			this.numericValue(row.purchase_qty)
		);
	},

	async stageCost() {
		const row = tblIngList.updatedRow || {};

		return this.stageField(
			row.id,
			"total_cost",
			this.numericValue(row.total_cost)
		);
	},

	async stageCode() {
		const row = tblIngList.updatedRow || {};

		return this.stageField(
			row.id,
			"item_code",
			String(row.item_code ?? "").trim() || null
		);
	},

	async stageActive() {
		const row = tblIngList.updatedRow || {};

		return this.stageField(
			row.id,
			"active",
			row.active === true
		);
	},

	async stageCategory(id, value) {
		return this.stageField(
			id,
			"category_id",
			value == null || value === ""
			? null
			: Number(value)
		);
	},

	async stageSupplier(id, value) {
		return this.stageField(
			id,
			"supplier_id",
			value == null || value === ""
			? null
			: Number(value)
		);
	},

	async stagePackaging(id, value) {
		return this.stageField(
			id,
			"packaging_id",
			value == null || value === ""
			? null
			: Number(value)
		);
	},

	async stageUnit(id, value, row) {
		if (String(value) === "__SET__") {
			return this.openSetUnit(row);
		}

		return this.stageField(
			id,
			"purchase_unit_id",
			value == null || value === ""
			? null
			: Number(value)
		);
	},

	unitOptions(unitType) {
		const type = String(unitType || "")
		.trim()
		.toLowerCase();

		return (apiIngGetUnits.data?.units || [])
			.filter(u =>
							String(u.unit_type || "")
							.trim()
							.toLowerCase() === type
						 )
			.map(u => ({
			label: u.abbreviation,
			value: String(u.id)
		}));
	},

	async openSetUnit(row) {
		if (!row?.id) {
			showAlert(
				"Ingredient could not be identified.",
				"error"
			);
			return false;
		}

		return jsIngForm.openEditFromIngredients(row);
	},

	filteredRows() {
		const rows =
					apiGetMyIngredients.data?.ingredients ?? [];

		const pending = jsIngBatch.pending();

		const workingRows = rows.map(row => ({
			...row,
			...(pending[String(row.id)] || {})
		}));

		const status =
					selIngListFilter.selectedOptionValue || "all";

		const search = String(
			inpIngListSearch.text || ""
		)
		.trim()
		.toLowerCase();

		return workingRows.filter(row => {
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
							String(value)
							.toLowerCase()
							.includes(search)
						 );
		});
	}
};
