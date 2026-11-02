export default {
	async signIn(email, password) {
		try {
			const result = await apiRecReauthenticate.run({
				email: String(email || "").trim(),
				password: String(password || "")
			});

			if (!result?.access_token || !result?.refresh_token) {
				showAlert("Sign-in failed. Please check your credentials.", "error");
				return false;
			}

			const identity = await apiRecReauthIdentity.run({
				access_token: result.access_token
			});

			if (
				identity?.authenticated !== true ||
				!identity?.user_id ||
				!identity?.client_id
			) {
				showAlert("Unable to verify your account.", "error");
				return false;
			}

			const owner = String(
				appsmith.store.workspace_owner_user_id || ""
			);

			const incoming = String(identity.user_id);

			if (!owner || incoming !== owner) {
				showAlert(
					"This workspace belongs to another operator. Use Logout to switch accounts.",
					"warning"
				);
				return false;
			}

			await storeValue("savveyra_access_token", result.access_token, true);
			await storeValue("savveyra_refresh_token", result.refresh_token, true);
			await storeValue(
				"savveyra_token_expires_at",
				Date.now() + Number(result.expires_in || 3600) * 1000,
				true
			);

			showAlert("Session restored. Your unsaved work is preserved.", "success");
			return true;

		} catch (error) {
			showAlert("Unable to sign in. Please try again.", "error");
			return false;
		}
	},

	async submit() {
		const success = await this.signIn(
			inpRecReauthEmail.text,
			inpRecReauthPassword.text
		);

		if (success) {
			closeModal("mdlRecReauth");
		}
	},

	cancel() {
		closeModal(mdlRecReauth.name);
	}
};