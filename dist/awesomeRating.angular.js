$.fn.awesomeRating = function(options) {
    //-- Normalize passed options
    options = options || {};

    //-- Options' Initialization
    if (!options.values && options.valueMax) {
        options.values = [];
        for (var i = options.valueMin || 1; i <= options.valueMax; i += options.valueStep || 1) { options.values.push(i); }
    }

    //-- Setup default initial values that will be overridden by passed options
    var defaultOptions = {
        values              : [ 1, 2, 3, 4, 5 ],
        valueInitial        : null,
        cssBase             : "rating-star fa",
        cssBaseSelected     : "fa-star",
        cssBaseUnselected   : "fa-star-o",
        cssValuesSelected   : [ "first-selected", "second-selected", "third-selected", "forth-selected", "fifth-selected" ],
        cssValuesUnselected : [ "first-unselected", "second-unselected", "third-unselected", "forth-unselected", "fifth-unselected" ],
        cssHover            : "rating-star-hover",
        cssFractional       : "rating-star-fractional",
        targetSelector      : null,
        htmlBase            : "<div></div>",
        htmlEvent           : "click",
        applyHoverCss       : true,
        readonly            : false,
        allowFractional     : false,
        calculateFractional : null,
        eventName           : "rated"
    };

    return this.each(function() {
        //-- Check if plugin is already initialized
        if (this._awesomeRatingApi) { return; }

        //-- Select current element
        var $element = $(this);

        //-- Merge passed options with default values and define basic methods
        var _api = {
            values : {
                list            : options.values || defaultOptions.values || [],
                initial         : options.valueInitial || defaultOptions.valueInitial || null,
                current         : null
            },
            html : {
                base            : options.htmlBase || defaultOptions.htmlBase,
                event           : options.htmlEvent || defaultOptions.htmlEvent
            },
            css : {
                base            : options.cssBase || defaultOptions.cssBase,
                selected        : options.cssBaseSelected || defaultOptions.cssBaseSelected,
                unselected      : options.cssBaseUnselected || defaultOptions.cssBaseUnselected,
                values : {
                    selected    : options.cssValuesSelected || defaultOptions.cssValuesSelected || [],
                    unselected  : options.cssValuesUnselected || defaultOptions.cssValuesUnselected || []
                },
                hover           : options.cssHover || defaultOptions.cssHover || null,
                fractional      : options.cssFractional || defaultOptions.cssFractional || null
            },
            settings : {
                applyHoverCss   : options.applyHoverCss !== false && defaultOptions.applyHoverCss,
                readonly        : options.readonly || defaultOptions.readonly || false,
                allowFractional : options.allowFractional || defaultOptions.allowFractional || false,
                eventName       : options.eventName || defaultOptions.eventName || "rated"
            },
            external : {
                $ : {
                    element     : $element,
                    target      : $(options.targetSelector || defaultOptions.targetSelector),
                    rates       : null,
                    fractional  : null
                },
                val : function(value) {
                    if (value === undefined) { return _api.values.current; }

                    _api.storeValue(value);
                }
            },
            temp : {
                $initial        : null,
                fractionalIndex : -1
            },
            storeValue : function(value) {
                // Check if current value has changed
                if (value === _api.values.current) { return; }

                _api.values.current = value;
                _api.updateTarget();
                _api.triggerEvent();
                _api.updateFractionalIndex();
                _api.updateCss();
            },
            updateTarget : function() {
                _api.external.$.target && _api.external.$.target.text(_api.values.current) && _api.external.$.target.val(_api.values.current);
            },
            triggerEvent : function() {
                _api.external.$.element.trigger(_api.settings.eventName, [ _api.values.current ]);
            },
            toggleBaseCss : function() {
                //-- Make sure that none of the rates will be marked as selected when null is passed
                var isCurrentValueSet = _api.values.current == null;

                _api.external.$.rates.each(function(rateIndex) {
                    var $rate = $(this);

                    //-- Handle fractional values
                    if (!isCurrentValueSet && _api.settings.allowFractional) {
                        isCurrentValueSet = _api.temp.fractionalIndex === rateIndex;
                    }

                    //-- Apply base styles
                    $rate.toggleClass(_api.css.selected, !isCurrentValueSet);
                    $rate.toggleClass(_api.css.unselected, isCurrentValueSet);

                    //-- Apply styles basing on value if css are defined per value in context of current rate
                    if (_api.css.values.selected.length == _api.values.list.length && _api.css.values.unselected.length == _api.values.list.length) {
                        $.each(_api.values.list, function(valueIndex, value) {
                            //-- Handle fractional values fo particular rate
                            var fractionalValue = _api.settings.allowFractional ? _api.calculateFractional(_api.values.current, _api.values.list[valueIndex]) : -1;
                            var isFractional = fractionalValue > 0 && fractionalValue < 1;

                            //-- Toggle defined classes for selected and unselected state
                            $rate.toggleClass(_api.css.values.selected[valueIndex], !isCurrentValueSet && (value === _api.values.current || isFractional));
                            $rate.toggleClass(_api.css.values.unselected[valueIndex], isCurrentValueSet && (value === _api.values.current || isFractional));
                        });
                    }

                    if (_api.values.list[rateIndex] === _api.values.current) { isCurrentValueSet = true; }
                });
            },
            toggleFractionalCss : function() {
                _api.external.$.fractional.each(function(fractionalIndex) {
                    var $fractionalRate = $(this);
                    if (fractionalIndex !== _api.temp.fractionalIndex) { $fractionalRate.hide(); }
                    else {
                        var fractionalValue = _api.calculateFractional(_api.values.current, _api.values.list[fractionalIndex]);
                        $fractionalRate.css("display", "initial");
                        $fractionalRate.width(fractionalValue + "em");
                    }
                });
            },
            updateCss : function() {
                _api.toggleBaseCss();
                if (_api.settings.allowFractional) { _api.toggleFractionalCss(); }
            },
            updateCssHover : function(hoverRateIndex) {
                _api.external.$.rates.each(function(rateIndex) {
                    $(this).toggleClass(_api.css.hover, rateIndex <= hoverRateIndex);
                });

                if (_api.settings.allowFractional) {
                    _api.external.$.fractional.each(function (rateIndex) {
                        $(this).toggleClass(_api.css.hover, rateIndex <= hoverRateIndex);
                    });
                }
            },
            calculateFractional : options.calculateFractional || defaultOptions.calculateFractional || function(current, rateValue) {
                return 1 - (rateValue - current);
            },
            updateFractionalIndex : function() {
                _api.temp.fractionalIndex = -1;
                _api.external.$.rates.each(function(rateIndex) {
                    if (_api.temp.fractionalIndex === -1 && _api.settings.allowFractional) {
                        var fractionalValue = _api.settings.allowFractional ? _api.calculateFractional(_api.values.current, _api.values.list[rateIndex]) : -1;
                        if (fractionalValue > 0 && fractionalValue < 1) { _api.temp.fractionalIndex = rateIndex; }
                    }
                });
            }
        };

        //-- Generate rates
        $.each(_api.values.list, function(valueIndex, value) {
            // Add requested html object
            var $rate = _api.external.$.element.append(_api.html.base).find(":last-child");
            // Toggle base and unselected class
            $rate.toggleClass(_api.css.base, true);
            $rate.toggleClass(_api.css.unselected, true);

            if (_api.settings.readonly) { return; }

            $rate.on(_api.html.event, function () { _api.storeValue(value); });

            if (_api.settings.applyHoverCss) {
                $rate.hover(function() { _api.updateCssHover(valueIndex) }, function() { _api.updateCssHover(-1); });
            }
        });

        //-- Store rates as external API's variable
        _api.external.$.rates = _api.external.$.element.children();

        //-- Generate fractional rates
        if (_api.settings.allowFractional) {
            _api.external.$.rates.each(function(rateIndex) {
                // Add requested html object
                var $fractionalRate = $(this).before(_api.html.base).prev();
                // Toggle base and unselected class
                $fractionalRate.toggleClass(_api.css.base, true);
                $fractionalRate.toggleClass(_api.css.fractional, true);
                $fractionalRate.toggleClass(_api.css.selected, true);

                //-- Apply styles basing on value if css are defined per value
                if (_api.css.values.selected.length == _api.values.list.length && _api.css.values.unselected.length == _api.values.list.length) {
                    $fractionalRate.toggleClass(_api.css.values.selected[rateIndex]);
                }

                if (_api.settings.readonly) { return; }

                $fractionalRate.on(_api.html.event, function () { _api.storeValue(_api.values.list[rateIndex]); });

                if (_api.settings.applyHoverCss) {
                    $fractionalRate.hover(function() { _api.updateCssHover(rateIndex) }, function() { _api.updateCssHover(-1); });
                }
            });
        }

        // Store fractional rates as external API's variable
        _api.external.$.fractional = _api.external.$.element.find("." + _api.css.fractional);

        // Store initial value as current
        _api.storeValue(_api.values.initial);

        //-- Expose the external part of API
        this._awesomeRatingApi = _api.external;
    });
};
angular.module('awesome-rating', []).directive('awesomeRating', ['$timeout', function($timeout) {
    return {
        restrict: 'A',
        scope: {
            awesomeRating: '=',
            awesomeRatingOptions: '@'
        },
        link: function($scope, element) {
            //-- Initialize the options
            var options = ($scope.awesomeRatingOptions && JSON.parse($scope.awesomeRatingOptions)) || { };
            options.valueInitial = $scope.awesomeRating;
            //-- Apply jquery plugin
            $element = $(element).awesomeRating(options)
                .on('rated', function(event, rate){
                    $timeout(function() {
                        $scope.awesomeRating = rate;
                    });
                });
            //-- Apply external changes
            $scope.$watch('awesomeRating', function(value){
                $element.each(function() { this._awesomeRatingApi.val(value); });
            })
        }
    };
}]);