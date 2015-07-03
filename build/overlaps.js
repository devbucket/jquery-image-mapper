(function ($) {
	"use strict";

	$.fn.overlaps = function(obj, tolerance) {
		var elems = {targets: [], hits:[]},
			$obj = $(obj),
			tol = (typeof tolerance === "undefined") ? 1 : tolerance;

		this.each(function() {
			var $el = $(this);

			// Calculate the bounds
			var bounds = $el.offset();
			bounds.right = bounds.left + $el.outerWidth();
			bounds.bottom = bounds.top + $el.outerHeight();

			// Calculate the compares
			var compare = $obj.offset();
			compare.right = compare.left + $obj.outerWidth();
			compare.bottom = compare.top + $obj.outerHeight();

			if ( ! (
				(compare.right+tol) < bounds.left ||
				(compare.left-tol) > bounds.right ||
				(compare.bottom+tol) < bounds.top ||
				(compare.top-tol) > bounds.bottom)
			) {
				elems.targets.push(this);
				elems.hits.push(obj);
			}
		});

		return elems;
	};

})(jQuery);