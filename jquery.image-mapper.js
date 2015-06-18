(function ($) {

    $.widget('ui.imageMapper', $.ui.mouse, {

		// Default options.
		options: {
			collideOnDraw: false,
			mapItemsListPercentage: false,
			mapItemClass: 'ui-map-item',
			drawHelperClass: 'ui-image-mapper-helper'
		},

        _init: function () {
            this.element
				.addClass('ui-image-mapper')
				.css({
					'position': 'absolute'
				});

			this.mapItems = [];

            this.dragged = true;

            this._mouseInit();

            this.helper = $('<div/>')
                .addClass('ui-image-mapper-helper');

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
				});

            $(this.element).append(this.container);

			$(this.element).find('img').css({
				'position': 'relative',
				'z-index': 1
			});
        },

        destroy: function () {
            this.element.removeClass('ui-image-mapper ui-image-mapper-disabled');
            this._mouseDestroy();
        },

        _mouseStart: function (event) {
			this.elPos = $(this.element).offset();
            this.opos = [
				(event.pageX - this.elPos.left),
				(event.pageY - this.elPos.top)
			];

            if (this.options.disabled)
                return;

            this._trigger('start', event);

            $(this.element).append(this.helper);

            this.helper.css({
                'z-index': 100,
                'position': 'absolute',
                'left': this.opos[0],
                'top': this.opos[1],
                'width': 0,
                'height': 0,
				'border': '2px dotted black'
            });
        },

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
                'width': x2-x1,
                'height': y2-y1
            });

            this._trigger('drag', event);

            return false;
        },

		_createMapItem: function (el) {
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

        _mouseStop: function (event) {
			var self = this;
            this.dragged = false;

            var mapItem = this.helper.clone().appendTo(this.container);


			$(mapItem).draggable({
				stack: '.ui-image-mapper-helper',
				containment: "parent",
				obstacle: this.options.drawHelperClass,
				preventCollision: true,
				stop: function (ev, ui) {
					var itemId = parseInt($(ui.helper.context).attr('data-id'), 10) - 1;
					self.mapItems[itemId].left = self._parseValue(ui.position.left);
					self.mapItems[itemId].top = self._parseValue(ui.position.top);
					self._trigger('updated', ev, { items: self.mapItems });
				}
			});

			$(mapItem).resizable({
				containment: "parent",
				stop: function (ev, ui) {
					var itemId = parseInt($(ui.helper.context).attr('data-id'), 10) - 1;
					self.mapItems[itemId].width = self._parseValue(ui.size.width);
					self.mapItems[itemId].height = self._parseValue(ui.size.height);
					self._trigger('updated', ev, { items: self.mapItems });
				}
			});

			$(mapItem).attr('data-id', (this.mapItems.length + 1));
			this._createMapItem(mapItem);

            this.helper.remove();

			this._trigger('updated', event, { items: this.mapItems });

            return false;
        },

		_parseValue: function (value) {
			if (this.options.mapItemsListPercentage === true) {
				return this._pixelToPercentageHorizontal(value)
			} else {
				return value.toString().replace('px', '') + 'px';
			}
		},

		_pixelToPercentageHorizontal: function (value) {
			var intValue = parseInt( value.toString().replace('px', ''), 10),
				intValueO = parseInt( $(this.container).width().toString(), 10),
				percent = (100 / intValueO) * intValue;

			return percent + '%';
		}
    });

    $.extend($.ui.imageMapper, {
        defaults: $.extend({}, $.ui.mouse.defaults)
    });

	$.fn.overlaps = function(obj) {
		var elems = {targets: [], hits:[]};

		this.each(function() {
			var bounds = $(this).offset();
			bounds.right = bounds.left + $(this).outerWidth();
			bounds.bottom = bounds.top + $(this).outerHeight();

			var compare = $(obj).offset();
			compare.right = compare.left + $(obj).outerWidth();
			compare.bottom = compare.top + $(obj).outerHeight();

			if (!(compare.right < bounds.left ||
				compare.left > bounds.right ||
				compare.bottom < bounds.top ||
				compare.top > bounds.bottom)
			) {
				elems.targets.push(this);
				elems.hits.push(obj);
			}
		});

		return elems;
	};

})(jQuery);