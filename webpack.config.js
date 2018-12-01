'use strict'
const path = require('path')
		, os = require('os')
		, {production = false} = require('webpack-nano/argv')
	  , webpack = require('webpack')
		, cssStandards = require('spike-css-standards')
	  , ManifestPlugin = require('webpack-manifest-plugin')
	  , MiniCssExtractPlugin = require('mini-css-extract-plugin')
	  , HtmlWebpackPlugin = require('html-webpack-plugin')
	  , {CheckerPlugin: TsChecker} = require('awesome-typescript-loader')
		, HardSourceWebpackPlugin = require('hard-source-webpack-plugin')
		, { WebpackPluginServe } = require('webpack-plugin-serve')
	  , config = (env) => {
			const isProd = production
					, postcssRule = (test, parser) => {
						const options = Object.assign
						( cssStandards({ parser
													 , minify: isProd
													 , warnForDuplicates: !isProd
													 })
						, {sourceMap: true}
						)
						return { test
									 , use:
										 [ ...( isProd
													? [{ loader: MiniCssExtractPlugin.loader }]
													: [ { loader: 'style-loader'
															, options: {sourceMap: true}
															}
														]
													)
										 , { loader: 'css-loader'
											 , options: { importLoaders: 1
																	, sourceMap: true
																	}
											 }
										 , { loader: 'postcss-loader'
											 , options
											 }
										 ]
									 }
					}
			return { mode: isProd
									 ? 'production'
									 : 'development'
						 // , context: path.resolve(__dirname, 'src')
						 , entry:
							 [ path.resolve('src', 'index.ts')
							 , 'webpack-plugin-serve/client'
							 ]
						 , output: {filename: '[name].js'}
						 , optimization: {splitChunks: {chunks: 'initial'}}
						 , devtool: isProd
											? 'source-map'
											: 'cheap-module-eval-source-map'
						 , module:
							 { rules:
								 [ postcssRule(/\.css$/)
								 , postcssRule(/\.sss$/, 'sugarss')
								 , { test: /\.pug$/
									 , use:
										 [ { loader: 'pug-loader'
											 , options: {}
											 }
										 ]
									 }
								 , { test: /\.[jt]sx?$/
									 , use:
										 [ { loader: 'awesome-typescript-loader'
											 , options:
												 { useTranspileModule: true
												 // , transpileOnly: true
												 , configFileName: path.resolve
													 ('webpack.tsconfig.json')
												 , reportFiles: [path.resolve('src', '**', '*.{ts,tsx}')]
												 }
											 }
										 ]
									 }
								 , { test: /\.svg$/
									 , use: [fileLoader({publicPath: 'image'})]
									 }
								 , { test: /\.(?:woff2?|ttf|eot)$/
									 , use: [fileLoader({publicPath: 'font'})]
									 }
								 , { test: /\.x?html?$/
									 , exclude: /node_modules/
									 , use: [fileLoader({publicPath: ''})]
									 }
								 ]
							 }
						 , resolve:
							 { extensions:
								 [ '.js'
								 , '.json'
								 , '.mjs'
								 , '.wasm'
								 , '.ts'
								 , '.tsx'
								 ]
							 }
						 , watch: !isProd
						 , plugins:
							 [ new HtmlWebpackPlugin
								 ({ template: path.resolve('src', 'index.pug')
									, filename: 'index.html'
									, xhtml: true
									})
							 , new HardSourceWebpackPlugin()
							 , new TsChecker()
							 , new ManifestPlugin
							 , new webpack.NamedModulesPlugin
							 , ...( isProd
										? [ new MiniCssExtractPlugin
												({ filename: path.join('style', '[name].css')
												 , chunkFilename: path.join('style', '[name].chunk.css')
												 })
											]
										: [ new WebpackPluginServe
												({ open: true
												 , static: path.resolve('dist')
												 , host: '::1'
												 })
											]
										)
							 ]

			}
		}
		, fileLoader = ({ext = '[ext]', publicPath} = {}) => {
			const options = {name: `[name].${ext}`}
			if (publicPath) {
				Object.assign
				( options
				, { outputPath: publicPath
					, publicPath
					}
				)
			}
			return { loader: 'file-loader'
						 , options
						 }
		}

module.exports = config
