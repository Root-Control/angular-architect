# Angular Architect

Angular Architect is a powerful tool that allows you to create complete scaffolding of your application based on a json file.

## Installation

Use the package manager [npm](https://www.npmjs.com/) to install angular-architect.

```bash
npm install -g angular-architect
```

## Usage

Create a new app from scratch
```bash
ng new myapp
```

In the rootpath of the project, create the file "angular-architecture.json"



```json
{
	"app":{
	   "modules":[
		  {
			 "name":"layout",
			 "modules":[
				{
				   "name":"admin",
				   "modules":[
					  
				   ],
				   "components":[
					  "admin-layout"
				   ]
				},
				{
				   "name":"public",
				   "modules":[
					  
				   ],
				   "components":[
					  "public-header",
					  "public-layout"
				   ]
				}
			 ],
			 "components":[
				
			 ]
		  },
		  {
			 "name":"private",
			 "modules":[
				{
				   "name":"projects",
				   "service":true,
				   "ngrx-feature":true,
				   "component-prefix":false,
				   "components":[
					  "choose"
				   ]
				},
				{
				   "name":"modulex",
				   "service":true,
				   "ngrx-feature":true,
				   "components":[
					  "module1",
					  "module2",
					  "module3"
				   ]
				}
			 ]
		  }
	   ]
	}
 }
```

Run the command

```bash
angular-architect
```

Enjoy

## Json Types

### App Object
```ts
{
    'modules': ModuleObject,
    'ngrx': boolean
}
```
### Where
```js
modules             -> List of modules
ngrx                -> Define ff ngrx dependencies will be installed (devTools, effects, actions, store, entity)
```



### Module Object
```ts
{
    'name': string,
    'service': boolean,
    'ngrx-feature': boolean,
    'components': string[],
    'component-prefix': boolean
}
```
### Where
```js
name             -> Module name
service          -> Service to be created
ngrx-feature     -> Complete ngrx Scaffolding (actions, effects, reducers, selectors)
components       -> A list of components names to create
component-prefix -> prefix for each component, example. "articles-module" if the module is "articles"
```


## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License
[MIT](https://choosealicense.com/licenses/mit/)