"use strict";

var componentStack = [];

function wrapState(fn,onStateChange,componentEntry) {
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
}

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

				// process all scheduled component renders
				for (let opEntry of opEntries) {
					if (opEntry.render) {
						let {
							id, root, instance, initialArgs
						} = opEntry.render;

						let html = instance(...(initialArgs || []));
						root.querySelectorAll(`[id='${ id }']`)[0].innerHTML = html;
					}
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

function useState(initialVal) {
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
}
