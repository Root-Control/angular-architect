'use strict';
const data = require('./angular-architecture.json');
const cp = require('child_process');
const chalk = require('chalk');

let modules = [];
let components = [];

let moduleCommands = [];
let serviceCommands = [];
let ngrxFeatureCommands = [];
let componentCommands = [];

const types = {
	MODULE: 'module',
	COMPONENT: 'component'
}

function mapAllModules(path, modulesPath) {
	return new Promise(resolve => {
		modulesPath.forEach(item => {
			modules.push({ 
				name: item.name, 
				ngrx: item['ngrx-feature'] || false,
				service: item.service || false,
				path,
				type: types.MODULE
			});
	
			if (item.components) mapComponents(item.name, path, item.components);
	
			if (item.modules && item.modules.length) mapAllModules(`${path || ''}/${item.name}`, item.modules);
		});
		resolve();
	});
}

function mapComponents(moduleName, path, moduleComponents) {
	moduleComponents.forEach(component => {
		components.push({ 
			name: `${moduleName}-${component}`, 
			path: `${path}/${moduleName}`, 
			type: types.COMPONENT
		}) 
	});
}

function createModuleCommands() {
	let fullPath;
	let modulePathCommand;
	return new Promise(resolve => {
		modules.forEach(_module => {
			fullPath = _module.path || '';
			modulePathCommand = fullPath ? `--module=${fullPath}`: '';
			moduleCommands.push(`ng g module ${fullPath}/${_module.name} ${modulePathCommand}`);

			if (_module.service) {
				serviceCommands.push(`ng g s ${fullPath}/${_module.name} --skip-tests=true`);
			}

			if (_module.ngrx) {
				const featureName = _module.name;
				ngrxFeatureCommands.push(`ng g feature ${fullPath}/${_module.name}/${featureName} ${modulePathCommand}/${_module.name} --creators="true" --skipTests="true" --api="true"`);
			}
		});
		resolve();
	});
}

function createComponentCommands() {
	let modulePathCommand;
	return new Promise(resolve => {
		components.forEach(component => {
			modulePathCommand = component.path ? `--module=${component.path}`: '';
			componentCommands.push(`ng generate component ${component.path}/${component.name} ${modulePathCommand}`);
		});
		resolve();
	});
}

async function start() {
	await mapAllModules(undefined, data.app.modules);
	await createModuleCommands();
	await createComponentCommands();
	console.log(ngrxFeatureCommands);
}

start();