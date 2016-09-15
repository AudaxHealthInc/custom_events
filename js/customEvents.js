/**
* Custom events v1.4.2 (2016-08-19)
*
* (c) 2012-2016 Black Label
*
* License: Creative Commons Attribution (CC)
*/

/* global Highcharts setTimeout clearTimeout module:true */
/* eslint no-loop-func: 0 */

(function (factory) {
	if (typeof module === 'object' && module.exports) {
		module.exports = factory;
	} else {
		factory(Highcharts);
	}
}(function (HC) {

	/* global Highcharts :true */

	'use strict';

	var UNDEFINED,
		DBLCLICK = 'dblclick',
		TOUCHSTART = 'touchstart',
		CLICK = 'click',
		each = HC.each,
		pick = HC.pick,
		wrap = HC.wrap,
		merge = HC.merge,
		addEvent = HC.addEvent,
		isTouchDevice = HC.isTouchDevice,
		defaultOptions = HC.getOptions().plotOptions,
		plotLineOrBandProto = HC.PlotLineOrBand && HC.PlotLineOrBand.prototype,
		seriesTypes = HC.seriesTypes,
		seriesProto = HC.Series && HC.Series.prototype,
		noop = function () { return false; },
		customEvents,
		proto,
		methods;

	function isArray(obj) {
		return Object.prototype.toString.call(obj) === '[object Array]';
	}

    /**
     * WRAPPERS
     */

	// reset exis events
	if (plotLineOrBandProto) { // # condition for highmaps and custom builds
		wrap(plotLineOrBandProto, 'render', function (proceed) {
			var defaultEvents = this.options && this.options.events;
		
			if (defaultEvents) {
				defaultEvents = noop; // reset events
			}

			proceed.apply(this, Array.prototype.slice.call(arguments, 1));
		});
	}

	if (seriesProto) { // # condition for highmaps and custom builds
		wrap(seriesProto, 'init', function (proceed, chart, options) {
				
			var chartOptions = chart.options,
				plotOptions = chartOptions.plotOptions,
				seriesOptions = chartOptions.plotOptions.series,
				userOptions = merge(seriesOptions, plotOptions[this.type]);

			options.events = noop;
			options.point = {
				events: noop
			};

			options.customEvents = {
				series: userOptions && userOptions.events,
				point: userOptions && userOptions.point && userOptions.point.events
			};

			proceed.apply(this, Array.prototype.slice.call(arguments, 1));

		});
	}

	HC.Chart.prototype.customEvent = {
		getEventsProtoMethods: function () {
			return [
				[HC.Tick, ['addLabel']],
				[HC.Axis, ['render']],
				[HC.Chart, ['setTitle']],
				[HC.Legend, ['renderItem']],
				[HC.PlotLineOrBand, ['render']],
				[HC.Series, ['drawPoints', 'drawDataLabels']],
				[seriesTypes.column, ['drawPoints', 'drawDataLabels']],
				[seriesTypes.bar, ['drawPoints', 'drawDataLabels']],
				[seriesTypes.pie, ['drawPoints', 'drawDataLabels']],
				[seriesTypes.bubble, ['drawPoints', 'drawDataLabels']],
				[seriesTypes.columnrange, ['drawPoints', 'drawDataLabels']],
				[seriesTypes.arearange, ['drawPoints', 'drawDataLabels']],
				[seriesTypes.areasplinerange, ['drawPoints', 'drawDataLabels']],
				[seriesTypes.errorbar, ['drawPoints', 'drawDataLabels']],
				[seriesTypes.boxplot, ['drawPoints', 'drawDataLabels']],
				[seriesTypes.flags, ['drawPoints', 'drawDataLabels']]
			];
		},
		init: function () {
			var eventsProtoMethods = this.getEventsProtoMethods();

			each(eventsProtoMethods, function (protoMethod) {

				proto = protoMethod[0] && protoMethod[0].prototype;
				methods = protoMethod[1];

				if (proto) {
					each(methods, function (method) {
						customEvents.attach(proto, method);
					});
				}
			});

		},
		addLabel: function () {
			var parent = this.parent,
				axisOptions = this.axis.options,
				eventsPoint = axisOptions.labels && axisOptions.labels.events,
				elementPoint = [this.label],
				len, i;

			if (parent) {
				var step = this; // current label

				while (step) {
					if (isArray(step)) {
						len = step.length;

						for (i = 0; i < len; i++) {
							elementPoint.push(step[i].label);
						}
					} else {
						elementPoint.push(step.label);
					}

					step = step.parent;
				}
			}

			return {
				eventsPoint: eventsPoint,
				elementPoint: elementPoint
			};
		},
		setTitle: function () {
			var events = this.options.title && this.options.title.events,
				element = this.title,
				eventsSubtitle = this.options.subtitle && this.options.subtitle.events,
				elementSubtitle = this.subtitle;

			return {
				events: events,
				element: element,
				eventsSubtitle: eventsSubtitle,
				elementSubtitle: elementSubtitle
			};
		},
		drawDataLabels: function () {
			var dataLabelsGroup = this.dataLabelsGroup;

			return {
				events: dataLabelsGroup ? this.options.dataLabels.events : UNDEFINED,
				element: dataLabelsGroup ? this.dataLabelsGroup : UNDEFINED
			};
		},
		render: function () {
			var stackLabels = this.options.stackLabels,
				events,
				element,
				eventsPoint,
				elementPoint,
				eventsStackLabel,
				elementStackLabel;

			if (this.axisTitle) {
				events = this.options.title.events;
				element = this.axisTitle;
			}

			if (stackLabels && stackLabels.enabled) {
				eventsPoint = stackLabels.events;
				elementPoint = this.stacks;
				eventsStackLabel = stackLabels.events;
				elementStackLabel = this.stackTotalGroup;
			}

			return {
				events: events,
				element: element,
				eventsPoint: eventsPoint,
				elementPoint: elementPoint,
				eventsStackLabel: eventsStackLabel,
				elementStackLabel: elementStackLabel
			};
		},
		drawPoints: function () {
			var op = this.options,
				type = this.type,
				events = op.customEvents ? op.customEvents.series : op.events,
				element = this.group,
				eventsPoint = op.customEvents ? op.customEvents.point : op.point.events,
				elementPoint;

			if (defaultOptions[type] && defaultOptions[type].marker) {
				elementPoint = [this.markerGroup];
			} else {
				elementPoint = this.points;
			}

			return {
				events: events,
				element: element,
				eventsPoint: eventsPoint,
				elementPoint: elementPoint
			};
		},
		renderItem: function () {
			return {
				events: this.options.itemEvents,
				element: this.group
			};
		},
		attach: function (obj, proto) {
			
			wrap(obj, proto, function (proceed) {
				var eventElement = {
						events: UNDEFINED,
						element: UNDEFINED
					},
					len,
					j;

				//  call default actions
				proceed.apply(this, Array.prototype.slice.call(arguments, 1));

				eventElement = customEvents[proto].call(this);

				if (!eventElement.events && !eventElement.eventsPoint) {
					return false;
				}
				
				if (eventElement.eventsPoint) { //

					len = eventElement.elementPoint.length;

					for (j = 0; j < len; j++) {
						var elemPoint = pick(eventElement.elementPoint[j].graphic, eventElement.elementPoint[j]);

						if (elemPoint && elemPoint !== UNDEFINED) {
							customEvents.add(elemPoint, eventElement.eventsPoint, eventElement.elementPoint[j], this);
						}
					}
				}

				if (eventElement.eventsSubtitle) {
					customEvents.add(eventElement.elementSubtitle, eventElement.eventsSubtitle, this);
				}

				if (eventElement.eventsStackLabel) {
					customEvents.add(eventElement.elementStackLabel, eventElement.eventsStackLabel, this);
				}

				customEvents.add(eventElement.element, eventElement.events, this);

			});
		},
		add: function (SVGelem, events, elemObj, series) {

			if (!SVGelem || !SVGelem.element) {
				return false;
			}

			for (var action in events) {

				(function (event) {
					if (events.hasOwnProperty(event) && !SVGelem[event]) {
						if (isTouchDevice && event === DBLCLICK) { //  #30
							
							var tapped = false;

							addEvent(SVGelem.element, TOUCHSTART, function (e) {
								e.stopPropagation();
								e.preventDefault();

								if (!tapped) {

									tapped = setTimeout(function () {
										tapped = null;
										events[CLICK].call(elemObj, e); //	call single click action
									}, 300);

								} else {
									clearTimeout(tapped);

									tapped = null;
									events[event].call(elemObj, e);

								}

								return false;

							});

						} else {

							addEvent(SVGelem.element, event, function (e) {
				
								if (elemObj && elemObj.textStr) { // labels
									elemObj.value = elemObj.textStr;
								}

								if (series && defaultOptions[series.type] && defaultOptions[series.type].marker) {

									var chart = series.chart,
										normalizedEvent = chart.pointer.normalize(e);

									elemObj = series.searchPoint(normalizedEvent, true);
								
								}

								events[event].call(elemObj, e);

								return false;
							});
						}

						SVGelem[event] = function () {
							return true;
						};
					}
				})(action);
			}
		}
	};

	customEvents = HC.Chart.prototype.customEvent;
	customEvents.init();

}));