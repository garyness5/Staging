export default {
	async load() {
		await storeValue("listsPageReady", false);

		try {
			const initialized = await jsAppInit.init();

			if (!initialized) {
				await jsIngredientImport.clearImportWorkspace();
				return false;
			}

			const results = await Promise.all([
				apiGetHelperLists.run(),
				apiImpGetSuppliers.run(),
				apiImpGetLookups.run()
			]);

			if (results.some(r => r?.authenticated !== true)) {
				throw new Error("Lists data request failed.");
			}

			const listId = selListsType.selectedOptionValue;

			if (listId) {
				const items = await apiGetHelperItems.run({
					list_id: listId
				});

				if (items?.authenticated !== true) {
					throw new Error("Helper items request failed.");
				}
			}

			await storeValue("listsPageReady", true);
			return true;

		} catch (error) {
			await storeValue("listsPageReady", false);
			console.error("Lists initialization failed:", error);
			showAlert("Unable to load Lists data.", "error");
			return false;
		}
	},

	isReady() {
		return appsmith.store.listsPageReady === true;
	}
};
