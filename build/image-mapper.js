(function ($) {

    $.widget('ui.imageMapper', $.ui.mouse, {

		// Default options.
		options: {
			handleCollision: true,
			collisionTolerance: 1,
			mapItemsListPercentage: false,
			mapItemClass: 'ui-map-item',
			drawHelperClass: 'ui-image-mapper-helper',
			zIndex: 100,
			revertDuration: 100,
			borderDrawSize: '1px',
			borderDrawStyle: 'dotted',
			borderDrawColor: '#000',
			borderDrawErrorSize: '1px',
			borderDrawErrorStyle: 'dotted',
			borderDrawErrorColor: '#ff0000',
			borderSize: '1px',
			borderStyle: 'solid',
			borderColor: '#69bce2',
			borderActiveSize: '1px',
			borderActiveStyle: 'solid',
			borderActiveColor: '#00aeff',
			borderActiveErrorSize: '1px',
			borderActiveErrorStyle: 'solid',
			borderActiveErrorColor: '#ff0000',
			backgroundDrawColor: 'rgba(0,174,255,0)',
			backgroundDrawErrorColor: 'rgba(255,0,0,0.1)',
			backgroundColor: 'rgba(0,174,255,0.1)',
			backgroundActiveColor: 'rgba(0,174,255,0.25)',
			backgroundActiveErrorColor: 'rgba(255,0,0,0.35)'
		},

		/**
		 * Set up the plugin.
		 *
		 * @private
		 */
        _init: function () {
			// Set up the plugin
			this.mapItems = [];
			this.dragged = true;
			this._mouseInit();

			// Style the draw element.
            this.element
				.addClass('ui-image-mapper')
				.css({
					'position': 'absolute'
				});

			// Create the helper
            this.helper = $('<div/>')
                .addClass('ui-image-mapper-helper')
				.addClass('drag');

			// Create the maps container
            this.container = $('<div/>')
                .addClass('ui-image-mapper-maps')
				.css({
					'position': 'absolute',
					'z-index': 2,
					'top': 0,
					'left': 0,
					'width': '100%',
					'height': '100%',
					'overflow': 'hidden'
				})
				.appendTo($(this.element));

			// Set the image position relative.
			$(this.element).find('img').css({
				'position': 'relative',
				'z-index': 1
			});
        },

		/**
		 * Destroy the plugin.
		 */
        destroy: function () {
            this.element.removeClass('ui-image-mapper ui-image-mapper-disabled');
            this._mouseDestroy();
        },

		/**
		 * Handle mouse start.
		 *
		 * @param event
		 */
        _mouseStart: function (event) {
			var self = this,
				opts = this.options;

			this.elPos = $(this.element).offset();
            this.opos = [
				(event.pageX - this.elPos.left),
				(event.pageY - this.elPos.top)
			];

            if (opts.disabled)
                return;

            this._trigger('start', event);
			this._setInactive($('.' + opts.drawHelperClass + '.active'));

            $(this.element).append(this.helper);

			this.helper.css({
				'z-index': (opts.zIndex + (this.mapItems.length + 1)),
				'position': 'absolute',
				'left': this.opos[0],
				'top': this.opos[1],
				'width': 0,
				'height': 0
			});

			this._setDraw(this.helper);
        },

		/**
		 * Handle mouse drag.
		 *
		 * @param event
		 * @returns {boolean}
		 */
        _mouseDrag: function (event) {
            this.dragged = true;

            if (this.options.disabled)
                return;

			var x1 = this.opos[0],
				y1 = this.opos[1],
				x2 = (event.pageX - this.elPos.left),
				y2 = (event.pageY - this.elPos.top);

            if (x1 > x2) {
                var tmp = x2;
                x2 = x1;
                x1 = tmp;
            }

			this.helper.css({
				'left': x1,
				'top': y1,
				'width': x2 - x1,
				'height': y2 - y1
			});

            this._trigger('drag', event);

			if (this._colliding()) {
				this._setDrawError(this.helper);
			} else {
				this._setDraw(this.helper);
			}

            return false;
        },

		/**
		 * Handle mouse stop.
		 *
		 * @param event
		 * @returns {boolean}
		 */
        _mouseStop: function (event) {
            this.dragged = false;

			var self = this,
				opts = self.options;

			if (self._colliding()) {
				self._resetAll(self.helper);
			} else {

				var mapItem = self.helper.clone().appendTo(self.container);

				self._setActive(mapItem);
				$(mapItem)
					.removeClass('drag')
					.addClass('drop')
					.draggable({
						zIndex: 500,
						stack: opts.drawHelperClass,
						containment: "parent",
						revertDuration: opts.revertDuration,
						revert: function () {
							if (self._colliding()) {
								return true;
							}
						},
						drag: function (ev, ui) {
							if (self._colliding()) {
								self._setError(ui.helper);
							} else {
								self._setActive(ui.helper)
							}
						},
						start: function (ev, ui) {
							if (!$(ui.helper).hasClass('active')) {
								self._setInactive($('.' + opts.drawHelperClass + '.active'));
							}

							$(ui.helper).removeClass('drop').addClass('drag');
						},
						stop: function (ev, ui) {
							if (!self._colliding()) {
								self._resetError(ui.helper);
								$(ui.helper).removeClass('drag').addClass('drop');
								var itemId = parseInt($(ui.helper).attr('data-id'), 10) - 1;
								self.mapItems[itemId].left = self._parseValue(ui.position.left);
								self.mapItems[itemId].top = self._parseValue(ui.position.top);
								self._trigger('updated', ev, {items: self.mapItems});
							}
						}
					})
					.resizable({
						containment: "parent",
						resize: function (ev, ui) {
							if (self._colliding()) {
								self._setError(ui.helper);
							} else {
								self._setActive(ui.helper)
							}
						},
						start: function (ev, ui) {
							if (!$(ui.helper).hasClass('active')) {
								self._setInactive($('.' + opts.drawHelperClass + '.active'));
							}
							$(ui.helper).removeClass('drop').addClass('drag');
						},
						stop: function (ev, ui) {
							$(ui.helper).removeClass('drag').addClass('drop');
							var itemId = parseInt($(ui.helper).attr('data-id'), 10) - 1;
							self.mapItems[itemId].width = self._parseValue(ui.size.width);
							self.mapItems[itemId].height = self._parseValue(ui.size.height);
							self._trigger('updated', ev, {items: self.mapItems});
						}
					})
					.attr('data-id', (this.mapItems.length + 1))
					.click(function (event) {
						if (!$(event.target).hasClass('active')) {
							self._setInactive($('.' + opts.drawHelperClass + '.active'));
							self._setActive(event.target);
						}
					});

				this._saveMapItem(mapItem);
				this.helper.remove();
				this._trigger('updated', event, {items: this.mapItems});
			}

            return false;
        },

		_resetAll: function (el) {
			var self = this;

			$(el).animate({
				'width': '0px',
				'height': '0px',
				'border-color': 'rgba(0,0,0,0)'
			}, self.options.revertDuration, function () {
				$(el).remove();
			})
		},

		_setActive: function (el) {
			var opts = this.options;

			$(el)
				.css({
					'z-index': 150,
					'border': opts.borderActiveSize + ' ' + opts.borderActiveStyle + ' ' + opts.borderActiveColor,
					'background-color': opts.backgroundActiveColor
				})
				.addClass('active');
		},

		_setInactive: function (el) {
			var opts = this.options;

			$(el)
				.css({
					'border': opts.borderSize + ' ' + opts.borderStyle + ' ' + opts.borderColor,
					'background-color': opts.backgroundColor
				})
				.removeClass('active');
		},

		_setError: function (el) {
			var opts = this.options;

			$(el)
				.css({
					'border': opts.borderActiveErrorSize + ' ' + opts.borderActiveErrorStyle + ' ' + opts.borderActiveErrorColor,
					'background-color': opts.backgroundActiveErrorColor
				})
				.addClass('error');
		},

		_resetError: function (el) {
			var opts = this.options;

			$(el)
				.css({
					'z-index': 150,
					'border': opts.borderActiveSize + ' ' + opts.borderActiveStyle + ' ' + opts.borderActiveColor,
					'background-color': opts.backgroundActiveColor
				})
				.removeClass('error');
		},

		_setDraw: function (el) {
			var opts = this.options;

			$(el).css({
				'border': opts.borderDrawSize + ' ' + opts.borderDrawStyle + ' ' + opts.borderDrawColor,
				'background-color': opts.backgroundDrawColor
			});
		},

		_setDrawError: function (el) {
			var opts = this.options;

			$(el).css({
				'border': opts.borderDrawErrorSize + ' ' + opts.borderDrawErrorStyle + ' ' + opts.borderDrawErrorColor,
				'background-color': opts.backgroundDrawErrorColor
			});
		},

		/**
		 * Stores the drawn map area.
		 *
		 * @param el
		 */
		_saveMapItem: function (el) {
			var id = this.options.mapItemClass + '-' + (this.mapItems.length + 1),
				item = {
					id: id,
					left: this._parseValue(el.css('left')),
					top: this._parseValue(el.css('top')),
					width: this._parseValue(el.css('width')),
					height: this._parseValue(el.css('height'))
				};

			$(el).attr('id', id);
			this.mapItems.push(item);
		},

		/**
		 * Parse the resize and drag values to pixel or percentage.
		 *
		 * @param value
		 * @returns {*}
		 */
		_parseValue: function (value) {
			if (this.options.mapItemsListPercentage === true) {
				return this._pixelToPercentageHorizontal(value)
			} else {
				return value.toString().replace('px', '') + 'px';
			}
		},

		/**
		 * Calculate the percentage value from pixel value depending on the plugin element dimensions.
		 *
		 * @param value
		 * @returns {string}
		 * @private
		 */
		_pixelToPercentageHorizontal: function (value) {
			var intValue = parseInt( value.toString().replace('px', ''), 10),
				intValueO = parseInt( $(this.container).width().toString(), 10),
				percent = (100 / intValueO) * intValue;

			return percent + '%';
		},

		_colliding: function () {
			if (this.options.handleCollision) {
				var drag = $('.drag'),
					drop = $('.drop'),
					collides = drop.overlaps(drag, this.options.collisionTolerance);

				return (collides.targets.length > 0);
			} else {
				return false;
			}
		}
    });

    $.extend($.ui.imageMapper, {
        defaults: $.extend({}, $.ui.mouse.defaults)
    });

})(jQuery);