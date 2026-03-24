import {CreateWebWorkerMLCEngine } from 'https://esm.run/@mlc-ai/web-llm';
const SELECTED_MODEL = "Qwen2.5-1.5B-Instruct-q4f16_1-MLC";

const input = document.querySelector('input');
const mensajes = document.querySelector('ul');
const contenedor = document.querySelector('main');
const plantilla = document.querySelector('#plantilla');
const boton = document.querySelector('button');
const progreso = document.querySelector('#progreso');

const motor = await CreateWebWorkerMLCEngine(
    new Worker('/JS/worker.js', {type: 'module'}),
    SELECTED_MODEL,
    {
        initProgressCallback: (info) =>{
            progreso.textContent = `${info.progress * 100}%`;
        }
    }
); 

let mensajesEnviados = [];

boton.addEventListener('click', async (event) =>{
    event.preventDefault();
    const mensajeUsuario = input.value.trim();

    if(mensajeUsuario !== '')
    {
        input.value = "";
    }
    agregarMensaje(mensajeUsuario, 'usuario');
    contenedor.scrollTop = contenedor.scrollHeight;
    const mensajeFormateado = {
        role: 'user',
        content: mensajeUsuario
    };
    mensajesEnviados.push(mensajeFormateado);
    const respuestaBot = await motor.chat.completions.create({
        messages: mensajesEnviados
    });
    const mensajeBot = respuestaBot.choices[0].message;
    mensajesEnviados.push(mensajeBot);
    agregarMensaje(mensajeBot.content, 'bot');
    contenedor.scrollTop = contenedor.scrollHeight;
});

function agregarMensaje(mensaje, rol)
{
    const clonPlantilla = plantilla.content.cloneNode(true);
    const mensajeNuevo = clonPlantilla.querySelector('.mensaje');
    const spanRol = clonPlantilla.querySelector('span:first-child');
    const spanTexto = clonPlantilla.querySelector('span:last-child');

    spanRol.textContent = rol === 'usuario' ? 'Tú' : 'Bot';
    spanTexto.textContent = mensaje;

    mensajeNuevo.classList.add(rol);
    mensajes.appendChild(mensajeNuevo);
    
}