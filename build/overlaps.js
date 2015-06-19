(function ($) {
	"use strict";

	$.fn.overlaps = function(obj, tolerance) {
		var elems = {targets: [], hits:[]};
		var tol = (typeof tolerance === "undefined") ? 1 : tolerance;

		this.each(function() {
			// Calculate the bounds
			var bounds = $(this).offset();
			bounds.right = bounds.left + $(this).outerWidth();
			bounds.bottom = bounds.top + $(this).outerHeight();

			// Calculate the compares
			var compare = $(obj).offset();
			compare.right = compare.left + $(obj).outerWidth();
			compare.bottom = compare.top + $(obj).outerHeight();

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