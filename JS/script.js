import { CreateWebWorkerMLCEngine } from 'https://esm.run/@mlc-ai/web-llm';

const SELECTED_MODEL = "Qwen2.5-1.5B-Instruct-q4f16_1-MLC";

const botonNuevo = document.querySelector('#nuevoChat');
const botonModo = document.querySelector('#modo');
const input = document.querySelector('input');
const mensajes = document.querySelector('ul');
const contenedor = document.querySelector('main');
const boton = document.querySelector('form button');
const progreso = document.querySelector('#progreso');

input.disabled = true;
boton.disabled = true;

const motor = await CreateWebWorkerMLCEngine(
  new Worker('/JS/worker.js', { type: 'module' }),
  SELECTED_MODEL,
  {
    initProgressCallback: (info) => {
      progreso.textContent = `${Math.round(info.progress * 100)}%`;
      if (info.progress === 1) {
        input.disabled = false;
        boton.disabled = false;
        progreso.textContent = "Listo";
      }
    }
  }
);

let mensajesEnviados = [];

function agregarMensaje(texto, rol) {
  const li = document.createElement("li");
  li.classList.add("mensaje", rol);

  li.innerHTML = `
    <span>${rol === "usuario" ? "Tú" : "Nebula"}</span>
    <span>${texto}</span>
  `;

  mensajes.appendChild(li);
  contenedor.scrollTop = contenedor.scrollHeight;
}

async function generarRespuestaStream() {
  const li = document.createElement("li");
  li.classList.add("mensaje", "bot");
  li.innerHTML = `
    <span>Nebula</span>
    <span class="texto-ia"></span>
  `;

  mensajes.appendChild(li);
  const spanRespuesta = li.querySelector(".texto-ia");
  contenedor.scrollTop = contenedor.scrollHeight;

  let textoAcumulado = "";

  try {
    const stream = await motor.chat.completions.create({
      messages: mensajesEnviados,
      stream: true
    });

    for await (const chunk of stream) {
      const token = chunk.choices?.[0]?.delta?.content;

      if (token) {
        textoAcumulado += token;
        spanRespuesta.textContent = textoAcumulado;
        contenedor.scrollTop = contenedor.scrollHeight;
      }
    }

    return textoAcumulado;

  } catch (error) {
    console.error("Error en el stream:", error);
    spanRespuesta.textContent = "Error al conectar con la IA.";
    return "Error.";
  }
}

boton.addEventListener("click", async (event) => {
  event.preventDefault();

  const mensajeUsuario = input.value.trim();

  if (!mensajeUsuario || boton.disabled) return;

  input.value = "";
  input.disabled = true;
  boton.disabled = true;

  agregarMensaje(mensajeUsuario, "usuario");

  mensajesEnviados.push({
    role: "user",
    content: mensajeUsuario
  });

  const respuestaFinal = await generarRespuestaStream();

  mensajesEnviados.push({
    role: "assistant",
    content: respuestaFinal
  });

  input.disabled = false;
  boton.disabled = false;
  input.focus();
});

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !boton.disabled) {
    boton.click();
  }
});

function limpiarChat() {
  mensajes.innerHTML = "";

  mensajesEnviados = [
    {
      role: "system",
      content: "Eres Nebula, una IA estilo cómic, amigable y divertida."
    }
  ];

  agregarMensaje("¡Nuevo chat iniciado! 🚀", "bot");
}

botonNuevo.addEventListener("click", () => {
  limpiarChat();
});

botonModo.addEventListener("click", () => {
  document.body.classList.toggle("villano");

  if (document.body.classList.contains("villano")) {
    botonModo.textContent = "Villano";
  } else {
    botonModo.textContent = "Héroe";
  }
});