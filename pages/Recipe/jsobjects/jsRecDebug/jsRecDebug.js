export default {
	async captureTest() {
		const captured = await jsRecWorkspace.capture();

		showAlert(
			JSON.stringify({
				displayedName: inpRecName.text,
				workspaceName: jsRecWorkspace.get().header.name,
				capturedName: captured?.header?.name ?? null
			}),
			"info"
		);

		return captured;
	}
}