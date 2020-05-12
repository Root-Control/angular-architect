#!/usr/bin/env node
'use strict';
const path = require('path');
let command = [];
let string = '';
const fs = require('fs');
const cp = require('child_process');
const pluralize = require('pluralize');
const chalk = require('chalk');

async function start() {
	const basePath = process.cwd();

	try {
		if (!moduleIsAvailable(`${basePath}/angular.json`)) {
			throw 'You should apply this command in a valid angular path';
		}

		if (!moduleIsAvailable(`${basePath}/angular-architecture.json`)) {
			console.log(`${basePath}/angular-architecture.json`);
			throw 'You should first create the angular-architecture.json file ';
		}

		const jsonFile = require(`${basePath}/angular.json`);
		const angularJson = require(`${basePath}/angular-architecture.json`);
		const modules = angularJson.app.modules;

		modules.forEach(_module => {
			processModule(_module, 'app', '');
		});

		console.log('--Optional--');
		console.log('--Getting Ngrx dependencies');

		await runNpmExec('npm install','@ngrx/{store,effects,entity,store-devtools} --save');
		await runNpmExec('ng add', '@ngrx/schematics');	
		runNgCommand(command);
	} catch (ex) {
		console.log(chalk.red(ex.toUpperCase()));
	}
}

function processModule(_module, parent, previousPath) {
	createModuleCommand(_module, parent, previousPath);
}

async function createModuleCommand(_module, parent, previousPath) {

	command.push(`ng g m "${previousPath}/${_module.name}" --module="${parent}"`);

	if (_module.service) {
		command.push(`ng g s "${previousPath}/${_module.name}/${_module.name}"`);
	}

	if (_module['ngrx-feature']) {
		command.push(`ng g feature "${previousPath}/${_module.name}/${_module.name}" --module="${parent.replace(/app/, '')}/${_module.name}" --skipTest="true" --creators="true" --api="true"`);
	}

	if(_module.modules) {
		parent = `${parent}/${_module.name}`;
		previousPath = `${previousPath}/${_module.name}`;
		_module.modules.forEach(_submodule => processModule(_submodule, parent, previousPath));
	}

	if (_module.components && _module.components.length) {
		await createComponentCommand(_module, parent, previousPath);
	}

}

function createComponentCommand(_module, parent, previousPath) {
	return _module.components.forEach(component => {
		command.push(`ng g c "${previousPath}/${component}" --module="${parent}"`);
	});	
}

async function runNgCommand(commandArray) {
	console.log('-----------------------------------------------------------------------------');
	console.log(`WE WILL RUN ${commandArray.length} COMMANDS`);
	console.log('-----------------------------------------------------------------------------');

	for (let i = 0; i < commandArray.length; i++) {
		console.log(`Processing  ${i+1} of ${commandArray.length} -> ${commandArray[i]} `);
		await execute(commandArray[i]);
	}
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

function moduleIsAvailable (path) {
    try {
        require.resolve(path);
        return true;
    } catch (e) {
        return false;
    }
}

start();