"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function RegistroPage() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleRegistro = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!email.endsWith("@umce.cl")) {
      setError("Solo se permiten correos institucionales @umce.cl");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nombre },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-2xl">
            &#10003;
          </div>
          <h1 className="text-xl font-bold text-gray-900">Registro exitoso</h1>
          <p className="mt-2 text-sm text-gray-600">
            Revisa tu correo <strong>{email}</strong> para confirmar tu cuenta.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block rounded-md bg-[var(--color-umce-blue)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-umce-blue)]/90"
          >
            Ir a iniciar sesion
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--color-umce-blue)] text-lg font-bold text-white">
            U
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Crear cuenta</h1>
          <p className="mt-2 text-sm text-gray-600">
            Usa tu correo institucional @umce.cl
          </p>
        </div>

        <form onSubmit={handleRegistro} className="space-y-4">
          <div>
            <label
              htmlFor="nombre"
              className="block text-sm font-medium text-gray-700"
            >
              Nombre completo
            </label>
            <input
              id="nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[var(--color-umce-light)] focus:ring-1 focus:ring-[var(--color-umce-light)] focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email institucional
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nombre@umce.cl"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[var(--color-umce-light)] focus:ring-1 focus:ring-[var(--color-umce-light)] focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Contrasena
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[var(--color-umce-light)] focus:ring-1 focus:ring-[var(--color-umce-light)] focus:outline-none"
            />
            <p className="mt-1 text-xs text-gray-500">Minimo 6 caracteres</p>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-[var(--color-umce-blue)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-umce-blue)]/90 focus:ring-2 focus:ring-[var(--color-umce-light)] focus:ring-offset-2 focus:outline-none disabled:opacity-50"
          >
            {loading ? "Registrando..." : "Crear cuenta"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Ya tienes cuenta?{" "}
          <Link
            href="/login"
            className="font-medium text-[var(--color-umce-light)] hover:underline"
          >
            Inicia sesion
          </Link>
        </p>
      </div>
    </div>
  );
}
