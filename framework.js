"use strict";

var componentStack = [];

function wrapState(fn,onStateChange) {
	var proxy = onStateChange ? createStateProxy(onStateChange) : null;
	var state = Object.create(proxy);

	return function component(...args){
		return fn(state,...args);
	};
}

var createStateProxy = wrapState(function createStateProxy(state,onStateChange){
	state.targetProps = state.targetProps || new WeakMap();

	return Object.freeze(new Proxy({},{
		has(target,key,context) {
			if (state.targetProps.has(context)) {
				return (key in state.targetProps.get(context));
			}
			return false;
		},
		set(target,key,val,context) {
			if (!state.targetProps.has(context)) {
				state.targetProps.set(context,{});
			}
			var props = state.targetProps.get(context);
			props[key] = val;

			Object.defineProperty(context,key,{
				set(newVal) {
					var prevVal = props[key];
					// changed?
					if (!Object.is(prevVal,newVal)) {
						props[key] = newVal;
						onStateChange(key,prevVal,newVal);
					}
				},
				get() {
					return props[key];
				},
				configurable: false,
				enumerable: true
			});

			return true;
		}
	}));
});

var generateComponentID = wrapState(function generateComponentID(state){
	var componentIDs = (
		state.componentIDs = state.componentIDs || new Set()
	);

	do {
		var id = Math.round(1E9 * Math.random());
	}
	while (componentIDs.has(id));
	componentIDs.add(id);
	return id;
});

var schedule = wrapState(function schedule(state,type,context){
	state.componentOps = state.componentOps || new Map();

	if (!state.componentOps.has(context.instance)) {
		state.componentOps.set(context.instance,{});
	}
	var componentOpEntry = state.componentOps.get(context.instance);

	if (type == "render" && !componentOpEntry.render) {
		componentOpEntry.render = context;
	}
	else {
		return;
	}

	if (!state.next) {
		state.next = Promise.resolve().then(function drainOpQueue(){
			// capture snapshot of all pending component ops
			var opEntries = [ ...state.componentOps.values() ];
			state.componentOps.clear();
			state.next = null;

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
		});
	}
});

var mount = wrapState(function mount(state,root,component,initialArgs = []){
	var mountedComponents = (
		state.mountedComponents = state.mountedComponents || new WeakMap()
	);

	if (!state.mountedComponents.has(component)) {
		state.mountedComponents.set(component,[]);
	}

	var componentEntries = state.mountedComponents.get(component);

	if (!componentEntries.find(entry => entry.root == root)) {
		let componentID = generateComponentID();
		let elem = document.createElement("div");
		elem.id = componentID;

		let componentEntry = {
			id: componentID,
			root,
			instance: null,
			initialArgs,
			elem
		};

		let componentInstance = wrapState(
			component,
			function onStateChange(){
				schedule("render",componentEntry);
			}
		);
		componentEntry.instance = componentInstance;
		componentEntries.push(componentEntry);

		root.appendChild(elem);

		schedule("render",componentEntry);
		return true;
	}

	return false;
});
