(function ($) {
	"use strict";

    $.widget('ui.imageMapper', $.ui.mouse, {

		// Default options.
		options: {
			handleCollision: true,
			collisionTolerance: 1,
			autoHideHandles: true,
			elementClass: 'ui-image-mapper',
			elementDisabledClass: 'ui-image-mapper-disabled',
			mapItemsListPercentage: false,
			drawHelperClass: 'ui-image-mapper-helper',
			drawHelperSpecialClass: '',
			drawHelperMinWidth: 20,
			drawHelperMinHeight: 20,
			drawHelperContainerClass: 'ui-image-mapper-maps',
			objectTypes: 'div',
			zIndex: 10,
			zIndexActive: 150,
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
			var self = this;

			self.elementTag = '<' + self.options.objectTypes + '/>';

			// Set up the plugin
			self.mapItems = [];
			self.dragged = true;
			self.active = null;
			self._mouseInit();

			// Style the element.
			self.element
				.addClass(self.options.elementClass)
				.css({
					'position': 'relative'
				});

			// Set the image position relative.
			$(self.element).find('img').css({
				'position': 'relative',
				'z-index': 1,
				'pointer-events': 'none'
			});

			// Create the maps container
			self.container = $(self.elementTag)
                .addClass(this.options.drawHelperContainerClass)
				.css({
					'position': 'absolute',
					'z-index': 2,
					'top': 0,
					'left': 0,
					'width': '100%',
					'height': '100%',
					'overflow': 'hidden'
				})
				.appendTo($(self.element));

			// Create the helper
			self.helper = $(self.elementTag)
				.addClass(self.options.drawHelperClass)
				.addClass('drag');

			// Delete the active helper on pressing delete or back key
			$('html').keyup(function (event) {
				if (event.keyCode === 8 || event.keyCode === 46) {
					self._deleteActive(event);
				}
			});
		},

		/**
		 * Retrieve all map area.
		 *
		 * @returns {Array}
		 */
		items: function () {
			return this.mapItems;
		},

		/**
		 * Retrieve the current map area.
		 *
		 * @returns {helper|*}
		 */
		item: function () {
			return this.helper;
		},

		/**
		 * Destroy the plugin.
		 */
        destroy: function () {
			var $img = this.element.find('img');

            this.element
				.removeClass(this.options.elementClass + ' ' + this.options.elementDisabledClass)
				.css({ 'position': '' });

			if ('' == this.element.attr('style')) {
				this.element.removeAttr('style');
			}

			if ('' == this.element.attr('class')) {
				this.element.removeAttr('class');
			}

			$img.css({
				'position': '',
				'z-index': '',
				'pointer-events': ''
			});

			if ('' == $img.attr('style')) {
				$img.removeAttr('style');
			}

			this.container.remove();
			this.mapItems.splice(0, this.mapItems.length);
            this._mouseDestroy();
        },

		/**
		 * Handle mouse start.
		 *
		 * @param event
		 */
        _mouseStart: function (event) {
			var self = this,
				opts = self.options;

			if (opts.disabled)
				return;

			self.elPos = $(self.element).offset();
			self.opos = [
				(event.pageX - self.elPos.left),
				(event.pageY - self.elPos.top)
			];

			self._trigger('start', event, self.helper);
			self._setInactive($('.' + opts.drawHelperClass + '.active'));

            $(self.element).append(self.helper);

			self.helper.css({
				'z-index': (opts.zIndex + (self.mapItems.length + 1)),
				'position': 'absolute',
				'left': self.opos[0],
				'top': self.opos[1],
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
			var self = this;

			self.dragged = true;

            if (self.options.disabled)
                return false;

			var x1 = self.opos[0],
				y1 = self.opos[1],
				x2 = (event.pageX - self.elPos.left),
				y2 = (event.pageY - self.elPos.top);

            if (x1 > x2) {
                var tmp = x2;
                x2 = x1;
                x1 = tmp;
            }

			self.helper.css({
				'left': x1,
				'top': y1,
				'width': x2 - x1,
				'height': y2 - y1
			});

			self._trigger('drag', event);

			if (self._colliding()) {
				self._setDrawError(self.helper);
			} else {
				self._setDraw(self.helper);
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
			var self = this,
				opts = self.options;

			self.dragged = false;

			if (opts.disabled)
				return false;

			if (self._colliding()) {
				self._resetAll(self.helper);
			} else {
				var mapItem = self.helper.clone().appendTo(self.container);

				self._setMinWidth(mapItem);
				self._setActive(mapItem);

				$(mapItem)
					.addClass(opts.drawHelperSpecialClass)
					.attr('data-special', opts.drawHelperSpecialClass)
					.removeClass('drag')
					.addClass('drop')

					// Apply jQuery UI draggable
					.draggable({
						stack: opts.drawHelperClass,
						containment: "parent",
						revertDuration: opts.revertDuration,
						revert: function () {
							// Revert position if colliding with other element.
							return self._colliding();
						},
						drag: function (ev, ui) {
							if (self._colliding()) {
								// Style as error if colliding with other element.
								self._setError(ui.helper);
							} else {
								// Style as active if not colliding with other element.
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
								var itemId = parseInt($(ui.helper).attr('data-id'), 10) - 1;
								self._resetError(ui.helper);
								$(ui.helper).removeClass('drag').addClass('drop');
								self.mapItems[itemId].left = self._parseValue(ui.position.left);
								self.mapItems[itemId].top = self._parseValue(ui.position.top);
								self._triggerUpdateItems(ev);
							}
						}
					})

					// Apply jQuery UI resizable
					.resizable({
						autoHide: self.options.autoHideHandles,
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
							if (!self._colliding()) {
								$(ui.helper).removeClass('drag').addClass('drop');
								var itemId = parseInt($(ui.helper).attr('data-id'), 10) - 1;
								self.mapItems[itemId].width = self._parseValue(ui.size.width);
								self.mapItems[itemId].height = self._parseValue(ui.size.height);
								self._triggerUpdateItems(ev);
							} else {
								$(ui.helper).animate({
									'width': ui.originalSize.width + 'px',
									'height': ui.originalSize.height + 'px'
								}, self.options.revertDuration, function () {
									self._setActive(ui.helper);
								});
							}
						}
					})

					.attr('data-id', (this.mapItems.length + 1))

					.click(function (event) {
						if (!$(event.target).hasClass('active')) {
							self._setInactive($('.' + opts.drawHelperClass + '.active'));
							self._setActive(event.target);
							self._trigger('active', event, self.active);
						}
					});

				self._saveMapItem(mapItem);
				self.helper.remove();
				self._triggerUpdateItems(event);
			}

            return false;
        },

		_setMinWidth: function (el) {
			var self = this,
				opts = self.options;

			if ($(el).width() < opts.drawHelperMinWidth) {
				$(el).css({ 'width': opts.drawHelperMinWidth + 'px' });
			}

			if ($(el).height() < opts.drawHelperMinHeight) {
				$(el).css({ 'height': opts.drawHelperMinHeight + 'px' });
			}
		},

		_setActive: function (el) {
			var self = this,
				opts = self.options;

			self.active = $(el);

			$(el).css({
				'z-index': opts.zIndexActive,
				'border': opts.borderActiveSize + ' ' + opts.borderActiveStyle + ' ' + opts.borderActiveColor,
				'background-color': opts.backgroundActiveColor
			}).addClass('active');
		},

		_setInactive: function (el) {
			var self = this,
				opts = self.options;

			$(el).css({
				'z-index': opts.zIndex,
				'border': opts.borderSize + ' ' + opts.borderStyle + ' ' + opts.borderColor,
				'background-color': opts.backgroundColor
			}).removeClass('active');
		},

		_setError: function (el) {
			var self = this,
				opts = self.options;

			$(el).css({
				'border': opts.borderActiveErrorSize + ' ' + opts.borderActiveErrorStyle + ' ' + opts.borderActiveErrorColor,
				'background-color': opts.backgroundActiveErrorColor
			}).addClass('error');
		},

		_resetError: function (el) {
			var self = this,
				opts = self.options;

			$(el).css({
				'z-index': opts.zIndexActive,
				'border': opts.borderActiveSize + ' ' + opts.borderActiveStyle + ' ' + opts.borderActiveColor,
				'background-color': opts.backgroundActiveColor
			}).removeClass('error');
		},

		_setDraw: function (el) {
			var self = this,
				opts = self.options;

			$(el).css({
				'z-index': opts.zIndex,
				'border': opts.borderDrawSize + ' ' + opts.borderDrawStyle + ' ' + opts.borderDrawColor,
				'background-color': opts.backgroundDrawColor
			});
		},

		_setDrawError: function (el) {
			var self = this,
				opts = self.options;

			$(el).css({
				'border': opts.borderDrawErrorSize + ' ' + opts.borderDrawErrorStyle + ' ' + opts.borderDrawErrorColor,
				'background-color': opts.backgroundDrawErrorColor
			});
		},

		_resetAll: function (el) {
			var self = this;

			$(el).animate({
				'z-index': self.options.zIndex,
				'width': '0px',
				'height': '0px',
				'border-color': 'rgba(0,0,0,0)'
			}, self.options.revertDuration, function () {
				$(el).remove();
			})
		},

		/**
		 * Delete the active marker.
		 */
		_deleteActive: function (event) {
			var self = this;

			if (self.active !== null) {
				var $active = $(self.active);
				self._deleteMapItem($active);
				$active.remove();
				self._triggerUpdateItems(event);
			}
		},

		/**
		 * Stores the drawn map area.
		 *
		 * @param el
		 */
		_saveMapItem: function (el) {
			var self = this,
				id = self.options.drawHelperClass + '-' + (self.mapItems.length + 1),
				item = {
					id: id,
					left: self._parseValue(el.css('left')),
					top: self._parseValue(el.css('top')),
					width: self._parseValue(el.css('width')),
					height: self._parseValue(el.css('height'))
				};

			$(el).attr('id', id);
			self.mapItems.push(item);
		},

		/**
		 * Deletes the map area.
		 *
		 * @param el
		 */
		_deleteMapItem: function (el) {
			var self = this,
				id = parseInt($(el).attr('data-id'), 10) - 1;

			self.mapItems.splice(id, 1);
		},

		/**
		 * Parse the resize and drag values to pixel or percentage.
		 *
		 * @param value
		 * @returns {*}
		 */
		_parseValue: function (value) {
			var self = this;

			if (self.options.mapItemsListPercentage === true) {
				return self._pixelToPercentageHorizontal(value)
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

		/**
		 * Checks if the dragged element collides with other elements.
		 *
		 * @returns {boolean}
		 * @private
		 */
		_colliding: function () {
			var self = this;

			if (self.options.handleCollision) {
				var drag = $('.drag'),
					drop = $('.drop'),
					collides = drop.overlaps(drag, self.options.collisionTolerance);

				return (collides.targets.length > 0);
			} else {
				return false;
			}
		},

		/**
		 * Triggers the update event.
		 *
		 * @param event
		 */
		_triggerUpdateItems: function (event) {
			var self = this,
				items = null;

			if (self.mapItems.length) {
				items = self.mapItems;
			}

			self._trigger('updated', event, [items]);
		}
    });

    $.extend($.ui.imageMapper, {
        defaults: $.extend({}, $.ui.mouse.defaults)
    });

})(jQuery);