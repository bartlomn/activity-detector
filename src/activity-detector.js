const ACTIVE = 'active';
const IDLE = 'idle';

const DEFAULT_INITIAL_STATE = ACTIVE;

const DEFAULT_ACTIVITY_EVENTS = [
    'click',
    'mousemove',
    'keydown',
    'DOMMouseScroll',
    'mousewheel',
    'mousedown',
    'touchstart',
    'touchmove',
    'focus',
];

const DEFAULT_INACTIVITY_EVENTS = ['blur'];

let hidden, visibilityChangeEvent;
if (typeof document.hidden !== 'undefined') {
    hidden = 'hidden';
    visibilityChangeEvent = 'visibilitychange';
} else {
    const prefix = ['webkit', 'moz', 'ms'].find(vendorPrefix => typeof document[`${vendorPrefix}Hidden`] !== undefined);
    if (prefix) {
        hidden = `${prefix}Hidden`;
        visibilityChangeEvent = `${prefix}visibilitychange`;
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
const activityDetector = ({
    activityEvents = DEFAULT_ACTIVITY_EVENTS,
    inactivityEvents = DEFAULT_INACTIVITY_EVENTS,
    timeToIdle = 30000,
    initialState = DEFAULT_INITIAL_STATE,
    autoInit = true,
} = {}) => {

    const listeners = {[ACTIVE]: [], [IDLE]: []};
    let state;
    let timer;

    const setState = newState => {
        if (newState === ACTIVE) {
            timer = setTimeout(() => setState(IDLE), timeToIdle);
        }

        if (state !== newState) {
            state = newState;
            listeners[state].forEach(l => setTimeout(l, 0));
        }
    };

    const handleUserActivityEvent = () => {
        clearTimeout(timer);
        setState(ACTIVE);
    };

    const handleUserInactivityEvent = () => {
        clearTimeout(timer);
        setState(IDLE);
    };

    const handleVisibilityChangeEvent = () => {
        clearTimeout(timer);
        setState(document[hidden] ? IDLE : ACTIVE);
    };

    /**
     * Adds event listener
     * @param {any} anyTarget target to add event listener to
     * @param {string} strEventName event name
     * @param {function} funcHandler event handler
     */
    const addListener = (anyTarget, strEventName, funcHandler) => {
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
    const init = (firstState = DEFAULT_INITIAL_STATE) => {
        setState(firstState);

        activityEvents.forEach(eventName =>
            addListener(window, eventName, handleUserActivityEvent));

        inactivityEvents.forEach(eventName =>
            addListener(window, eventName, handleUserInactivityEvent));

        if (visibilityChangeEvent) {
            addListener(document, visibilityChangeEvent, handleVisibilityChangeEvent);
        }
    };

    /**
     * Register an event listener for the required event
     * @param {string} eventName 'active' or 'idle'
     * @param {Function} listener
     */
    const on = (eventName, listener) => {
        listeners[eventName].push(listener);
    };

    /**
     * Removes event listener
     * @param {any} anyTarget target to remove event listener from
     * @param {string} strEventName event name
     * @param {function} funcHandler event handler
     */
    const removeListener = (anyTarget, strEventName, funcHandler) => {
        if (anyTarget.removeEventListener) {
            anyTarget.removeEventListener(strEventName, funcHandler);
        } else {
            anyTarget.detachEvent(strEventName, funcHandler);
        }
    };

    /**
     * Stops the activity detector and clean the listeners
     */
    const stop = () => {
        listeners[ACTIVE] = [];
        listeners[IDLE] = [];

        clearTimeout(timer);

        activityEvents.forEach(eventName =>
            removeListener(window, eventName, handleUserActivityEvent));

        inactivityEvents.forEach(eventName =>
            removeListener(window, eventName, handleUserInactivityEvent));

        if (visibilityChangeEvent) {
            removeListener(document, visibilityChangeEvent, handleVisibilityChangeEvent);
        }
    };

    if (autoInit) {
        init(initialState);
    }

    return {on, stop, init};
};

export default activityDetector;
