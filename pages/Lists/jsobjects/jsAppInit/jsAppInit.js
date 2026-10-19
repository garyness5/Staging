export default {
	async clearTenantState() {
		await removeValue("current_client_id");
		await removeValue("current_client_name");
		await removeValue("current_user_id");
		await removeValue("current_user_name");

		return true;
	},

	async init() {
		try {
			const sessionValid = await jsAuthSession.ensureValid();

			if (!sessionValid) {
				await this.clearTenantState();
				return false;
			}

			const identity = await apiGetMyIdentity.run();

			if (
				identity?.authenticated !== true ||
				!identity.user_id ||
				!identity.client_id
			) {
				await this.clearTenantState();
				return false;
			}

			const previousUser = String(
				appsmith.store.current_user_id || ""
			);

			const previousClient = String(
				appsmith.store.current_client_id || ""
			);

			if (
				(previousUser &&
				 previousUser !== String(identity.user_id)) ||
				(previousClient &&
				 previousClient !== String(identity.client_id))
			) {
				await this.clearTenantState();
			}

			await storeValue("current_client_id", identity.client_id);
			await storeValue("current_client_name", identity.client_name || "");
			await storeValue("current_user_id", identity.user_id);
			await storeValue("current_user_name", identity.user_name || "");

			return true;
		} catch (error) {
			await this.clearTenantState();
			console.error("Savveyra initialization failed:", error);
			return false;
		}
	}
};