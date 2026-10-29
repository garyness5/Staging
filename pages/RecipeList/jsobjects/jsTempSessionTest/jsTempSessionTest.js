export default {
	async testFailedInitialization() {
		const originalRefreshToken =
					appsmith.store.savveyra_refresh_token;

		const originalAccessToken =
					appsmith.store.savveyra_access_token;

		const originalExpiry =
					appsmith.store.savveyra_token_expires_at;

		try {
			await removeValue("savveyra_refresh_token");

			const loadResult =
						await jsRecListPageload.load();

			return {
				initializationRejected: loadResult === false,
				pageReady:
				appsmith.store.recListPageReady === true,
				identityCleared:
				!appsmith.store.current_client_id &&
				!appsmith.store.current_user_id
			};

		} finally {
			await storeValue(
				"savveyra_refresh_token",
				originalRefreshToken,
				true
			);

			await storeValue(
				"savveyra_access_token",
				originalAccessToken,
				true
			);

			await storeValue(
				"savveyra_token_expires_at",
				originalExpiry,
				true
			);
		}
	}
};