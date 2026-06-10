/* withArm64Only — config plugin that builds only the modern 64-bit ARM ABI
 * (arm64-v8a) by setting `reactNativeArchitectures` in android/gradle.properties
 * at (cloud) build time. Halves APK size; drops legacy 32-bit/x86 ABIs. */
const { withGradleProperties } = require("@expo/config-plugins");

module.exports = function withArm64Only(config) {
  return withGradleProperties(config, (cfg) => {
    const props = cfg.modResults;
    const set = (key, value) => {
      const i = props.findIndex((p) => p.type === "property" && p.key === key);
      const item = { type: "property", key, value };
      if (i >= 0) props[i] = item;
      else props.push(item);
    };
    set("reactNativeArchitectures", "arm64-v8a");
    return cfg;
  });
};
