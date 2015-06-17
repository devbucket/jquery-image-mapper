(function ($) {

    $.widget('ui.imageMapper', $.ui.mouse, {

        defaults: $.extend({}, $.ui.mouse.defaults, {
            appendTo: 'body'
        }),

        _init: function () {
            this.element.addClass('ui-image-mapper');
            this.dragged = true;
            this._mouseInit();
            this.helper = $('<div/>')
                .addClass('ui-image-mapper-helper');
            this.container = $('<div/>')
                .addClass('ui-image-mapper-maps');
            $(this.element).append(this.container);
        },

        destroy: function () {
            this.element.removeClass('ui-image-mapper ui-image-mapper-disabled');
            this._mouseDestroy();
        },

        _mouseStart: function (event) {
            this.opos = [event.pageX, event.pageY];

            if (this.options.disabled)
                return;

            this._trigger('start', event);

            $(this.options.appendTo).append(this.helper);

            this.helper.css({
                'z-index': 100,
                'position': 'absolute',
                'left': event.pageX,
                'top': event.pageY,
                'width': 0,
                'height': 0
            });
        },

        _mouseDrag: function (event) {
            this.dragged = true;

            if (this.options.disabled)
                return;

            var x1 = this.opos[0],
                y1 = this.opos[1],
                x2 = this.pageX,
                y2 = this.pageY;

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

        _mouseStop: function (event) {
            this.dragged = false;

            var clone = this.helper.clone().appendTo(this.container);
            this.helper.remove();

            return false;
        }
    });

    $.extend($.ui.imageMapper, {
        defaults: $.extend({}, $.ui.mouse.defaults, {
            appendTo: 'body',
            distance: 0
        })
    });

})(jQuery);