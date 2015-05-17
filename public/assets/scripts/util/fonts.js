// var WebFont = require('components-webfontloader');
var loadCSS = require('./loadCSS');
var compat = typeof(Storage) !== 'undefined';
var loadedStyles = localStorage.getItem('base64fonts');
var loaded = loadedStyles !== null;

var cacheFontsToStorage = function(styles) {
	localStorage.setItem('base64fonts', styles);
}

var loadFontsFromStorage = function() {
	return localStorage.getItem('base64fonts');
}

module.exports.load = function(cb) {
	if (compat) {
		if (loaded) {
			loadCSS.inject(loadedStyles);
			if (cb) cb();
		} else {
			loadCSS.load('/assets/fonts/fonts.css', function(styles) {
				cacheFontsToStorage(styles);
				loadCSS.inject(styles);
				if (cb) cb();
			});
		}
	} else {
		getFonts(function(styles) {
			loadCSS.inject(styles);
			if (cb) cb();
		});
	}
};
