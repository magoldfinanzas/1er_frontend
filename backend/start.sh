#!/bin/bash
# Creamos un entorno virtual temporal para evitar el error "externally-managed-environment"
python3 -m venv /tmp/venv
# Instalamos las dependencias en el entorno virtual
/tmp/venv/bin/pip install -r requirements.txt --quiet
# Ejecutamos el servidor desde el entorno virtual
/tmp/venv/bin/python servidor_ppal.py
