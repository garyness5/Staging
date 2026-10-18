export default {
  async restoreTenantBSupplier() {
    return await apiRenameHelperItem.run({
      helper_item_id: 2,
      name: "Tenant B Supplier Marker"
    });
  }
};