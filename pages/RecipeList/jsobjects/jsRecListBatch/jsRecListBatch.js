export default {
	pending() {
		return appsmith.store.RecListBatchPending || {};
	},

	count() {
		return Object.keys(this.pending()).length;
	},

	hasChanges() {
		return this.count() > 0;
	},

	savedRow(id) {
		return (apiRecLstGetRecipes.data?.recipes || [])
			.find(row => String(row.id) === String(id)) || null;
	},

	sameValue(a, b, field) {
		if (field === "active") {
			return a === b;
		}

		if (field === "category_id") {
			const normalize = v =>
			v === null || v === undefined || v === ""
			? null
			: Number(v);

			return normalize(a) === normalize(b);
		}

		return (a ?? "") === (b ?? "");
	},

	async stage(id, changes) {
		const saved = this.savedRow(id);

		if (!saved) {
			showAlert("Recipe could not be identified.", "error");
			return false;
		}

		const all = { ...this.pending() };
		const next = { ...(all[String(id)] || {}) };

		for (const [field, value] of Object.entries(changes || {})) {
			if (!["active", "category_id"].includes(field)) {
				showAlert("Unsupported RecipeList field.", "error");
				return false;
			}

			if (this.sameValue(value, saved[field], field)) {
				delete next[field];
			} else {
				next[field] = value;
			}
		}

		if (Object.keys(next).length) {
			all[String(id)] = next;
		} else {
			delete all[String(id)];
		}

		await storeValue("RecListBatchPending", all, false);
		return true;
	},

	isCellPending(id, field) {
		return Object.prototype.hasOwnProperty.call(
			this.pending()[String(id)] || {},
			field
		);
	},

	workingRows() {
		return (apiRecLstGetRecipes.data?.recipes || []).map(row => ({
			...row,
			...(this.pending()[String(row.id)] || {})
		}));
	},

	async discard() {
		await storeValue("RecListBatchPending", {}, false);
		return true;
	},

	async save() {
		const rows = Object.entries(this.pending()).map(
			([id, changes]) => ({
				recipe_id: Number(id),
				changes
			})
		);

		if (!rows.length) return true;

		try {
			const result = await apiRecLstBatchSave.run({ rows });

			if (
				result?.authenticated !== true ||
				Number(result.updated_count) !== rows.length
			) {
				throw new Error(
					"Recipe batch save was not confirmed by the server."
				);
			}

			await this.discard();

			const refreshed = await apiRecLstGetRecipes.run();

			if (
				refreshed?.authenticated !== true ||
				!Array.isArray(refreshed?.recipes)
			) {
				throw new Error(
					"Recipes were saved, but the list could not be refreshed."
				);
			}

			showAlert(
				`${rows.length} recipe(s) updated.`,
				"success"
			);

			return true;

		} catch (error) {
			console.error("RecipeList batch save failed:", error);

			showAlert(
				"Recipe changes could not be confirmed. Refresh the list before retrying.",
				"error"
			);

			return false;
		}
	}
};
