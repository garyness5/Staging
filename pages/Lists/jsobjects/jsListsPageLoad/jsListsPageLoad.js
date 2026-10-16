export default {
	async load() {
		const ok = await jsAppInit.init();

		if (!ok) {
			return false;
		}

		await qryGetHelperLists.run();
		await qryImpSuppliers.run();

		return true;
	}
};