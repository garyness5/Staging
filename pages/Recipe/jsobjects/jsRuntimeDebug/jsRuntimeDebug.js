export default {
	runtimeId: Math.random().toString(36).slice(2),

	getRuntimeId() {
		return this.runtimeId;
	}
}