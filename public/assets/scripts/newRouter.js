var Router = require('ampersand-router');
var $ = require('./util/sprint');
var request = require('superagent');
var scrollToEl = require('./util/scrollToEl');
var Velocity = require('velocity-animate');
var Images = require('./util/loadImages');



// ..............................................
// === Traverse target to find anchor w/ href ===
// ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
var findAnchor = function(target) {
	if (target.hasAttribute('href')) return target;
	var parent = target;
	while (parent) {
		parent = parent.parentNode;
		if (parent && parent.hasAttribute && parent.hasAttribute('href')) return parent;
	}
	return null;
};

// ........................................
// === Return important info about link ===
// ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
var prepLink = function(href) {
	var parser = document.createElement('a');
	parser.href = href;

	return {
		href: parser.href,
		pathname: parser.pathname,
		hash: parser.hash || null,
		internal: (parser.protocol != 'tel:' && parser.protocol != 'mailto:' && parser.hostname == location.hostname),
		onThisPage: !!parser.hash && $(parser.hash).dom.length > 0,
	};
};

// ..............................
// === go to an internal page ===
// ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
var loadPage = function(link, el, callback) {
	var content = request.get(link.href);

	if (window.scrollY > 20) {
		scrollToEl(el, function() {
			content.end(function(err, res) {
				if (err) return console.log(err);
				var content = /<main\s*[^>]*>([\S\s]*?)<\/main>/im.exec(res.text)[0];
				if (callback) callback(content);
			});
		});
	} else {
		content.end(function(err, res) {
			if (err) return console.log(err);
			var content = /<main\s*[^>]*>([\S\s]*?)<\/main>/im.exec(res.text)[0];
			if (callback) callback(content);
		});
	}
};


// ......................................
// === replace the main content block ===
// ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
var replaceContent = function(content, callback) {
	var $main = $('main');
	Velocity($main.dom[0], {opacity: 0}, {
		duration: 400,
		easing: [.8,0,.2,1],
		complete: function() {
			$main.html(content);
			Velocity($main.dom[0], {opacity: 1}, {
				duration: 400,
				easing: [.8,0,.2,1]
			});
			if (callback) callback();
		}
	});
};


// ..............
// === ROUTER ===
// ^^^^^^^^^^^^^^
// 1. User clicks link
// 2. link is processed
// 3. Router decides if link is internal or external
// 4. If external, move on. If internal, router checks to see
//    if link is a hash (on current page) or if link is a URL
// 5. If hash, scroll to hash, if interl URL, load content,
//    scroll to top, and replace content
module.exports = Router.extend({

	loaded: false,
	
	routes: {
		'work/:project': 'project',
		'': 'home',
	},

	initialize: function() {
		this.history.start({pushState: true});
		this.hijackLinks();
	},

	// ..............................
	// === Initial Load animation ===
	// ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
	firstLoad: function() {
		this.loaded = true;
		$('body').addClass('js-load-finish');
	},

	// ......................
	// === ROUTE HANDLERS ===
	// ^^^^^^^^^^^^^^^^^^^^^^
	// 1. Anchor (on this page), override router hash behavior 
	// 2. Home
	// 3. Project

	anchor: function(link) {
		if (!this.loaded) this.firstLoad();
		if (history && history.pushState) {
			history.pushState(null, null, link.href);
		} else {
			window.location = link.href;
		}
		scrollToEl(link.hash);
	},

	home: function() {
		var self = this;

		if (!this.loaded) {
			this.firstLoad();
		} else {
			// load page while scrolling, replace content
			loadPage(prepLink(location.href), 'body', function(content) {
				replaceContent(content, function() {
					self.onPageChange();
				});
			});
		}
	},

	project: function() {
		var self = this;

		if (!this.loaded) {
			this.firstLoad();
		} else {
			// load page while scrolling, replace content
			loadPage(prepLink(location.href), 'main', function(content) {
				replaceContent(content, function() {
					self.onPageChange();
				});
			});
		}
	},

	// .....................................
	// === Happens on every route change ===
	// ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
	onPageChange: function() {
		new Images('[data-src]');
	},

	// ..........................................
	// === Hijack links for internal behavior ===
	// ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

	hijackLinks: function() {
		var self = this;

		// Only need this for pushState enabled browsers
		if (this.history && this.history._hasPushState) {

			// Use delegation to avoid initial DOM selection and allow all matching elements to bubble
			document.addEventListener('click', function(e) {
				// Don't hijack no-wank anchors
				// Don't hijack if we can't find an anchor
				var target = findAnchor(e.target);
				if (!target || target.hasAttribute('no-wank')) return true;

				// Ensure relative url
				var link = prepLink(target.getAttribute('href'));
				if (link.internal) e.preventDefault();

				// Override router hash behavior
				if (link.onThisPage) {
					self.anchor(link);
				} else if (link.internal) {
					self.history.navigate(link.pathname);
				}

				return false;
			});
		}
	}

});
