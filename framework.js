"use strict";

var bindComponentStack = (function hideComponentStack(){
	var componentStack = [];

	return function bindComponentStack(fn){
		return function bound(...args){
			return fn(componentStack,...args);
		};
	};
})();

var wrapState = bindComponentStack(function wrapState(componentStack,fn,onStateChange,componentEntry){
	var hooks = [];
	if (componentEntry) {
		componentEntry.hooks = hooks;
	}

	return function component(...args){
		componentStack.push([ hooks, 0, onStateChange, component, componentEntry ]);
		try {
			return fn(...args);
		}
		finally {
			componentStack.pop();
		}
	};
});

var generateComponentID = wrapState(function generateComponentID(){
	var [ componentIDs ] = useState(() => new Set());

	do {
		var id = Math.round(1E9 * Math.random());
	}
	while (componentIDs.has(id));
	componentIDs.add(id);
	return id;
});

var schedule = wrapState(function schedule(type,context){
	var [ componentOps ] = useState(() => new Map());
	var [ next, updateNext ] = useState(null);

	if (!componentOps.has(context.instance)) {
		componentOps.set(context.instance,{});
	}
	var componentOpEntry = componentOps.get(context.instance);

	if (type == "render" && !componentOpEntry.render) {
		componentOpEntry.render = context;
	}
	else if (type == "effect") {
		if (!componentOpEntry.effects) {
			componentOpEntry.effects = [];
		}
		componentOpEntry.effects.push(context.effect);
	}
	else {
		return;
	}

	if (!next) {
		updateNext(
			Promise.resolve().then(function drainOpQueue(){
				// capture snapshot of all pending component ops
				var opEntries = [ ...componentOps.values() ];
				componentOps.clear();
				updateNext(null);

				var effects = [];

				// process all scheduled component renders first
				for (let opEntry of opEntries) {
					if (opEntry.render) {
						let {
							id, root, instance, initialArgs
						} = opEntry.render;

						let html = instance(...(initialArgs || []));
						root.querySelectorAll(`[id='${ id }']`)[0].innerHTML = html;
					}

					// collect any scheduled effects
					if (opEntry.effects) {
						effects = [ ...effects, ...opEntry.effects ];
					}
				}

				// process all scheduled effects
				for (let effect of effects) {
					effect();
				}
			})
		);
	}
});

var mount = wrapState(function mount(root,component,initialArgs = []){
	var [ mountedComponents ] = useState(() => new WeakMap());

	if (!mountedComponents.has(component)) {
		mountedComponents.set(component,[]);
	}

	var componentEntries = mountedComponents.get(component);

	if (!componentEntries.find(entry => entry.root == root)) {
		let componentID = generateComponentID();
		let elem = document.createElement("div");
		elem.id = componentID;

		let componentEntry = {
			id: componentID,
			root,
			hooks: null,
			instance: null,
			initialArgs,
			elem
		};

		let componentInstance = wrapState(
			component,
			function onStateChange(){
				schedule("render",componentEntry);
			},
			componentEntry
		);
		componentEntry.instance = componentInstance;
		componentEntries.push(componentEntry);

		root.appendChild(elem);

		schedule("render",componentEntry);
		return true;
	}

	return false;
});

var createStateStore = wrapState(function createStateStore(storeID,onStoreUpdated){
	var [ stores ] = useState({});
	var [ storesData ] = useState(new WeakMap());

	if (!stores[storeID]) {
		let store = {
			listeners: [],
			data: {
				has(key) {
					return (key in storesData.get(this));
				},
				get(key) {
					return storesData.get(this)[key];
				},
				set(key,newVal) {
					var storeData = storesData.get(this);
					if (key in storeData) {
						let oldVal = storeData[key];
						if (!Object.is(oldVal,newVal)) {
							storeData[key] = newVal;
							store.notifyListeners("update",key,oldVal,newVal);
							return true;
						}
					}
					else {
						storeData[key] = newVal;
						store.notifyListeners("set",key,newVal);
						return true;
					}
					return false;
				},
				remove(key) {
					var storeData = storesData.get(this);
					if (key in storeData) {
						let oldVal = storeData[key];
						delete storeData[key];
						store.notifyListeners("remove",key,oldVal);
						return true;
					}
					return false;
				},
				commitUpdate(key) {
					var storeData = storesData.get(this);
					store.notifyListeners("update",key,storeData[key],storeData[key]);
				}
			},
			resetData() {
				storesData.set(store.data,{});
				store.notifyListeners("reset");
			},
			notifyListeners(type,...args) {
				for (let listener of [ ...store.listeners ]) {
					listener(type,...args);
				}
			}
		};
		storesData.set(store.data,{});
		stores[storeID] = store;
	}

	stores[storeID].listeners.push(onStoreUpdated);
	return [
		stores[storeID].data,
		stores[storeID].resetData
	];
});

var useState = bindComponentStack(function useState(componentStack,initialVal){
	var currentState = componentStack[componentStack.length - 1];
	var [ hooks, hookIdx, onStateChange ] = currentState;

	if (!hooks[hookIdx]) {
		if (typeof initialVal == "function") {
			initialVal = initialVal();
		}
		let hook = [
			initialVal,
			function setState(newVal){
				var prevVal = hook[0];
				if (typeof newVal == "function") {
					newVal = newVal(prevVal);
				}

				hook[0] = newVal;
				if (onStateChange) {
					onStateChange(prevVal,newVal);
				}

				return newVal;
			}
		];
		hooks[hookIdx] = hook;
	}

	// increment hook index for next usage
	currentState[1]++;

	return [ ...hooks[hookIdx] ];
});

var useEffect = bindComponentStack(function useEffect(componentStack,effect,guards){
	var currentState = componentStack[componentStack.length - 1];
	var [ hooks, hookIdx,, componentInstance ] = currentState;

	if (!hooks[hookIdx]) {
		hooks[hookIdx] = [];
	}

	var effectHook = hooks[hookIdx];
	var prevGuards = effectHook[0];

	// guards-mismatch indicates effect should be run?
	if (!matchGuards(prevGuards,guards)) {
		// save current guards state for future comparison
		effectHook[0] = Array.isArray(guards) ? [ ...guards ] : guards;

		// setup the effect handler
		effectHook[1] = function doEffect(){
			// unset ourself
			effectHook[1] = null;

			// need to first perform a cleanup from
			// a previous effect?
			if (typeof effectHook[2] == "function") {
				effectHook[2]();
				effectHook[2] = null;
			}

			// perform the effect
			let ret = effect();

			// store a cleanup function if any returned
			if (typeof ret == "function") {
				effectHook[2] = ret;
			}
		};

		schedule("effect",{
			instance: componentInstance,
			effect: effectHook[1]
		});
	}

	// increment hook index for next usage
	currentState[1]++;
});

function useRef(initialVal) {
	var [ ref ] = useState({ current: initialVal });
	return ref;
}

function useEffectToggle(fn,applyEffect) {
	useEffect(() => {
		if (applyEffect) {
			return fn();
		}
	},[ applyEffect ]);
}

function useSharedStore(storeID,onStoreUpdated) {
	var [ storeEntry, updateStore ] = useState(setupSharedStateStore);
	return storeEntry;

	// ***********************

	function setupSharedStateStore(){
		var [ store, resetStore ] = createStateStore(
			storeID,
			(
				onStoreUpdated ||
				// or default to triggering state-change
				(() => updateStore(storeEntry))
			)
		);
		var storeEntry = [ useSharedState, store, resetStore ];
		return storeEntry;

		// ***********************

		function useSharedState(key,initialVal) {
			if (!store.has(key)) {
				if (typeof initialVal == "function") {
					initialVal = initialVal();
				}
				store.set(key,initialVal);
			}
			return [
				store.get(key),
				function setState(newVal) {
					var prevVal = store.get(key);
					if (typeof newVal == "function") {
						newVal = newVal(prevVal);
					}
					store.set(key,newVal);
					return newVal;
				}
			];
		}
	}
}

function matchGuards(prevGuards,newGuards) {
	if (!(
		Array.isArray(prevGuards) &&
		Array.isArray(newGuards) &&
		prevGuards.length == newGuards.length
	)) {
		return false;
	}
	for (let [idx,guard] of prevGuards.entries()) {
		if (!Object.is(guard,newGuards[idx])) {
			return false;
		}
	}
	return true;
}
