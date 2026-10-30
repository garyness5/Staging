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
			// A workspace must have a verified owner.
			const workspaceOwner = String(
				appsmith.store.workspace_owner_user_id || ""
			);

			if (!workspaceOwner) {
				showAlert(
					"Please sign in to Savveyra.",
					"warning"
				);
				return false;
			}

			// Validate or refresh the existing session.
			// A failed refresh must not erase unsaved work.
			const sessionValid = await jsAuthSession.ensureValid();

			if (!sessionValid) {
				showAlert(
					"Your Savveyra session has expired. Please sign in again.",
					"warning"
				);
				return false;
			}

			// Verify identity with the authenticated backend.
			const identity = await apiGetMyIdentity.run();

			if (
				identity?.authenticated !== true ||
				!identity.user_id ||
				!identity.client_id
			) {
				showAlert(
					"Unable to verify your Savveyra account.",
					"warning"
				);
				return false;
			}

			const verifiedUserId = String(identity.user_id);

			// Never allow one user's workspace to operate
			// under another authenticated identity.
			if (verifiedUserId !== workspaceOwner) {
				await clearStore();

				showAlert(
					"The authenticated account has changed. Please sign in again.",
					"warning"
				);

				return false;
			}

			// The verified user owns this workspace.
			await storeValue(
				"current_client_id",
				identity.client_id
			);

			await storeValue(
				"current_user_id",
				verifiedUserId
			);

			await storeValue(
				"current_client_name",
				identity.client_name
			);

			await storeValue(
				"current_user_name",
				identity.user_name
			);

			return true;

		} catch (error) {
			// Keep the local workspace for same-user reauthentication.
			// Protected page initialization remains unsuccessful.
			showAlert(
				"Unable to verify your Savveyra session.",
				"error"
			);

			return false;
		}
	}
};