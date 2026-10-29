export default {
	async clearSession() {
		// Hide every protected page before clearing credentials.
		const readinessKeys = [
			"listsPageReady",
			"ingPageReady",
			"recListPageReady",
			"recPageReady"
		];

		await Promise.all(
			readinessKeys.map(key => storeValue(key, false))
		);

		// Clear the Supabase session.
		await storeValue("savveyra_access_token", "", true);
		await storeValue("savveyra_refresh_token", "", true);
		await storeValue("savveyra_token_expires_at", 0, true);

		return true;
	},

	async clearPreviousTenantWorkspace() {
		const keys = [
			"current_client_id",
			"current_client_name",
			"current_user_id",
			"current_user_name",
			"IngBatchPending",
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
		await this.clearPreviousTenantWorkspace();

		try {
			const result = await apiLoginAuth.run();

			if (!result?.access_token || !result?.refresh_token) {
				jsUserErrors.show(
					"invalid_credentials",
					"There is an error in the email and/or password you entered. Please try again."
				);

				return { success: false };
			}

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
			await this.clearPreviousTenantWorkspace();

			const rawError = jsUserErrors.rawMessage(error);

			// Invalid credentials may arrive as a rejected Appsmith API call
			// without exposing the Supabase error body to JavaScript.
			if (
				/invalid_credentials|invalid login credentials/i.test(rawError) ||
				Number(error?.statusCode || error?.status) === 400
			) {
				jsUserErrors.show("invalid_credentials");
			} else {
				jsUserErrors.show(
					error,
					"There is an error in the email and/or password you entered. Please try again."
				);
			}

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
