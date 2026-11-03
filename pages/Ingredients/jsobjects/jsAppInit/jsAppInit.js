export default {
	async clearIdentity() {
		const keys = [
			"current_client_id",
			"current_client_name",
			"current_user_id",
			"current_user_name"
		];

		for (const key of keys) {
			await removeValue(key);
		}
	},

	async init() {
		try {
			const workspaceOwner = String(
				appsmith.store.workspace_owner_user_id || ""
			);

			if (!workspaceOwner) {
				showModal(mdlIngLogin.name);
				return false;
			}

			const sessionValid =
						await jsAuthSession.requireValid();

			if (!sessionValid) return false;

			const identity = await apiIngGetMyIdentity.run();

			if (
				identity?.authenticated !== true ||
				!identity?.user_id ||
				!identity?.client_id
			) {
				showAlert(
					"Unable to verify your Savveyra account.",
					"error"
				);
				return false;
			}

			const verifiedUserId = String(identity.user_id);

			if (verifiedUserId !== workspaceOwner) {
				await clearStore();

				showModal(mdlIngLogin.name);

				showAlert(
					"The authenticated account has changed. Please sign in again.",
					"warning"
				);

				return false;
			}

			await storeValue("current_client_id", identity.client_id);
			await storeValue("current_user_id", verifiedUserId);
			await storeValue("current_client_name", identity.client_name);
			await storeValue("current_user_name", identity.user_name);

			return true;

		} catch (error) {
			console.error("Ingredients initialization failed:", error);

			showAlert(
				"Unable to verify your Savveyra session.",
				"error"
			);

			return false;
		}
	}
};