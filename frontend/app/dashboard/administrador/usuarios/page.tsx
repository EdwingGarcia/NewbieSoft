"use client";

import { useState, useEffect } from "react";
import { apiGet, apiPost } from "@/app/utils/api";

export default function UsuariosPage() {
  const [roles, setRoles] = useState<any[]>([]);
  const [form, setForm] = useState({
    cedula: "",
    nombre: "",
    correo: "",
    telefono: "",
    direccion: "",
    password: "",
    rolId: "",
    estado: true,
  });

  // 🔹 Cargar roles dinámicamente
  useEffect(() => {
    apiGet("/roles").then((data) => {
      if (data) setRoles(data);
    });
  }, []);

  // 🔹 Manejo de inputs
  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  // 🔹 Enviar formulario
  const handleSubmit = async (e: any) => {
    e.preventDefault();

    const payload = {
      cedula: form.cedula,
      nombre: form.nombre,
      correo: form.correo,
      telefono: form.telefono,
      direccion: form.direccion,
      password: form.password,
      rol: { idRol: parseInt(form.rolId) },
      estado: form.estado,
    };

    const res = await apiPost("/api/auth/register", payload);
    if (res) {
      alert("✅ Usuario registrado correctamente");
      setForm({
        cedula: "",
        nombre: "",
        correo: "",
        telefono: "",
        direccion: "",
        password: "",
        rolId: "",
        estado: true,
      });
    } else {
      alert("⚠️ Error al registrar usuario");
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-[#1a1c3d] mb-6">
        Registrar nuevo usuario
      </h1>

      <div className="bg-white rounded-2xl shadow-md p-6 max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Campos del formulario */}
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              name="cedula"
              value={form.cedula}
              onChange={handleChange}
              placeholder="Cédula"
              className="border border-gray-300 rounded-lg p-2 w-full"
              required
            />
            <input
              type="text"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              placeholder="Nombre"
              className="border border-gray-300 rounded-lg p-2 w-full"
              required
            />
            <input
              type="email"
              name="correo"
              value={form.correo}
              onChange={handleChange}
              placeholder="Correo"
              className="border border-gray-300 rounded-lg p-2 w-full"
              required
            />
            <input
              type="text"
              name="telefono"
              value={form.telefono}
              onChange={handleChange}
              placeholder="Teléfono"
              className="border border-gray-300 rounded-lg p-2 w-full"
            />
            <input
              type="text"
              name="direccion"
              value={form.direccion}
              onChange={handleChange}
              placeholder="Dirección"
              className="border border-gray-300 rounded-lg p-2 w-full"
            />
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Contraseña"
              className="border border-gray-300 rounded-lg p-2 w-full"
              required
            />
          </div>

          {/* Selector de rol */}
          <select
            name="rolId"
            value={form.rolId}
            onChange={handleChange}
            className="border border-gray-300 rounded-lg p-2 w-full"
            required
          >
            <option value="">Selecciona un rol</option>
            {roles.map((rol) => (
              <option key={rol.idRol} value={rol.idRol}>
                {rol.nombre}
              </option>
            ))}
          </select>

          {/* Botón */}
          <button
            type="submit"
            className="bg-[#1a1c3d] text-white px-4 py-2 rounded-lg w-full hover:bg-[#2a2e5b] transition"
          >
            Registrar usuario
          </button>
        </form>
      </div>
    </div>
  );
}
