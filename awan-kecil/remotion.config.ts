import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
// Render WebGL lewat ANGLE (alternatif: --gl=swangle, lihat README).
Config.setChromiumOpenGlRenderer("angle");
