export default {
	busy: false,

	async signIn() {
		if (this.busy) return false;
		this.busy = true;

		try {
			const email = String(inpIngLoginEmail.text || "").trim();
			const password = String(inpIngLoginPw.text || "");

			if (!email || !password) {
				showAlert("Enter your email and password.", "warning");
				return false;
			}

			const result = await apiIngLoginAuth.run();

			if (!result?.access_token || !result?.refresh_token) {
				showAlert(
					"Unable to sign in. Check your email and password.",
					"error"
				);
				return false;
			}

			const identity = await apiIngLoginEdgeIdentity.run({
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
				await jsIngWorkspace.clearForDifferentUser();
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

			// Close the login modal while protected content remains hidden.
			await storeValue("ingPageReady", false);

			closeModal(mdlIngLogin.name);

			resetWidget("inpIngLoginEmail", true);
			resetWidget("inpIngLoginPw", true);

			// Allow the modal's onClose handler to complete before loading.
			const loaded = await jsIngPageLoad.load();

			if (!loaded) {
				showAlert(
					"Signed in, but Ingredients could not finish loading.",
					"warning"
				);
			}

			return true;

		} catch (error) {
			console.error("Ingredients sign-in failed:", error);

			showAlert(
				"Sign-in failed. Check your credentials or connection and try again.",
				"error"
			);

			return false;

		} finally {
			this.busy = false;
		}
	},

	async onClose() {
		if (!this.busy) {
			await storeValue("ingPageReady", false);
		}

		resetWidget("inpIngLoginEmail", true);
		resetWidget("inpIngLoginPw", true);
	},

	async cancel() {
		await storeValue("ingPageReady", false);
		closeModal(mdlIngLogin.name);
		return true;
	}
};