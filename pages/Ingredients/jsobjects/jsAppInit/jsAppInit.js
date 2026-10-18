export default {
	async init() {
		try {
			const sessionValid = await jsAuthSession.ensureValid();

			if (!sessionValid) {
				showAlert(
					"Your Savveyra session has expired. Please sign in again.",
					"warning"
				);
				return false;
			}

			const identity = await apiGetMyIdentity.run();

			if (
				identity?.authenticated !== true ||
				!identity.user_id ||
				!identity.client_id
			) {
				showAlert(
					"Your Savveyra account is not activated. Please contact the administrator.",
					"warning"
				);
				return false;
			}

			await storeValue("current_client_id", identity.client_id);
			await storeValue("current_user_id", identity.user_id);
			await storeValue("current_client_name", identity.client_name);
			await storeValue("current_user_name", identity.user_name);

			return true;
		} catch (error) {
			showAlert(
				"Unable to verify your Savveyra session.",
				"error"
			);
			return false;
		}
	}
};