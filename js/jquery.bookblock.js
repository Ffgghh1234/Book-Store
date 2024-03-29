(function($, window, undefined) {
	'use strict';
	var $event = $.event,
	$special,
	resizeTimeout;
	$special = $event.special.debouncedresize = {
		setup: function() {
			$( this ).on( "resize", $special.handler );
		},
		teardown: function() {
			$( this ).off( "resize", $special.handler );
		},
		handler: function( event, execAsap ) {
			var context = this,
				args = arguments,
				dispatch = function() {
					event.type = "debouncedresize";
					$event.dispatch.apply( context, args );
				};
			if ( resizeTimeout ) {
				clearTimeout( resizeTimeout );
			}
			execAsap ?
				dispatch() :
				resizeTimeout = setTimeout( dispatch, $special.threshold );
		},
		threshold: 150
	};
	var $window = $(window),
		Modernizr = window.Modernizr;
	$.BookBlock = function(options, element) {
		this.$el = $(element);
		this._init(options);
	};
	$.BookBlock.defaults = {
		speed : 1000,
		easing : 'ease-in-out',
		shadows : true,
		shadowSides : 0.2,
		shadowFlip : 0.1,
		perspective : 1300,
		circular : false,
		nextEl : '',
		prevEl : '',
		autoplay : false,
		interval : 3000,
		keyboard : true,
		onEndFlip : function(old, page, isLimit) {
			return false;
		},
		onBeforeFlip : function(page) {
			return false;
		}
	};
	$.BookBlock.prototype = {
		_init: function(options) {
			this.options = $.extend(true, {}, $.BookBlock.defaults, options);
			this.$el.css('perspective', this.options.perspective);
			this.$items = this.$el.children('.bb-item');
			this.itemsCount = this.$items.length;
			this.current = 0;
			this.previous = -1;
			this.$current = this.$items.eq(this.current).show();
			this.elWidth = this.$el.width();
			var transEndEventNames = {
				'WebkitTransition': 'webkitTransitionEnd',
				'MozTransition': 'transitionend',
				'OTransition': 'oTransitionEnd',
				'msTransition': 'MSTransitionEnd',
				'transition': 'transitionend'
			};
			this.transEndEventName = transEndEventNames[Modernizr.prefixed('transition')] + '.bookblock';
			this.support = Modernizr.csstransitions && Modernizr.csstransforms3d;
			this._initEvents();
			if (this.options.autoplay) {
				this.options.circular = true;
				this._startSlideshow();
			}
		},
		_initEvents: function() {
			var self = this;
			if (this.options.nextEl !== '') {
				$(this.options.nextEl).on('click.bookblock', function() {
					self._action('next');
					return false;
				});
			}
			if (this.options.prevEl !== '') {
				$(this.options.prevEl).on('click.bookblock', function() {
					self._action('prev');
					return false;
				});
			}
			if (this.options.keyboard == true) {
				$(document).keydown(function(e) {
					var keyCode = e.keyCode || e.which,
						arrow = {
							left : 37,
							up : 38,
							right : 39,
							down : 40
						};
					switch (keyCode) {
						case arrow.left:
							self._action('prev');
							break;
						case arrow.right:
							self._action('next');
							break;
					}
				});
			}
			$window.on( 'debouncedresize', function() {
							
				self.elWidth = self.$el.width();
			} )
		},
		_action : function(dir, page) {
			this._stopSlideshow();
			this._navigate(dir, page);
		},
		_navigate: function(dir, page) {
			if (this.isAnimating) {
				return false;
			}
			this.options.onBeforeFlip(this.current);
			this.isAnimating = true;
			this.$current = this.$items.eq(this.current);
			if (page !== undefined) {
				this.current = page;
			} else if (dir === 'next') {
				if (!this.options.circular && this.current === this.itemsCount - 1) {
					this.end = true;
				} else {
					this.previous = this.current;
					this.current = this.current < this.itemsCount - 1 ? this.current + 1 : 0;
				}
			} else if (dir === 'prev') {
				if (!this.options.circular && this.current === 0) {
					this.end = true;
				} else {
					this.previous = this.current;
					this.current = this.current > 0 ? this.current - 1 : this.itemsCount - 1;
				}
			}
			this.$nextItem = !this.options.circular && this.end ? this.$current : this.$items.eq(this.current);
			
			if (!this.support) {
				this._layoutNoSupport(dir);
			} else {
				this._layout(dir);
			}
		},
		_layoutNoSupport: function(dir) {
			this.$items.hide();
			this.$nextItem.show();
			this.end = false;
			this.isAnimating = false;
			var isLimit = dir === 'next' && this.current === this.itemsCount - 1 || dir === 'prev' && this.current === 0;
			this.options.onEndFlip(this.previous, this.current, isLimit);
		},
		_layout: function(dir) {
			var self = this,
				$s_left = this._addSide('left', dir),
				$s_middle = this._addSide('middle', dir),
				$s_right = this._addSide('right', dir),
				$o_left = $s_left.find('div.bb-overlay'),
				$o_middle_f = $s_middle.find('div.bb-flipoverlay:first'),
				$o_middle_b = $s_middle.find('div.bb-flipoverlay:last'),
				$o_right = $s_right.find('div.bb-overlay'),
				speed = this.end ? 400 : this.options.speed;
			this.$items.hide();
			this.$el.prepend($s_left, $s_middle, $s_right);
			$s_middle.css({
				transition: 'all ' + speed + 'ms ' + this.options.easing
			}).on(this.transEndEventName, function(event) {
				if (event.target.className === 'bb-page') {
					self.$el.children('div.bb-page').remove();
					self.$nextItem.show();
					self.end = false;
					self.isAnimating = false;
					var isLimit = dir === 'next' && self.current === self.itemsCount - 1 || dir === 'prev' && self.current === 0;
					self.options.onEndFlip(self.previous, self.current, isLimit);
				}
			});
			if (dir === 'prev') {
				$s_middle.css({ transform: 'rotateY(-180deg)' });
			}
			if (this.options.shadows && !this.end) {
				var o_left_style = (dir === 'next') ? {
					transition: 'opacity ' + this.options.speed / 2 + 'ms ' + 'linear' + ' ' + this.options.speed / 2 + 'ms'
				} : {
					transition: 'opacity ' + this.options.speed / 2 + 'ms ' + 'linear',
					opacity: this.options.shadowSides
				},
					o_middle_f_style = (dir === 'next') ? {
						transition: 'opacity ' + this.options.speed / 2 + 'ms ' + 'linear'
					} : {
						transition: 'opacity ' + this.options.speed / 2 + 'ms ' + 'linear' + ' ' + this.options.speed / 2 + 'ms',
						opacity: this.options.shadowFlip
					},
					o_middle_b_style = (dir === 'next') ? {
						transition: 'opacity ' + this.options.speed / 2 + 'ms ' + 'linear' + ' ' + this.options.speed / 2 + 'ms',
						opacity: this.options.shadowFlip
					} : {
						transition: 'opacity ' + this.options.speed / 2 + 'ms ' + 'linear'
					},
					o_right_style = (dir === 'next') ? {
						transition: 'opacity ' + this.options.speed / 2 + 'ms ' + 'linear',
						opacity: this.options.shadowSides
					} : {
						transition: 'opacity ' + this.options.speed / 2 + 'ms ' + 'linear' + ' ' + this.options.speed / 2 + 'ms'
					};
				$o_middle_f.css(o_middle_f_style);
				$o_middle_b.css(o_middle_b_style);
				$o_left.css(o_left_style);
				$o_right.css(o_right_style);
			}
			setTimeout(function() {
				var style = dir === 'next' ? 'rotateY(-180deg)' : 'rotateY(0deg)';
				if (self.end) {
					style = dir === 'next' ? 'rotateY(-15deg)' : 'rotateY(-165deg)';
				}
				$s_middle.css({transform: style});
				if (self.options.shadows && !self.end) {
					$o_middle_f.css({
						opacity: dir === 'next' ? self.options.shadowFlip : 0
					});
					$o_middle_b.css({
						opacity: dir === 'next' ? 0 : self.options.shadowFlip
					});
					$o_left.css({
						opacity: dir === 'next' ? self.options.shadowSides : 0
					});
					$o_right.css({
						opacity: dir === 'next' ? 0 : self.options.shadowSides
					});
				}
			}, 30);
		},
		_addSide: function(side, dir) {
			var $side;
			switch (side) {
			case 'left':
					
				$side = $('<div class="bb-page"><div class="bb-back"><div class="bb-outer"><div class="bb-content" style="width:' + this.elWidth + 'px"><div class="bb-inner">' + (dir === 'next' ? this.$current.html() : this.$nextItem.html()) + '</div></div><div class="bb-overlay"></div></div></div></div>').css('z-index', 102);
				break;
			case 'middle':
				$side = $('<div class="bb-page"><div class="bb-front"><div class="bb-outer"><div class="bb-content" style="left:' + (-this.elWidth / 2) + 'px;width:' + this.elWidth + 'px"><div class="bb-inner">' + (dir === 'next' ? this.$current.html() : this.$nextItem.html()) + '</div></div><div class="bb-flipoverlay"></div></div></div><div class="bb-back"><div class="bb-outer"><div class="bb-content" style="width:' + this.elWidth + 'px"><div class="bb-inner">' + (dir === 'next' ? this.$nextItem.html() : this.$current.html()) + '</div></div><div class="bb-flipoverlay"></div></div></div></div>').css('z-index', 103);
				break;
			case 'right':
				$side = $('<div class="bb-page"><div class="bb-front"><div class="bb-outer"><div class="bb-content" style="left:' + (-this.elWidth / 2) + 'px;width:' + this.elWidth + 'px"><div class="bb-inner">' + (dir === 'next' ? this.$nextItem.html() : this.$current.html()) + '</div></div><div class="bb-overlay"></div></div></div></div>').css('z-index', 101);
				break;
			}
			return $side;
		},
		_startSlideshow: function() {
			var self = this;
			this.slideshow = setTimeout(function() {
				self._navigate('next');
				if (self.options.autoplay) {
					self._startSlideshow();
				}
			}, this.options.interval);
		},
		_stopSlideshow: function() {
			if (this.options.autoplay) {
				clearTimeout(this.slideshow);
				this.options.autoplay = false;
			}
		},
		next: function() {
			this._action('next');
		},
		prev: function() {
			this._action('prev');
		},
		jump: function(page) {
			page -= 1;
			if (page === this.current || page >= this.itemsCount || page < 0) {
				return false;
			}
			this._action(page > this.current ? 'next' : 'prev', page);
		},
		isActive: function() {
			return this.isAnimating;
		},
		update : function () {
			var $currentItem = this.$items.eq( this.current );
			this.$items = this.$el.children('.bb-item');
			this.itemsCount = this.$items.length;
			this.current = $currentItem.index();
		}
	};
	var logError = function(message) {
		if (window.console) {
			window.console.error(message);
		}
	};
	$.fn.bookblock = function(options) {
		var instance = $.data(this, 'bookblock');
		if (typeof options === 'string') {
			var args = Array.prototype.slice.call(arguments, 1);
			this.each(function() {
				if (!instance) {
					logError("cannot call methods on bookblock prior to initialization; " + "attempted to call method '" + options + "'");
					return;
				}
				if (!$.isFunction(instance[options]) || options.charAt(0) === "_") {
					logError("no such method '" + options + "' for bookblock instance");
					return;
				}
				instance[options].apply(instance, args);
			});
		} else {
			this.each(function() {
				if (instance) {
					instance._init();
				} else {
					instance = $.data(this, 'bookblock', new $.BookBlock(options, this));
				}
			});
		}
		return instance;
	};
})(jQuery, window);
