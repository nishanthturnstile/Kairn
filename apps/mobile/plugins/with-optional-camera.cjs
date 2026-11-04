const { withAndroidManifest } = require("expo/config-plugins");

/** @type {import("expo/config-plugins").ConfigPlugin} */
module.exports = (config) =>
  withAndroidManifest(config, (config) => {
    // Image selection does not require camera hardware. Keep the permission
    // removal marker from Image Picker while making that hardware optional.
    const manifest = config.modResults.manifest;
    const features = manifest["uses-feature"] ?? [];
    const camera = features.find(
      (feature) => feature.$["android:name"] === "android.hardware.camera",
    );
    if (camera) camera.$["android:required"] = "false";
    else
      features.push({
        $: { "android:name": "android.hardware.camera", "android:required": "false" },
      });
    manifest["uses-feature"] = features;
    return config;
  });
