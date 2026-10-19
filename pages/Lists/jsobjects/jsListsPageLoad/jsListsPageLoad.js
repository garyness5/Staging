export default {
	async load() {
		try {
			const initialized = await jsAppInit.init();

			if (!initialized) {
				showAlert("Lists initialization failed.", "error");
				return false;
			}

			const sessionValid = await jsAuthSession.ensureValid();

			if (!sessionValid) {
				showAlert("Lists authentication failed.", "error");
				return false;
			}

			await apiGetHelperLists.run();
			await apiImpGetSuppliers.run();
			await apiImpGetLookups.run();

			const listId = selListsType.selectedOptionValue;
			if (listId) {
				await apiGetHelperItems.run({ list_id: listId });
			}

			return true;
		} catch (error) {
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