'use strict';

var fs = require('fs'),
    path = require('path'),
    eventStream = require('event-stream'),
    os = require('os'),
    { merge } = require(path.resolve('./helpers/utils')),
    dJSON = require('dirty-json');

class FileWriter {
    constructor(filePath, options) {
        this.filePath = filePath;
        this.options = options;
        this.indent2 = '  ';
        this.indent4 = '    ';
    }

    modifyModuleFile() {
        let line = 0,
            lastImportLine,
            codeArray = [];
        /* options
         *  options.classToAttach
         *  options.classPath
         *  options.type  <-- //declarations, providers, exports, imports
         */
        const stream = fs.createReadStream(this.filePath)
            .pipe(eventStream.split())
            .pipe(eventStream.mapSync(codeline => {
                line++;
                //pause the readstream
                stream.pause();
                
                if (!lastImportLine) {
                    lastImportLine = this.detectFinalImport(line, codeline, lastImportLine);
                    if (lastImportLine) {
                        codeArray.push(`import { ${this.options.classToAttach} } from '${this.options.classPath}';`);
                    }
                }
                codeArray.push(codeline);
                stream.resume();
            })
            .on('error', function(err) {
                console.log('Error:', err);
            })
            .on('end', () => {
                console.log('----------------------------------------------------');
                console.log(this.filePath);
                console.log('----------------------------------------------------');
                const modifiedNgModule = this.modifyNgModule(codeArray, this.options);
                this.createOrUpdateFile(this.filePath, modifiedNgModule);
                console.log('Finish reading.');
            })
        );     
    }

    detectFinalImport(line, codeline, lastImportLine) {
        const text = 'import';
        const contains = codeline.includes(text);
        if (!contains) {
            lastImportLine = line;
        }
        return lastImportLine;
    }

    modifyNgModule(codeArray, options) {
        const { ngModule, startBraceLine, endBraceLine } = this.detectNgModuleClosure(codeArray);
        const newNgModule = this.modifyNgModuleAndImport(options.type, options.classToAttach, ngModule);
        console.log(newNgModule);

        console.log(`Start brace line ${startBraceLine}`);
        console.log(`End brace line ${endBraceLine}`);

        codeArray.splice(startBraceLine, (endBraceLine - startBraceLine) + 1);

        const result = merge(codeArray, newNgModule, startBraceLine);
        
        return result;
    }



    detectNgModuleClosure(codeArray) {
        let ngModule = [];
        let openedBrace = '{',
            firstBraceFound = false,
            lastBraceFound = false,
            startBraceLine,
            endBraceLine,
            closedBrace = '}',
            openedBraces = 0;

        const closureText = '@NgModule';

        for (let i = 0; i < codeArray.length; i++) {
            if (codeArray[i].includes(closureText)) {
                firstBraceFound = true;
                startBraceLine = i;
            }

            if (codeArray[i].includes(openedBrace)) openedBraces++;
            if (codeArray[i].includes(closedBrace)) openedBraces--;

            if (!openedBraces && firstBraceFound && !lastBraceFound) {
                console.log(openedBraces);
                lastBraceFound = true;
                endBraceLine = i;
            }

            if (openedBraces) {
                ngModule.push(codeArray[i]);
            }
        }

        ngModule.push('})');
        return {
            ngModule,
            startBraceLine,
            endBraceLine
        };
    }

    modifyNgModuleAndImport(type, Class, ngModule) {
        ngModule = this.removeNgModuleAndGetJsonObject(ngModule);

        if (ngModule[type]) ngModule[type].push(Class);
        else ngModule[type] = [Class];
        
        const newNgModule = this.reconstructNgModule(ngModule);
        return newNgModule;
    }

    removeNgModuleAndGetJsonObject(ngModule) {
        const firstLine = 0;
        const lastLine = ngModule.length - 1;

        ngModule[firstLine] = ngModule[firstLine].replace('@NgModule(', '');
        ngModule[lastLine] = ngModule[lastLine].replace(')', '');
        
        let ngModuleToJsonObject = this.transformArrayOfStringsOnJson(ngModule);
        return ngModuleToJsonObject;
    }

    createOrUpdateFile(file = 'myfile', content) {
        let code = '';
        for (var i = 0; i < content.length; i++) {
            code = `${code}${content[i]}\n`;
        }

        fs.writeFileSync(`${file}`, code, function (err) {
          if (err) throw err;
          console.log('Saved!');
        });
       }

    transformArrayOfStringsOnJson(ngModuleString) {
        let jsonString = '';

        ngModuleString.forEach(string => jsonString = `${jsonString}${string}`);

        return dJSON.parse(jsonString);
    };

    reconstructNgModule(ngModuleObject) {
        let _beginOfBracket = '[',
            _endOfBracket = ']',
            _importsArray = [],
            _exportsArray = [],
            _providersArray = [],
            _declarationsArray = [];

        const _imports      = ngModuleObject.imports || [];
        const _exports      = ngModuleObject.exports || [];
        const _providers    = ngModuleObject.providers || [];
        const _declarations = ngModuleObject.declarations || [];

        const firstLine = '@NgModule({';
        const lastLine = '})';

        _importsArray.push(`${this.indent2}imports: [`);
        _imports.forEach((_import, index) => _importsArray.push(`${this.indent4}${_import},`));
        _importsArray.push(`${this.indent2}],`);

        console.log(_importsArray);

        _exportsArray.push(`${this.indent2}exports: [`);
        _exports.forEach((_export, index) => _exportsArray.push(`${this.indent4}${_export},`));
        _exportsArray.push(`${this.indent2}],`);

        _providersArray.push(`${this.indent2}providers: [`);
        _providers.forEach((_provider, index) => _providersArray.push(`${this.indent4}${_provider},`));
        _providersArray.push(`${this.indent2}],`);

        _declarationsArray.push(`${this.indent2}declarations: [`);
        _declarations.forEach((_declaration, index) => _declarationsArray.push(`${this.indent4}${_declaration},`));
        _declarationsArray.push(`${this.indent2}]`);

        const recontructedNgModule = [firstLine, ..._importsArray, ..._exportsArray, ..._providersArray, ..._declarationsArray, lastLine];

        return recontructedNgModule;
    }

}

const fileWriter = new FileWriter('./examples/module.example.txt', { classToAttach: 'OmarClass', type: 'exports', classPath: '../../hiro-service/service' });
fileWriter.modifyModuleFile();
