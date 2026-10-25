export default {
  async test() {
    const result = await apiIngGetImpactCount.run({
      ingredient_id: 73
    });

    console.log("Ingredient impact:", result);
    return result;
  }
};