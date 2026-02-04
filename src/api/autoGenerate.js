/**
 * 封面自动生成 API
 * 根据标题和选择自动生成封面
 */

import { state } from '../assets/script.js';
import { defaultConfig } from '../config.js';

// 预设配色方案
const colorSchemes = [
    { name: '科技蓝', bg: '#1a1a2e', text: '#ffffff', accent: '#16213e', watermark: '#94a3b8' },
    { name: '活力橙', bg: '#ff6b35', text: '#ffffff', accent: '#f7931e', watermark: '#ffd9c4' },
    { name: '清新绿', bg: '#10b981', text: '#ffffff', accent: '#34d399', watermark: '#a7f3d0' },
    { name: '优雅紫', bg: '#7c3aed', text: '#ffffff', accent: '#a78bfa', watermark: '#ddd6fe' },
    { name: '极简白', bg: '#fafafa', text: '#1f2937', accent: '#e5e7eb', watermark: '#9ca3af' },
    { name: '暗夜黑', bg: '#0f0f0f', text: '#f5f5f5', accent: '#262626', watermark: '#737373' },
    { name: '暖阳黄', bg: '#f59e0b', text: '#ffffff', accent: '#fbbf24', watermark: '#fef3c7' },
    { name: '薄荷青', bg: '#14b8a6', text: '#ffffff', accent: '#2dd4bf', watermark: '#ccfbf1' },
    { name: '玫瑰粉', bg: '#ec4899', text: '#ffffff', accent: '#f472b6', watermark: '#fce7f3' },
    { name: '深海蓝', bg: '#0369a1', text: '#ffffff', accent: '#0ea5e9', watermark: '#bae6fd' }
];

// 智能标题分析
function analyzeTitle(title) {
    const keywords = {
        tech: ['科技', '技术', '编程', '代码', 'AI', '人工智能', '算法', '数据', '开发', '软件', '前端', '后端', '全栈'],
        design: ['设计', 'UI', 'UX', '界面', '视觉', '创意', '艺术', '美学', '配色', '排版'],
        life: ['生活', '日常', '随笔', '感悟', '心情', '成长', '读书', '旅行', '美食', '摄影'],
        business: ['商业', '创业', '产品', '运营', '营销', '管理', '职场', '投资', '经济', '市场'],
        education: ['学习', '教程', '笔记', '知识', '课程', '教学', '培训', '考试', '认证', '技能']
    };

    const scores = {};
    for (const [category, words] of Object.entries(keywords)) {
        scores[category] = words.reduce((score, word) => {
            return score + (title.toLowerCase().includes(word.toLowerCase()) ? 1 : 0);
        }, 0);
    }

    const dominantCategory = Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0] || 'tech';

    return {
        category: dominantCategory,
        length: title.length,
        hasMultipleLines: title.includes('\n'),
        complexity: scores
    };
}

// 根据分析结果选择配色
function selectColorScheme(analysis) {
    const categoryMap = {
        tech: [0, 9],      // 科技蓝, 深海蓝
        design: [3, 7],    // 优雅紫, 薄荷青
        life: [2, 8],      // 清新绿, 玫瑰粉
        business: [1, 4],  // 活力橙, 极简白
        education: [5, 6]  // 暗夜黑, 暖阳黄
    };

    const indices = categoryMap[analysis.category] || [0];
    const randomIndex = indices[Math.floor(Math.random() * indices.length)];
    return colorSchemes[randomIndex];
}

// 计算最佳字体大小
function calculateOptimalFontSize(title, baseSize = 200) {
    const length = title.length;
    if (length <= 4) return baseSize;
    if (length <= 8) return baseSize * 0.8;
    if (length <= 12) return baseSize * 0.65;
    if (length <= 20) return baseSize * 0.5;
    return baseSize * 0.4;
}

// 主生成函数
export async function generateCover(options = {}) {
    const {
        title = defaultConfig.text,
        image = null,
        style = 'auto',
        watermark = defaultConfig.watermark
    } = options;

    // 分析标题
    const analysis = analyzeTitle(title);

    // 选择配色方案
    const colorScheme = style === 'auto' ? selectColorScheme(analysis) : colorSchemes.find(c => c.name === style) || colorSchemes[0];

    // 计算最佳字体大小
    const optimalFontSize = calculateOptimalFontSize(title);

    // 更新状态
    state.text = title;
    state.watermark = watermark;
    state.bgColor = colorScheme.bg;
    state.textColor = colorScheme.text;
    state.watermarkColor = colorScheme.watermark;
    state.textSize = optimalFontSize;
    state.selectedFont = 'HarmonyOS Sans SC';

    // 如果有图片，设置为背景
    if (image) {
        state.bgImageUrl = image;
        state.bgBlur = 8;
    } else {
        state.bgImageUrl = null;
        state.bgBlur = 0;
    }

    // 触发重绘
    const { drawBackground, drawText, drawWatermark, drawSquareImage } = await import('../assets/script.js');
    drawBackground();
    drawText();
    drawWatermark();
    drawSquareImage();

    return {
        success: true,
        analysis,
        colorScheme,
        settings: {
            title,
            fontSize: optimalFontSize,
            colors: colorScheme
        }
    };
}

// API 接口封装
export const coverAPI = {
    // 自动生成封面
    async autoGenerate(title, options = {}) {
        return generateCover({ title, ...options });
    },

    // 根据主题生成
    async generateByTheme(title, theme, options = {}) {
        const themeMap = {
            tech: colorSchemes[0],
            business: colorSchemes[1],
            creative: colorSchemes[3],
            minimal: colorSchemes[4],
            dark: colorSchemes[5]
        };
        const colorScheme = themeMap[theme] || colorSchemes[0];
        return generateCover({ title, style: colorScheme.name, ...options });
    },

    // 批量生成
    async batchGenerate(titles, options = {}) {
        const results = [];
        for (const title of titles) {
            const result = await generateCover({ title, ...options });
            results.push(result);
        }
        return results;
    },

    // 导出当前封面为不同格式
    async export(format = 'webp', quality = 0.9) {
        const canvas = document.getElementById('canvasPreview');
        if (!canvas) throw new Error('Canvas not found');

        return new Promise((resolve, reject) => {
            canvas.toBlob(
                blob => {
                    if (blob) {
                        resolve({
                            blob,
                            url: URL.createObjectURL(blob),
                            size: blob.size,
                            type: blob.type
                        });
                    } else {
                        reject(new Error('Export failed'));
                    }
                },
                `image/${format}`,
                quality
            );
        });
    }
};

export default coverAPI;