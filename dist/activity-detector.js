'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var ACTIVE = 'active';
var IDLE = 'idle';

var DEFAULT_INITIAL_STATE = ACTIVE;

var DEFAULT_ACTIVITY_EVENTS = ['click', 'mousemove', 'keydown', 'DOMMouseScroll', 'mousewheel', 'mousedown', 'touchstart', 'touchmove', 'focus'];

var DEFAULT_INACTIVITY_EVENTS = ['blur'];

var hidden = void 0,
    visibilityChangeEvent = void 0;
if (typeof document.hidden !== 'undefined') {
    hidden = 'hidden';
    visibilityChangeEvent = 'visibilitychange';
} else {
    var prefix = ['webkit', 'moz', 'ms'].find(function (vendorPrefix) {
        return _typeof(document[vendorPrefix + 'Hidden']) !== undefined;
    });
    if (prefix) {
        hidden = prefix + 'Hidden';
        visibilityChangeEvent = prefix + 'visibilitychange';
    }
}

/**
 * Creates an activity detector instance
 * @param  {Object}   options
 * @param  {String[]} options.activityEvents events which force a transition to 'active'
 * @param  {String[]} options.inactivityEvents events which force a transition to 'idle'
 * @param  {Number}   options.timeToIdle inactivity time in ms to transition to 'idle'
 * @param  {String}   options.initialState one of 'active' or 'idle'
 * @param  {Boolean}  options.autoInit
 * @return {Object} activity detector instance
 */
var activityDetector = function activityDetector() {
    var _listeners;

    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    var _ref$activityEvents = _ref.activityEvents;
    var activityEvents = _ref$activityEvents === undefined ? DEFAULT_ACTIVITY_EVENTS : _ref$activityEvents;
    var _ref$inactivityEvents = _ref.inactivityEvents;
    var inactivityEvents = _ref$inactivityEvents === undefined ? DEFAULT_INACTIVITY_EVENTS : _ref$inactivityEvents;
    var _ref$timeToIdle = _ref.timeToIdle;
    var timeToIdle = _ref$timeToIdle === undefined ? 30000 : _ref$timeToIdle;
    var _ref$initialState = _ref.initialState;
    var initialState = _ref$initialState === undefined ? DEFAULT_INITIAL_STATE : _ref$initialState;
    var _ref$autoInit = _ref.autoInit;
    var autoInit = _ref$autoInit === undefined ? true : _ref$autoInit;


    var listeners = (_listeners = {}, _defineProperty(_listeners, ACTIVE, []), _defineProperty(_listeners, IDLE, []), _listeners);
    var state = void 0;
    var timer = void 0;

    var setState = function setState(newState) {
        if (newState === ACTIVE) {
            timer = setTimeout(function () {
                return setState(IDLE);
            }, timeToIdle);
        }

        if (state !== newState) {
            state = newState;
            listeners[state].forEach(function (l) {
                return setTimeout(l, 0);
            });
        }
    };

    var handleUserActivityEvent = function handleUserActivityEvent() {
        clearTimeout(timer);
        setState(ACTIVE);
    };

    var handleUserInactivityEvent = function handleUserInactivityEvent() {
        clearTimeout(timer);
        setState(IDLE);
    };

    var handleVisibilityChangeEvent = function handleVisibilityChangeEvent() {
        clearTimeout(timer);
        setState(document[hidden] ? IDLE : ACTIVE);
    };

    /**
     * Adds event listener
     * @param {any} anyTarget target to add event listener to
     * @param {string} strEventName event name
     * @param {function} funcHandler event handler
     */
    var addListener = function addListener(anyTarget, strEventName, funcHandler) {
        if (anyTarget.addEventListener) {
            anyTarget.addEventListener(strEventName, funcHandler);
        } else {
            anyTarget.attachEvent(strEventName, funcHandler);
        }
    };

    /**
     * Starts the activity detector with the given state.
     * @param {string} firstState 'iddle' or 'active' (default)
     */
    var init = function init() {
        var firstState = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : DEFAULT_INITIAL_STATE;

        setState(firstState);

        activityEvents.forEach(function (eventName) {
            return addListener(window, eventName, handleUserActivityEvent);
        });

        inactivityEvents.forEach(function (eventName) {
            return addListener(window, eventName, handleUserInactivityEvent);
        });

        if (visibilityChangeEvent) {
            addListener(document, visibilityChangeEvent, handleVisibilityChangeEvent);
        }
    };

    /**
     * Register an event listener for the required event
     * @param {string} eventName 'active' or 'idle'
     * @param {Function} listener
     */
    var on = function on(eventName, listener) {
        listeners[eventName].push(listener);
    };

    /**
     * Removes event listener
     * @param {any} anyTarget target to remove event listener from
     * @param {string} strEventName event name
     * @param {function} funcHandler event handler
     */
    var removeListener = function removeListener(anyTarget, strEventName, funcHandler) {
        if (anyTarget.removeEventListener) {
            anyTarget.removeEventListener(strEventName, funcHandler);
        } else {
            anyTarget.detachEvent(strEventName, funcHandler);
        }
    };

    /**
     * Stops the activity detector and clean the listeners
     */
    var stop = function stop() {
        listeners[ACTIVE] = [];
        listeners[IDLE] = [];

        clearTimeout(timer);

        activityEvents.forEach(function (eventName) {
            return removeListener(window, eventName, handleUserActivityEvent);
        });

        inactivityEvents.forEach(function (eventName) {
            return removeListener(window, eventName, handleUserInactivityEvent);
        });

        if (visibilityChangeEvent) {
            removeListener(document, visibilityChangeEvent, handleVisibilityChangeEvent);
        }
    };

    if (autoInit) {
        init(initialState);
    }

    return { on: on, stop: stop, init: init };
};

exports.default = activityDetector;