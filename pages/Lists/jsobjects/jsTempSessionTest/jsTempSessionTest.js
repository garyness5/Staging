export default {
  async testFailedInitialization() {
    const originalRefreshToken = appsmith.store.savveyra_refresh_token;

    try {
      await removeValue("savveyra_refresh_token");

      const loadResult = await jsListsPageLoad.load();

      return {
        initializationRejected: loadResult === false,
        pageReady: appsmith.store.listsPageReady === true,
        identityCleared:
          !appsmith.store.current_client_id &&
          !appsmith.store.current_user_id
      };

    } finally {
      await storeValue(
        "savveyra_refresh_token",
        originalRefreshToken,
        true
      );
    }
  }
};