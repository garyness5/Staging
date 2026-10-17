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

		const helperLists =
					apiGetHelperLists.data?.helper_lists || [];

		let listId;

		if (fromImport) {
			const supplierList = helperLists.find(
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

		if (!listId) {
			showAlert("Select a list first.", "warning");
			return false;
		}

		try {
			const addedItem = await apiAddHelperItem.run({
				list_id: listId,
				name: newName
			});

			await apiGetHelperItems.run({
				list_id: listId
			});

			if (fromImport) {
				if (addedItem?.helper_item_id) {
					await storeValue(
						"impSelectedSupplierId",
						String(addedItem.helper_item_id)
					);
				}
			}

			resetWidget("inpPLAddName");
			closeModal("mdlPLAdd");

			showAlert("Item added.", "success");

			return true;

		} catch (error) {
			const message = String(
				error?.message || error || ""
			);

			if (
				message.includes("409") ||
				message.includes("Name already exists")
			) {
				showAlert(
					"Name already exists in this list.",
					"warning"
				);
			} else {
				showAlert("Unable to add item.", "error");
			}

			return false;
		}
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
		const newName = (inpPLRenameName.text || "").trim();

		const oldId = Number(tblListsItems.selectedRow?.id || 0);

		if (!newName || !oldId) {
			return false;
		}

		const exists = (apiGetHelperItems.data?.helper_items || [])
		.some(
			item =>
			Number(item.id) !== oldId &&
			item.name &&
			this.norm(item.name) === this.norm(newName)
		);

		if (exists) {
			showAlert("Name already exists in this list", "warning");
			return false;
		}

		try {
			const result = await apiRenameHelperItem.run({
				helper_item_id: oldId,
				name: newName
			});

			if (
				result?.authenticated !== true ||
				Number(result.helper_item_id) !== oldId
			) {
				showAlert("Unable to rename item", "error");
				return false;
			}

			await apiGetHelperItems.run({
				list_id: selListsType.selectedOptionValue
			});

			closeModal(mdlPLRename.name);

			showAlert("Item renamed", "success");

			return true;
		} catch (error) {
			showAlert(
				"Unable to rename item. Check whether the name already exists.",
				"error"
			);
			return false;
		}
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