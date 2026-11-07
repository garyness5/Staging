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

			// No existing workspace: use standalone Login.
			if (!workspaceOwner) {
				await storeValue("ingPageReady", false);
				await clearStore();
				navigateTo("Login", {}, "SAME_WINDOW");
				return false;
			}

			// Existing workspace: renew the session when necessary.
			const sessionValid = await jsAuthSession.requireValid();

			if (!sessionValid) {
				// requireValid handles recovery or connection errors.
				// Do not discard the existing working state.
				return false;
			}

			const identity = await apiIngGetMyIdentity.run();

			if (
				identity?.authenticated !== true ||
				!identity?.user_id ||
				!identity?.client_id
			) {
				await storeValue("ingPageReady", false);

				showAlert(
					"Unable to verify your Savveyra account.",
					"error"
				);

				return false;
			}

			const verifiedUserId = String(identity.user_id);

			if (verifiedUserId !== workspaceOwner) {
				// A different authenticated operator must never inherit
				// the previous operator's Ingredients workspace.
				await jsIngWorkspace.clearForDifferentUser();

				navigateTo("Ingredients", {}, "SAME_WINDOW");
				return false;
			}

			await storeValue("current_client_id", identity.client_id);
			await storeValue("current_user_id", verifiedUserId);
			await storeValue("current_client_name", identity.client_name);
			await storeValue("current_user_name", identity.user_name);

			return true;

		} catch (error) {
			console.error("Ingredients initialization failed:", error);

			await storeValue("ingPageReady", false);

			showAlert(
				"Unable to verify your Savveyra session.",
				"error"
			);

			return false;
		}
	},

};