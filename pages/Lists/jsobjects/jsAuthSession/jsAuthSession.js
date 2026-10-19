export default {
	async ensureValid() {
		const token = appsmith.store.savveyra_access_token;
		const refreshToken = appsmith.store.savveyra_refresh_token;
		const expiresAt = Number(
			appsmith.store.savveyra_token_expires_at || 0
		);

		if (!refreshToken) return false;

		if (token && expiresAt > Date.now() + 5 * 60 * 1000) {
			return true;
		}

		return await this.refresh();
	},

	async refresh() {
		try {
			const result = await apiRefreshSupabaseSession.run();

			if (!result?.access_token || !result?.refresh_token) {
				return false;
			}

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
				Date.now() + Number(result.expires_in || 3600) * 1000,
				true
			);

			return true;
		} catch (error) {
			return false;
		}
	},

	async logout() {
		// Hide protected Lists content immediately.
		if (typeof jsListsPageLoad !== "undefined") {
			jsListsPageLoad.ready = false;
		}

		// Clear session credentials.
		await removeValue("savveyra_access_token");
		await removeValue("savveyra_refresh_token");
		await removeValue("savveyra_token_expires_at");

		// Clear resolved tenant identity.
		await jsAppInit.clearTenantState();

		// Clear locally retained Ingredient Import data.
		await jsIngredientImport.clearImportWorkspace();

		return true;
	},

	status() {
		const expiresAt = Number(
			appsmith.store.savveyra_token_expires_at || 0
		);

		return {
			accessTokenPresent:
			!!appsmith.store.savveyra_access_token,
			refreshTokenPresent:
			!!appsmith.store.savveyra_refresh_token,
			expiresAt: expiresAt
			? new Date(expiresAt).toISOString()
			: null,
			refreshRequired:
			expiresAt <= Date.now() + 5 * 60 * 1000
		};
	},

	check() {
		const token = String(
			appsmith.store.savveyra_access_token || ""
		);

		return {
			tokenPresent: !!token,
			tokenLength: token.length,
			tokenSegments: token.split(".").length,
			expiresAt: new Date(
				Number(
					appsmith.store.savveyra_token_expires_at || 0
				)
			).toISOString()
		};
	}
};