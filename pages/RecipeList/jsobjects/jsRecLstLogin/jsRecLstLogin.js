export default {
	busy: false,

	async signIn(email, password) {
		if (this.busy) return { success: false };
		this.busy = true;

		try {
			const result = await apiRecLstReauthenticate.run({
				email: String(email || "").trim(),
				password: String(password || "")
			});

			if (!result?.access_token || !result?.refresh_token) {
				showAlert("Sign-in failed. Check your credentials.", "error");
				return { success: false };
			}

			const identity = await apiRecLstReauthIdentity.run({
				access_token: result.access_token
			});

			if (
				identity?.authenticated !== true ||
				!identity?.user_id ||
				!identity?.client_id
			) {
				showAlert("Unable to verify your account.", "error");
				return { success: false };
			}

			const incoming = String(identity.user_id);
			const owner = String(
				appsmith.store.workspace_owner_user_id || ""
			);
			const sameUser = owner !== "" && owner === incoming;

			// A different operator must never inherit previous
			// account data, selections or unsaved state.
			if (!sameUser) {
				await clearStore();
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

			await storeValue("workspace_owner_user_id", incoming, true);
			await storeValue("current_user_id", incoming);
			await storeValue("current_client_id", identity.client_id);
			await storeValue("current_user_name", identity.user_name);
			await storeValue("current_client_name", identity.client_name);
			await storeValue("recLstReauthRequired", false);

			if (sameUser) {
				showAlert("Session restored.", "success");
			}

			return {
				success: true,
				sameUser
			};

		} catch (error) {
			showAlert("Unable to sign in. Please try again.", "error");
			return { success: false };

		} finally {
			this.busy = false;
		}
	},

	async submit() {
		const result = await this.signIn(
			inpRecLstLoginEmail.text,
			inpRecLstLoginPassword.text
		);

		if (!result.success) return false;

		if (!result.sameUser) {
			navigateTo("RecipeList", {}, "SAME_WINDOW");
			return true;
		}

		closeModal(mdlRecLstLogin.name);

		await resetWidget("inpRecLstLoginEmail", true);
		await resetWidget("inpRecLstLoginPassword", true);
		await jsRecListPageload.load();

		return true;
	},

	async openSignIn() {
		await resetWidget("inpRecLstLoginEmail", true);
		await resetWidget("inpRecLstLoginPassword", true);
		showModal(mdlRecLstLogin.name);
	},

	async logout() {
		let revoked = false;

		try {
			if (appsmith.store.savveyra_access_token) {
				await apiRecLstSignOut.run();
				revoked = true;
			}
		} catch (error) {
			console.error("RecipeList sign-out failed:", error);
		}

		await clearStore();
		closeModal(mdlRecLstLogin.name);
		navigateTo("Login", {}, "SAME_WINDOW");

		return revoked;
	}
};
