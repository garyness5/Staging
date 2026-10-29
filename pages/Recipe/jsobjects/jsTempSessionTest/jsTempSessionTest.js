export default {
	async inspectReadiness() {
		const before = {
			ready: appsmith.store.recPageReady,
			userIdPresent: !!appsmith.store.current_user_id,
			clientIdPresent: !!appsmith.store.current_client_id
		};

		const result = await jsRecPageLoad.load();

		const after = {
			ready: appsmith.store.recPageReady,
			userIdPresent: !!appsmith.store.current_user_id,
			clientIdPresent: !!appsmith.store.current_client_id
		};

		return {
			before,
			loadSucceeded: result === true,
			after
		};
	}
};