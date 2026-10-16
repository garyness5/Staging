export default {
	async init() {
		const rows = await qryResolveUser.run();

		if (!rows?.length || !rows[0]?.client_id) {
			await removeValue("current_client_id");
			await removeValue("current_user_id");
			await removeValue("current_client_name");
			await removeValue("current_user_name");

			showAlert(
				"Your Savveyra account is not activated. Please contact the administrator.",
				"warning"
			);

			return false;
		}

		const user = rows[0];

		await storeValue("current_client_id", user.client_id);
		await storeValue("current_user_id", user.user_id);
		await storeValue("current_client_name", user.client_name);
		await storeValue(
			"current_user_name",
			user.display_name || user.email
		);

		return true;
	}
};