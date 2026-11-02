export default {
	lastFailure: null,

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
		this.lastFailure = null;

		try {
			const workspaceOwner = String(
				appsmith.store.workspace_owner_user_id || ""
			);

			if (!workspaceOwner) {
				this.lastFailure = "login_required";

				showModal(mdlLstLogin.name);

				showAlert(
					"Please sign in to continue using Savveyra.",
					"warning"
				);
				return false;
			}

			const sessionValid =
						await jsAuthSession.ensureValid();

			if (!sessionValid) {
				this.lastFailure =
					jsAuthSession.lastFailure === "login_required"
					? "login_required"
				: "service_unavailable";

				if (this.lastFailure === "login_required") {
					showModal(mdlLstLogin.name);
				}

				showAlert(
					this.lastFailure === "login_required"
					? "Please sign in to continue using Savveyra."
					: "Unable to connect to Savveyra. Please try again.",
					this.lastFailure === "login_required"
					? "warning"
					: "error"
				);

				return false;
			}

			const identity = await apiLstGetMyIdentity.run();

			if (
				identity?.authenticated !== true ||
				!identity.user_id ||
				!identity.client_id
			) {
				this.lastFailure =
					identity?.authenticated === false
					? "login_required"
				: "identity_unavailable";

				if (this.lastFailure === "login_required") {
					showModal(mdlLstLogin.name);
				}

				showAlert(
					this.lastFailure === "login_required"
					? "Please sign in to continue using Savveyra."
					: "Unable to verify your Savveyra account. Please try again.",
					"warning"
				);

				return false;
			}

			const verifiedUserId = String(identity.user_id);

			if (verifiedUserId !== workspaceOwner) {
				await clearStore();

				this.lastFailure = "account_changed";

				showAlert(
					"The authenticated account has changed. Please sign in again.",
					"warning"
				);

				return false;
			}

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
			this.lastFailure = "service_unavailable";

			console.error(
				"Lists initialization identity check failed:",
				error
			);

			showAlert(
				"Unable to connect to Savveyra. Please try again.",
				"error"
			);

			return false;
		}
	}
};
