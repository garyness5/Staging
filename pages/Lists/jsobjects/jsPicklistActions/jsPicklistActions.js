export default {

	norm(value) {
		return (value || "")
			.trim()
			.normalize("NFD")
			.replace(/[\u0300-\u036f]/g, "")
			.toLowerCase();
	},

	async openAdd() {
		resetWidget("inpPLAddName");
		showModal(mdlPLAdd.name);

		return true;
	},


	async saveAdd() {
		const newName = (inpPLAddName.text || "").trim();

		if (!newName) {
			return false;
		}

		const fromImport =
					appsmith.store.plAddContext === "ingredientImport";

		let listId;

		if (fromImport) {
			const supplierList = (qryGetHelperLists.data || []).find(
				x => x.list_code === "supplier"
			);
			if (!supplierList) {
				showAlert("Supplier list could not be found.", "error");
				return false;
			}

			listId = supplierList.id;
		} else {
			listId = selListsType.selectedOptionValue;
		}

		const picklistItems = await qryGetPicklistItems.run({
			list_id: listId
		});

		const exists = (picklistItems || []).some(
			item =>
			item.name &&
			this.norm(item.name) === this.norm(newName)
		);

		if (exists) {
			showAlert("Name already exists in this list", "warning");
			return false;
		}

		const addedItem = await qryAddListItem.run({
			list_id: listId
		});

		await qryGetPicklistItems.run({
			list_id: listId
		});

		if (fromImport) {
			await qryImpSuppliers.run();

			const newSupplier = addedItem?.[0];

			if (newSupplier?.id) {
				await storeValue("impSelectedSupplierId", String(newSupplier.id));
			}
		}

		resetWidget("inpPLAddName");

		closeModal("mdlPLAdd");

		return true;
	},

	async openRename() {
		if (!jsPicklistRules.hasSelection()) {
			showAlert(
				"Select an item first.",
				"warning"
			);

			return false;
		}

		if (jsPicklistRules.isProtectedSystemItem()) {
			return false;
		}

		resetWidget("inpPLRenameName");

		showModal(mdlPLRename.name);

		return true;
	},

	async saveRename() {
		const newName =
					(inpPLRenameName.text || "").trim();

		const oldId =
					Number(tblListsItems.selectedRow?.id || 0);

		if (!newName || !oldId) {
			return false;
		}

		const exists =
					(qryGetPicklistItems.data || [])
		.some(
			item =>
			Number(item.id) !== oldId &&
			item.name &&
			this.norm(item.name) ===
			this.norm(newName)
		);

		if (exists) {
			showAlert(
				"Name already exists in this list",
				"warning"
			);

			return false;
		}

		await qryRenameListItem.run();

		await qryGetPicklistItems.run();

		closeModal(mdlPLRename.name);

		showAlert(
			"Item renamed",
			"success"
		);

		return true;
	},

	async openReplaceDelete() {
		if (!jsPicklistRules.hasSelection()) {
			showAlert("Select an item first.", "warning");
			return false;
		}

		if (jsPicklistRules.isProtectedSystemItem()) {
			return false;
		}

		await qryGetListItemImpact.run();

		resetWidget("radPLReplaceDeleteAction");
		resetWidget("selPLReplaceWith");

		showModal(mdlPLReplace.name);

		return true;
	},

	onReplaceDeleteActionChange() {
		return true;
	},

	async saveReplaceDelete() {
		const action =
					jsPicklistRules.isDietTag()
		? "delete"
		: radPLReplaceDeleteAction.selectedOptionValue;

		const replaceToId =
					jsPicklistRules.isDietTag()
		? null
		: selPLReplaceWith.selectedOptionValue;

		if (!action) {
			return false;
		}

		if (
			action === "replace" &&
			!replaceToId
		) {
			showAlert(
				"Select a replacement item first.",
				"warning"
			);

			return false;
		}

		await qryGetListItemImpact.run();

		await storeValue(
			"plReplaceAction",
			action === "replace"
			? "Replace"
			: "Delete"
		);

		await storeValue(
			"plReplaceToId",
			replaceToId || null
		);

		return await this.confirmReplaceDelete();
	},

	async confirmReplaceDelete() {
		await qryReplaceDeleteListItem.run();

		await qryGetPicklistItems.run();

		closeModal(mdlPLReplace.name);

		showAlert(
			appsmith.store.plReplaceAction === "Replace"
			? "Item replaced everywhere used."
			: appsmith.store.plReplaceToId
			? "Item replaced everywhere used and deleted."
			: "Item deleted.",
			"success"
		);

		return true;
	},
}