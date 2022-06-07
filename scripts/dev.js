const args = require('minimist')(process.argv.slice(2)) // node scripts/dev.js reactivity -f global
const { build } = require('esbuild')
const { resolve } = require('path')

const target = args._[0] || 'reactivity'
const format = args.f || 'global'

// 暂时打包一个
// 找到打包目标的package.json
const pkg = require(resolve(__dirname, `../packages/${target}/package.json`))

// 判断打包格式
const outputFormat = format.startsWith('global')
	? 'iife'
	: format === 'cjs'
	? 'cjs'
	: 'esm'

// 配置打包目录
const outfile = resolve(
	__dirname,
	`../packages/${target}/dist/${target}.${format}.js`
)

build({
	entryPoints: [resolve(__dirname, `../packages/${target}/src/index.ts`)], // 打包入口
	outfile, // 输出文件
	bundle: true, // 所有的包打包到一起
	sourcemap: true,
	format: outputFormat, // 输出的格式
	globalName: pkg.buildOptions.name, // 打包的全局的名字
	platform: format === 'cjs' ? 'node' : 'browser',
	watch: {
		onRebuild(error) {
			if (error) console.log('rebuild...')
		},
	},
}).then(() => {
	console.log('watching...')
})
