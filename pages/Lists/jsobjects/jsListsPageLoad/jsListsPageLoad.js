export default {
	async load() {
		const ok = await jsAppInit.init();

		if (!ok) {
			return false;
		}

		try {
			await apiGetHelperLists.run();

			const listId = selListsType.selectedOptionValue;

			if (listId) {
				await apiGetHelperItems.run({
					list_id: listId
				});
			}

			return true;
		} catch (error) {
			showAlert("Unable to load Lists.", "error");
			return false;
		}
	}
};