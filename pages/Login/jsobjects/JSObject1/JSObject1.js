export default {
    async checkReadinessFlags() {
        return {
            listsPageReady: appsmith.store.listsPageReady,
            ingPageReady: appsmith.store.ingPageReady,
            recListPageReady: appsmith.store.recListPageReady,
            recPageReady: appsmith.store.recPageReady
        };
    }
};