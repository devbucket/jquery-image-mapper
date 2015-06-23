/* jQuery Image Mapper v0.4.7 - https://github.com/devbucket/jquery-image-mapper
 * Draw image maps the old fashioned way just with HTML, jQuery and jQuery UI.
 * 
 * Copyright (c) 2015 Florian Mueller
 * Licensed under the GPL license
 * 2015-06-23
 */

(function($) {
    "use strict";
    $.fn.overlaps = function(obj, tolerance) {
        var elems = {
            targets: [],
            hits: []
        };
        var tol = typeof tolerance === "undefined" ? 1 : tolerance;
        this.each(function() {
            var bounds = $(this).offset();
            bounds.right = bounds.left + $(this).outerWidth();
            bounds.bottom = bounds.top + $(this).outerHeight();
            var compare = $(obj).offset();
            compare.right = compare.left + $(obj).outerWidth();
            compare.bottom = compare.top + $(obj).outerHeight();
            if (!(compare.right + tol < bounds.left || compare.left - tol > bounds.right || compare.bottom + tol < bounds.top || compare.top - tol > bounds.bottom)) {
                elems.targets.push(this);
                elems.hits.push(obj);
            }
        });
        return elems;
    };
})(jQuery);

(function($) {
    "use strict";
    $.widget("ui.imageMapper", $.ui.mouse, {
        options: {
            data: [],
            handleCollision: true,
            collisionTolerance: 1,
            autoHideHandles: true,
            elementClass: "ui-image-mapper",
            elementDisabledClass: "ui-image-mapper-disabled",
            percentageValues: false,
            drawHelperClass: "ui-image-mapper-helper",
            drawHelperSpecialClass: "",
            drawHelperMinWidth: 20,
            drawHelperMinHeight: 20,
            drawHelperContainerClass: "ui-image-mapper-maps",
            objectTypes: "div",
            zIndex: 10,
            zIndexActive: 150,
            revertDuration: 100,
            borderDrawSize: "1px",
            borderDrawStyle: "dotted",
            borderDrawColor: "#000",
            borderDrawErrorSize: "1px",
            borderDrawErrorStyle: "dotted",
            borderDrawErrorColor: "#ff0000",
            borderSize: "1px",
            borderStyle: "solid",
            borderColor: "#69bce2",
            borderActiveSize: "1px",
            borderActiveStyle: "solid",
            borderActiveColor: "#00aeff",
            borderActiveErrorSize: "1px",
            borderActiveErrorStyle: "solid",
            borderActiveErrorColor: "#ff0000",
            backgroundDrawColor: "rgba(0,174,255,0)",
            backgroundDrawErrorColor: "rgba(255,0,0,0.1)",
            backgroundColor: "rgba(0,174,255,0.1)",
            backgroundActiveColor: "rgba(0,174,255,0.25)",
            backgroundActiveErrorColor: "rgba(255,0,0,0.35)"
        },
        _init: function() {
            var self = this, opts = self.options;
            self.elementTag = "<" + opts.objectTypes + "/>";
            self.mapItems = [];
            self.dragged = true;
            self.active = null;
            self._mouseInit();
            self.element.addClass(opts.elementClass).css({
                position: "relative"
            });
            $(self.element).find("img").css({
                position: "relative",
                "z-index": 1,
                "pointer-events": "none"
            });
            self.container = $(self.elementTag).addClass(opts.drawHelperContainerClass).css({
                position: "absolute",
                "z-index": 2,
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                overflow: "hidden"
            }).appendTo(self.element).click(function(event) {
                if ($(event.target).hasClass(opts.drawHelperContainerClass)) {
                    self._setInactive($("." + opts.drawHelperClass + ".active"));
                    self.active = null;
                    opts.drawHelperSpecialClass = "";
                    self._trigger("inactive", event);
                }
            });
            self.helper = $(self.elementTag).addClass(opts.drawHelperClass + " drag");
            self._trigger("init", self);
            $("html").keyup(function(event) {
                if (event.keyCode === 8 || event.keyCode === 46) {
                    self._deleteActive(event);
                }
            });
            self._setExistingData();
        },
        _setExistingData: function() {
            var self = this, opts = self.options;
            if (opts.data.length) {
                $.each(opts.data, function(index, item) {
                    var special = null, existingItem = $(self.elementTag).appendTo(self.container);
                    if (opts.drawHelperSpecialClass !== "") {
                        special = opts.drawHelperSpecialClass;
                    }
                    if (typeof item.special !== "undefined") {
                        special = item.special;
                    }
                    existingItem.css({
                        "z-index": opts.zIndex + (self.mapItems.length + 1),
                        position: "absolute",
                        left: item.left,
                        top: item.top,
                        width: item.width,
                        height: item.height
                    }).addClass(opts.drawHelperClass + " " + special + " drop").attr("data-id", self.mapItems.length + 1);
                    if (special !== null) {
                        existingItem.attr("data-special", special);
                    }
                    self._addDraggable(existingItem);
                    self._addResizable(existingItem);
                    existingItem.click(function(event) {
                        if (!$(event.target).hasClass("active")) {
                            self._setInactive($("." + opts.drawHelperClass + ".active"));
                            self._setActive(event.target);
                            self._trigger("active", event, self.active);
                        }
                    });
                    self._setInactive(existingItem);
                    self._saveMapItem(existingItem, item.id, special);
                });
            }
        },
        items: function() {
            return this.mapItems;
        },
        item: function() {
            return this.active;
        },
        toggleSpecial: function(newSpecial) {
            var id = parseInt($(this.active).attr("data-id"), 10) - 1;
            $(this.active).removeClass($(this.active).attr("data-special")).addClass(newSpecial).attr("data-special", newSpecial);
            this.options.drawHelperSpecialClass = newSpecial;
            this.mapItems[id].special = newSpecial;
            this._triggerUpdateItems(null);
        },
        destroy: function() {
            var $img = this.element.find("img");
            this.element.removeClass(this.options.elementClass + " " + this.options.elementDisabledClass).css({
                position: ""
            });
            if ("" == this.element.attr("style")) {
                this.element.removeAttr("style");
            }
            if ("" == this.element.attr("class")) {
                this.element.removeAttr("class");
            }
            $img.css({
                position: "",
                "z-index": "",
                "pointer-events": ""
            });
            if ("" == $img.attr("style")) {
                $img.removeAttr("style");
            }
            this.container.remove();
            this.mapItems.splice(0, this.mapItems.length);
            this._mouseDestroy();
        },
        _mouseStart: function(event) {
            var self = this, opts = self.options;
            if (opts.disabled) return;
            self.container.css({
                "pointer-events": "none"
            });
            self.elPos = $(self.element).offset();
            self.opos = [ event.pageX - self.elPos.left, event.pageY - self.elPos.top ];
            self._trigger("start", event, self.helper);
            self._setInactive($("." + opts.drawHelperClass + ".active"));
            $(self.container).append(self.helper);
            self.helper.css({
                "z-index": opts.zIndex + (self.mapItems.length + 1),
                position: "absolute",
                left: self.opos[0],
                top: self.opos[1],
                width: 0,
                height: 0
            });
            self._setDraw(self.helper);
        },
        _mouseDrag: function(event) {
            var self = this;
            self.dragged = true;
            if (self.options.disabled) return false;
            var x1 = self.opos[0] + 2, y1 = self.opos[1] + 2, x2 = event.pageX - self.elPos.left, y2 = event.pageY - self.elPos.top;
            if (x1 > x2) {
                var tmp = x2;
                x2 = x1;
                x1 = tmp;
            }
            self.helper.css({
                left: x1,
                top: y1,
                width: x2 - x1,
                height: y2 - y1
            });
            self._trigger("drag", event);
            if (self._colliding()) {
                self._setDrawError(self.helper);
            } else {
                self._setDraw(self.helper);
            }
            return false;
        },
        _mouseStop: function(event) {
            var self = this, opts = self.options, special = null, mapItem;
            self.dragged = false;
            if (opts.disabled) return false;
            if (self._colliding()) {
                self._resetAll(self.helper);
            } else {
                mapItem = self.helper.clone().appendTo(self.container);
                self._setMinWidth(mapItem);
                self._setActive(mapItem);
                mapItem.removeClass("drag").addClass(opts.drawHelperSpecialClass + " drop");
                if (opts.drawHelperSpecialClass !== "") {
                    special = opts.drawHelperSpecialClass;
                    mapItem.attr("data-special", special);
                }
                self._trigger("active", event, mapItem);
                self._addDraggable(mapItem);
                self._addResizable(mapItem);
                mapItem.attr("data-id", this.mapItems.length + 1).click(function(event) {
                    if (!$(event.target).hasClass("active")) {
                        self._setInactive($("." + opts.drawHelperClass + ".active"));
                        self._setActive(event.target);
                        self._trigger("active", event, self.active);
                    }
                });
                self._saveMapItem(mapItem, null, special);
                self.helper.remove();
                self._triggerUpdateItems(event);
            }
            self.container.css({
                "pointer-events": "auto"
            });
            return false;
        },
        _addDraggable: function(el) {
            var self = this, opts = self.options;
            $(el).draggable({
                stack: opts.drawHelperClass,
                containment: "parent",
                revertDuration: opts.revertDuration,
                revert: function() {
                    return self._colliding();
                },
                drag: function(ev, ui) {
                    if (self._colliding()) {
                        self._setError(ui.helper);
                    } else {
                        self._setActive(ui.helper);
                    }
                },
                start: function(ev, ui) {
                    if (!$(ui.helper).hasClass("active")) {
                        self._setInactive($("." + opts.drawHelperClass + ".active"));
                    }
                    $(ui.helper).removeClass("drop").addClass("drag");
                    self._setActive(ui.helper);
                    self._trigger("active", event, self.active);
                },
                stop: function(ev, ui) {
                    if (!self._colliding()) {
                        var itemId = parseInt($(ui.helper).attr("data-id"), 10) - 1;
                        self._resetError(ui.helper);
                        $(ui.helper).removeClass("drag").addClass("drop");
                        self.mapItems[itemId].left = self._parseValue(ui.position.left, "horizontal");
                        self.mapItems[itemId].top = self._parseValue(ui.position.top, "vertical");
                        self._triggerUpdateItems(ev);
                    }
                }
            });
        },
        _addResizable: function(el) {
            var self = this, opts = self.options;
            $(el).resizable({
                minWidth: opts.drawHelperMinWidth,
                minHeight: opts.drawHelperMinHeight,
                autoHide: self.options.autoHideHandles,
                containment: "parent",
                resize: function(ev, ui) {
                    if (self._colliding()) {
                        self._setError(ui.helper);
                    } else {
                        self._setActive(ui.helper);
                    }
                },
                start: function(ev, ui) {
                    if (!$(ui.helper).hasClass("active")) {
                        self._setInactive($("." + opts.drawHelperClass + ".active"));
                    }
                    $(ui.helper).removeClass("drop").addClass("drag");
                    self._setActive(ui.helper);
                    self._trigger("active", event, self.active);
                },
                stop: function(ev, ui) {
                    if (!self._colliding()) {
                        $(ui.helper).removeClass("drag").addClass("drop");
                        var itemId = parseInt($(ui.helper).attr("data-id"), 10) - 1;
                        self.mapItems[itemId].width = self._parseValue(ui.size.width, "horizontal");
                        self.mapItems[itemId].height = self._parseValue(ui.size.height, "vertical");
                        self._triggerUpdateItems(ev);
                    } else {
                        $(ui.helper).animate({
                            width: ui.originalSize.width + "px",
                            height: ui.originalSize.height + "px"
                        }, self.options.revertDuration, function() {
                            self._setActive(ui.helper);
                        });
                    }
                }
            });
        },
        _setMinWidth: function(el) {
            var opts = this.options, minWidth = opts.drawHelperMinWidth >= 10 ? opts.drawHelperMinWidth : 10, minHeight = opts.drawHelperMinHeight >= 10 ? opts.drawHelperMinHeight : 10;
            if ($(el).width() < minWidth) {
                $(el).css({
                    width: minWidth + "px"
                });
            }
            if ($(el).height() < minHeight) {
                $(el).css({
                    height: minHeight + "px"
                });
            }
        },
        _setActive: function(el) {
            var opts = this.options;
            this.active = $(el);
            $(el).css({
                "z-index": opts.zIndexActive,
                border: opts.borderActiveSize + " " + opts.borderActiveStyle + " " + opts.borderActiveColor,
                "background-color": opts.backgroundActiveColor
            }).addClass("active");
        },
        _setInactive: function(el) {
            var opts = this.options;
            $(el).css({
                "z-index": opts.zIndex,
                border: opts.borderSize + " " + opts.borderStyle + " " + opts.borderColor,
                "background-color": opts.backgroundColor
            }).removeClass("active");
        },
        _setError: function(el) {
            var opts = this.options;
            $(el).css({
                border: opts.borderActiveErrorSize + " " + opts.borderActiveErrorStyle + " " + opts.borderActiveErrorColor,
                "background-color": opts.backgroundActiveErrorColor
            }).addClass("error");
        },
        _resetError: function(el) {
            var opts = this.options;
            $(el).css({
                "z-index": opts.zIndexActive,
                border: opts.borderActiveSize + " " + opts.borderActiveStyle + " " + opts.borderActiveColor,
                "background-color": opts.backgroundActiveColor
            }).removeClass("error");
        },
        _setDraw: function(el) {
            var opts = this.options;
            $(el).css({
                "z-index": opts.zIndex,
                border: opts.borderDrawSize + " " + opts.borderDrawStyle + " " + opts.borderDrawColor,
                "background-color": opts.backgroundDrawColor
            });
        },
        _setDrawError: function(el) {
            var opts = this.options;
            $(el).css({
                border: opts.borderDrawErrorSize + " " + opts.borderDrawErrorStyle + " " + opts.borderDrawErrorColor,
                "background-color": opts.backgroundDrawErrorColor
            });
        },
        _resetAll: function(el) {
            $(el).animate({
                "z-index": this.options.zIndex,
                width: "0px",
                height: "0px",
                "border-color": "rgba(0,0,0,0)"
            }, this.options.revertDuration, function() {
                $(el).remove();
            });
        },
        _deleteActive: function(event) {
            if (this.active !== null) {
                this._deleteMapItem(this.active);
                this.active.remove();
                this.active = null;
                this._triggerUpdateItems(event);
                this._trigger("inactive", event);
            }
        },
        _saveMapItem: function(el, id, special) {
            var opts = this.options, item = {};
            if (typeof id === "undefined" || id === null) {
                id = opts.drawHelperClass + "-" + (this.mapItems.length + 1);
            }
            $(el).attr("id", id);
            item.id = id;
            item.left = this._parseValue(el.css("left"), "horizontal");
            item.top = this._parseValue(el.css("top"), "vertical");
            item.width = this._parseValue(el.css("width"), "horizontal");
            item.height = this._parseValue(el.css("height"), "vertical");
            if (opts.drawHelperSpecialClass !== "") {
                item.special = opts.drawHelperSpecialClass;
            }
            if (typeof special !== "undefined") {
                item.special = special;
            }
            this.mapItems.push(item);
        },
        _deleteMapItem: function(el) {
            var id = parseInt($(el).attr("data-id"), 10) - 1;
            this.mapItems.splice(id, 1);
        },
        _parseValue: function(value, orientation) {
            var percent;
            if (typeof orientation === "undefined") orientation = "horizontal";
            if (this.options.percentageValues === true) {
                switch (orientation) {
                  case "horizontal":
                  default:
                    percent = this._pixelToPercentageHorizontal(value);
                    break;

                  case "vertical":
                    percent = this._pixelToPercentageVertical(value);
                    break;
                }
            } else {
                percent = value.toString().replace("px", "") + "px";
            }
            return percent;
        },
        _pixelToPercentageHorizontal: function(value) {
            var intValue = parseFloat(value.toString().replace("px", "")), intValueO = parseFloat($(this.container).width().toString()), percent = 100 / intValueO * intValue;
            return percent + "%";
        },
        _pixelToPercentageVertical: function(value) {
            var intValue = parseFloat(value.toString().replace("px", "")), intValueO = parseFloat($(this.container).height().toString()), percent = 100 / intValueO * intValue;
            return percent + "%";
        },
        _colliding: function() {
            if (this.options.handleCollision === true) {
                var drag = $(".drag"), drop = $(".drop"), collides = drop.overlaps(drag, this.options.collisionTolerance);
                return collides.targets.length > 0;
            } else {
                return false;
            }
        },
        _triggerUpdateItems: function(event) {
            var items = this.mapItems.length ? this.mapItems : null;
            this._trigger("updated", event, [ items ]);
        }
    });
    $.extend($.ui.imageMapper, {
        defaults: $.extend({}, $.ui.mouse.defaults)
    });
})(jQuery);