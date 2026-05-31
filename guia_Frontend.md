# Guía paso a paso: Cómo crear un Frontend desde cero y conectarlo a un Backend de Python

Esta guía detalla los pasos para crear un proyecto Frontend (con React y Vite) y conectarlo a un backend hecho en Python nativo, de la misma manera que lo hicimos en este proyecto.

---

## 1. Crear el proyecto Frontend (React + Vite)

Para iniciar el proyecto de React de forma rápida y moderna, usamos la herramienta Vite.
Abre tu terminal y ejecuta los siguientes comandos:

```bash
# 1. Crear el proyecto llamado "mi-frontend" usando la plantilla de React
npm create vite@latest mi-frontend -- --template react

# 2. Entrar a la carpeta del proyecto recién creado
cd mi-frontend

# 3. Instalar las dependencias bases que necesita React
npm install

# 4. (Opcional) Instalar librerías adicionales que uses, como recharts para gráficos
npm install recharts
```

---

## 2. Crear un Backend Genérico en Python

El backend es el encargado de procesar la lógica pesada (ej: descargar datos financieros) y enviarla al frontend. Para esto, usamos la librería nativa `wsgiref` para levantar un servidor muy sencillo y que no requiere instalar frameworks pesados.

Crea un archivo llamado `backend_generico.py` y agrega el siguiente código:

```python
import json
from wsgiref.simple_server import make_server

# Función genérica que simula la obtención de datos
def obtener_datos():
    # Aquí puedes llamar a tus scripts financieros, leer CSVs, etc.
    return [
        {"nombre": "Activo A", "precio": 1500},
        {"nombre": "Activo B", "precio": 2300}
    ]

# Función principal que maneja las peticiones de la web
def aplicacion_web(environ, responder):
    path = environ.get('PATH_INFO', '')
    metodo = environ.get('REQUEST_METHOD', '')

    # 1. Cabeceras fundamentales para permitir la conexión desde el Frontend (CORS)
    headers = [
        ('Content-Type', 'application/json'),
        ('Access-Control-Allow-Origin', '*'), # Permite que cualquier Frontend se conecte
        ('Access-Control-Allow-Methods', 'GET, OPTIONS'),
        ('Access-Control-Allow-Headers', 'Content-Type')
    ]

    # 2. Responder al chequeo de seguridad del navegador
    if metodo == 'OPTIONS':
        responder('200 OK', headers)
        return [b""]

    # 3. Ruta principal donde enviaremos los datos
    if path == '/api/datos':
        try:
            datos = obtener_datos()
            responder('200 OK', headers)
            # Convertimos el diccionario a texto JSON para enviarlo
            return [json.dumps(datos).encode('utf-8')]
        except Exception as e:
            responder('500 Error', headers)
            return [json.dumps({"error": str(e)}).encode('utf-8')]

    # 4. Si intentan entrar a otra ruta que no existe
    responder('404 Not Found', headers)
    return [json.dumps({"error": "Ruta no encontrada"}).encode('utf-8')]

# Arrancamos el servidor si ejecutamos este archivo directamente
if __name__ == '__main__':
    puerto = 8000
    httpd = make_server('', puerto, aplicacion_web)
    print(f"Servidor backend corriendo en http://localhost:{puerto}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
```

---

## 3. Conectar el Frontend al Backend

Ahora volvemos al Frontend. Vamos a limpiar el archivo principal de React para que haga una llamada (`fetch`) a nuestro servidor Python y muestre los datos en pantalla.

Ve al archivo `src/App.jsx` dentro de tu proyecto Frontend y reemplázalo por el siguiente código:

```javascript
// Importamos funciones básicas de React
import { useState, useEffect } from 'react';

function App() {
  // Guardamos los datos que vienen del backend
  const [datos, setDatos] = useState([]);
  // Guardamos si hay un error
  const [error, setError] = useState(null);
  // Guardamos si todavía está cargando
  const [cargando, setCargando] = useState(true);

  // useEffect se ejecuta una sola vez al cargar la página
  useEffect(() => {
    // Función que va a buscar la info a Python
    const buscarDatos = async () => {
      try {
        // Le pegamos a la ruta exacta que armamos en nuestro Python
        const respuesta = await fetch('http://localhost:8000/api/datos');
        
        // Si el backend responde con error, lanzamos un aviso
        if (!respuesta.ok) {
          throw new Error('Error al conectar con el servidor Python');
        }
        
        // Convertimos la respuesta a formato que JavaScript entiende
        const datosProcesados = await respuesta.json();
        setDatos(datosProcesados);
      } catch (err) {
        // Guardamos el error si falla la conexión
        setError(err.message);
      } finally {
        // Pase lo que pase, ya no estamos cargando
        setCargando(false);
      }
    };

    buscarDatos();
  }, []); // Los corchetes vacíos indican que solo se ejecuta al inicio

  // 1. Si está cargando, mostramos esto
  if (cargando) return <div>Cargando datos desde el servidor...</div>;
  
  // 2. Si hubo un error, mostramos esto
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;

  // 3. Si todo salió bien, dibujamos los datos en pantalla
  return (
    <div>
      <h1>Mis Datos Financieros</h1>
      <ul>
        {/* Recorremos cada elemento de los datos y creamos una fila */}
        {datos.map((item, index) => (
          <li key={index}>
            {item.nombre} - Precio: ${item.precio}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
```

---

## 4. Cómo ejecutar todo el proyecto

Para ver tu aplicación funcionando, necesitas tener dos terminales abiertas:

**Terminal 1 (Backend - Python):**
```bash
# Asegúrate de estar en la carpeta donde está tu archivo .py
python backend_generico.py
```

**Terminal 2 (Frontend - React):**
```bash
# Asegúrate de estar dentro de tu carpeta frontend
npm run dev
```

Una vez que ambos estén corriendo, la terminal del Frontend te dará una URL (por lo general `http://localhost:5173/`). Abre ese enlace en tu navegador y verás los datos del backend mostrados en tu interfaz web.
