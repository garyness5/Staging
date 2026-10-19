export default {
	async clearSession() {
		await storeValue("savveyra_access_token", "", true);
		await storeValue("savveyra_refresh_token", "", true);
		await storeValue("savveyra_token_expires_at", 0, true);
	},

	async clearPreviousTenantWorkspace() {
		const keys = [
			"current_client_id",
			"current_client_name",
			"current_user_id",
			"current_user_name",
			"impSourceHeaders",
			"impSourceRows",
			"impHeaderSignature",
			"impHeaderMapRows",
			"impAppliedHeaderMapRows",
			"impAppliedHeaderSignature",
			"impSelectedSupplierId",
			"impValueMapRows",
			"impReviewSnapshot",
			"impImpact"
		];

		for (const key of keys) {
			await removeValue(key);
		}

		return true;
	},

	async login() {
		await this.clearSession();

		try {
			const result = await apiLoginAuth.run();

			if (!result?.access_token || !result?.refresh_token) {
				showAlert("Supabase login failed.", "error");
				return { success: false };
			}

			// Successful login establishes a new user workspace.
			await this.clearPreviousTenantWorkspace();

			const expiresAt =
						Date.now() + Number(result.expires_in || 3600) * 1000;

			await storeValue(
				"savveyra_access_token",
				result.access_token,
				true
			);

			await storeValue(
				"savveyra_refresh_token",
				result.refresh_token,
				true
			);

			await storeValue(
				"savveyra_token_expires_at",
				expiresAt,
				true
			);

			return {
				success: true,
				expiresAt: new Date(expiresAt).toISOString()
			};
		} catch (error) {
			await this.clearSession();
			showAlert("Unable to establish Supabase session.", "error");
			return { success: false };
		}
	},

	async logout() {
		await this.clearSession();
		await this.clearPreviousTenantWorkspace();

		showAlert("Logged out successfully.", "success");
		return true;
	},

	checkToken() {
		const token = String(
			appsmith.store.savveyra_access_token || ""
		);

		const refreshToken = String(
			appsmith.store.savveyra_refresh_token || ""
		);

		try {
			const payload = JSON.parse(
				atob(
					token.split(".")[1]
					.replace(/-/g, "+")
					.replace(/_/g, "/")
				)
			);

			return {
				accessTokenPresent: true,
				refreshTokenPresent: !!refreshToken,
				currentTime: new Date().toISOString(),
				expiresAt: new Date(
					payload.exp * 1000
				).toISOString(),
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
