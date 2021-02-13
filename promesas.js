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
		modulesPath.forEach(_module => {
			modules.push({ 
				name: _module.name, 
				ngrx: _module['ngrx-feature'] || false,
				service: _module.service || false,
				path,
				type: types.MODULE
			});
	
			if (_module.components) mapComponents(_module, path);
	
			if (_module.modules && _module.modules.length) mapAllModules(`${path || ''}/${_module.name}`, _module.modules);
		});
		resolve();
	});
}

/**
 * 
 * @param {*} _module 
 * @param {*} path 
 */
function mapComponents(_module, path) {
	const moduleName = _module.name;
	const moduleComponents = _module.components;

	moduleComponents.forEach(component => {
		components.push({ 
			name: `${_module['component-prefix'] ? moduleName + '-': ''}${component}`, 
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
			modulePathCommand = fullPath ? `--module=${fullPath}`: '--module=app';
			moduleCommands.push(`ng g module ${fullPath}/${_module.name} ${modulePathCommand}`);

			if (_module.service) {
				const serviceName = _module.name;
				serviceCommands.push(`ng g s ${fullPath}/${_module.name}/${serviceName} --skip-tests=true`);
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
	//console.log(componentCommands);
}

start();