"use strict";

var componentStack = [];

var generateComponentID = (function define(){
	var state = {};

	return function generateComponentID(){
		var componentIDs = (
			state.componentIDs = state.componentIDs || new Set()
		);

		do {
			var id = Math.round(1E9 * Math.random());
		}
		while (componentIDs.has(id));
		componentIDs.add(id);
		return id;
	};
})();

var schedule = (function define(){
	var state = {};

	return function schedule(type,context){
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
	};
})();

var mount = (function define(){
	var state = {};

	return function mount(root,component,initialArgs = []){
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
				elem,
				state: {}
			};

			let componentInstance = function componentInstance(){
				return component(
					componentEntry.state,
					function forceRender(){
						schedule("render",componentEntry);
					},
					...initialArgs
				);
			};

			componentEntry.instance = componentInstance;
			componentEntries.push(componentEntry);

			root.appendChild(elem);

			schedule("render",componentEntry);
			return true;
		}

		return false;
	};
})();
