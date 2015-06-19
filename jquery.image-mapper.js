/* jQuery Image Mapper v1.2.1 - https://github.com/devbucket/jquery-image-mapper
 * Draw image maps the old fashioned way just with HTML, jQuery and jQuery UI.
 * 
 * Copyright (c) 2015 Florian Mueller
 * Licensed under the GPL license
 * 2015-06-19
 */

(function(a) {
    "use strict";
    a.fn.overlaps = function(b, c) {
        var d = {
            targets: [],
            hits: []
        };
        var e = typeof c === "undefined" ? 1 : c;
        this.each(function() {
            var c = a(this).offset();
            c.right = c.left + a(this).outerWidth();
            c.bottom = c.top + a(this).outerHeight();
            var f = a(b).offset();
            f.right = f.left + a(b).outerWidth();
            f.bottom = f.top + a(b).outerHeight();
            if (!(f.right + e < c.left || f.left - e > c.right || f.bottom + e < c.top || f.top - e > c.bottom)) {
                d.targets.push(this);
                d.hits.push(b);
            }
        });
        return d;
    };
})(jQuery);

(function(a) {
    "use strict";
    a.widget("ui.imageMapper", a.ui.mouse, {
        options: {
            handleCollision: true,
            collisionTolerance: 1,
            autoHideHandles: true,
            elementClass: "ui-image-mapper",
            elementDisabledClass: "ui-image-mapper-disabled",
            mapItemsListPercentage: false,
            drawHelperClass: "ui-image-mapper-helper",
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
            var b = this;
            b.elementTag = "<" + b.options.objectTypes + "/>";
            b.mapItems = [];
            b.dragged = true;
            b.active = null;
            b._mouseInit();
            b.element.addClass(b.options.elementClass).css({
                position: "relative"
            });
            a(b.element).find("img").css({
                position: "relative",
                "z-index": 1,
                "pointer-events": "none"
            });
            b.container = a(b.elementTag).addClass(this.options.drawHelperContainerClass).css({
                position: "absolute",
                "z-index": 2,
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                overflow: "hidden"
            }).appendTo(a(b.element));
            b.helper = a(b.elementTag).addClass(b.options.drawHelperClass).addClass("drag");
            a("html").keyup(function(a) {
                if (a.keyCode === 8 || a.keyCode === 46) {
                    b._deleteActive(a);
                }
            });
        },
        items: function() {
            return this.mapItems;
        },
        destroy: function() {
            var a = this.element.find("img");
            this.element.removeClass(this.options.elementClass + " " + this.options.elementDisabledClass).css({
                position: ""
            });
            if ("" == this.element.attr("style")) {
                this.element.removeAttr("style");
            }
            if ("" == this.element.attr("class")) {
                this.element.removeAttr("class");
            }
            a.css({
                position: "",
                "z-index": "",
                "pointer-events": ""
            });
            if ("" == a.attr("style")) {
                a.removeAttr("style");
            }
            this.container.remove();
            this.mapItems.splice(0, this.mapItems.length);
            this._mouseDestroy();
        },
        _mouseStart: function(b) {
            var c = this, d = c.options;
            if (d.disabled) return;
            c.elPos = a(c.element).offset();
            c.opos = [ b.pageX - c.elPos.left, b.pageY - c.elPos.top ];
            c._trigger("start", b, c.helper);
            c._setInactive(a("." + d.drawHelperClass + ".active"));
            a(c.element).append(c.helper);
            c.helper.css({
                "z-index": d.zIndex + (c.mapItems.length + 1),
                position: "absolute",
                left: c.opos[0],
                top: c.opos[1],
                width: 0,
                height: 0
            });
            this._setDraw(this.helper);
        },
        _mouseDrag: function(a) {
            var b = this;
            b.dragged = true;
            if (b.options.disabled) return false;
            var c = b.opos[0], d = b.opos[1], e = a.pageX - b.elPos.left, f = a.pageY - b.elPos.top;
            if (c > e) {
                var g = e;
                e = c;
                c = g;
            }
            b.helper.css({
                left: c,
                top: d,
                width: e - c,
                height: f - d
            });
            b._trigger("drag", a);
            if (b._colliding()) {
                b._setDrawError(b.helper);
            } else {
                b._setDraw(b.helper);
            }
            return false;
        },
        _mouseStop: function(b) {
            var c = this, d = c.options;
            c.dragged = false;
            if (d.disabled) return false;
            if (c._colliding()) {
                c._resetAll(c.helper);
            } else {
                var e = c.helper.clone().appendTo(c.container);
                if (a(e).width() < d.drawHelperMinWidth) {
                    a(e).css({
                        width: d.drawHelperMinWidth + "px"
                    });
                }
                if (a(e).height() < d.drawHelperMinHeight) {
                    a(e).css({
                        height: d.drawHelperMinHeight + "px"
                    });
                }
                c._setActive(e);
                a(e).removeClass("drag").addClass("drop").draggable({
                    stack: d.drawHelperClass,
                    containment: "parent",
                    revertDuration: d.revertDuration,
                    revert: function() {
                        return c._colliding();
                    },
                    drag: function(a, b) {
                        if (c._colliding()) {
                            c._setError(b.helper);
                        } else {
                            c._setActive(b.helper);
                        }
                    },
                    start: function(b, e) {
                        if (!a(e.helper).hasClass("active")) {
                            c._setInactive(a("." + d.drawHelperClass + ".active"));
                        }
                        a(e.helper).removeClass("drop").addClass("drag");
                    },
                    stop: function(b, d) {
                        if (!c._colliding()) {
                            var e = parseInt(a(d.helper).attr("data-id"), 10) - 1;
                            c._resetError(d.helper);
                            a(d.helper).removeClass("drag").addClass("drop");
                            c.mapItems[e].left = c._parseValue(d.position.left);
                            c.mapItems[e].top = c._parseValue(d.position.top);
                            c._triggerUpdateItems(b);
                        }
                    }
                }).resizable({
                    autoHide: c.options.autoHideHandles,
                    containment: "parent",
                    resize: function(a, b) {
                        if (c._colliding()) {
                            c._setError(b.helper);
                        } else {
                            c._setActive(b.helper);
                        }
                    },
                    start: function(b, e) {
                        if (!a(e.helper).hasClass("active")) {
                            c._setInactive(a("." + d.drawHelperClass + ".active"));
                        }
                        a(e.helper).removeClass("drop").addClass("drag");
                    },
                    stop: function(b, d) {
                        if (!c._colliding()) {
                            a(d.helper).removeClass("drag").addClass("drop");
                            var e = parseInt(a(d.helper).attr("data-id"), 10) - 1;
                            c.mapItems[e].width = c._parseValue(d.size.width);
                            c.mapItems[e].height = c._parseValue(d.size.height);
                            c._triggerUpdateItems(b);
                        } else {
                            a(d.helper).animate({
                                width: d.originalSize.width + "px",
                                height: d.originalSize.height + "px"
                            }, c.options.revertDuration, function() {
                                c._setActive(d.helper);
                            });
                        }
                    }
                }).attr("data-id", this.mapItems.length + 1).click(function(b) {
                    if (!a(b.target).hasClass("active")) {
                        c._setInactive(a("." + d.drawHelperClass + ".active"));
                        c._setActive(b.target);
                    }
                });
                c._saveMapItem(e);
                c.helper.remove();
                c._triggerUpdateItems(b);
            }
            return false;
        },
        _setActive: function(b) {
            var c = this, d = c.options;
            c.active = a(b);
            a(b).css({
                "z-index": d.zIndexActive,
                border: d.borderActiveSize + " " + d.borderActiveStyle + " " + d.borderActiveColor,
                "background-color": d.backgroundActiveColor
            }).addClass("active");
        },
        _setInactive: function(b) {
            var c = this, d = c.options;
            a(b).css({
                "z-index": d.zIndex,
                border: d.borderSize + " " + d.borderStyle + " " + d.borderColor,
                "background-color": d.backgroundColor
            }).removeClass("active");
        },
        _setError: function(b) {
            var c = this, d = c.options;
            a(b).css({
                border: d.borderActiveErrorSize + " " + d.borderActiveErrorStyle + " " + d.borderActiveErrorColor,
                "background-color": d.backgroundActiveErrorColor
            }).addClass("error");
        },
        _resetError: function(b) {
            var c = this, d = c.options;
            a(b).css({
                "z-index": d.zIndexActive,
                border: d.borderActiveSize + " " + d.borderActiveStyle + " " + d.borderActiveColor,
                "background-color": d.backgroundActiveColor
            }).removeClass("error");
        },
        _setDraw: function(b) {
            var c = this, d = c.options;
            a(b).css({
                "z-index": d.zIndex,
                border: d.borderDrawSize + " " + d.borderDrawStyle + " " + d.borderDrawColor,
                "background-color": d.backgroundDrawColor
            });
        },
        _setDrawError: function(b) {
            var c = this, d = c.options;
            a(b).css({
                border: d.borderDrawErrorSize + " " + d.borderDrawErrorStyle + " " + d.borderDrawErrorColor,
                "background-color": d.backgroundDrawErrorColor
            });
        },
        _resetAll: function(b) {
            var c = this;
            a(b).animate({
                "z-index": c.options.zIndex,
                width: "0px",
                height: "0px",
                "border-color": "rgba(0,0,0,0)"
            }, c.options.revertDuration, function() {
                a(b).remove();
            });
        },
        _deleteActive: function(b) {
            var c = this;
            if (c.active !== null) {
                var d = a(c.active);
                c._deleteMapItem(d);
                d.remove();
                c._triggerUpdateItems(b);
            }
        },
        _saveMapItem: function(b) {
            var c = this, d = c.options.drawHelperClass + "-" + (c.mapItems.length + 1), e = {
                id: d,
                left: c._parseValue(b.css("left")),
                top: c._parseValue(b.css("top")),
                width: c._parseValue(b.css("width")),
                height: c._parseValue(b.css("height"))
            };
            a(b).attr("id", d);
            c.mapItems.push(e);
        },
        _deleteMapItem: function(b) {
            var c = this, d = parseInt(a(b).attr("data-id"), 10) - 1;
            c.mapItems.splice(d, 1);
        },
        _parseValue: function(a) {
            var b = this;
            if (b.options.mapItemsListPercentage === true) {
                return b._pixelToPercentageHorizontal(a);
            } else {
                return a.toString().replace("px", "") + "px";
            }
        },
        _pixelToPercentageHorizontal: function(b) {
            var c = parseInt(b.toString().replace("px", ""), 10), d = parseInt(a(this.container).width().toString(), 10), e = 100 / d * c;
            return e + "%";
        },
        _colliding: function() {
            var b = this;
            if (b.options.handleCollision) {
                var c = a(".drag"), d = a(".drop"), e = d.overlaps(c, b.options.collisionTolerance);
                return e.targets.length > 0;
            } else {
                return false;
            }
        },
        _triggerUpdateItems: function(a) {
            var b = this, c = null;
            if (b.mapItems.length) {
                c = b.mapItems;
            }
            b._trigger("updated", a, {
                items: c
            });
        }
    });
    a.extend(a.ui.imageMapper, {
        defaults: a.extend({}, a.ui.mouse.defaults)
    });
})(jQuery);