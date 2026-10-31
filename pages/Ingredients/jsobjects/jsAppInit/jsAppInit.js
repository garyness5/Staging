export default {
    async clearIdentity() {
        const keys = [
            "current_client_id",
            "current_client_name",
            "current_user_id",
            "current_user_name"
        ];

        for (const key of keys) {
            await removeValue(key);
        }
    },

    async init() {
        try {
            const workspaceOwner = String(
                appsmith.store.workspace_owner_user_id || ""
            );

            if (!workspaceOwner) {
                showAlert(
                    "Please sign in to Savveyra.",
                    "warning"
                );
                return false;
            }

            const sessionValid =
                await jsAuthSession.ensureValid();

            if (!sessionValid) {
                showAlert(
                    "Your Savveyra session has expired. Please sign in again.",
                    "warning"
                );
                return false;
            }

            const identity = await apiGetMyIdentity.run();

            if (
                identity?.authenticated !== true ||
                !identity.user_id ||
                !identity.client_id
            ) {
                showAlert(
                    "Unable to verify your Savveyra account.",
                    "warning"
                );
                return false;
            }

            const verifiedUserId = String(identity.user_id);

            if (verifiedUserId !== workspaceOwner) {
                await clearStore();

                showAlert(
                    "The authenticated account has changed. Please sign in again.",
                    "warning"
                );
                return false;
            }

            await storeValue(
                "current_client_id",
                identity.client_id
            );

            await storeValue(
                "current_user_id",
                verifiedUserId
            );

            await storeValue(
                "current_client_name",
                identity.client_name
            );

            await storeValue(
                "current_user_name",
                identity.user_name
            );

            return true;

        } catch (error) {
            showAlert(
                "Unable to verify your Savveyra session.",
                "error"
            );

            return false;
        }
    }
};
