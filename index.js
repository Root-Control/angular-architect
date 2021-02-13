#!/usr/bin/env node
'use strict';
// require('dotenv').config()
const path = require('path');
let command = [];
let string = '';
const fs = require('fs');
const cp = require('child_process');
const pluralize = require('pluralize');
const chalk = require('chalk');

let modules = [];
let components = [];

let moduleCommands = [];
let serviceCommands = [];
let ngrxFeatureCommands = [];
let componentCommands = [];

let ngrx;

const types = {
	MODULE: 'module',
	COMPONENT: 'component'
}
// const isDev = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'local' ;

async function start() {
	const basePath = process.cwd();

	try {
		//if (!isDev && !isModuleAvailable(`${basePath}/angular.json`)) {
		if (!isModuleAvailable(`${basePath}/angular.json`)) {
			throw 'You should apply this command in a valid angular path';
		}

		if (!isModuleAvailable(`${basePath}/angular-architecture.json`)) {
			console.log(`${basePath}/angular-architecture.json`);
			throw 'You should first create the angular-architecture.json file ';
		}

		//  const jsonFile = require(`${basePath}/angular.json`);
		const angularJson = require(`${basePath}/angular-architecture.json`);

		const modules = angularJson.app.modules;
		ngrx = angularJson.app.ngrx;

		await mapAllModules(undefined, modules);
		await createModuleCommands();
		await createComponentCommands();

		console.log('--Optional--');
		console.log('--Getting Ngrx dependencies');

		if (ngrx) {
			await runNpmExec('ng add','@ngrx/store@latest');
			await runNpmExec('ng add','@ngrx/effects@latest');
			await runNpmExec('ng add','@ngrx/entity@latest');
			await runNpmExec('ng add','@ngrx/store-devtools@latest');
			await runNpmExec('ng add', '@ngrx/schematics@latest');
		}
		
		await runNgCommand(moduleCommands, 'module');
		await runNgCommand(serviceCommands, 'service');
		await runNgCommand(componentCommands, 'component');
		await runNgCommand(ngrxFeatureCommands, 'ngrxFeature');
	} catch (ex) {
		console.log(chalk.red(ex));
	}
}

async function runNgCommand(commandArray, type) {
	const isNgrxFeature = type === 'ngrxFeature';
	return new Promise(async resolve => {
		console.log('-----------------------------------------------------------------------------');
		console.log(chalk.green(`Running ${commandArray.length} ${type} COMMANDS`))
		console.log('-----------------------------------------------------------------------------');
	
		for (let i = 0; i < commandArray.length; i++) {
			if (isNgrxFeature && !ngrx) {
				console.log(chalk.yellow(`Omiting ngrx process, ${i+1} of ${commandArray.length} -> ${commandArray[i]} (check your json and add app.ngrx = true instead)`));
				resolve();
			}
			console.log(chalk.yellow(`Processing  ${i+1} of ${commandArray.length} -> ${commandArray[i]} `));
	
			await execute(commandArray[i]);
		}
		resolve();
	});

}

function execute(command) {
	return new Promise((resolve, reject) => {
		cp.exec(command, (err, stdout, stderr) => {
		  if (err) {
		  	reject(err);
		    console.error(err)
		  } else {
		  	resolve();
		  }
		});
	});
}

function runNpmExec(type, _package) {
	console.log(chalk.green(`Installing package ${_package} please wait...`));
	return new Promise((resolve, reject) => {
		cp.exec(`${type} ${_package}`, (err, stdout, stderr) => {
			resolve();
		});
	});
}

function isModuleAvailable (path) {
    try {
        require.resolve(path);
        return true;
    } catch (e) {
        return false;
    }
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
	
			if (_module.components) mapComponents(_module, item.name);
	
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
	const moduleName = _module.mame;
	const moduleComponents = _module.components;

	moduleComponents.forEach(component => {
		components.push({ 
			name: `${_module['component-prefix'] ? moduleName: ''}-${component}`, 
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

start();
