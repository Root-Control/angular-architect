'use strict';
var valor = 0;
async function iniciar() {
	for (var i = 0; i < 100; i++) {
		await mostrarMensaje(i);
	}
}

function mostrarMensaje(numero) {
	return new Promise(resolve => {
		setTimeout(() => {
			console.log('Numero es ' + numero);
			valor = valor + 2;
			resolve();
		}, 1000);
	});
}

iniciar();