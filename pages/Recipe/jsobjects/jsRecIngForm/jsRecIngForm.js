export default {
	async openAdd() {
		await resetWidget(
			mdlRecIngAddIng.name,
			true
		);

		await qryRecGetIngCategories.run();

		showModal(
			mdlRecIngAddIng.name
		);

		return true;
	},

	validate() {
		const name =
					String(
						inpRecIngIngredient.text || ""
					).trim();

		if (!name) {
			showAlert(
				"Ingredient Name is required.",
				"warning"
			);

			return false;
		}

		return true;
	},

	async save(closeAfter = true) {
		if (!this.validate()) {
			return false;
		}

		try {
			const result =
						await qryRecSaveIngredient.run();

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

			await qryRecGetComponentItems.run();

			if (closeAfter) {
				closeModal(
					mdlRecIngAddIng.name
				);
			} else {
				await resetWidget(
					mdlRecIngAddIng.name,
					true
				);
			}

			showAlert(
				"Ingredient saved.",
				"success"
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

	cancel() {
		closeModal(
			mdlRecIngAddIng.name
		);

		return true;
	},

	netYieldText() {
		const qty =
					Number(
						inpRecIngQuantity.text || 0
					);

		if (!qty) {
			return "Net Yield: ";
		}

		const wastage =
					Number(
						inpRecIngWastage.text || 0
					);

		const netYield =
					qty * (1 - wastage / 100);

		return `Net Yield: ${netYield.toFixed(2)}`;
	},

	costPerUnitText() {
		const qty =
					Number(
						inpRecIngQuantity.text || 0
					);

		const cost =
					Number(
						inpRecIngPurchaseCost.text || 0
					);

		if (!qty || !cost) {
			return "Cost / unit ";
		}

		const wastage =
					Number(
						inpRecIngWastage.text || 0
					);

		const netYield =
					qty * (1 - wastage / 100);

		if (!netYield || netYield <= 0) {
			return "Cost / unit ";
		}

		const value =
					cost / netYield;

		const price =
					value % 1 === 0
		? value.toFixed(0)
		: value.toFixed(2);

		const unit =
					selRecIngPurchaseUnit.selectedOptionLabel || "";

		return unit
			? `Cost / unit $${price} / ${unit}`
		: `Cost / unit $${price}`;
	},
};