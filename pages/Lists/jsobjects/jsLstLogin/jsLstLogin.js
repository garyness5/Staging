export default {
	busy: false,

	async signIn() {
		if (this.busy) return false;
		this.busy = true;

		try {
			const email = String(inpLstLoginEmail.text || "").trim();
			const password = String(inpLstLoginPw.text || "");

			if (!email || !password) {
				showAlert("Enter your email and password.", "warning");
				return false;
			}

			const result = await apiLstLoginAuth.run();

			if (!result?.access_token || !result?.refresh_token) {
				showAlert(
					"Unable to sign in. Check your email and password.",
					"error"
				);
				return false;
			}

			const identity = await apiLstLoginEdgeIdentity.run({
				access_token: result.access_token
			});

			if (
				identity?.authenticated !== true ||
				!identity?.user_id ||
				!identity?.client_id
			) {
				showAlert(
					"Unable to verify your account. Sign-in was not completed.",
					"error"
				);
				return false;
			}

			const incomingUserId = String(identity.user_id);
			const previousUserId = String(
				appsmith.store.workspace_owner_user_id || ""
			);

			const sameUser =
						previousUserId !== "" &&
						previousUserId === incomingUserId;

			if (!sameUser) {
				await clearStore();

				// Remove the previous operator's selected import file.
				await resetWidget("filImportListPriceList", true);
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
			await storeValue(
				"workspace_owner_user_id",
				incomingUserId,
				true
			);

			await storeValue("current_user_id", incomingUserId);
			await storeValue("current_client_id", identity.client_id);
			await storeValue("current_user_name", identity.user_name);
			await storeValue("current_client_name", identity.client_name);

			resetWidget("inpLstLoginEmail", true);
			resetWidget("inpLstLoginPw", true);

			closeModal(mdlLstLogin.name);

			const loaded = await jsListsPageLoad.load();

			if (!loaded) {
				showAlert(
					"Signed in, but Lists could not finish loading.",
					"warning"
				);
			}

			return true;

		} catch (error) {
			console.error("Lists sign-in failed:", error);
			showAlert(
				"Sign-in failed. Check your credentials or connection and try again.",
				"error"
			);
			return false;

		} finally {
			this.busy = false;
		}
	},

	cancel() {
		closeModal(mdlLstLogin.name);
	}
};
