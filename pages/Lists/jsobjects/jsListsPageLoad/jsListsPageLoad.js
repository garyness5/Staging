export default {
	ready: false,

	isReady() {
		return this.ready === true;
	},

	async load() {
		this.ready = false;

		try {
			const previousUser = String(
				appsmith.store.current_user_id || ""
			);
			const previousClient = String(
				appsmith.store.current_client_id || ""
			);

			const initialized = await jsAppInit.init();

			if (!initialized) {
				await jsIngredientImport.clearImportWorkspace();
				showAlert("Lists authentication failed.", "error");
				return false;
			}

			const userChanged =
						previousUser &&
						previousUser !== String(appsmith.store.current_user_id || "");

			const clientChanged =
						previousClient &&
						previousClient !== String(appsmith.store.current_client_id || "");

			if (userChanged || clientChanged) {
				await jsIngredientImport.clearImportWorkspace();
			}

			await apiGetHelperLists.run();
			await apiImpGetSuppliers.run();
			await apiImpGetLookups.run();

			const listId = selListsType.selectedOptionValue;

			if (listId) {
				await apiGetHelperItems.run({ list_id: listId });
			}

			this.ready = true;
			return true;

		} catch (error) {
			this.ready = false;

			console.error("Lists load failed:", error);

			showAlert(
				"Unable to load Lists: " +
				(error?.message || String(error)),
				"error"
			);

			return false;
		}
	}
};