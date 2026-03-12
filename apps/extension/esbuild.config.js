const esbuild = require('esbuild');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const isProduction = process.argv.includes('--production');
const isWatch = process.argv.includes('--watch');

const backendUrl = process.env.BACKEND_BASE_API_URL || 'http://localhost:4000';

async function main() {
    const ctx = await esbuild.context({
        entryPoints: ['src/extension.ts'],
        bundle: true,
        format: 'cjs',
        minify: isProduction,
        sourcemap: !isProduction,
        sourcesContent: false,
        platform: 'node',
        outfile: 'dist/extension.js',
        external: ['vscode'],
        logLevel: 'info',
        define: {
            'process.env.BACKEND_BASE_API_URL': JSON.stringify(backendUrl),
        },
    });

    if (isWatch) {
        await ctx.watch();
    } else {
        await ctx.rebuild();
        await ctx.dispose();
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
