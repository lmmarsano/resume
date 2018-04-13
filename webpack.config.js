'use strict'
module.exports = config
function config(env) {
	const cssStandards = require('spike-css-standards')
	    , cssCommentFilter = require('postcss-discard-comments')()
	    , webpack = require('webpack')
	    , path = require('path')
	    , ManifestPlugin = require('webpack-manifest-plugin')
	    , CleanWebpackPlugin = require('clean-webpack-plugin')
	    , HtmlWebpackPlugin = require('html-webpack-plugin')
	    , CopyWebpackPlugin = require('copy-webpack-plugin')
	    , MiniCssExtractPlugin = require('mini-css-extract-plugin')
	    , ATLoader = require('awesome-typescript-loader')
	    , isProd = env && env.NODE_ENV === 'production'
	    , buildDir = path.resolve(__dirname, 'docs')
	    , context = path.resolve(__dirname, 'views')
	    , output = { path: buildDir
	               , filename: osPath('script/[name].js')
	               , chunkFilename: osPath('script/[id].chunk.js')
	               }
	    , chunk = [ 'index' ]
	return { context
	       , entry: entrySet(chunk)
	       , output: isProd
	               ? output
	               : Object.assign( output
	                              , { devtoolModuleFilenameTemplate: '[absolute-resource-path]'
	                                , devtoolFallbackModuleFilenameTemplate: '[absolute-resource-path]?[hash]'
	                                }
	                              )
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
	                   , transpileOnly: true
	                   }
	                 }
	               ]
	             }
	           , { test: /\.svg$/
	             , use: [ fileLoader(undefined, 'image/') ]
	             }
	           ]
	         }
	       , resolve:
	         { extensions:
	           [ '.js'
	           , '.json'
	           , '.ts'
	           , '.tsx'
	           ]
	         }
	       , devtool: isProd
	                ? 'source-map'
	                : 'cheap-module-eval-source-map'
	       , devServer:
	         { contentBase: buildDir
	         , hot: !isProd
	         }
	       , plugins:
	         [ new CleanWebpackPlugin([buildDir])
	         , new CopyWebpackPlugin
	           ([{ from: { glob: osPath('./image/*') } }])
	         // , new ATLoader.CheckerPlugin
	         , ...hwpArray(chunk)
	         , new ManifestPlugin
	         , new webpack.NamedModulesPlugin
	         , ...( isProd
	              ? [ new MiniCssExtractPlugin
	                  ({ filename: osPath('style/[name].css')
	                   , chunkFilename: osPath('style/[name].chunk.css')
	                   })
	                ]
	              : [ new webpack.HotModuleReplacementPlugin ]
	              )
	         ]
	       }
	// each entry has a file directly under context
	function entrySet(names) {
		let entry = {}
		for (let name of names) {
			entry[name] = osPath(`./${name}`)
		}
		return entry
	}
	// chunk: string[] array of chunk names
	function hwpArray(chunk) {
		let hwpOptions = isProd
		               ? hwpOptionsProd
		               : hwpOptionsDev
		return chunk
		       .map((name) =>
		          new HtmlWebpackPlugin(hwpOptions(name))
		         )
	}
	function hwpOptionsDev(name) {
		return { template: osPath(`./${name}.pug`)
		       , filename: `${name}.html`
		       , xhtml: true
		       , chunks: [name]
		       , locals: require(path.join(context, 'locals', name))
		       }
	}
	function hwpOptionsProd(name) {
		// default configuration creates shared chunks, default vendors: include them in the webpage
		// https://gist.github.com/sokra/1522d586b8e5c0f5072d7565c2bee693#configurate-cache-groups
		let options = hwpOptionsDev(name)
		options.chunks.unshift('default', 'vendors')
		return options
	}
	function osPath(posixPath) {
		return path.sep === '/'
		     ? posixPath
		     : posixPath.replace(/\//g, path.sep)
	}
	function postcssRule(test, parser) {
		let options = cssStandards({ parser
		                           , minify: isProd
		                           , warnForDuplicates: !isProd
		                           })
		options.plugins.push(cssCommentFilter)
		options.sourceMap = true
		return { test
		       , use:
		         [ ...( isProd
			            ? [ { loader: MiniCssExtractPlugin.loader } ]
			            : [ { loader: 'style-loader'
			                , options: { sourceMap: true }
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
	function fileLoader(ext = '[ext]', publicPath) {
		let options = { name: `[name].${ext}`
		              }
		if (publicPath) {
			Object.assign
			( options
			, { outputPath: osPath(publicPath)
			  , publicPath
			  }
			)
		}
		return { loader: 'file-loader'
		       , options
		       }
	}
}
