(function ($) {
	"use strict";

	$.fn.overlaps = function(obj, tolerance, reverse) {
		var elems = {targets: [], hits:[]},
			$obj = $(obj),
			tol = (typeof tolerance === "undefined") ? 1 : tolerance,
			rev = (typeof reverse === "undefined" && typeof reverse !== "boolean") ? false : reverse;

		this.each(function() {
			var $el = $(this);

			// Calculate the bounds
			var bounds 		= $el.offset();
			bounds.right 	= bounds.left + $el.outerWidth();
			bounds.bottom 	= bounds.top + $el.outerHeight();

			// Calculate the compares
			var compare 	= $obj.offset();
			compare.right 	= compare.left + $obj.outerWidth();
			compare.bottom 	= compare.top + $obj.outerHeight();

			// Calculate the real compare values
			var compRight 	= compare.right + tol,
				compLeft 	= compare.left - tol,
				compBottom 	= compare.bottom + tol,
				compTop 	= compare.top - tol;

			// Compare it.
			var collapsing = !(compRight < bounds.left || compLeft > bounds.right || compBottom < bounds.top || compTop > bounds.bottom);

			if (rev) {
				collapsing = (compLeft < bounds.left || compRight > bounds.right || compTop < bounds.top || compBottom > bounds.bottom);
			}

			if (collapsing) {
				elems.targets.push(this);
				elems.hits.push(obj);
			}
		});

		return elems;
	};

})(jQuery);