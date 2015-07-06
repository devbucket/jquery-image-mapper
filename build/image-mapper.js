(function ($) {
	"use strict";

	var pluginName = 'imageMapper';

    $.widget('ui.' + pluginName, $.ui.mouse, {

		DIRECTION_HORIZONTAL: 'horizontal',
		DIRECTION_VERTICAL: 'vertical',

		// Default options.
		options: {
			data: [],
			handleCollision: true,
			collisionTolerance: 1,
			autoHideHandles: true,
			elementClass: 'ui-image-mapper',
			elementDisabledClass: 'ui-image-mapper-disabled',
			percentageValues: false,
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
			var self = this,
				opts = self.options;

			self.pluginName = pluginName;

			self.elementTag = '<' + opts.objectTypes + '/>';

			// Set up the plugin
			self.mapItems = [];
			self.dragged = true;
			self.active = null;
			self._mouseInit();

			// Style the element.
			self.element
				.addClass(opts.elementClass)
				.css({
					'display': 'inline-block',
					'position': 'relative'
				});

			// Set the image position relative.
			self.element.children('img').css({
				'position': 'relative',
				'z-index': 1,
				'pointer-events': 'none'
			});

			if (opts.percentageValues) {
				self.element.children('img').css({
					'width': '100%',
					'max-width': '100%',
					'height': 'auto'
				})
			}

			// Create the maps container
			self.container = $(self.elementTag)
                .addClass(opts.drawHelperContainerClass)
				.css({
					'position': 'absolute',
					'z-index': 2,
					'top': 0,
					'left': 0,
					'width': '100%',
					'height': '100%',
					'overflow': 'hidden'
				})
				.appendTo(self.element)
				.click(function (event) {
					if ($(event.target).hasClass(opts.drawHelperContainerClass)) {
						self._setInactive($('.' + opts.drawHelperClass + '.active'));
						self.active = null;
						opts.drawHelperSpecialClass = '';
						self._trigger('inactive', event);
					}
				});

			// Create the helper
			self.helper = $(self.elementTag).addClass(opts.drawHelperClass + ' drag');

			self._trigger('init', self);

			// Delete the active helper on pressing delete or back key
			$('html').keyup(function (event) {
				if (event.keyCode === 8 || event.keyCode === 46) {
					self._deleteActive(event);
				}
			});

			self._setExistingData();
		},

		/**
		 * Adds existing data to the painting canvas.
		 */
		_setExistingData: function () {
			var self = this,
				opts = self.options,
				extra;

			if (opts.data.length) {
				$.each(opts.data, function (index, item) {
					var special = null,
						existingItem = $(self.elementTag).appendTo(self.container);

					if (opts.drawHelperSpecialClass !== '') {
						special = opts.drawHelperSpecialClass
					}

					if (typeof item.special !== 'undefined') {
						special = item.special;
					}

					existingItem
						.css({
							'z-index': (opts.zIndex + (self.mapItems.length + 1)),
							'position': 'absolute',
							'left': self._parseValue(item.left, self.DIRECTION_HORIZONTAL, true),
							'top': self._parseValue(item.top, self.DIRECTION_VERTICAL, true),
							'width': self._parseValue(item.width, self.DIRECTION_HORIZONTAL, true),
							'height': self._parseValue(item.height, self.DIRECTION_VERTICAL, true)
						})
						.addClass(opts.drawHelperClass + ' ' + special + ' drop')
						.attr('data-id', (self.mapItems.length + 1));

					if (special !== null) {
						existingItem.attr('data-special', special);
					}

					self._addDraggable(existingItem);
					self._addResizable(existingItem);

					existingItem
						.click(function (event) {
							var target = !$(event.target).hasClass(opts.drawHelperClass) ? $(event.target).parent() : $(event.target);

							if (!target.hasClass('active')) {
								self._setInactive($('.' + opts.drawHelperClass + '.active'));
								self._setActive(target);
								self._trigger('active', event, self.active);
							}
						});

					extra = item;
					delete extra['id'];
					delete extra['special'];
					delete extra['left'];
					delete extra['top'];
					delete extra['width'];
					delete extra['height'];


					self._setInactive(existingItem);
					self._saveMapItem(existingItem, item.id, special, extra);
				});
			}
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
			return this.active;
		},

		/**
		 * Toggle the special class and attribute.
		 *
		 * @param newSpecial
		 */
		toggleSpecial: function (newSpecial) {
			var id = parseInt($(this.active).attr('data-id'), 10) - 1;

			$(this.active)
				.removeClass($(this.active).attr('data-special'))
				.addClass(newSpecial)
				.attr('data-special', newSpecial);

			this.options.drawHelperSpecialClass = newSpecial;
			this.mapItems[id].special = newSpecial;
			this._triggerUpdateItems(null);
		},

		/**
		 * Deletes the current active map.
		 *
		 * @param event
		 */
		deleteActive: function (event) {
			this._deleteActive(event);
		},

		/**
		 * Appends a custom data object to the active map item.
		 *
		 * @param data
		 */
		addMapData: function (data) {
			if (typeof data !== 'unedfined' && this.active !== null) {
				var id = parseInt($(this.active).attr('data-id'), 10) - 1;

				$.extend(this.mapItems[id], data);
				this._triggerUpdateItems(null);
			}
		},

		/**
		 * Destroy the plugin.
		 */
        destroy: function () {
			var self = this,
				$img = this.element.find('img');

			$img.css({
				'position': '',
				'z-index': '',
				'pointer-events': ''
			});

			if ('' == $img.attr('style')) {
				$img.removeAttr('style');
			}

			$(this.element)
				.removeClass(this.options.elementClass)
				.removeClass(this.options.elementDisabledClass)
				.css({ 'position': '' });

			if ('' == this.element.attr('style')) {
				this.element.removeAttr('style');
			}

			if ('' == this.element.attr('class')) {
				this.element.removeAttr('class');
			}

			$(this.element).each(function () {
				var dataAttr = 'ui' + self.pluginName.charAt(0).toUpperCase() + self.pluginName.slice(1);
				$(this).removeData(dataAttr)
			});

			$('.' + this.options.drawHelperContainerClass).remove();

			this.mapItems.splice(0, this.mapItems.length);
			this.dragged = false;
			this.active = null;
			this._mouseDestroy();

			this._trigger('destroy');

			$.Widget.prototype.destroy.apply( this, arguments );
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

			self.container.css({'pointer-events': 'none'});

			self.elPos = $(self.element).offset();
			self.opos = [
				(event.pageX - self.elPos.left),
				(event.pageY - self.elPos.top)
			];

			self._trigger('start', event, self.helper);
			self._setInactive($('.' + opts.drawHelperClass + '.active'));

            $(self.container).append(self.helper);

			self.helper.css({
				'z-index': (opts.zIndex + (self.mapItems.length + 1)),
				'position': 'absolute',
				'left': self._parseValue(self.opos[0], self.DIRECTION_HORIZONTAL),
				'top': self._parseValue(self.opos[1], self.DIRECTION_VERTICAL),
				'width': self._parseValue(0, self.DIRECTION_HORIZONTAL),
				'height': self._parseValue(0, self.DIRECTION_VERTICAL)
			});

			self._setDraw(self.helper);
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

			var x1 = (self.opos[0]+2),
				y1 = (self.opos[1]+2),
				x2 = (event.pageX - self.elPos.left),
				y2 = (event.pageY - self.elPos.top);

            if (x1 > x2) {
                var tmp = x2;
                x2 = x1;
                x1 = tmp;
            }

			self.helper.css({
				'left': self._parseValue(x1, self.DIRECTION_HORIZONTAL),
				'top': self._parseValue(y1, self.DIRECTION_VERTICAL),
				'width': self._parseValue(x2 - x1, self.DIRECTION_HORIZONTAL),
				'height': self._parseValue(y2 - y1, self.DIRECTION_VERTICAL)
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
				opts = self.options,
				special = null,
				mapItem;

			self.dragged = false;

			if (opts.disabled)
				return false;

			// If colliding, remove the area with animation
			if (self._colliding()) {
				self._resetAll(self.helper);

			// if not colliding, place it.
			} else {
				mapItem = self.helper.clone().appendTo(self.container);

				self._setMinWidth(mapItem);
				self._setActive(mapItem);

				mapItem
					.removeClass('drag')
					.addClass(opts.drawHelperSpecialClass + ' drop');

				if (opts.drawHelperSpecialClass !== '') {
					special = opts.drawHelperSpecialClass;
					mapItem.attr('data-special', special);
				}

				self._trigger('active', event, mapItem);

				self._addDraggable(mapItem);
				self._addResizable(mapItem);

				mapItem
					.attr('data-id', (this.mapItems.length + 1))
					.click(function (event) {
						var target = !$(event.target).hasClass(opts.drawHelperClass) ? $(event.target).parent() : $(event.target);

						if (!target.hasClass('active')) {
							self._setInactive($('.' + opts.drawHelperClass + '.active'));
							self._setActive(target);
							self._trigger('active', event, self.active);
						}
					});

				self._saveMapItem(mapItem, null, special);
				self.helper.remove();
				self._triggerUpdateItems(event);
			}

			self.container.css({
				'pointer-events': 'auto'
			});

            return false;
        },

		/**
		 * Add the jQuery UI draggable plugin to the element.
		 *
		 * @param el
		 */
		_addDraggable: function (el) {
			var self = this,
				opts = self.options;

			$(el).draggable({
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
					// remove .active class from all others
					// if it is not on current element.
					if (!$(ui.helper).hasClass('active')) {
						self._setInactive($('.' + opts.drawHelperClass + '.active'));
					}

					$(ui.helper).removeClass('drop').addClass('drag');
					self._setActive(ui.helper);
					self._trigger('active', event, self.active);
				},
				stop: function (ev, ui) {
					if (!self._colliding()) {
						var itemId = parseInt($(ui.helper).attr('data-id'), 10) - 1;
						self._resetError(ui.helper);
						$(ui.helper).removeClass('drag').addClass('drop');
						self.mapItems[itemId].left = self._parseValue(ui.position.left, self.DIRECTION_HORIZONTAL);
						self.mapItems[itemId].top = self._parseValue(ui.position.top, self.DIRECTION_VERTICAL);
						self._triggerUpdateItems(ev);
					}
				}
			});
		},

		/**
		 * Add the jQuery UI resizable plugin to the element.
		 *
		 * @param el
		 */
		_addResizable: function (el) {
			var self = this,
				opts = self.options;

			$(el).resizable({
				minWidth: opts.drawHelperMinWidth,
				minHeight: opts.drawHelperMinHeight,
				autoHide: self.options.autoHideHandles,
				containment: "parent",
				resize: function (ev, ui) {
					if (self._colliding()) {
						// Style as error if colliding with other element.
						self._setError(ui.helper);
					} else {

						// Style as active if not colliding with other element.
						self._setActive(ui.helper)
					}
				},
				start: function (ev, ui) {
					// remove .active class from all others
					// if it is not on current element.
					if (!$(ui.helper).hasClass('active')) {
						self._setInactive($('.' + opts.drawHelperClass + '.active'));
					}

					$(ui.helper).removeClass('drop').addClass('drag');

					self._setActive(ui.helper);
					self._trigger('active', event, self.active);
				},
				// The .resizable() plugin doesn't have a revert callback
				// like the .draggable() plugin, so it has to be custom created.
				stop: function (ev, ui) {
					// If not colliding with others, stay resized ...
					if (!self._colliding()) {
						$(ui.helper).removeClass('drag').addClass('drop');
						var itemId = parseInt($(ui.helper).attr('data-id'), 10) - 1;
						self.mapItems[itemId].width = self._parseValue(ui.size.width, self.DIRECTION_HORIZONTAL);
						self.mapItems[itemId].height = self._parseValue(ui.size.height, self.DIRECTION_VERTICAL);
						self._triggerUpdateItems(ev);
					// ... otherwise animate back to former size.
					} else {
						$(ui.helper).animate({
							'width': self._parseValue(ui.originalSize.width, self.DIRECTION_HORIZONTAL),
							'height': self._parseValue(ui.originalSize.height, self.DIRECTION_VERTICAL)
						}, self.options.revertDuration, function () {
							self._setActive(ui.helper);
						});
					}
				}
			});
		},

		/**
		 * Set the minimum width and height of the
		 * element. Has to be at least 10px!
		 *
		 * @param el
		 */
		_setMinWidth: function (el) {
			var opts = this.options,
				minWidth = (opts.drawHelperMinWidth >= 10) ? opts.drawHelperMinWidth : 10,
				minHeight = (opts.drawHelperMinHeight >= 10) ? opts.drawHelperMinHeight : 10;

			if ($(el).width() < minWidth) {
				$(el).css({ 'width': this._parseValue(minWidth, this.DIRECTION_HORIZONTAL) });
			}

			if ($(el).height() < minHeight) {
				$(el).css({ 'height': this._parseValue(minHeight, this.DIRECTION_VERTICAL) });
			}
		},

		/**
		 * Set the element to active state.
		 *
		 * @param el
		 */
		_setActive: function (el) {
			var opts = this.options;

			this.active = $(el);

			$(el).css({
				'z-index': opts.zIndexActive,
				'border': opts.borderActiveSize + ' ' + opts.borderActiveStyle + ' ' + opts.borderActiveColor,
				'background-color': opts.backgroundActiveColor
			}).addClass('active');
		},

		/**
		 * Set the element to inactive state.
		 *
		 * @param el
		 */
		_setInactive: function (el) {
			var opts = this.options;

			$(el).css({
				'z-index': opts.zIndex,
				'border': opts.borderSize + ' ' + opts.borderStyle + ' ' + opts.borderColor,
				'background-color': opts.backgroundColor
			}).removeClass('active');
		},

		/**
		 * Set the element to error state.
		 *
		 * @param el
		 */
		_setError: function (el) {
			var opts = this.options;

			$(el).css({
				'border': opts.borderActiveErrorSize + ' ' + opts.borderActiveErrorStyle + ' ' + opts.borderActiveErrorColor,
				'background-color': opts.backgroundActiveErrorColor
			}).addClass('error');
		},

		/**
		 * Remove the error state from element.
		 *
		 * @param el
		 */
		_resetError: function (el) {
			var opts = this.options;

			$(el).css({
				'z-index': opts.zIndexActive,
				'border': opts.borderActiveSize + ' ' + opts.borderActiveStyle + ' ' + opts.borderActiveColor,
				'background-color': opts.backgroundActiveColor
			}).removeClass('error');
		},

		/**
		 * Set the element to draw state.
		 *
		 * @param el
		 */
		_setDraw: function (el) {
			var opts = this.options;

			$(el).css({
				'z-index': opts.zIndex,
				'border': opts.borderDrawSize + ' ' + opts.borderDrawStyle + ' ' + opts.borderDrawColor,
				'background-color': opts.backgroundDrawColor
			});
		},

		/**
		 * Set the element to draw error state.
		 *
		 * @param el
		 */
		_setDrawError: function (el) {
			var opts = this.options;

			$(el).css({
				'border': opts.borderDrawErrorSize + ' ' + opts.borderDrawErrorStyle + ' ' + opts.borderDrawErrorColor,
				'background-color': opts.backgroundDrawErrorColor
			});
		},

		/**
		 * Reset the draw area when e.g. it collides with others on release.
		 *
		 * @param el
		 */
		_resetAll: function (el) {
			$(el).animate({
				'z-index': this.options.zIndex,
				'width': this._parseValue(0, this.DIRECTION_HORIZONTAL),
				'height': this._parseValue(0, this.DIRECTION_VERTICAL),
				'border-color': 'rgba(0,0,0,0)'
			}, this.options.revertDuration, function () {
				$(el).remove();
			});
		},

		/**
		 * Delete the active marker.
		 */
		_deleteActive: function (event) {
			if (this.active !== null) {
				this._deleteMapItem(this.active);
				this.active.remove();
				this.active = null;
				this._triggerUpdateItems(event);
				this._trigger('inactive', event)
			}
		},

		/**
		 * Stores the drawn map area.
		 *
		 * @param el
		 * @param id
		 * @param special
		 * @param extra
		 */
		_saveMapItem: function (el, id, special, extra) {
			var opts = this.options,
				item = {};

			if (typeof id === 'undefined' || id === null) {
				id = opts.drawHelperClass + '-' + (this.mapItems.length + 1);
			}

			$(el).attr('id', id);

			item.id 	= id;
			item.left 	= this._parseValue(el.css('left'), this.DIRECTION_HORIZONTAL);
			item.top 	= this._parseValue(el.css('top'), this.DIRECTION_VERTICAL);
			item.width 	= this._parseValue(el.css('width'), this.DIRECTION_HORIZONTAL);
			item.height	= this._parseValue(el.css('height'), this.DIRECTION_VERTICAL);

			if (opts.drawHelperSpecialClass !== '') {
				item.special = opts.drawHelperSpecialClass
			}

			if (typeof special !== 'undefined') {
				item.special = special;
			}

			if (typeof extra !== "undefined" && extra.length !== 0) {
				$.extend(item, extra);
			}

			this.mapItems.push(item);
		},

		/**
		 * Deletes the map area.
		 *
		 * @param el
		 */
		_deleteMapItem: function (el) {
			var id = parseInt($(el).attr('data-id'), 10) - 1;
			this.mapItems.splice(id, 1);
		},

		/**
		 * Parse the resize and drag values to percent.
		 *
		 * @param value
		 * @param orientation
		 * @param isPercentage
		 * @returns {*}
		 */
		_parseValue: function (value, orientation, isPercentage) {
			var newValue;

			if (typeof orientation === 'undefined')
				orientation = this.DIRECTION_HORIZONTAL;

			if (typeof isPercentage === 'undefined')
				isPercentage = false;

			if (this.options.percentageValues === true && !isPercentage) {
				switch (orientation) {
					case this.DIRECTION_HORIZONTAL:
					default:
						newValue = this._pixelToPercentageHorizontal(value);
						break;
					case this.DIRECTION_VERTICAL:
						newValue = this._pixelToPercentageVertical(value);
						break;
				}
			} else {
				if (isPercentage) {
					newValue = value;
				} else {
					newValue = value.toString().replace('px', '') + 'px';
				}
			}

			return newValue;
		},

		/**
		 * Calculate the percentage value from pixel value depending on the plugin element horizontal dimensions.
		 *
		 * @param value
		 * @returns {string}
		 * @private
		 */
		_pixelToPercentageHorizontal: function (value) {
			var intValue = parseFloat(value.toString().replace('px', '')),
				intValueO = parseFloat(this.element.children('img').width().toString()),
				percent = (100 / intValueO) * intValue;

			return percent + '%';
		},

		/**
		 * Calculate the percentage value from pixel value depending on the plugin element vertical dimensions.
		 *
		 * @param value
		 * @returns {string}
		 * @private
		 */
		_pixelToPercentageVertical: function (value) {
			var intValue = parseFloat(value.toString().replace('px', '')),
				intValueO = parseFloat(this.element.children('img').height().toString()),
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
			if (this.options.handleCollision === true) {
				var drag = $('.drag'),
					drop = $('.drop'),
					collides = drop.overlaps(drag, this.options.collisionTolerance);

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
			var items = (this.mapItems.length) ? this.mapItems : null;
			this._trigger('updated', event, [items]);
		}
    });

    $.extend($.ui.imageMapper, {
        defaults: $.extend({}, $.ui.mouse.defaults)
    });

})(jQuery);