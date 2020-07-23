"use strict";

var componentStack = [];
var componentIDs = new Set();
var componentOps = new Map();
var nextTick = null;
var mountedComponents = new WeakMap();


function generateComponentID() {
	do {
		var id = Math.round(1E9 * Math.random());
	}
	while (componentIDs.has(id));
	componentIDs.add(id);
	return id;
}

function schedule(type,context) {
	componentOps = componentOps || new Map();

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

	if (!nextTick) {
		nextTick = Promise.resolve().then(function drainOpQueue(){
			// capture snapshot of all pending component ops
			var opEntries = [ ...componentOps.values() ];
			componentOps.clear();
			nextTick = null;

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
}

function mount(root,component,initialArgs = []){
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
			instance: null,
			initialArgs,
			elem
		};

		let componentInstance = function componentInstance(){
			return component(
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
}
