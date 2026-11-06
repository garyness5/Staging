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
			const owner = String(
				appsmith.store.workspace_owner_user_id || ""
			);

			if (!owner) {
				await storeValue("recLstReauthRequired", true);
				showModal(mdlRecLstLogin.name);
				return false;
			}

			const valid = await jsAuthSession.ensureValid();

			if (!valid) {
				if (jsAuthSession.lastFailure === "login_required") {
					await storeValue("recLstReauthRequired", true);
					showModal(mdlRecLstLogin.name);
				} else {
					await storeValue("recLstReauthRequired", false);
					showAlert(
						"Unable to connect to Savveyra. Please check your connection.",
						"warning"
					);
				}
				return false;
			}

			const identity = await apiGetMyIdentity.run();

			if (
				identity?.authenticated !== true ||
				!identity.user_id ||
				!identity.client_id
			) {
				showAlert("Unable to verify your account.", "warning");
				return false;
			}

			const verifiedUser = String(identity.user_id);

			if (verifiedUser !== owner) {
				await clearStore();
				await storeValue("recLstReauthRequired", true);
				showModal(mdlRecLstLogin.name);
				return false;
			}

			await storeValue("current_user_id", verifiedUser);
			await storeValue("current_client_id", identity.client_id);
			await storeValue("current_user_name", identity.user_name);
			await storeValue("current_client_name", identity.client_name);
			await storeValue("recLstReauthRequired", false);

			return true;

		} catch (error) {
			showAlert("Unable to verify your Savveyra session.", "error");
			return false;
		}
	},
};
