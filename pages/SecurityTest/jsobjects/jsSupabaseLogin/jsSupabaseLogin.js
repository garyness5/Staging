export default {
	async login() {
		try {
			const result = await apiTestAuthLogin.run();

			if (!result?.access_token || !result?.refresh_token) {
				showAlert("Supabase login failed.", "error");
				return { success: false };
			}

			await storeValue("savveyra_access_token", result.access_token, true);
			await storeValue("savveyra_refresh_token", result.refresh_token, true);

			const expiresAt = Date.now() + Number(result.expires_in || 3600) * 1000;
			await storeValue("savveyra_token_expires_at", expiresAt, true);

			return {
				success: true,
				expiresAt: new Date(expiresAt).toISOString()
			};
		} catch (error) {
			showAlert("Unable to establish Supabase session.", "error");
			return { success: false };
		}
	},

	checkToken() {
		const token = String(appsmith.store.savveyra_access_token || "");
		const refreshToken = String(appsmith.store.savveyra_refresh_token || "");

		try {
			const payload = JSON.parse(
				atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
			);

			return {
				accessTokenPresent: true,
				refreshTokenPresent: !!refreshToken,
				currentTime: new Date().toISOString(),
				expiresAt: new Date(payload.exp * 1000).toISOString(),
				expired: Date.now() >= payload.exp * 1000
			};
		} catch (error) {
			return {
				accessTokenPresent: false,
				refreshTokenPresent: !!refreshToken
			};
		}
	}
};
