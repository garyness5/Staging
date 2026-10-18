export default {
  async testCrossTenantImpact() {
    try {
      const result = await apiIngGetImpactCount.run({
        ingredient_id: 14
      });

      console.log("UNEXPECTED SUCCESS:", result);
      return result;

    } catch (error) {
      console.log("Expected rejection:", error);
      return error;
    }
  }
}