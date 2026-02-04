// 字体配置: [字体CSS名称, 显示名称, CSS文件地址]
const fonts = [
    [import.meta.env.VITE_APP_FONT_FAMILY, 'HarmonyOS Sans', 'https://cdn.jsdelivr.net/npm/harmonyos-fonts@1.0.0/HarmonyOS-Sans/Regular/HarmonyOS_Sans_SC_Regular.css'],
    ['HarmonyOS Sans SC Medium', 'HarmonyOS Medium', 'https://cdn.jsdelivr.net/npm/harmonyos-fonts@1.0.0/HarmonyOS-Sans/Medium/HarmonyOS_Sans_SC_Medium.css'],
    ['HarmonyOS Sans SC Bold', 'HarmonyOS Bold', 'https://cdn.jsdelivr.net/npm/harmonyos-fonts@1.0.0/HarmonyOS-Sans/Bold/HarmonyOS_Sans_SC_Bold.css'],
    ['Microsoft YaHei', '微软雅黑'],
    ['PingFang SC', '苹方'],
    ['yozai', '悠哉字体', 'https://chinese-fonts-cdn.deno.dev/packages/yozai/dist/Yozai-Regular/result.css'],
    ['寒蝉全圆体', '寒蝉全圆体', 'https://chinese-fonts-cdn.deno.dev/packages/hcqyt/dist/ChillRoundFRegular/result.css'],
    ['Douyin Sans', '抖音美好体', 'https://chinese-fonts-cdn.deno.dev/packages/dymh/dist/DouyinSansBold/result.css'],
    ['MaokenZhuyuanTi', '猫啃珠圆体', 'https://chinese-fonts-cdn.deno.dev/packages/mkzyt/dist/猫啃珠圆体/result.css']
];

export const defaultConfig = {
    text: '梦爱吃鱼',       // 默认文本
    watermark: '@梦爱吃鱼', // 默认水印
    fontFamily: import.meta.env.VITE_APP_FONT_FAMILY,
    fontStyles: fonts.map(f => f[2]).filter(Boolean),
    fontOptions: fonts.map(([value, label]) => ({ value, label }))
};