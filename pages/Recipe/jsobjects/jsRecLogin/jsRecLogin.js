export default {

	async signIn(email, password) {
		try {
			const result = await apiRecReauthenticate.run({
				email: String(email || "").trim(),
				password: String(password || "")
			});

			if (!result?.access_token || !result?.refresh_token) {
				showAlert("Sign-in failed. Please check your credentials.", "error");
				return { success: false };
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
				return { success: false };
			}

			const owner = String(
				appsmith.store.workspace_owner_user_id || ""
			);

			const incoming = String(identity.user_id);

			const sameUser = owner !== "" && owner === incoming;

			if (!sameUser) {
				await jsRecWorkspace.clearForDifferentUser();
			}

			await storeValue("savveyra_access_token", result.access_token, true);
			await storeValue("savveyra_refresh_token", result.refresh_token, true);
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
			await storeValue("recReauthRequired", false);

			if (!sameUser) {
				return {
					success: true,
					destination: "RecipeList"
				};
			}

			showAlert(
				"Session restored. Your unsaved work is preserved.",
				"success"
			);

			return {
				success: true,
				destination: "Recipe"
			};

		} catch (error) {
			showAlert("Unable to sign in. Please try again.", "error");
			return { success: false };
		}
	},

	async submit() {
		const result = await this.signIn(
			inpRecLoginEmail.text,
			inpRecLoginPassword.text
		);

		if (!result?.success) {
			return false;
		}

		if (result.destination === "RecipeList") {
			navigateTo("RecipeList");
			return true;
		}

		closeModal(mdlRecLogin.name);

		await resetWidget("inpRecLoginEmail", true);
		await resetWidget("inpRecLoginPassword", true);

		return true;
	},


	async openSignIn() {
		await resetWidget("inpRecLoginEmail", true);
		await resetWidget("inpRecLoginPassword", true);

		showModal(mdlRecLogin.name);
	},

	async logout() {
		let revoked = false;

		try {
			if (appsmith.store.savveyra_access_token) {
				await apiRecSignOut.run();
				revoked = true;
			}
		} catch (error) {
			console.error(
				"Recipe session revocation failed:",
				error
			);
		}

		// Explicit Logout discards the current operator's workspace.
		await clearStore();

		closeModal(mdlRecLogin.name);

		navigateTo("Login");

		return revoked;
	}
};